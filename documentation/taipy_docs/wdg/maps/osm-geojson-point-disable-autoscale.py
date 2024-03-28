from taipy.gui import Gui
from chlkt import *

gui = Gui()
page = ChalkitPage("osm-geojson-point-disable-autoscale_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
