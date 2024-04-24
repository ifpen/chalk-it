import sys
import pandas as pd
from pathlib import Path
from taipy.gui import Gui

sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *


df = pd.DataFrame()
tab_html = ""
file_path = ""
upload_folder = Path(__file__).parent.resolve()


# Callback function to load the CSV file
def load_csv(state):
    print("Load CSV file to + " + state.file_path)
    state.df = pd.read_csv(state.file_path)
    state.tab_html = state.df.to_html()
    print(state.tab_html)


page = ChalkitPage("file_loader_csv_table.xprjson", designer_mode=True)
gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False, upload_folder=upload_folder)