from taipy.gui import Gui
from taipy.designer import *

lineHeatMap = {
    "data": [
        {"coordinates": [[4.84112, 45.74968], [4.84091, 45.74981]], "CO2": 6},
        {"coordinates": [[4.84138, 45.74953], [4.84112, 45.74968]], "CO2": 10},
        {"coordinates": [[4.84158, 45.74941], [4.84138, 45.74953]], "CO2": 0},
    ],
    "config": {
        "opacity": 0.7,
        "weight": 4,
        "disableAutoscale": False,
        "min": 4,
        "max": 10,
        "colorScale": "interpolateSpectral",
        "reverseColorScale": False,
    },
}

gui = Gui()
page = Page("osm_lineheatmap.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
