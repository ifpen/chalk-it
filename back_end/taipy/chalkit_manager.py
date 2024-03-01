from .function_json_adapter import FunctionJsonAdapter
from pathlib import Path
import json
import sys

# Get the absolute path of the main module
__base_path = Path(sys.argv[0]).resolve().parent

file_name = __base_path / "config.xprjson"
json_data = ""
has_file_saved = False
file_list = {}

def load_file(state, action_name):
    state.json_data = Path(state.file_name).read_text()

def save_file(state, action_name, payload):
    if "data" not in payload:
        return
    with open(state.file_name, "w") as f:
        f.write(payload["data"])
        state.has_file_saved = True

# file should only be within base path
def select_file(state, action_name, payload):
    if "file_name" not in payload:
        return
    potential_file_path = __base_path / payload['file_name']
    if potential_file_path.exists():
        state.file_name = str(potential_file_path)
        
def get_file_list(state, action_name):
    # Use glob to find .xprjson files directly within the base directory.
    file_names = [file.name for file in __base_path.glob('*.xprjson')]
    file_list_obj = {
        'file_names': file_names,
        'base_path': str(__base_path)
    }
    state.file_list = json.dumps(file_list_obj)

FunctionJsonAdapter().register()