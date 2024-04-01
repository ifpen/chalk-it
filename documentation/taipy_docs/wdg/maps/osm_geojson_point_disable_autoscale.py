from taipy.gui import Gui
from taipy_designer import *

disableAutoScale = False

def define_point(disableAutoScale):
  return {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "comment": "click to display the contents of the properties object"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [
            2.295,
            48.8738
          ]
        }
      }
    ],
    "properties": {
      "description": "Arc de triomphe",
      "disableAutoscale": disableAutoScale
    }
  }

point = define_point(disableAutoScale)

def update(state):
  state.point = define_point(state.disableAutoScale)
  
def on_change(state, var, val):
  if (var == "disableAutoScale"):
    state.point = define_point(val)

gui = Gui()
page = DesignerPage("osm_geojson_point_disable_autoscale.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
