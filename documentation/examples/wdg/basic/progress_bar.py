from taipy.gui import Gui
from chlkt import *

progress = 50

gui = Gui()

page = DesignerPage("progress_bar.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)