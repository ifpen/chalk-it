from taipy.gui import Gui
from chlkt import *

geoJsonParkings = 

gui = Gui()
page = ChalkitPage("osm_geojson_points.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
