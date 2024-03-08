"""
This module provides functionalities for loading, saving, and selecting files
based on user actions, specifically handling .xprjson files.
"""

import json
import sys
from pathlib import Path
from typing import Dict, Union

from .chalkit_json_adapter import FunctionJsonAdapter

# Get the absolute path of the main module
BASE_PATH: Path = Path(sys.argv[0]).resolve().parent

xprjson_file_name: str = "new_project.xprjson"
json_data: str = ""
has_file_saved: bool = False
file_list: Dict[str, Union[str, list]] = {}


def load_file(state: object, action_name: str) -> None: # pylint: disable=unused-argument
    """
    Loads file content into the state.

    Parameters:
    - state: The current state object.
    - action_name: The name of the action being performed.
    """
    xprjson_file_path = BASE_PATH / state.xprjson_file_name
    state.json_data = Path(xprjson_file_path).read_text(encoding="utf-8")


def save_file(state: object, action_name: str, payload: Dict[str, str]) -> None:
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
        xprjson_file_path = BASE_PATH / (
            state.xprjson_file_name.split('.')[0] + '_recovery.xprjson' if action_name == "reload" else state.xprjson_file_name)
        if "data" not in payload:
            raise ValueError("Payload does not contain 'data'")
        with open(xprjson_file_path, "w", encoding="utf-8") as f:
            f.write(payload["data"])
            state.has_file_saved = True
    except OSError as error:
        raise OSError(f"Failed to write to {xprjson_file_path}: {error}") from error


def select_file(state: object, action_name: str, payload: Dict[str, str]) -> None: # pylint: disable=unused-argument
    """
    Selects a file based on the provided file name in the payload.

    Parameters:
    - state: The current state object.
    - action_name: The name of the action being performed.
    - payload: Contains the file_name to select.
    """
    if "file_name" not in payload:
        raise ValueError("Payload does not contain 'file_name'")
    selected_file_name = payload['file_name']
    selected_file_path = BASE_PATH / selected_file_name
    if selected_file_path.exists():
        state.xprjson_file_name = selected_file_name


def get_file_list(state: object, action_name: str) -> None: # pylint: disable=unused-argument
    """
    Updates the state with a list of .xprjson files in the base path.

    Parameters:
    - state: The current state object.
    - action_name: The name of the action being performed.
    """
    file_names = [file.name for file in BASE_PATH.glob('*.xprjson')]
    file_list_obj: Dict[str, Union[str, list]] = {
        'file_names': file_names,
        'base_path': str(BASE_PATH)
    }
    state.file_list = json.dumps(file_list_obj)


FunctionJsonAdapter().register()
