from taipy.gui import JsonAdapter
from types import FunctionType
from pathlib import Path
import json
import io, base64
import math
import datetime

class FunctionJsonAdapter(JsonAdapter):
    def parse(self, o):
        if isinstance(o, FunctionType):
            return o.__name__
        if "plotly.graph_objs._figure.Figure" in str(type(o)):
            return json.loads(o.to_json(validate=True, pretty=False))
        #if "matplotlib.figure.Figure" in str(type(o)): # seems impossible in other thread than main thread
        #    buf = io.BytesIO()
        #    o.savefig(buf, format='png')
        #    buf.seek(0)
        #    img_str = base64.b64encode(buf.read()).decode('UTF-8')    
        #    return img_str
        if "pandas.core.frame.DataFrame" in str(type(o)):
            return json.loads(o.to_json(orient='split'))
        if "folium.folium.Map" in str(type(o)):
            return o._repr_html_()
        if "geopandas.geodataframe.GeoDataFrame" in str(type(o)):
            return json.loads(o.to_json())
        if "PIL.Image.Image" in str(type(o)):
            return self._image_to_base64(o)
        
    # Function to convert an image to base64
    def _image_to_base64(image):
        # Create a BytesIO buffer to save the image
        buffered = io.BytesIO()
        # Save the image to the buffer in JPEG format
        image.save(buffered, format="JPEG")
        # Get the byte data from the buffer
        img_byte = buffered.getvalue()
        # Encode the bytes to base64
        img_base64 = base64.b64encode(img_byte)
        # Convert bytes to string for HTML use
        img_base64_str = img_base64.decode('utf-8')
        html_img_str = f'data:image/jpeg;base64,{img_base64_str}'

        return html_img_str

