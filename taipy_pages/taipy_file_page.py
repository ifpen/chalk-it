import sys
from pathlib import Path
# Add the parent directory of `back_end` to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *
from taipy.gui.custom import Page

a = 8
b = 10
c = a + b * 2

# Called from a file loader widgets
def upload_file(state, name, payload):
    print('file data', payload["file_data"])

def on_change(state, var, val):
    state.c = state.a + state.b * 2

# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())