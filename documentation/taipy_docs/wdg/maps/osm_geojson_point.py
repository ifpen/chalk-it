from taipy.gui import Gui
from taipy.designer import Page

point = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [2.295, 48.8738]},
            "properties": {
                "comment": "click to display the contents of the properties object"
            },
        }
    ],
    "properties": {"description": "Arc de triomphe"},
}

gui = Gui()
page = Page("osm_geojson_point.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
