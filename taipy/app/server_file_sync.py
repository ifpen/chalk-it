# Copyright 2023-2024 IFP Energies nouvelles
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.


import logging
import os
from base64 import b64decode, b64encode
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional, TypedDict, Generator, Any, Literal

import simple_websocket
from flask import Blueprint
from flask import json
from flask_sock import Sock
from pathvalidate import sanitize_filename
from watchdog.events import FileSystemEventHandler, FileModifiedEvent, FileDeletedEvent
from watchdog.observers import Observer

logger = logging.getLogger(__name__)

FILE_SYNC_WS_ENDPOINT = "/FileSyncSocket"


@dataclass
class FileState:
    """ Describes a tracked file """

    id: str
    """ identifier used by the web ui to refer to the file """

    base_name: str
    file: Path
    content: bytes
    """ Last known content of the file. Used to prune non-changes. """


# Protocal types
class FileDef(TypedDict):
    """ Used as typing for incoming messages """

    id: str
    name: str
    content: str
    """ base64 encoded data """


# Incoming messages
class SetFilesMsg(TypedDict):
    type: Literal['set_files']
    files: list[FileDef]


class DeleteFilesMsg(TypedDict):
    type: Literal['delete_files']
    files: list[str]
    """ File ids """


# Outgoing messages
class OnDeletedFileMsg(TypedDict):
    type: Literal['file_deleted']
    id: str


class OnModifiedFileMsg(TypedDict):
    type: Literal['file_modified']
    id: str
    content: str
    """ base64 encoded data """


@dataclass(eq=False)
class _SyncSubscription:
    """ Subscription used to listen to the file watcher """

    on_delete: Callable[[str], None]
    """ argument is a file id """

    on_modify: Callable[[str, bytes], None]
    """ arguments are file id and new file content """


class UnsubscribeMeException(Exception):
    """ Subscribed client with unrecoverable errors can throw this to be removed """
    pass


class FileSynchronizer:
    """ Tracks files in a folder. Can be commanded to create/delete files.
    Will then report changes to those to listeners  """

    def __init__(self, directory: Path) -> None:
        self._directory = directory
        self._files_per_id = dict[str, FileState]()
        self._files_per_path = dict[Path, FileState]()
        self._subscriptions = set[_SyncSubscription]()

    def _get_file_state(self, file: str) -> Optional[FileState]:
        path = Path(file).resolve()
        return self._files_per_path.get(path, None)

    def _safe_subscription_iter(self, call: Callable[[_SyncSubscription], None]):
        """ Exceptions will kill the watcher and have to be caught. First and foremost close websocket. """
        unsubscriptions = []
        for s in self._subscriptions:
            try:
                call(s)
            except UnsubscribeMeException:
                # drop clients with permanent failures
                unsubscriptions.append(s)
            except RuntimeError:
                logging.exception("Listener notification failed")

        for s in unsubscriptions:
            self._subscriptions.remove(s)

    def file_deleted(self, file_path: str) -> None:
        state = self._get_file_state(file_path)
        logger.debug("local deletion of %s file %s", "tracked" if state else "untracked", file_path)
        if state:
            file_id = state.id
            del self._files_per_id[file_id]
            del self._files_per_path[state.file]

            self._safe_subscription_iter(lambda s: s.on_delete(file_id))

    def file_modified(self, file_path: str) -> None:
        state = self._get_file_state(file_path)
        logger.debug("local change of %s file %s", "tracked" if state else "untracked", file_path)
        if state:
            file_id = state.id
            content = state.file.read_bytes()
            if content != state.content:
                logger.debug("local content different for %s", file_path)
                state.content = content

                self._safe_subscription_iter(lambda s: s.on_modify(file_id, content))

    def clear(self):
        for file_state in self._files_per_id.values():
            os.remove(file_state.file)
        self._files_per_id.clear()
        self._files_per_path.clear()

    def command_delete(self, file_ids: list[str]) -> None:
        for file_id in file_ids:
            state = self._files_per_id.get(file_id, None)
            if state:
                del self._files_per_id[state.id]
                del self._files_per_path[state.file]
                os.remove(state.file)

    def command_set(self, files: list[FileDef]) -> None:
        for file in files:
            state = self._files_per_id.get(file['id'], None)
            content = b64decode(file['content'])
            if state:
                if state.base_name != file['name']:
                    old_file = state.file

                    state.base_name = file['name']
                    state.file = self._directory / sanitize_filename(file['name'])
                    del self._files_per_path[old_file]
                    self._files_per_path[state.file] = state

                    os.remove(old_file)

                state.content = content
            else:
                base_name = file['name']
                name = sanitize_filename(base_name)
                state = FileState(id=file['id'], content=content, base_name=base_name, file=self._directory / name)
                self._files_per_id[state.id] = state
                self._files_per_path[state.file] = state

            state.file.write_bytes(state.content)

    @contextmanager
    def subscribe(self, on_delete: Callable[[str], None], on_modify: Callable[[str, bytes], None]) -> Generator:
        """ Register callbacks to track file changes and use a context manager to track the subscription's lifecycle """
        sub = _SyncSubscription(on_delete, on_modify)
        self._subscriptions.add(sub)
        yield None
        self._subscriptions.remove(sub)


class FileWatcher(FileSystemEventHandler):
    """ Adapts watchdogs event to the FileSynchronizer """

    def __init__(self, synchronizer: FileSynchronizer):
        self._synchronizer = synchronizer

    def on_modified(self, event: FileModifiedEvent) -> None:
        self._synchronizer.file_modified(event.src_path)

    def on_deleted(self, event: FileDeletedEvent) -> None:
        self._synchronizer.file_deleted(event.src_path)


class WebsocketFileSyncIO:
    """ Message on the websocket are json objects.

    We expect to get SetFilesMsg and DeleteFilesMsg, and we send back OnDeletedFileMsg and OnModifiedFileMsg """

    def __init__(self, ws: simple_websocket.Server, synchronizer: FileSynchronizer):
        self._ws = ws
        self._synchronizer = synchronizer

    def start(self):
        with self._synchronizer.subscribe(self.send_file_delete, self.send_file_modified):
            while True:
                data = self._ws.receive()
                self.handle_message(data)

    def handle_message(self, data: Any):
        msg = json.loads(data)
        if msg['type'] == 'delete_files':
            self._synchronizer.command_delete(msg['files'])
        elif msg['type'] == 'set_files':
            self._synchronizer.command_set(msg['files'])
        else:
            logger.error(f"Invalid message type: {msg['type']}")

    def send_file_delete(self, file_id: str) -> None:
        json_msg = json.dumps(OnDeletedFileMsg(
            type='file_deleted',
            id=file_id,
        ))
        try:
            self._ws.send(json_msg)
        except simple_websocket.ws.ConnectionClosed as e:
            logging.debug(e, exc_info=True)
            raise UnsubscribeMeException()

    def send_file_modified(self, file_id: str, content: bytes) -> None:
        json_msg = json.dumps(OnModifiedFileMsg(
            type='file_modified',
            id=file_id,
            content=b64encode(content).decode('ascii'),
        ))
        try:
            self._ws.send(json_msg)
        except simple_websocket.ws.ConnectionClosed as e:
            logging.debug(e, exc_info=True)
            raise UnsubscribeMeException()


def create_file_sync_blueprint(sync_dir: str, sync_clear: bool, server_ws_url: str) -> Blueprint:
    target_dir = os.path.abspath(sync_dir)

    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    elif os.path.isfile(target_dir):
        raise RuntimeError(f"{target_dir} is not a directory")
    elif sync_clear:
        for file in os.listdir(target_dir):
            os.remove(os.path.join(target_dir, file))

    synchronizer = FileSynchronizer(Path(target_dir))
    event_handler = FileWatcher(synchronizer)

    observer = Observer()
    observer.schedule(event_handler, target_dir, recursive=True)
    observer.daemon = True
    observer.start()

    blueprint = Blueprint('file_sync', __name__)
    sock = Sock(blueprint)

    @blueprint.route("/FileSyncURI")
    def file_sync_uri():
        return server_ws_url

    @sock.route(FILE_SYNC_WS_ENDPOINT)
    def file_sync_socket(ws: simple_websocket.Server):
        WebsocketFileSyncIO(ws, synchronizer).start()

    return blueprint
