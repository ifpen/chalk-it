from taipy.gui import Gui
from taipy_src.variable_values import page

gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True)