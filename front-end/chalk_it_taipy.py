from taipy.gui import Gui
from taipy_page import page as page1
from taipy_matplotlib import page as page2
from folium_map import page as page3


gui = Gui()
gui.add_page("page1", page1)
gui.add_page("page2", page2)
gui.add_page("page3", page3)
gui.run(run_browser=True, use_reloader=True)