from taipy.gui import Gui
from chlkt import *

selected = {
  "geoJson": {
    "type": "FeatureCollection",
    "features": []
  }
}

gui = Gui()
page = ChalkitPage("osm-drawing-features_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
