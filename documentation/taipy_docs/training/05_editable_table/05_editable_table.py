from taipy.gui import Gui
from chlkt import *

gui = Gui()

editable_table = [["Day", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], 
                  ["Paris", 0, 11, 15 ,16, 20, 18, 17], ["London", 0, 10, 14, 15, 19, 17, 16], 
                  ["New York", 0, 5, 9, 10, 14, 12, 11], ["Tokyo", 0, 3, 7, 8, 12, 10, 9], ["Sydney", 0, 1, 5, 6, 10, 8, 7]]


def compute_total(editable_table):
    total = 0
    for i in range(1, len(editable_table)):
        for j in range(1, len(editable_table[i])):
            total += editable_table[i][j]
    return total

total = compute_total(editable_table)

def on_change(state, var, val):
    if var == "editable_table":
        state.total = compute_total(val)

page = ChalkitPage("05_editable_table.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)