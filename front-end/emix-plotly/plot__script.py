import pandas as pd
import plotly.graph_objects as go
import plotly.express as px

fig = go.Figure()

df = dataNodes["df"]

# Define common layout
layout = dict(
    showlegend=True,
    xaxis_type='date',
    yaxis=dict(
        type='linear',
        range = [0,90000],
        ticksuffix=' MW'  # Set y-axis units as 'MW' 
    ),
    xaxis_title="Time",
    yaxis_title="Power [MW]",
    title="Daily electrical power for " + dataNodes["date"]
)

if (not dataNodes["bSampling"]):

    # Loop over DataFrame columns
    for col in df.columns[0:]:
        fig.add_trace(go.Scatter(
            x=df.index, y=df[col],
            hoverinfo='x+y',
            mode='lines',
            line=dict(width=0.5),
            name=col,  # Set the trace name to the column name
            stackgroup='one' # define stack group
        ))

    fig.update_layout(layout)

else:
    dff = df.resample('H').mean()
    fig = px.bar(dff, barmode='stack')
    fig.update_layout(layout)

return fig
