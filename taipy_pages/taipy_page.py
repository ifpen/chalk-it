import sys
import plotly.express as px
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *

a = 8
b = 10
c = a + b * 2

path = ""
df = px.data.gapminder().query("country=='Canada'")
fig = px.line(df, x="year", y="lifeExp", title="Life expectancy in Canada")

df2 = px.data.gapminder().query("year == 2007").query("continent == 'Europe'")
df2.loc[df2["pop"] < 2.0e6, "country"] = (
    "Other countries"  # Represent only large countries
)
fig2 = px.pie(
    df2, values="pop", names="country", title="Population of European continent"
)

fruits = ["apple", "blueberry", "cherry", "orange"]
counts = [40, 100, 30, 55]

selectd_fruit = "apple"
selectd_count = 40
hello_var = "toto titi"

# Initializing real numbers
x = 5
y = 3

# converting x and y into complex number
z = complex(x, y)


def load_csv(state):
    print("loading csv", state.path)


def on_change(state, var, val):
    if (var == "a") or (var == "b"):
        state.c = state.a + state.b * 2


def run_simul(state):
    notice(state, "Title", "message", "info", 2000)
    print("running simulation", state.path)


page = ChalkitPage("taipy_page.xprjson", designer_mode=True)
