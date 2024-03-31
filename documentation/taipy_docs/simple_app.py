from taipy.gui import Gui
from taipy_designer import *

a = 1
b = 5
c = a + b

page = DesignerPage("sliders_value.xprjson")

gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)