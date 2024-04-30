from taipy.gui import Gui
from taipy.designer import Page

gui = Gui()


def print_message(select_fruit):
    message = "The selected fruit is: " + select_fruit
    return message


fruits = [
    "apple",
    "banana",
    "cherry",
    "date",
    "elderberry",
    "fig",
    "grape",
    "kiwi",
    "lemon",
    "mango",
]
select_fruit = fruits[0]
message = print_message(select_fruit)


def on_change(state, var, val):
    if var == "select_fruit":
        state.message = print_message(state.select_fruit)


page = Page("select_combo.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)