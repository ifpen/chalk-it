from taipy.gui import Gui
import pandas as pd
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *

# Initialize the GUI and set the default DataFrame
gui = Gui()

df = pd.DataFrame()
tab = []

# Callback function to load the CSV file
def load_csv(state):
    state.df = pd.read_csv(state.upload_file_name)
    print(state.upload_file_name)
    state.tab = df.values.tolist()

    

page = ChalkitPage("06_file_loader_csv_table.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)