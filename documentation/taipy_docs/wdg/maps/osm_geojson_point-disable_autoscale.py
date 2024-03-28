from taipy.gui import Gui
from chlkt import *

gui = Gui()
page = ChalkitPage("osm_geojson_point_disable_autoscale.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
