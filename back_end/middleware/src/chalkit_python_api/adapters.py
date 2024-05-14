import json
import sys
from io import BytesIO
from typing import Any

from chalkit_python_api import PICKLE_MIME
from chalkit_python_api.utils import bytes_to_b64, with_io


class OutputAdapter:
    def to_json(self):
        pass


class JsonAdapter(OutputAdapter):
    PREFER_FOR = {
        'pandas.core.frame.DataFrame',
        'pandas.core.series.Series',
        'plotly.graph_objs._figure.Figure',
        'numpy.ndarray',
    }

    def __init__(self, value: Any):
        self._value = value

    def to_json(self):
        cls = type(self._value)
        name = cls.__module__ + '.' + cls.__name__

        if name == 'pandas.core.frame.DataFrame' or name == 'pandas.core.series.Series':
            return json.loads(self._value.to_json(orient='split'))
        elif name == 'plotly.graph_objs._figure.Figure':
            return json.loads(self._value.to_json())
        elif name == 'numpy.ndarray':
            return self._value.tolist()

        return self._value


class ImageAdapter(OutputAdapter):
    PREFER_FOR = {
        'matplotlib.figure.Figure',
        'PIL.Image.Image',
    }

    def __init__(self, value: Any):
        self._value = value

    def to_json(self):
        cls = type(self._value)
        name = cls.__module__ + '.' + cls.__name__

        if name == 'matplotlib.figure.Figure':
            image_svg = with_io(lambda buffer: self._value.savefig(buffer, format='svg'))
            return {
                "content": bytes_to_b64(image_svg),
                "type": "image/svg+xml",
                "isBinary": True,
            }
        elif name == 'plotly.graph_objs._figure.Figure':
            if 'pyodide' in sys.modules:
                raise NotImplementedError("Does not work with Pyodide")

            data = self._value.to_image(format="svg")
            return {
                "content": bytes_to_b64(data),
                "type": "image/svg+xml",
                "isBinary": True,
            }
        elif name == 'PIL.Image.Image':
            data = with_io(lambda buffer: self._value.save(buffer, format='PNG'))
            return {
                "content": bytes_to_b64(data),
                "type": "image/png",
                "isBinary": True,
            }

        return self._value


class PythonAdapter(OutputAdapter):
    def __init__(self, value: Any):
        self._value = value

    def to_json(self):
        import pickle

        return {
            "content": bytes_to_b64(pickle.dumps(self._value)),
            "type": PICKLE_MIME,
            "name": type(self._value).__module__ + "." + type(self._value).__name__,
            "isBinary": True,
        }


class DataAdapter(OutputAdapter):
    PREFER_FOR = {
        '_io.BytesIO',
        'builtins.bytes',
    }

    def __init__(self, value: Any, mime_type=None, name=None):
        self._mime_type = mime_type
        self._name = name
        self._value = value

    def to_json(self):
        cls = type(self._value)
        name = cls.__module__ + '.' + cls.__name__

        mime_type = None

        if isinstance(self._value, BytesIO):
            data = self._value.getvalue()
        elif isinstance(self._value, bytes):
            data = self._value
        elif name == 'numpy.ndarray':
            import numpy

            data = with_io(lambda buffer: numpy.save(buffer, self._value))
        elif name == 'PIL.Image.Image':
            data = with_io(lambda buffer: self._value.save(buffer, format='PNG'))
            mime_type = "image/png"
        else:
            # questionable
            data = self._value

        if self._mime_type and not mime_type:
            mime_type = self._mime_type

        result = {
            "content": bytes_to_b64(data),
            "type": mime_type if mime_type else 'application/octet-stream',
            "isBinary": True,
        }
        if self._name:
            result['name'] = self._name

        return result
