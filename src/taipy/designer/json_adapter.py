# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.


from taipy.gui import JsonAdapter
from taipy.gui.utils import _MapDict
from types import FunctionType
import json
import io
import base64
from .utils import replace_nan


_registered = False


def register_json_adapter() -> None:
    global _registered
    if not _registered:
        _registered = True
        FunctionJsonAdapter().register()


class FunctionJsonAdapter(JsonAdapter):
    def parse(self, o):
        cls = type(o)
        name = cls.__module__ + "." + cls.__name__
        if isinstance(o, FunctionType):
            return o.__name__
        elif "plotly.graph_objs._figure.Figure" == name:
            return json.loads(o.to_json(validate=True, pretty=False))
        elif "pandas.core.frame.DataFrame" == name:
            return replace_nan(json.loads(o.to_json(orient="split")))
        elif "folium.folium.Map" == name:
            return o._repr_html_()
        elif "geopandas.geodataframe.GeoDataFrame" == name:
            return replace_nan(json.loads(o.to_json()))
        elif "matplotlib.figure.Figure" == name:
            with io.BytesIO() as buf:
                o.savefig(buf, format="svg")
                return {
                    "content": self._to_b64(buf.getvalue()),
                    "type": "image/svg+xml",
                    "isBinary": True,
                }
        elif "PIL.Image.Image" == name:
            return self._image_to_base64(o)
        elif isinstance(o, _MapDict):
            o_ = o._dict
            o__r = replace_nan(o_)
            return o__r
        elif hasattr(o, "_repr_jpeg_") and callable(getattr(o, "_repr_jpeg_")):
            jpeg_bytes = o._repr_jpeg_()
            return {
                "content": self._to_b64(jpeg_bytes),
                "type": "image/jpeg",
                "isBinary": True,
            }
        elif isinstance(o, io.BytesIO):
            return {
                "content": self._to_b64(o.getvalue()),
                "type": "application/octet-stream",
                "isBinary": True,
            }

    @staticmethod
    def _to_b64(data: bytes) -> str:
        return base64.b64encode(data).decode("ascii")

    @staticmethod
    def _image_to_base64(image):
        with io.BytesIO() as buffered:
            image.save(buffered, format="PNG")
            return {
                "content": FunctionJsonAdapter._to_b64(buffered.getvalue()),
                "type": "image/png",
                "isBinary": True,
            }
