from taipy.gui import Gui
from iris_demo_page import page

gui = Gui()
gui.add_page("iris", page)
gui.run(design=True, run_browser=True, use_reloader=False)
