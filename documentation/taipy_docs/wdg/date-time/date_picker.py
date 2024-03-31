from taipy.gui import Gui
from taipy_designer import *

gui = Gui()
page = DesignerPage("date_picker_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
