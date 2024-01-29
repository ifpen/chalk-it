import geopandas as gpd

# Load your GeoJSON file containing polygons
polygons = gpd.GeoDataFrame.from_features(dataNodes["selected_polygon"])

return xdash.as_python(polygons)