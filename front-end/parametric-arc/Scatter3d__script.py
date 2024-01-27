import numpy as np
import plotly.graph_objects as go

n_rotations = dataNodes["params"]["n_rotations"]
r = dataNodes["params"]["radius"]
f = dataNodes["params"]["frequency"]

t = np.linspace(0, n_rotations*2*np.pi, 1000)  # parameter t
x = r * np.cos(f*t)
y = r * np.sin(f*t)
z = t

fig = go.Figure(data=go.Scatter3d(
    x=x, y=y, z=z,
    mode='lines',
    line=dict(color=t, colorscale='Viridis', width=6)
))

# Set axes labels
fig.update_layout(scene=dict(
    xaxis_title='X',
    yaxis_title='Y',
    zaxis_title='Z'
))

# Set axes labels and reduce the margins
fig.update_layout(scene=dict(
    xaxis_title='X',
    yaxis_title='Y',
    zaxis_title='Z'
), title="3D Parametric Helix", 
   margin=dict(l=10, r=10, b=10, t=30))

return fig