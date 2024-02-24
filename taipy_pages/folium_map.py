import sys
from pathlib import Path
# Add the parent directory of `back_end` to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end.taipy.resource_handler import PureHTMLResourceHandler
from taipy.gui.custom import Page
import geopandas as gpd
from shapely.geometry import shape
import folium

# user code starts here
eiffel_tour ={
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          2.2945,
          48.8584
        ]
      },
      "properties": {
        "name": "Eiffel Tower",
        "city": "Paris"
      }
    }
  ]
}

# Read the GeoJSON file with GeoPandas
gdf = gpd.GeoDataFrame.from_features(eiffel_tour)

# Get the latitude and longitude of the Eiffel Tower
eiffel_tower = gdf.loc[0, "geometry"]
latitude, longitude = eiffel_tower.y, eiffel_tower.x

# Create a folium map centered at the Eiffel Tower
map = folium.Map(location=[latitude, longitude], zoom_start=15)

# Add a marker for the Eiffel Tower
folium.Marker(
    location=[latitude, longitude],
    popup="Eiffel Tower",
    icon=folium.Icon(color="blue", icon="info-sign"),
).add_to(map)

# User code ends here

# String to sent to Chalk'it
#map_html = map._repr_html_()

# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())
