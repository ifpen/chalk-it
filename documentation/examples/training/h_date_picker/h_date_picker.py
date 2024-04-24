from taipy.gui import Gui
from taipy_designer import *


selected_date = "2021-01-01"

page = DesignerPage("h_date_picker.xprjson", designer_mode=True)
gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)