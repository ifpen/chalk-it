from taipy.gui import Gui
from taipy_designer import *


a = 1
b = 5
c = a + b

def compute_addition(state, var, val):
        state.c = state.a + state.b


page = DesignerPage("b_sliders_button_value.xprjson", designer_mode=True)
gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)