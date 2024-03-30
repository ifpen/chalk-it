from taipy.gui import Gui
from chlkt import *

line = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            2.295,
            48.8738
          ],
          [
            2.321125,
            48.865487
          ]
        ]
      },
      "properties": {
        "style": {
          "color": "#FF0000",
          "weight": 4,
          "opacity": 1
        }
      }
    }
  ],
  "properties": {
    "description": "<span style=\"color: #FF0000\">Champs-\u00c3\u2030lys\u00c3\u00a9es</span>"
  }
}

gui = Gui()
page = ChalkitPage("osm_geojson_line.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
