from taipy.gui.custom import Page
from source.connectors.taipy.resource_handler import PureHTMLResourceHandler
import plotly.express as px

a = 8
b = 10
c = a + b * 2


df = px.data.gapminder().query("country=='Canada'")
fig = px.line(df, x="year", y="lifeExp", title='Life expectancy in Canada')

def on_change(state):
    state.c = state.a + state.b * 2


# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())
