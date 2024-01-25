from taipy.gui.custom import Page
from source.connectors.taipy.resource_handler import PureHTMLResourceHandler
import plotly.express as px

a = 8
b = 10
c = a + b * 2
d = 86
e = 65


df = px.data.gapminder().query("country=='Canada'")
fig = px.line(df, x="year", y="lifeExp", title='Life expectancy in Canada')


fruits = ['apple', 'blueberry', 'cherry', 'orange']
counts = [40, 100, 30, 55]
bar_labels = ['red', 'blue', '_red', 'orange']
bar_colors = ['tab:red', 'tab:blue', 'tab:red', 'tab:orange']


def on_change(state):
    state.c = state.a + state.b * 2




# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())
