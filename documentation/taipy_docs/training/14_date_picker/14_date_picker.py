from taipy.gui import Gui
from chlkt import *

gui = Gui()

selected_date = "2021-01-01"

page = ChalkitPage("14_date_picker.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)