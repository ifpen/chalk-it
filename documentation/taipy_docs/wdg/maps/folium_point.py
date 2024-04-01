from taipy.gui import Gui
from chlkt import *

import geopandas as gpd
import folium

eiffel_tour = {
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

gui = Gui()
page = ChalkitPage("folium_point.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
