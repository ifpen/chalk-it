from taipy.gui.custom import Page
from source.connectors.taipy.resource_handler import PureHTMLResourceHandler
import plotly.express as px

a = 8
b = 10
c = a + b * 2
d = 86


f = 4

df = px.data.gapminder().query("country=='Canada'")
fig = px.line(df, x="year", y="lifeExp", title='Life expectancy in Canada')

df2 = px.data.gapminder().query("year == 2007").query("continent == 'Europe'")
df2.loc[df2['pop'] < 2.e6, 'country'] = 'Other countries' # Represent only large countries
fig2 = px.pie(df2, values='pop', names='country', title='Population of European continent')


fruits = ['apple', 'blueberry', 'cherry', 'orange']
counts = [40, 100, 30, 55]

selectd_fruit = 'apple'
selectd_count = 40

def on_change(state, var, val):
    if ((var == 'a') or (var == 'b')):
        state.c = state.a + state.b * 2
    if var == 'selectd_fruit':
        state.selectd_count = state.counts[state.fruits.index(val)]

# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())
