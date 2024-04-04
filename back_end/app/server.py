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



from functools import wraps
from flask import (
    Blueprint,
    Flask,
    Response,
    send_file,
    jsonify,
    make_response,
    request,
    redirect,
    send_from_directory,
    render_template_string,
    url_for,
)
from base64 import b64decode, b64encode
from concurrent.futures import Executor, ProcessPoolExecutor
from pathlib import Path
from typing import Any, Dict, Optional, Type, Callable
from argparse import Namespace
import argparse
import os
import json
import logging
import webbrowser
import threading


class AppConfig:
    def __init__(self, args: Namespace) -> None:
        # Extract arguments and set default values
        self.DEBUG = args.dev
        self.xprjson = args.xprjson_file
        self.run_port = args.app_port or 7854
        self.app_ip = args.app_ip or "127.0.0.1"
        self.server_url = f"http://{self.app_ip}:{self.run_port}"

        # Set up directories
        self.home_dir = Path.home()
        self.settings_dir = self.home_dir / ".chalk-it"
        self.settings_file = self.settings_dir / "settings.json"

        self._setup_paths()

    def _setup_paths(self) -> None:
        self.project_dir = Path.cwd()
        self.base_dir = Path(__file__).parent.resolve()
        if self.DEBUG:
            # Development mode paths
            self.templates_dir = (
                self.base_dir / ".." / ".." / "documentation" / "Templates" / "Projects"
            ).resolve()
            self.images_dir = (
                self.base_dir / ".." / ".." / "documentation" / "Templates" / "Images"
            ).resolve()
            self.static_folder = (self.base_dir / ".." / ".." / "front-end").resolve()
        else:
            # Production mode paths
            self.templates_dir = (
                self.base_dir / ".." / "Templates" / "Projects"
            ).resolve()
            self.images_dir = (self.base_dir / ".." / "Templates" / "Images").resolve()
            self.static_folder = (self.base_dir / "..").resolve()


class RootManager:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.app = Flask(
            __name__, static_folder=config.static_folder, static_url_path=""
        )

        # Initialize and register blueprints
        self.file_manager = FileManager(config)
        self.app.register_blueprint(self.file_manager.blueprint)

        self.doc_manager = DocManager(config)
        self.app.register_blueprint(self.doc_manager.blueprint)

        self.settings_manager = SettingsManager(config)
        self.app.register_blueprint(self.settings_manager.blueprint)

        self.template_manager = TemplateManager(config)
        self.app.register_blueprint(self.template_manager.blueprint)

        self.project_manager = ProjectManager(config)
        self.app.register_blueprint(self.project_manager.blueprint)

        # Setup CORS
        self._setup_cors()

    def _setup_cors(self) -> None:
        # Set up CORS headers after each request
        @self.app.after_request
        def after_request(response: Response) -> Response:
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type")
            response.headers.add("Access-Control-Allow-Methods", "GET, POST")
            return response

    @staticmethod
    def send_success(json_obj: Dict[str, Any]) -> Response:
        response = make_response(json.dumps({"d": json.dumps(json_obj)}), 200)
        return response

    # Handle errors and return a formatted response
    @staticmethod
    def _send_error(error: str) -> Response:
        logging.error(error, exc_info=True)

        # Extract exception type from the error message
        exception_type = error.split(":")[0].strip()
        response = make_response(
            json.dumps(
                {
                    "d": json.dumps(
                        {
                            "Success": False,
                            "Msg": f"Error Type: {exception_type}, Details: {error}",
                        }
                    )
                }
            ),
            500,
        )
        return response

    @staticmethod
    def handle_errors(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                # Attempt to call the wrapped function
                return func(*args, **kwargs)
            except Exception as err:
                RootManager._send_error(err)

        return wrapper


class SettingsManager:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.blueprint = Blueprint(
            "settings", __name__, static_folder=config.static_folder
        )
        self.blueprint.route("/SaveSettings", methods=["POST"])(
            RootManager.handle_errors(self.save_settings)
        )
        self.blueprint.route("/ReadSettings", methods=["POST"])(
            RootManager.handle_errors(self.read_settings)
        )

    def save_settings(self) -> Response:
        decoded_data_json = json.loads(
            b64decode(request.json["FileData"].encode()).decode()
        )
        if os.access(self.config.settings_file, os.F_OK):
            with open(self.config.settings_file, "r", encoding="utf8") as file:
                file_data = file.read()
            file_data_json = json.loads(file_data)
            file_data_json.update(decoded_data_json)
            with open(self.config.settings_file, "w", encoding="utf8") as file:
                json.dump(file_data_json, file, indent=2)
            return RootManager.send_success({"Success": True, "Msg": "OK"})
        else:
            return RootManager.send_success({"Success": False, "Msg": "KO"})

    def read_settings(self) -> Response:
        if os.access(self.config.settings_file, os.F_OK):
            with open(self.config.settings_file, "r", encoding="utf8") as file:
                file_data = file.read()
            encoded_data = b64encode(
                json.dumps(json.loads(file_data)).encode()
            ).decode()
        else:
            os.makedirs(self.config.settings_dir, exist_ok=True)
            default_settings = json.dumps(
                {
                    "data": {},
                    "projects": [],
                    "dataNode": [],
                    "tags": [],
                    "updatedAt": "",
                    "createdAt": "",
                    "scope": {},
                    "info": {},
                    "settings": {},
                    "profile": {"userName": "Guest", "Id": "-1"},
                    "help": {
                        "isDiscoverDone": False,
                        "displayHelp": True,
                        "discoverSteps": [0, 0, 0, 0, 0],
                    },
                },
                indent=2,
            )
            encoded_data = b64encode(default_settings.encode()).decode()
            with open(self.config.settings_file, "w", encoding="utf8") as file:
                file.write(default_settings)

        file_stats = os.stat(self.config.settings_file)
        nb_bytes = file_stats.st_size
        return RootManager.send_success(
            {
                "Success": True,
                "Msg": None,
                "Offset": 0,
                "NbBytes": nb_bytes,
                "LastChunk": True,
                "ReadOnly": False,
                "FileData": encoded_data,
                "Array": None,
            }
        )


class ProjectManager:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.blueprint = Blueprint(
            "project", __name__, static_folder=config.static_folder
        )
        self.blueprint.route("/SaveProject", methods=["POST"])(
            RootManager.handle_errors(self.save_project)
        )
        self.blueprint.route("/ReadProject", methods=["POST"])(
            RootManager.handle_errors(self.read_project)
        )
        self.blueprint.route("/RenameProject", methods=["POST"])(
            RootManager.handle_errors(self.rename_project)
        )
        self.blueprint.route("/CheckNewProjectName", methods=["POST"])(
            RootManager.handle_errors(self.check_new_project_name)
        )
        self.blueprint.route("/GetProjectStatus", methods=["POST"])(
            RootManager.handle_errors(self.get_project_status)
        )

    def save_project(self) -> Response:
        file_name = request.json["FileName"]
        file_data = request.json["FileData"]
        offset = request.json["Offset"]
        if file_data and offset != -1:
            decoded_data_json = json.loads(b64decode(file_data.encode()).decode())
            project_name = decoded_data_json.get("meta").get("name")
            os.makedirs(self.config.project_dir, exist_ok=True)
            path_project_file = os.path.join(
                self.config.project_dir, f"{project_name}.xprjson"
            )
            with open(path_project_file, "w", encoding="utf8") as file:
                file.write(json.dumps(decoded_data_json, indent=2))
        return RootManager.send_success({"Success": True, "Msg": "OK"})

    def read_project(self) -> Response:
        file_name = request.json["FileName"]
        offset = request.json["Offset"]
        encoded_data = ""
        path_project_file = os.path.join(self.config.project_dir, file_name)
        if offset != -1 and os.access(path_project_file, os.F_OK):
            with open(path_project_file, "r", encoding="utf8") as file:
                file_data = json.load(file)
            encoded_data = b64encode(json.dumps(file_data).encode()).decode()
        file_stats = os.stat(path_project_file)
        nb_bytes = file_stats.st_size
        return RootManager.send_success(
            {
                "Success": True,
                "Msg": None,
                "Offset": 0,
                "NbBytes": nb_bytes,
                "LastChunk": True,
                "ReadOnly": False,
                "FileData": encoded_data,
                "Array": None,
            }
        )

    def rename_project(self) -> Response:
        file_name = request.json.get("FileName")
        new_file_name = request.json.get("NewFileName")
        try:
            path_project_file = os.path.join(self.config.project_dir, file_name)
            new_path_project_file = os.path.join(self.config.project_dir, new_file_name)
            os.rename(path_project_file, new_path_project_file)
            return RootManager.send_success({"Success": True, "Msg": "OK"})
        except Exception:
            return RootManager.send_success({"Success": False, "Msg": "KO"})

    def check_new_project_name(self) -> Response:
        file_name = request.json.get("FileName")
        new_file_name = request.json.get("NewFileName")
        path_project_file = os.path.join(self.config.project_dir, file_name)
        new_path_project_file = os.path.join(self.config.project_dir, new_file_name)
        if os.access(new_path_project_file, os.F_OK):
            return RootManager.send_success({"Success": True, "Msg": "KO"})
        else:
            return RootManager.send_success({"Success": True, "Msg": "OK"})

    def get_project_status(self) -> Response:
        return RootManager.send_success(
            {
                "Success": True,
                "Msg": """{
                        "OpenedBy": "",
                        "Shared": "False",
                        "SecuredLink": "False"
                    }""",
            }
        )


class FileManager:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.blueprint = Blueprint("file", __name__, static_folder=config.static_folder)
        self.blueprint.route("/GetFiles", methods=["POST"])(
            RootManager.handle_errors(self.get_files)
        )
        self.blueprint.route("/GetPythonDataList", methods=["POST"])(
            RootManager.handle_errors(self.get_python_data_list)
        )
        self.blueprint.route("/heartbeat")(RootManager.handle_errors(self.heartbeat))
        self.blueprint.add_url_rule(
            "/<path:path>",
            view_func=RootManager.handle_errors(self.static_files),
            methods=["GET"],
            endpoint="static_file_with_path",
        )
        self.blueprint.add_url_rule(
            "/",
            view_func=RootManager.handle_errors(self.static_files),
            methods=["GET"],
            defaults={"path": "index.html"},
            endpoint="static_file_root",
        )

    def get_files(self) -> Response:
        relative_path_dir = ""
        file_type = request.json["FileType"]
        if file_type == "project":
            relative_path_dir = self.config.project_dir
        elif file_type == "template":
            relative_path_dir = self.config.templates_dir
        files = Path(relative_path_dir).glob("*.xprjson")
        # Resolve the relative path to an absolute path
        absolute_path_dir = str(Path(relative_path_dir).resolve())
        file_list = [
            {
                "Name": file.stem,
                "FileName": file.name,
                "Description": "",
                "GroupeName": "",
                "Python": None,
                "Tags": [],
                "URL": f"{self.config.server_url}/GetImages?image={file.stem}",
                "Path": str(file.parent),
            }
            for file in files
        ]
        # sort the file list by 'Name' key in ascending order
        file_list = sorted(file_list, key=lambda k: k["Name"], reverse=False)
        return RootManager.send_success(
            {
                "Success": True,
                "Msg": None,
                "FileList": file_list,
                "Path": absolute_path_dir,
                "Python": None,
            }
        )

    def static_files(self, path: str) -> Response:
        """
        Handles requests for static files.
        """
        static_file_directory = Path(self.blueprint.static_folder)
        full_path = (static_file_directory / path).resolve()

        # Safety check: Ensure the resolved path is within the static directory
        if not str(full_path).startswith(str(static_file_directory)):
            return "Invalid path", 404

        if full_path.is_file():
            return send_from_directory(static_file_directory, path)

        if self.config.xprjson is not None:
            return self.dashboard(self.config.xprjson)

        return "Invalid path", 404

    def dashboard(self, xprjson: str) -> str:
        # Load configuration from json file
        with open(xprjson, "r") as config_file:
            config_data = json.load(config_file)

        # Read the HTML template
        index_view_path = os.path.join(
            self.config.base_dir, "index-view-2.930.8710.html"
        )
        with open(index_view_path, "r") as template_file:
            template_data = template_file.read()

        # Inject the JSON data into the template
        template_data_with_config = template_data.replace(
            "jsonContent = {};", f"var jsonContent = {json.dumps(config_data)};"
        )

        # Render the HTML with the configuration inlined
        return render_template_string(template_data_with_config)

    def get_python_data_list(self) -> Response:
        return RootManager.send_success(
            {
                "Success": True,
                "Msg": None,
                "FileList": [],
            }
        )

    def heartbeat(self) -> Response:
        return jsonify({"status": "healthy"})


class DocManager:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.blueprint = Blueprint("doc", __name__, static_folder=config.static_folder)

        # Document serving routes
        self.blueprint.add_url_rule(
            "/doc/<path:path>",
            view_func=RootManager.handle_errors(self.serve_doc),
            methods=["GET"],
            endpoint="serve_doc_path",
        )
        self.blueprint.add_url_rule(
            "/doc/",
            view_func=RootManager.handle_errors(self.serve_doc),
            defaults={"path": "index.html"},
            methods=["GET"],
            endpoint="serve_doc_root",
        )

    def serve_doc(self, path: str) -> Response:
        # Adjust 'doc_path' if your docs are in a specific subdirectory
        static_file_directory = Path(self.blueprint.static_folder)
        doc_path = static_file_directory / "doc"
        full_path = doc_path / path

        # Safety check to prevent directory traversal
        if not full_path.resolve().is_relative_to(doc_path):
            return "Invalid path", 404

        if full_path.is_dir():
            path = path.rstrip("/") + "/index.html"

        return send_from_directory(doc_path, path)


class TemplateManager:
    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.blueprint = Blueprint(
            "template", __name__, static_folder=config.static_folder
        )
        self.blueprint.route("/GetImages", methods=["GET"])(
            RootManager.handle_errors(self.get_template_image)
        )
        self.blueprint.route("/ReadTemplate", methods=["POST"])(
            RootManager.handle_errors(self.read_template)
        )

    def get_template_image(self) -> Response:
        image_name = request.args.get("image")
        image_path = os.path.join(self.config.images_dir, f"{image_name}.png")
        return send_file(image_path, mimetype="image/png")

    def read_template(self) -> Response:
        template_name = request.json.get("FileName")
        template_path = os.path.join(self.config.templates_dir, template_name)
        with open(template_path, "r", encoding="utf8") as file:
            file_data = file.read()
        encoded_data = b64encode(file_data.encode()).decode()
        file_stats = os.stat(template_path)
        nb_bytes = file_stats.st_size
        return RootManager.send_success(
            {
                "Success": True,
                "Msg": None,
                "Offset": 0,
                "NbBytes": nb_bytes,
                "LastChunk": True,
                "ReadOnly": False,
                "FileData": encoded_data,
                "Array": None,
            }
        )


class Main:
    @classmethod
    def _configure_logging(cls, app: Flask, config: AppConfig) -> None:
        if config.DEBUG:
            # develop mode
            logging.basicConfig()
            logging.getLogger("werkzeug").setLevel(logging.INFO)
        else:
            # prod mode
            loggers = [app.logger, logging.getLogger("werkzeug")]
            for logger in loggers:
                logger.handlers = []  # Remove existing handlers
                logger.setLevel(logging.ERROR)

    @classmethod
    def _open_browser(cls, server_url: str) -> None:
        """
        Opens a new web browser window with the server URL.
        """
        webbrowser.open_new(server_url)

    @classmethod
    def _create_app(cls, config: AppConfig) -> Flask:
        root_manager = RootManager(config)
        return root_manager.app

    @classmethod
    def _run_python_pool(cls, app: Flask, args: Namespace) -> None:
        python_pool: Optional[Executor] = (
            ProcessPoolExecutor(args.python_workers) if args.python_workers else None
        )
        if python_pool:
            from .server_exec import create_python_exec_blueprint

            app.register_blueprint(create_python_exec_blueprint(python_pool))

    @classmethod
    def _run_file_sync(cls, app: Flask, args: Namespace, config: AppConfig) -> None:
        if args.sync:
            from .server_file_sync import (
                create_file_sync_blueprint,
                FILE_SYNC_WS_ENDPOINT,
            )

            server_ws_url = (
                f"{config.server_url.replace('http', 'ws')}{FILE_SYNC_WS_ENDPOINT}"
            )
            blueprint = create_file_sync_blueprint(
                args.sync, args.sync_clear, server_ws_url
            )
            app.register_blueprint(blueprint)
            app.config["SOCK_SERVER_OPTIONS"] = {"ping_interval": 25}

    @classmethod
    def _print_startup_info(cls, config: AppConfig) -> None:
        print("User home directory:", config.home_dir)
        print("Current working directory:", config.project_dir)
        print(f"Chalk'it launched on {config.server_url}")
        mode_message = "development" if config.DEBUG else "production"
        print(f"Running in {mode_message} mode")

    @classmethod
    def _start_application(cls, app: Flask, config: AppConfig) -> None:
        if (not config.DEBUG) and (config.xprjson is None):
            threading.Timer(2, lambda: cls._open_browser(config.server_url)).start()
        app.run(debug=False, port=config.run_port)

    @classmethod
    def _parse_command_line_arguments(cls) -> Namespace:
        # create the top-level parser
        parser = argparse.ArgumentParser()
        parser.add_argument(
            "--dev", action="store_true", help="run in development mode"
        )
        parser.add_argument(
            "--syncDir",
            dest="sync",
            help="""if given a directory, the edited dashboard
         will project the definition of some datanodes (like scripts) as files.
         Requires "pathvalidate", "watchdog" and "flask-sock".""",
        )
        parser.add_argument(
            "--clearSyncDir",
            dest="sync_clear",
            action="store_true",
            help='if set, the "syncDir" directory will be cleared on startup. Please use responsively.',
        )
        parser.add_argument(
            "--pythonWorkers",
            dest="python_workers",
            type=int,
            help="""Size of pool used to evaluate user's python scripts.""",
        )
        parser.add_argument(
            "--render",
            dest="xprjson_file",
            type=str,
            help="render project in HTML page mode",
        )
        parser.add_argument(
            "--port", dest="app_port", type=int, help="change Flask TCP port"
        )
        parser.add_argument(
            "--ip", dest="app_ip", type=str, help="change Flask TCP address"
        )

        return parser.parse_args()

    @classmethod
    def print_routes(cls, app: Flask) -> None:
        for rule in app.url_map.iter_rules():
            print(f"Endpoint: {rule.endpoint}, Route: {rule}")

    # Main function to run the application
    @classmethod
    def main(cls: Type["Main"]) -> None:
        # Parse command-line arguments
        args = cls._parse_command_line_arguments()
        config = AppConfig(args)
        app = cls._create_app(config)
        cls._print_startup_info(config)
        if config.DEBUG:
            # develop mode
            cls.print_routes(app)
        cls._configure_logging(app, config)
        cls._run_python_pool(app, args)
        cls._run_file_sync(app, args, config)
        cls._start_application(app, config)
