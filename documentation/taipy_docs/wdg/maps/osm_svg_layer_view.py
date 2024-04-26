from taipy.gui import Gui
from taipy.designer import Page

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
        "addAs": "overlay",
    },
}

gui = Gui()
page = Page("osm_svg_layer_view.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
