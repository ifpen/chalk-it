from taipy.gui import Gui
from chlkt import *

gui = Gui()
page = ChalkitPage("d3_year_heatmap_calendar_modif.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
