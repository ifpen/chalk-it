"""
This module provides functionalities for loading, saving, and selecting files
based on user actions, specifically handling .xprjson files.
"""

import json
import sys
from pathlib import Path
from typing import Dict, Union
from taipy.gui.gui_actions import notify

# Get the absolute path of the main module
BASE_PATH: Path = Path(sys.argv[0]).resolve().parent

chlkt_json_data_: str = ""
chlkt_file_list_: Dict[str, Union[str, list]] = {}


def chlkt_load_file_(state: object, action_name: str, payload: Dict[str, str]) -> None: # pylint: disable=unused-argument
    """
    Loads file content into the state.

    Parameters:
    - state: The current state object.
    - action_name: The name of the action being performed.
    """
    if "xprjson_file_name" not in payload:
        notify(state, notification_type="E", message="chlkt_load_file_")
        return
    xprjson_file_name = payload.get("xprjson_file_name", None)
    xprjson_file_path = BASE_PATH / xprjson_file_name
    if not xprjson_file_path.is_file():
        print("Invalid file path")
        notify(state, notification_type="E", message="chlkt_load_file_")
        return
    state.chlkt_json_data_ = Path(xprjson_file_path).read_text(encoding="utf-8")
    notify(state, notification_type="I", message="chlkt_load_file_")


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
    try:
        if "data" not in payload or "xprjson_file_name" not in payload:
            notify(state, notification_type="E", message="chlkt_save_file_")
            return
        xprjson_file_name = payload.get("xprjson_file_name", None)
        xprjson_file_path = BASE_PATH / (
            xprjson_file_name.split(".")[0] + "_recovery.xprjson" if action_name == "reload" else xprjson_file_name)
        if not xprjson_file_path.is_file():
            print("Invalid file path")
            notify(state, notification_type="E", message="chlkt_save_file_")
            return
        with open(xprjson_file_path, "w", encoding="utf-8") as f:
            f.write(payload["data"])
        notify(state, notification_type="I", message="chlkt_save_file_")
    except OSError as error:
        notify(state, notification_type="E", message="chlkt_save_file_")


def chlkt_get_file_list_(state: object, action_name: str) -> None: # pylint: disable=unused-argument
    """
    Updates the state with a list of .xprjson files in the base path.

    Parameters:
    - state: The current state object.
    - action_name: The name of the action being performed.
    """
    file_names = [file.name for file in BASE_PATH.glob("*.xprjson")]
    file_list_obj: Dict[str, Union[str, list]] = {
        "file_names": file_names,
        "base_path": str(BASE_PATH)
    }
    state.chlkt_file_list_ = json.dumps(file_list_obj)
