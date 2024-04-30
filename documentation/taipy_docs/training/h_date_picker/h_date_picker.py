from taipy.gui import Gui
from taipy.designer import Page


selected_date = "2021-01-01"

page = Page("h_date_picker.xprjson")
gui = Gui()
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)
