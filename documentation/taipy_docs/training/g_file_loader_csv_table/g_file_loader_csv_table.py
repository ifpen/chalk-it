from taipy.gui import Gui
import pandas as pd
from taipy.designer import Page


df = pd.DataFrame()
tab_html = ""
csv_file_path = ""

# Callback function to load the CSV file
def load_csv(state):
    state.df = pd.read_csv(state.csv_file_path)
    state.tab_html = state.df.to_html()

page = Page("g_file_loader_csv_table.xprjson", designer_mode=True)
gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
