from pathlib import Path
from taipy.gui import Gui

from taipy_page import page as page1
from taipy_matplotlib import page as page2
from folium_map import page as page3

# Define the path for the upload folder relative to the current script's directory
upload_folder = Path(__file__).parent.resolve()
hello_var = "Hello, World!"

gui = Gui()
gui.add_page("page1", page1)
gui.add_page("page2", page2)
gui.add_page("page3", page3)
gui.run(run_browser=True, use_reloader=False, upload_folder=upload_folder)
