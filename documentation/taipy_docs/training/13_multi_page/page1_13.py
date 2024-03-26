from chlkt import *

a = 1
b = 5
c = a + b

def on_change(state, var, val):
    if (var == "a" or var == "b"):
        state.c = state.a + state.b


page = ChalkitPage("13_1_page1.xprjson")