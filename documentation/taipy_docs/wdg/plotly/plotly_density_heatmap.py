from taipy.gui import Gui
from taipy_designer import *

import plotly.express as px
df = px.data.tips()

fig = px.density_heatmap(df, x="total_bill", y="tip")

gui = Gui()
page = DesignerPage("plotly_density_heatmap.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
