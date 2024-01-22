from taipy.gui import Gui
from taipy_page import page

gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True)