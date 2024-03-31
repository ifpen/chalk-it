from taipy.gui import Gui
from taipy_designer import *

import pandas as pd


markers = ["arrow", "emptyTriangle", "fullTriangle"]

wind_data_df = pd.read_csv("wind_data.csv")
wind_data = wind_data_df.to_dict("records")

wind_svg_layer = {
    "data": wind_data,
    "config": { 
      "marker": "arrow",
      "title": "Wind direction",
      "opacity": 0.5,
      "length": 9.3, 
      "disableAutoscale": False,
      "addAs": "overlay"
    }
}

gui = Gui()
page = DesignerPage("osm_svg_layer_view.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
