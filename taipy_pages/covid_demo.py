from taipy.gui import Gui
from covid_page import page as page1


gui = Gui()
gui.add_page("covid", page1)
gui.run(run_browser=True, use_reloader=False)