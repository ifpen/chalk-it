from taipy.gui import Gui
from taipy.designer import Page

data = {
    "fuel": ["Gasoline", "Diesel", "Biofuel", "LPG", "NGV"],
    "consumption": [1010, 821, 69, 25, 38],
}

gui = Gui()
page = Page("bar_chart.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
