from taipy.gui import Gui
from taipy.designer import Page

point = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [2.295, 48.8738]},
            "properties": {
                "html": 'See <a href="https://en.wikipedia.org/wiki/Place_Charles_de_Gaulle" target="_blank">Place Charles de Gaulle</a>',
                "awesomeMarker": {
                    "icon": " fa-asterisk",
                    "prefix": "fa",
                    "markerColor": "red",
                },
            },
        }
    ],
    "properties": {"description": "Arc de triomphe"},
}

gui = Gui()
page = Page("osm_geojson_point_awesome_marker.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)