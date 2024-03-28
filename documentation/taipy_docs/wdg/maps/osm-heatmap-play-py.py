from taipy.gui import Gui
from chlkt import *

CH4_heatmap_config = {
  "opacity": 0.9,
  "radius": 4,
  "disableAutoscale": true,
  "min": 0,
  "max": 4,
  "colorScale": "interpolateSpectral",
  "reverseColorScale": true
}

gui = Gui()
page = ChalkitPage("osm-heatmap-play-py_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
