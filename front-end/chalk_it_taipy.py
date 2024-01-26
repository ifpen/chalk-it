from taipy.gui import Gui
#from taipy_page import page
from taipy_matplotlib import page

gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=True)