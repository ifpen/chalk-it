from taipy.gui import Gui
from taipy.designer import Page

time = {"selected": "13:10"}

gui = Gui()
page = Page("time_picker.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)
