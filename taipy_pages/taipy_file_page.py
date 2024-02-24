import sys
from pathlib import Path
# Add the parent directory of `back_end` to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end.taipy.resource_handler import PureHTMLResourceHandler
import json
import os
from taipy.gui.custom import Page

base_path = (Path(__file__).parent / "projects").resolve()
file_name = base_path / "config.xprjson"
json_data = ""
has_file_saved = False
file_list = {}

def load_file(state, name):
    state.json_data = Path(state.file_name).read_text()

def save_file(state, name, payload):
    if "data" not in payload:
        return
    with open(state.file_name, "w") as f:
        f.write(payload["data"])
    state.has_file_saved = True

# file should only be within base path
def select_file(state, name, payload):
    if "file_name" not in payload:
        return
    potential_file_path = base_path / payload['file_name']
    if os.path.exists(potential_file_path):
        state.file_name = potential_file_path
        
def get_file_list(state, name):
    # Use glob to find .xprjson files directly within the base directory.
    file_names = [file.name for file in base_path.glob('*.xprjson')]
    file_list_obj = {
        'file_names': file_names,
        'base_path': str(base_path)
    }
    state.file_list = json.dumps(file_list_obj)

# Called from a file loader widgets
def upload_file(state, name, payload):
    print('file data', payload["file_data"])

# def get_function_names():
#     # Use inspect to get all current globals, then filter by those that are functions
#     # Exclude the specified function names from the list
#     excluded_function_names = ['get_file_list', 'load_file', 'select_file', 'get_function_names', 'save_file']
#     function_names = [name for name, obj in globals().items() if inspect.isfunction(obj) and name not in excluded_function_names]
#     return function_names

# function_names = get_function_names()

a = 8
b = 10
c = a + b * 2


def on_change(state, var, val):
    state.c = state.a + state.b * 2

# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())
