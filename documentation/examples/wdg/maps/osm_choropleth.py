from taipy.gui import Gui
from chlkt import *

import json

with open('regionsFranceGeoJson.json') as json_file:
    regionsFranceGeoJson =  json.load(json_file)
    
data = []
for region in regionsFranceGeoJson["features"]:
    data.append({"geometry": region["geometry"], "population": region["properties"]["population"]})

choropleth = {
  "data": data,         
  "config": {
    "opacity": 0.8,
    "weight": 2,
    "disableAutoscale": False,
    "min": 0,
    "max": 12000000,
    "colorScale": "interpolateOranges",
    "reverseColorScale": False
  } 
}

gui = Gui()
page = ChalkitPage("osm_choropleth.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
