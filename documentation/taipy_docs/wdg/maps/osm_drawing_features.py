from taipy.gui import Gui
from taipy_designer import *

selected = {
  "geoJson": {
    "type": "FeatureCollection",
    "features": []
  }
}

gui = Gui()
page = DesignerPage("osm_drawing_features.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
