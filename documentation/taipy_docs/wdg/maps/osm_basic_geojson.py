from taipy.gui import Gui
from taipy.designer import *

basicGeoJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [102, 0.5]},
            "properties": {"prop0": "value0"},
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[102, 0], [103, 1], [104, 0], [105, 1]],
            },
            "properties": {"prop0": "value0", "prop1": 0},
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[100, 0], [101, 0], [101, 1], [100, 1], [100, 0]]],
            },
            "properties": {"prop0": "value0", "prop1": {"this": "that"}},
        },
    ],
    "properties": {"description": "GeoJSON example"},
}

gui = Gui()
page = Page("osm_basic_geojson.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
