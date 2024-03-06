import sys
from pathlib import Path
# Add the parent directory of `back_end` to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *
from taipy.gui.custom import Page
import pandas as pd
import geopandas as gpd
from shapely.geometry import shape, Point
import requests
import re
import json

def fetch_stations_status():
    url = "https://opendata.paris.fr/api/records/1.0/search/?dataset=velib-disponibilite-en-temps-reel&q=&rows=2000&facet=name&facet=is_installed&facet=is_renting&facet=is_returning"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return None

def process_stations_status(data):
    df_rt = pd.json_normalize(data["records"])
    df_rt.rename(columns=lambda x: re.sub('^fields\\.', '', x), inplace=True)
    df_rt.drop(['datasetid', 'recordid'], axis=1, inplace=True)
    df_rt['lat'] = df_rt['coordonnees_geo'].apply(lambda x: x[0])
    df_rt['lng'] = df_rt['coordonnees_geo'].apply(lambda x: x[1])
    df_rt['is_renting'] = df_rt['is_renting'].replace(['OUI', 'NON'], [1, 0])
    df_rt['is_installed'] = df_rt['is_installed'].replace(['OUI', 'NON'], [1, 0])
    return df_rt

def augment_with_geodata(df_rt, selected_polygon_geojson=None):
    dfg = df_rt.copy()
    dfg['bikes_availability_rate'] = dfg['numbikesavailable'] / dfg['capacity']
    dfg['station_full'] = (dfg['numbikesavailable'] == dfg['capacity']).astype(int)
    dfg['station_empty'] = (dfg['numbikesavailable'] == 0).astype(int)
    geometry = [Point(xy) for xy in zip(dfg['lng'], dfg['lat'])]
    geo_df = gpd.GeoDataFrame(dfg, geometry=geometry)
    if selected_polygon_geojson is not None:
        selected_polygon = shape(selected_polygon_geojson)
        mask = geo_df.within(selected_polygon)
        filtered_geo_df = geo_df[mask]
        return filtered_geo_df
    else:
        return geo_df

def generate_echarts_bar_graph(data, dockBar):
    station_counts = data.value_counts().reset_index()
    station_counts.columns = ['Station Status', 'Count']
    title = 'Docks available per station' if dockBar else 'Bikes available per station'

    echarts_option = {
        "title": {"text": title},
        "tooltip": {"trigger": 'axis', "axisPointer": {"type": 'shadow'}},
        "grid": {"left": '3%', "right": '4%', "bottom": '3%', "containLabel": True},
        "xAxis": {"type": 'value', "boundaryGap": [0, 0.01]},
        "yAxis": {"type": 'category', "data": station_counts['Station Status'].tolist()},
        "series": [{"name": 'Count', "type": 'bar', "data": station_counts['Count'].tolist()}]
    }
    return echarts_option

def generate_heatmap_data(geo_df):
    """
    Generate heatmap data from a GeoDataFrame.

    Args:
    - geo_df: A GeoDataFrame containing bike station data with latitude, longitude, and bikes availability rate.

    Returns:
    - A dictionary suitable for generating a heatmap on the JavaScript side, including the location and bikes availability rate.
    """
    # Extract relevant data for the heatmap
    heatmap_data = geo_df[['lat', 'lng', 'bikes_availability_rate']].copy()
    
    # Convert the DataFrame to a list of dictionaries for easy JSON serialization
    heatmap_data_list = heatmap_data.to_dict(orient='records')

    # Prepare the configuration for the heatmap display
    heatmap_config = {
        "data": heatmap_data_list,
        "config": {
            "opacity": 0.9,
            "radius": 80,
            "disableAutoscale": False,
            "min": 0,
            "max": 1,
            "colorScale": "interpolateRdYlBu",
            "reverseColorScale": False
        }
    }
    return heatmap_config

# Example of incorporating the function into the workflow
stations_status_json = fetch_stations_status()
df_rt = process_stations_status(stations_status_json)
dfg = augment_with_geodata(df_rt)
heatmap_data_config = generate_heatmap_data(dfg)
echarts_option_json = generate_echarts_bar_graph(dfg['numbikesavailable'], dockBar=False)


# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())