from taipy.gui import Gui
from taipy_designer import *

polygon = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [
              2.300815,
              48.871943
            ],
            [
              2.30158,
              48.864638
            ],
            [
              2.310094,
              48.868996
            ]
          ]
        ]
      },
      "properties": {
        "style": {
          "color": "#01DF01",
          "weight": 4,
          "opacity": 0.9,
          "fillColor": "#01DF01",
          "fillOpacity": 0.4
        }
      }
    }
  ],
  "properties": {
    "description": "<span style=\"color: #01DF01\">Triangle d'or</span>"
  }
}

gui = Gui()
page = DesignerPage("osm_geojson_polygon.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
