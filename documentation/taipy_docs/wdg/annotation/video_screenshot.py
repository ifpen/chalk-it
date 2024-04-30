from taipy.gui import Gui
from taipy.designer import Page

imageData = {
    "b64": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVR42mNk",
    "mimeType": "image/png",
    "imageData": "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABjElEQVR42mNk",
}

gui = Gui()
page = Page("video_screenshot.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)