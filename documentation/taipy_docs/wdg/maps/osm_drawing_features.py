from taipy.gui import Gui
from taipy.designer import Page

selected = {"geoJson": {"type": "FeatureCollection", "features": []}}

gui = Gui()
page = Page("osm_drawing_features.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)
