from taipy.gui import Gui
from chalkit_manager_page_poc import page

gui = Gui()
gui.add_page("files", page)

gui.run(run_browser=True, use_reloader=True)