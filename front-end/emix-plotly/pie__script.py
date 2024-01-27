import plotly.graph_objects as go

total_energy_GWh = dataNodes["energy"]/1000

# Create new labels with units
labels_with_units = [f'{label} (GWh)' for label in total_energy_GWh.index]

# Create the pie chart
fig = go.Figure(data=[go.Pie(labels=labels_with_units, 
                             values=total_energy_GWh.values,
                             hole=.3)])  # Adjust hole parameter to create a donut chart

# Give the chart a title
fig.update_layout(title_text="Total energy production by sector")

# Show the chart
return fig