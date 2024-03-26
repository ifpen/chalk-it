from taipy.gui import Gui
from chlkt import *

gui = Gui()

a = 1
b = 5
c = a + b

def on_change(state, var, val):
    if (var == "a" or var == "b"):
        state.c = state.a + state.b


page = ChalkitPage("01_sliders_value.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)