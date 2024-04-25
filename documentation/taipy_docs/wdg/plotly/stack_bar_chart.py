from taipy.gui import Gui
from taipy.designer import *

trace1 = {
    "x": [2015, 2016, 2017],
    "BHEVs": [247482, 409000, 652000],
}

trace2 = {
    "x": [2015, 2016, 2017],
    "PHEVs": [83610, 98000, 125000],
}

data = [trace1, trace2]

gui = Gui()
page = DesignerPage("stack_bar_chart.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
