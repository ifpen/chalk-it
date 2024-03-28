from taipy.gui import Gui
from chlkt import *
import pandas as pd

# Read data from CSV file
CH4_df = pd.read_csv("CH4_data.csv")

CH4_data = CH4_df.to_dict(orient='records')

CH4_heatmap_config = {
  "opacity": 0.8,
  "radius": 4.4,
  "disableAutoscale": False,
  "min": 0,
  "max": 4,
  "colorScale": "interpolateSpectral",
  "reverseColorScale": False
}

CH4_heatmap = {
  "data" : CH4_data,
  "config" : CH4_heatmap_config
}

def on_change(state, var, val):
  if (var == "CH4_heatmap"):
    state.CH4_heatmap = val

gui = Gui()
page = ChalkitPage("osm-heatmap-view_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
