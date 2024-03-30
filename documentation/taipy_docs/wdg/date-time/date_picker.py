from taipy.gui import Gui
from chlkt import *

gui = Gui()
page = ChalkitPage("date_picker_modif.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
