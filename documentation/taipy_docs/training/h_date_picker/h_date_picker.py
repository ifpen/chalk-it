from taipy.gui import Gui
from taipy.designer import Page


selected_date = "2021-01-01"

page = Page("h_date_picker.xprjson", designer_mode=True)
gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
