from taipy.gui import Gui
from chlkt import *

eiffel_tour = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.2945,
          48.8584
        ]
      },
      "properties": {
        "name": "Eiffel Tower",
        "city": "Paris"
      }
    }
  ]
}

gui = Gui()
page = ChalkitPage("folium-point_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
