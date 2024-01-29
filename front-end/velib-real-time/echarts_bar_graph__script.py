station_counts = dataNodes["station_counts"]

# Convert station_counts dataframe to dict
station_counts_dict = station_counts.to_dict('records')

if dataNodes["dockBar"]:
  title = 'Docks available per station'
else:
  title = 'Bikes available per station'

# Create JSON-like dict for ECharts
echarts_option = {
    "title": {
        "text": title
    },
    "tooltip": {
        "trigger": 'axis',
        "axisPointer": {
            "type": 'shadow'
        }
    },
    "grid": {
        "left": '3%',
        "right": '4%',
        "bottom": '3%',
        "containLabel": True
    },
    "xAxis": {
        "type": 'value',
        "boundaryGap": [0, 0.01]
    },
    "yAxis": {
        "type": 'category',
        "data": [d['Station Status'] for d in station_counts_dict]
    },
    "series": [
        {
            "name": 'Number of stations',
            "type": 'bar',
            "data": [d['Count'] for d in station_counts_dict]
        }
    ]
}

return echarts_option