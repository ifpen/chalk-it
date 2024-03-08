from taipy.gui import JsonAdapter
from taipy.gui.utils import _MapDict
from types import FunctionType
import json
import io, base64
import numpy as np
import math

def replace_nan(obj):
    """
    Recursively replace NaN values with None in a nested structure.
    """
    if isinstance(obj, float) and math.isnan(obj):
        return None
    elif isinstance(obj, dict):
        return {k: replace_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_nan(item) for item in obj]
    return obj
        

class FunctionJsonAdapter(JsonAdapter):
    def parse(self, o):
        if isinstance(o, FunctionType):
            return o.__name__
        elif "plotly.graph_objs._figure.Figure" in str(type(o)):
            return json.loads(o.to_json(validate=True, pretty=False))
        elif "pandas.core.frame.DataFrame" in str(type(o)):
            return replace_nan(json.loads(o.to_json(orient='split')))
        elif "folium.folium.Map" in str(type(o)):
            return o._repr_html_()
        elif "geopandas.geodataframe.GeoDataFrame" in str(type(o)):
            return replace_nan(json.loads(o.to_json()))
        elif "PIL.Image.Image" in str(type(o)):
            return self._image_to_base64(o)
        elif isinstance(o, _MapDict):
            o_=o._dict
            o__r = replace_nan(o_)
            return o__r
        #else:
        #   o_=super().parse(o)
        #   return replace_nan(o_)

    @staticmethod
    def _image_to_base64(image):
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_byte = buffered.getvalue()
        img_base64 = base64.b64encode(img_byte)
        img_base64_str = img_base64.decode('utf-8')
        return f'data:image/jpeg;base64,{img_base64_str}'
