from taipy.gui import Gui
from chlkt import *
import plotly.express as px


gui = Gui()

fig = px.imshow([[1, 20, 30],
                 [20, 1, 60],
                 [30, 60, 1]])

page = ChalkitPage("07_plotly_figure.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)