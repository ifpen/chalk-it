from taipy.gui import Gui

from page1_13 import page as page1
from page2_13 import page as page2

gui = Gui()

gui.add_page("page1", page1)
gui.add_page("page2", page2)

gui.run(run_browser=True, use_reloader=False)