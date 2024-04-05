from taipy.gui import Gui
from taipy_designer import *
import plotly.express as px


gui = Gui()

fig = px.imshow([[1, 20, 30],
                 [20, 1, 60],
                 [30, 60, 1]])

page = DesignerPage("i_plotly_figure.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)