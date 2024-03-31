from taipy.gui import Gui
from taipy_designer import *

point = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.295,
          48.8738
        ]
      },
      "properties": {
        "comment": "click to display the contents of the properties object"
      }
    }
  ],
  "properties": {
    "description": "Arc de triomphe"
  }
}

gui = Gui()
page = DesignerPage("osm_geojson_point.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
