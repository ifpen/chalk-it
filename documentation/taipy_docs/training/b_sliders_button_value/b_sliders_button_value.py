from taipy.gui import Gui
from taipy_designer import *

gui = Gui()

a = 1
b = 5
c = a + b

def compute_addition(state, var, val):
        state.c = state.a + state.b


page = DesignerPage("b_sliders_button_value.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)