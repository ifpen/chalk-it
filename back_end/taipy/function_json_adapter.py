from taipy.gui import JsonAdapter
from types import FunctionType
import json
import io, base64
import numpy as np

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, float) and np.isnan(obj):
            return None
        return json.JSONEncoder.default(self, obj)

class FunctionJsonAdapter(JsonAdapter):
    @staticmethod
    def json_fix(obj):
        jsn_str = json.dumps(obj, cls=CustomEncoder)
        jsn_obj = json.loads(jsn_str)  # Corrected from json.parse to json.loads
        return jsn_obj
        
    def parse(self, o):
        if isinstance(o, FunctionType):
            return o.__name__
        elif "plotly.graph_objs._figure.Figure" in str(type(o)):
            return json.loads(o.to_json(validate=True, pretty=False))
        elif "pandas.core.frame.DataFrame" in str(type(o)):
            return self.json_fix(json.loads(o.to_json(orient='split')))
        elif "folium.folium.Map" in str(type(o)):
            return o._repr_html_()
        elif "geopandas.geodataframe.GeoDataFrame" in str(type(o)):
            return self.json_fix(json.loads(o.to_json()))
        elif "PIL.Image.Image" in str(type(o)):
            return self._image_to_base64(o)
        else:
            return self.json_fix(super().parse(o))  # Corrected super().parse(self, o) to super().parse(o)

    @staticmethod
    def _image_to_base64(image):
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_byte = buffered.getvalue()
        img_base64 = base64.b64encode(img_byte)
        img_base64_str = img_base64.decode('utf-8')
        return f'data:image/jpeg;base64,{img_base64_str}'
