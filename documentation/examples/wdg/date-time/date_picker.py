from taipy.gui import Gui
from chlkt import *


selected_date = "2024-04-01"

gui = Gui()
page = ChalkitPage("date_picker.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
