from taipy.gui import Gui
from taipy.designer import Page

import plotly.express as px

df = px.data.tips()

fig = px.density_heatmap(df, x="total_bill", y="tip")

gui = Gui()
page = Page("plotly_density_heatmap.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)