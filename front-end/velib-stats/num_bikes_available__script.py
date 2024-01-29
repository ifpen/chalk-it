import plotly.express as px
fig = px.histogram(dataNodes["dfg"], x='numbikesavailable')
fig.update_layout(margin=dict(l=0, r=0, b=5, t=5))

return fig

