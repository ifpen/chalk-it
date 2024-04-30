from taipy.gui import Gui
from chlkt import *

progress = 50

gui = Gui()

page = Page("progress_bar.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)
