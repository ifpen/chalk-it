from taipy.gui import Gui
import pandas as pd
# Add the parent directory of `back_end` to sys.path
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *

# Initialize the GUI and set the default DataFrame
gui = Gui()

df = pd.DataFrame()
tab_html = ""
file_path = ""

# Callback function to load the CSV file
def load_csv(state):
    print("Load CSV file to + " + state.file_path)
    state.df = pd.read_csv(state.file_path)
    state.tab_html = state.df.to_html()
    print(state.tab_html)

page = ChalkitPage("06_file_loader_csv_table.xprjson")
gui.add_page("page", page)

upload_folder = Path(__file__).parent.resolve()
gui.run(run_browser=True, use_reloader=False, upload_folder=upload_folder)