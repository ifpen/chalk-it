from taipy.gui import Gui
from taipy.designer import *

time = {"selected": "13:10"}

gui = Gui()
page = Page("time_picker.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
