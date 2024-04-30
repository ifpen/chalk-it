from taipy.gui import Gui
from chlkt import *

import json

with open("paris_parkings.json") as f:
    geoJsonParkings = json.load(f)

gui = Gui()
page = ChalkitPage("osm_geojson_points.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
