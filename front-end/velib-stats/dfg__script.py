import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

dfg=dataNodes["df_rt"]
dfg['bikes_availability_rate'] = dfg['numbikesavailable'] / dfg['capacity']
dfg['station_full'] = (dfg['numbikesavailable'] == dfg['capacity']).astype(int)
dfg['station_empty'] = (dfg['numbikesavailable'] == 0).astype(int)


# Convert DataFrame to GeoDataFrame
geometry = [Point(xy) for xy in dfg['geometry.coordinates']]
geo_df = gpd.GeoDataFrame(dfg, geometry=geometry)

if (not dataNodes["selected_gpd"].empty):

  # Assume selected_gpd is a single polygon for simplicity
  selected_polygon = dataNodes["selected_gpd"].iloc[0]['geometry']

  # Create a boolean mask where each value is True if the point is within the selected geometry
  mask = geo_df.within(selected_polygon)

  # Use the mask to filter the GeoDataFrame
  filtered_geo_df = geo_df[mask]

  return filtered_geo_df

else:
  return geo_df
