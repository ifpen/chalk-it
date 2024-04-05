import sys
import pandas as pd
import geopandas as gpd
import requests
import re
import numpy as np
from pathlib import Path
from shapely.geometry import Point

sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *


def fetch_stations_status():
    url = "https://opendata.paris.fr/api/records/1.0/search/?dataset=velib-disponibilite-en-temps-reel&q=&rows=2000&facet=name&facet=is_installed&facet=is_renting&facet=is_returning"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return None


def process_stations_status(data):
    df_rt = pd.json_normalize(data["records"])
    df_rt.rename(columns=lambda x: re.sub("^fields\\.", "", x), inplace=True)
    df_rt.drop(["datasetid", "recordid"], axis=1, inplace=True)
    df_rt["lat"] = df_rt["coordonnees_geo"].apply(lambda x: x[0])
    df_rt["lng"] = df_rt["coordonnees_geo"].apply(lambda x: x[1])
    df_rt["is_renting"] = df_rt["is_renting"].replace(["OUI", "NON"], [1, 0])
    df_rt["is_installed"] = df_rt["is_installed"].replace(["OUI", "NON"], [1, 0])
    return df_rt


def augment_with_geodata(df_rt, selected_polygon_geojson=None):

    dfg = df_rt.copy()
    dfg["bikes_availability_rate"] = dfg["numbikesavailable"] / dfg["capacity"]
    dfg["station_full"] = (dfg["numbikesavailable"] == dfg["capacity"]).astype(int)
    dfg["station_empty"] = (dfg["numbikesavailable"] == 0).astype(int)
    geometry = [Point(xy) for xy in zip(dfg["lng"], dfg["lat"])]
    geo_df = gpd.GeoDataFrame(dfg, geometry=geometry)
    if selected_polygon_geojson is not None:
        if len(selected_polygon_geojson["features"]) > 0:
            selected_gpd = gpd.GeoDataFrame.from_features(selected_polygon_geojson)
            # Assume selected_gpd is a single polygon for simplicity
            selected_polygon = selected_gpd.iloc[0]["geometry"]
            # Create a boolean mask where each value is True if the point is within the selected geometry
            mask = geo_df.within(selected_polygon)
            # Use the mask to filter the GeoDataFrame
            filtered_geo_df = geo_df[mask]
            return filtered_geo_df
        else:
            return geo_df
    else:
        return geo_df


def generate_echarts_bar_graph(dfg, dockBar):

    df = dfg.copy()
    if dockBar:
        metric = "numdocksavailable"
        labels = ["Full", "1 dock", "2 docks", "3-5 docks", "6-10 docks", "> 10 docks"]
    else:
        metric = "numbikesavailable"
        labels = ["Empty", "1 bike", "2 bikes", "3-5 bikes", "6-10 bikes", "> 10 bikes"]

    # Assuming df is your DataFrame
    bins = [-np.inf, 0, 1, 2, 5, 10, np.inf]
    df["station_status"] = pd.cut(df[metric], bins=bins, labels=labels)

    # Counting the number of stations for each category
    station_counts = df["station_status"].value_counts().reset_index()
    station_counts.columns = ["Station Status", "Count"]

    # Convert station_counts dataframe to dict
    station_counts_dict = station_counts.to_dict("records")

    if dockBar:
        title = "Docks available per station"
    else:
        title = "Bikes available per station"

    # Create JSON-like dict for ECharts
    echarts_option = {
        "title": {"text": title},
        "tooltip": {"trigger": "axis", "axisPointer": {"type": "shadow"}},
        "grid": {"left": "3%", "right": "4%", "bottom": "3%", "containLabel": True},
        "xAxis": {"type": "value", "boundaryGap": [0, 0.01]},
        "yAxis": {
            "type": "category",
            "data": [d["Station Status"] for d in station_counts_dict],
        },
        "series": [
            {
                "name": "Number of stations",
                "type": "bar",
                "data": [d["Count"] for d in station_counts_dict],
            }
        ],
    }

    return echarts_option


def generate_heatmap_data(geo_df, cfg):
    """
    Generate heatmap data from a GeoDataFrame.

    Args:
    - geo_df: A GeoDataFrame containing bike station data with latitude, longitude, and bikes availability rate.

    Returns:
    - A dictionary suitable for generating a heatmap, including the location and bikes availability rate.
    """
    # Extract relevant data for the heatmap
    heatmap_data = geo_df[["lat", "lng", "bikes_availability_rate"]].copy()

    # Convert the DataFrame to a list of dictionaries for easy JSON serialization
    heatmap_data_list = heatmap_data.to_dict(orient="records")

    # Prepare the configuration for the heatmap display
    heatmap_config = {"data": heatmap_data_list, "config": cfg}
    return heatmap_config


def compute_global_stats(dfg):
    return {
        "Number of available bikes": "{:,}".format(
            int(dfg["numbikesavailable"].sum())
        ).replace(",", " "),
        "Number of available docks": "{:,}".format(
            int(dfg["numdocksavailable"].sum())
        ).replace(",", " "),
        "Capacity": "{:,}".format(int(dfg["capacity"].sum())).replace(",", " "),
        "Number of full stations": "{:,}".format(
            int(dfg["station_full"].sum())
        ).replace(",", " "),
        "Number of empty stations": "{:,}".format(
            int(dfg["station_empty"].sum())
        ).replace(",", " "),
        "Number of renting stations": "{:,}".format(
            int(dfg["is_renting"].sum())
        ).replace(",", " "),
        "Max capacity": int(dfg["capacity"].max()),
    }


# Dashboard parameters
cfg = {
    "opacity": 0.9,
    "radius": 80,
    "disableAutoscale": False,
    "min": 0,
    "max": 1,
    "colorScale": "interpolateRdYlBu",
    "reverseColorScale": False,
}

selected_polygon_geojson = None
dockBar = False

# Init dataflow
stations_status_json = fetch_stations_status()
indicator = ["Availability rate"]
selected_indicator = indicator[0]
last_update = stations_status_json["records"][0]["record_timestamp"]
df_rt = process_stations_status(stations_status_json)
dfg = augment_with_geodata(df_rt, selected_polygon_geojson)
heatmap_json = generate_heatmap_data(dfg, cfg)
echarts_option_json = generate_echarts_bar_graph(dfg, dockBar)
global_stats = compute_global_stats(dfg)


def on_change(state, var, val):
    if var == "selected_polygon_geojson":
        selected_polygon_geojson = val
        dfg = augment_with_geodata(state.df_rt, selected_polygon_geojson)
        heatmap_json = generate_heatmap_data(dfg, state.cfg)
        echarts_option_json = generate_echarts_bar_graph(dfg, state.dockBar)
        state.heatmap_json = heatmap_json
        state.echarts_option_json = echarts_option_json
        state.global_stats = compute_global_stats(dfg)

    if var == "cfg":
        cfg = val
        state.heatmap_json = generate_heatmap_data(state.dfg, cfg)

    if var == "dockBar":
        dockBar = val
        state.echarts_option_json = generate_echarts_bar_graph(state.dfg, dockBar)


page = DesignerPage("velib_real_time_page.xprjson", designer_mode=True)
