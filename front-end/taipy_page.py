from taipy.gui.custom import Page
from source.connectors.taipy.resource_handler import PureHTMLResourceHandler

a = 8
b = 10
c = a + b * 2

def on_change(state):
    state.c = state.a + state.b * 2


# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())
