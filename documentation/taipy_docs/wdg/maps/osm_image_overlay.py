from taipy.gui import Gui
from taipy.designer import Page


imgStruct = {
    "imageUrl": "https://www.ifpenergiesnouvelles.fr/sites/ifpen.fr/files/logo_ifpen_2.jpg",
    "imageBounds": [[48.874875, 2.171738], [48.877923, 2.179484]],
    "title": "IFPEN location",
    "addAs": "overlay",
    "options": {"opacity": 0.9},
}

gui = Gui()
page = Page("osm_image_overlay.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)
