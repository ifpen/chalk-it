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


"""
This module provides functionalities for loading, saving, and selecting files
based on user actions, specifically handling .xprjson files.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Union
from taipy.gui.gui_actions import notify

from .template_xprjson import xprjson_template
from .utils_xprjson import update_xprjson

# Get the absolute path of the main module
BASE_PATH: Path = Path(sys.argv[0]).resolve().parent

chlkt_json_data_: str = ""
chlkt_file_list_: Dict[str, Union[str, list]] = {}


# pylint: disable=unused-argument
def chlkt_load_file_(state: object, action_name: str, payload: Dict[str, str]) -> None:
    """
    Loads file content into the state.
    If the file does not exist, the code will create it based on a given string
    template 'xprjson_file_name'.

    Parameters:
    - state: The current state object.
    - action_name: The name of the action being performed.
    """
    action: str = "load_file"
    is_new_file: bool = False

    try:
        if not all(key in payload for key in ["xprjson_file_name", "is_template_file"]):
            notify(
                state,
                notification_type="E",
                message={
                    "action_name": action,
                    "text": "Error while loading: invalid pyload data",
                },
            )
            return

        is_template_file: bool = payload.get("is_template_file", None)
        xprjson_file_name: str = payload.get("xprjson_file_name", None)
        xprjson_file_path: Path = (
            Path(__file__).parent
            / ".."
            / ".."
            / "documentation"
            / "Templates"
            / "Projects"
            / xprjson_file_name
            if is_template_file
            else BASE_PATH / xprjson_file_name
        )

        if not xprjson_file_path.exists():
            # If the file does not exist, create it with the contents of 'xprjson_template'
            with open(xprjson_file_path, "w", encoding="utf-8") as file:
                update_xprjson(xprjson_template, xprjson_file_name)
                file.write(json.dumps(xprjson_template))
                is_new_file = True

        if not xprjson_file_path.is_file():
            print("Invalid file path")
            notify(
                state,
                notification_type="E",
                message={
                    "action_name": action,
                    "text": "Error while loading: invalid file path",
                },
            )
            return

        state.chlkt_json_data_ = Path(xprjson_file_path).read_text(encoding="utf-8")
        notify(
            state,
            notification_type="I",
            message={
                "action_name": action,
                "text": f"The file {xprjson_file_name} was successfully loaded",
                "is_new_file": is_new_file,
            },
        )
    except OSError as e:
        notify(
            state,
            notification_type="E",
            message={
                "action_name": action,
                "text": f"Error while loading: {e}",
            },
        )


def chlkt_save_file_(state: object, action_name: str, payload: Dict[str, str]) -> None:
    """
    Saves the provided data into a file, determining the file name based on the action name.

    Parameters:
    - state: The current state object.
    - action_name: The name of the action being performed.
    - payload: The data payload to save.

    Raises:
    - ValueError: If the payload does not contain 'data'.
    - OSError: If there's an error writing to the file.
    """
    action: str = "save_file"
    is_reload: bool = action_name == "reload"

    try:
        if "data" not in payload or "xprjson_file_name" not in payload:
            notify(
                state,
                notification_type="E",
                message={
                    "action_name": action,
                    "text": "Error while saving: invalid pyload data",
                },
            )
            return

        xprjson_file_name: str = payload.get("xprjson_file_name", None)
        xprjson_file_path: Path = BASE_PATH / (
            xprjson_file_name.split(".")[0] + "_recovery.xprjson"
            if is_reload
            else xprjson_file_name
        )

        if not xprjson_file_path.is_file() and not is_reload:
            print("Invalid file path")
            notify(
                state,
                notification_type="E",
                message={
                    "action_name": action,
                    "text": "Error while saving: invalid file path",
                },
            )
            return

        with open(xprjson_file_path, "w", encoding="utf-8") as f:
            f.write(payload["data"])
        notify(
            state,
            notification_type="I",
            message={
                "action_name": action,
                "text": "The project was successfully saved",
            },
        )
    except OSError as e:
        notify(
            state,
            notification_type="E",
            message={
                "action_name": action,
                "text": f"Error while saving: {e}",
            },
        )


# pylint: disable=unused-argument
def chlkt_get_file_list_(state: object, action_name: str) -> None:
    """
    Updates the state with a list of .xprjson files in the base path.

    Parameters:
    - state: The current state object.
    - action_name: The name of the action being performed.
    """
    action: str = "get_file_list"

    try:
        file_names: List[str] = [file.name for file in BASE_PATH.glob("*.xprjson")]
        file_list_obj: Dict[str, Union[str, List[str]]] = {
            "file_names": file_names,
            "base_path": str(BASE_PATH),
        }

        state.chlkt_file_list_ = json.dumps(file_list_obj)
    except OSError as e:
        notify(
            state,
            notification_type="E",
            message={
                "action_name": action,
                "text": f"Error while getting file list: {e}",
            },
        )
