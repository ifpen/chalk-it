from taipy.gui import Gui
from eco2mix_plotly_page import page

gui = Gui()
gui.add_page("eco2mix", page)

gui.run(run_browser=True, use_reloader=False)