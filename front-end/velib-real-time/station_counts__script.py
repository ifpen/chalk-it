import numpy as np
import pandas as pd

df = dataNodes["dfg"]
if (dataNodes["dockBar"]):
  metric = 'numdocksavailable'
  labels = ['Full', '1 dock', '2 docks', '3-5 docks', '6-10 docks', '> 10 docks']
  
else:
  metric = 'numbikesavailable'
  labels = ['Empty', '1 bike', '2 bikes', '3-5 bikes', '6-10 bikes', '> 10 bikes']

# Assuming df is your DataFrame
bins = [-np.inf, 0, 1, 2, 5, 10, np.inf]
df['station_status'] = pd.cut(df[metric], bins=bins, labels=labels)

# Counting the number of stations for each category
station_counts = df['station_status'].value_counts().reset_index()
station_counts.columns = ['Station Status', 'Count']

return xdash.as_python(station_counts)