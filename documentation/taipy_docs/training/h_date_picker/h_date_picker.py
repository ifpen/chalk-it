from taipy.gui import Gui
from taipy_designer import *

gui = Gui()

selected_date = "2021-01-01"

page = DesignerPage("14_date_picker.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)