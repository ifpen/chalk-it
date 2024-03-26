from taipy.gui import Gui
from chlkt import *
import copy

gui = Gui()

fruits = [
    "Apple",
    "Banana",
    "Orange",
    "Mango",
    "Strawberry",
    "Grapes",
    "Watermelon",
    "Pineapple",
    "Cherry",
    "Peach",
    "Papaya",
    "Kiwi",
    "Plum",
    "Pomegranate",
    "Blueberry",
    "Raspberry",
    "Blackberry",
    "Cantaloupe",
    "Lemon",
    "Lime"
]

seleced_fruit = fruits[0]

list_fruits = []

def add_fruit_to_list(state):
    list_fruits = state.list_fruits
    list_fruits.append(state.seleced_fruit)
    state.list_fruits = copy.deepcopy(list_fruits)

page = ChalkitPage("16_crud_template.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)