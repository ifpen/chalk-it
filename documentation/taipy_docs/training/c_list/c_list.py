from taipy.gui import Gui
from chlkt import *


def print_message(select_fruits):
    message = "The selected fruits are: " + ", ".join(select_fruits)
    return message

fruits = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "kiwi", "lemon", "mango"]
select_fruits = [fruits[0]]
message = print_message(select_fruits)

def on_change(state, var, val):
    if (var == "select_fruits"):
        state.message = print_message(state.select_fruits)


page = ChalkitPage("c_list.xprjson", designer_mode=True)
gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)