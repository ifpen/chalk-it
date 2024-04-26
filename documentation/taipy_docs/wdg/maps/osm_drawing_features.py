from taipy.gui import Gui
from taipy.designer import *

selected = {"geoJson": {"type": "FeatureCollection", "features": []}}

gui = Gui()
page = Page("osm_drawing_features.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
