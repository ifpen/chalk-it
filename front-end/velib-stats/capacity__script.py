import pandas as pd
import plotly.express as px

dfg = dataNodes["dfg"]

fig = px.histogram(dfg, x='capacity')
fig.update_layout(margin=dict(l=0, r=0, b=5, t=5))


return fig