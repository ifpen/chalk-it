from taipy.gui import Gui
from taipy.designer import *
import pandas as pd

# Read data from CSV file
CH4_df = pd.read_csv("CH4_data.csv")

CH4_data = CH4_df.to_dict(orient="records")

CH4_heatmap = {
    "data": CH4_data,
    "config": {
        "opacity": 0.8,
        "radius": 4.4,
        "disableAutoscale": False,
        "min": 0,
        "max": 4,
        "colorScale": "interpolateSpectral",
        "reverseColorScale": False,
    },
}

gui = Gui()
page = DesignerPage("osm_heatmap_view.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
