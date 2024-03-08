from taipy.gui import Gui
from velib_real_time_page import page

gui = Gui()
gui.add_page("velib-real-time", page)

gui.run(run_browser=True, use_reloader=False)