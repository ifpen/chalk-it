from taipy.gui import Gui
from taipy.designer import Page

import json

with open("regionsFranceGeoJson.json") as json_file:
    regionsFranceGeoJson = json.load(json_file)

data = []
for region in regionsFranceGeoJson["features"]:
    data.append(
        {
            "geometry": region["geometry"],
            "population": region["properties"]["population"],
        }
    )

choropleth = {
    "data": data,
    "config": {
        "opacity": 0.8,
        "weight": 2,
        "disableAutoscale": False,
        "min": 0,
        "max": 12000000,
        "colorScale": "interpolateOranges",
        "reverseColorScale": False,
    },
}

gui = Gui()
page = Page("osm_choropleth.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)
