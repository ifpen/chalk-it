import sys
from pathlib import Path
# Add the parent directory of `back_end` to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *
from taipy.gui.custom import Page

a = 8
b = 10
c = a + b * 2

# Define the path for the upload folder relative to the current script's directory
upload_folder = Path(__file__).parent.resolve() / "projects"

# Called from a file loader widgets
def upload_file(state, name, payload):
    print('file data', payload["file_data"])

def on_change(state, var, val):
    state.c = state.a + state.b * 2

def on_test():
    print("on_test")

# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())
