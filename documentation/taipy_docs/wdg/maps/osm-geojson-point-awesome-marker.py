from taipy.gui import Gui
from chlkt import *

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
        "html": "See <a href=\"https://en.wikipedia.org/wiki/Place_Charles_de_Gaulle\" target=\"_blank\">Place Charles de Gaulle</a>",
        "awesomeMarker": {
          "icon": " fa-asterisk",
          "prefix": "fa",
          "markerColor": "red"
        }
      }
    }
  ],
  "properties": {
    "description": "Arc de triomphe"
  }
}

gui = Gui()
page = ChalkitPage("osm-geojson-point-awesome-marker_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
