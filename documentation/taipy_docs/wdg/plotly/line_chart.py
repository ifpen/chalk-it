from taipy.gui import Gui
from chlkt import *

plot = {
  "x": [
    0,
    1,
    2,
    3,
    4,
    5
  ],
  "y": [
    0,
    2,
    4,
    6,
    8,
    10
  ]
}

gui = Gui()
page = ChalkitPage("line_chart.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)