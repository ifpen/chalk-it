from taipy.gui import Gui
from taipy_designer import *

import json 

with open('paris_cycle_1st_arrd.json') as json_file:
    paris_first_arrd_cycle_network =  json.load(json_file)

gui = Gui()
page = DesignerPage("osm_geojson_lines.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
