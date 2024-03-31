from taipy.gui import Gui
from taipy_designer import *

gui = Gui()
page = DesignerPage("d3_year_heatmap_calendar_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
