# Copyright 2023-2024 IFP Energies nouvelles
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.


from taipy.gui import JsonAdapter
from taipy.gui.utils import _MapDict
from types import FunctionType
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
from matplotlib.collections import QuadMesh
import matplotlib.pyplot as plt
import json
import io, base64
import math
import io
import numpy as np


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
            return self._figure_to_image(o)
        elif "matplotlib.collections.QuadMesh" == name:
            return self._quadmesh_to_image(o)
        elif "PIL.Image.Image" == name:
            return self._image_to_base64(o)
        elif isinstance(o, _MapDict):
            return replace_nan(o._dict)
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

    def _figure_to_image(self, fig, format="png"):
        buf = io.BytesIO()
        fig.savefig(buf, format=format)
        buf.seek(0)
        return {
            "content": self._to_b64(buf.getvalue()),
            "type": f"image/{format}",
            "isBinary": True,
        }

    def _quadmesh_to_image(self, quadmesh, format="png"):
        fig, ax = plt.subplots()
        ax.add_collection(quadmesh)
        ax.axis("tight")
        ax.axis("off")
        return self._figure_to_image(fig, format)

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
