from taipy.gui import Gui
from taipy.designer import Page
import plotly.express as px


fig = px.imshow([[1, 20, 30], [20, 1, 60], [30, 60, 1]])

page = Page("i_plotly_figure.xprjson")
gui = Gui()
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)