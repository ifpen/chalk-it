from taipy.gui import JsonAdapter
from types import FunctionType
from pathlib import Path
import json


class FunctionJsonAdapter(JsonAdapter):
    def parse(self, o):
        if isinstance(o, FunctionType):
            return o.__name__
        # if isinstance(o, Icon):
        #     return o._to_dict()
        # if isinstance(o, _MapDict):
        #     return o._dict
        # if isinstance(o, _TaipyBase):
        #     return o.get()
        # if isinstance(o, (datetime, date, time)):
        #     return _date_to_string(o)
        if isinstance(o, Path):
            return str(o)
        if "plotly.graph_objs._figure.Figure" in str(type(o)):
            return json.loads(o.to_json(validate=True, pretty=False))
    #    if "matplotlib.figure.Figure" in str(type(o)): # seems impossible in other thread than main thread
    #        buf = io.BytesIO()
    #        o.savefig(buf, format='png')
    #        buf.seek(0)
    #        img_str = base64.b64encode(buf.read()).decode('UTF-8')    
    #        return img_str
        if "pandas.core.frame.DataFrame" in str(type(o)):
            return json.loads(o.to_json(orient='split'))
        if "folium.folium.Map" in str(type(o)):
            return o._repr_html_()
        if "geopandas.geodataframe.GeoDataFrame" in str(type(o)):
            return json.loads(o.to_json())
        # if "PIL.Image.Image" in str(type(o)):
        #     return image_to_base64(o)            