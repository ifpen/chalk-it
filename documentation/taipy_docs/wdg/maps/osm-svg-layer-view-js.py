from taipy.gui import Gui
from chlkt import *

selected = {
  "marker": "arrow"
}

markers = [
  {
    "key": "arrow",
    "value": "arrow"
  },
  {
    "key": "emptyTriangle",
    "value": "emptyTriangle"
  },
  {
    "key": "fullTriangle",
    "value": "fullTriangle"
  }
]

configs = {
  "length": 9.3,
  "disableAutoscale": false
}

wind_data = [
  {
    "lat": 48.876684999999995,
    "lng": 2.175765,
    "rotation": 255
  },
  {
    "lat": 48.876684999999995,
    "lng": 2.175765,
    "rotation": 256
  },
  {
    "lat": 48.876684999999995,
    "lng": 2.175765,
    "rotation": 250
  },
  {
    "lat": 48.876705,
    "lng": 2.175806666666667,
    "rotation": 252
  },
  {
    "lat": 48.876705,
    "lng": 2.175806666666667,
    "rotation": 253
  },
  {
    "lat": 48.876705,
    "lng": 2.175806666666667,
    "rotation": 264
  },
  {
    "lat": 48.876741666666675,
    "lng": 2.1758333333333337,
    "rotation": 266
  },
  {
    "lat": 48.876741666666675,
    "lng": 2.1758333333333337,
    "rotation": 267
  },
  {
    "lat": 48.876741666666675,
    "lng": 2.1758333333333337,
    "rotation": 260
  },
  {
    "lat": 48.87675333333333,
    "lng": 2.175885,
    "rotation": 256
  },
  {
    "lat": 48.87675333333333,
    "lng": 2.175885,
    "rotation": 251
  },
  {
    "lat": 48.87675333333333,
    "lng": 2.175885,
    "rotation": 252
  },
  {
    "lat": 48.87678833333333,
    "lng": 2.1759616666666663,
    "rotation": 259
  },
  {
    "lat": 48.87678833333333,
    "lng": 2.1759616666666663,
    "rotation": 260
  },
  {
    "lat": 48.87678833333333,
    "lng": 2.1759616666666663,
    "rotation": 256
  },
  {
    "lat": 48.876776666666665,
    "lng": 2.1760533333333334,
    "rotation": 257
  }
]

gui = Gui()
page = ChalkitPage("osm-svg-layer-view-js_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
