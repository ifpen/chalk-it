from taipy.gui import Gui
from iris.main import page as page

gui = Gui()
gui.add_page("iris-main", page)

gui.run(run_browser=True, use_reloader=True)