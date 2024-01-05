import json
import sys
import traceback
import typing
from io import BytesIO, StringIO

from xdash_python_api import PICKLE_MIME
from xdash_python_api.datanodes import DataNodesProxy

PANDAS_MAX_ROWS = 20
PANDAS_MAX_COLS = None


def bytes_to_b64(data: bytes) -> str:
    from base64 import standard_b64encode

    return standard_b64encode(data).decode('ascii')


def with_io(fct: typing.Callable[[BytesIO], None]) -> bytes:
    buffer = BytesIO()
    fct(buffer)
    return buffer.getvalue()


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

    def __init__(self, value: any):
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

    def __init__(self, value: any):
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
    def __init__(self, value: any):
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

    def __init__(self, value: any, mime_type=None, name=None):
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


class XDashState:
    capture_io: typing.Tuple[StringIO, StringIO]
    debug_data: typing.List[any]

    def __init__(self, debug, capture_io):
        self._results = None
        self.debug_data = []  # primitives/json, images, -> str
        self.debug = debug
        self.capture_io = capture_io

    def _result_as_dict(self) -> typing.Dict[str, any]:
        if self._results:
            if isinstance(self._results, list):
                raise RuntimeError("There are positional outputs")
            else:
                return self._results
        else:
            self._results = {}
            return self._results

    def _result_as_list(self) -> typing.List[any]:
        if self._results:
            if isinstance(self._results, dict):
                raise RuntimeError("There are keyed outputs")
            else:
                return self._results
        else:
            self._results = []
            return self._results

    def results(self) -> typing.Optional[typing.Union[typing.Dict[str, any], typing.List[any]]]:
        return self._results

    def add_output(self, value: any, key: typing.Optional[str] = None) -> None:
        if key:
            self._result_as_dict()[str(key)] = value
        else:
            self._result_as_list().append(value)

    def add_debug(self, value: any) -> None:
        if self.debug:
            self.debug_data.append(value)


class XDashApi:
    def __init__(self, state: XDashState):
        self._state = state

    @staticmethod
    def base64_to_bytes(b64: str) -> bytes:
        from base64 import standard_b64decode

        return standard_b64decode(b64)

    @staticmethod
    def as_json(value) -> OutputAdapter:
        return JsonAdapter(value)

    @staticmethod
    def as_python(value) -> OutputAdapter:
        return PythonAdapter(value)

    @staticmethod
    def as_image(value) -> OutputAdapter:
        return ImageAdapter(value)

    @staticmethod
    def as_data(value, mime_type=None, name=None) -> OutputAdapter:
        return DataAdapter(value, mime_type, name)

    def output(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(value, key)

    def output_json(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(self.as_json(value), key)

    def output_python(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(self.as_python(value), key)

    def output_image(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(self.as_image(value), key)

    def output_data(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(self.as_data(value), key)

    def debug(self, value: any):
        self._state.add_debug(value)

    def notify(self):
        pass
        # TODO


def smart_adapt(value: any, is_debug: bool = False) -> typing.Optional[OutputAdapter]:
    if isinstance(value, OutputAdapter):
        return value

    cls = type(value)
    fullname = cls.__module__ + '.' + cls.__name__

    if is_debug:
        if fullname == 'pandas.core.frame.DataFrame':
            data = {
                'content': value.to_html(max_rows=PANDAS_MAX_ROWS, max_cols=PANDAS_MAX_COLS),
                'type': 'text/html',
                'isBinary': False,
            }
            return JsonAdapter(data)

    if fullname in ImageAdapter.PREFER_FOR:
        return ImageAdapter(value)
    elif fullname in JsonAdapter.PREFER_FOR:
        return JsonAdapter(value)
    elif fullname in DataAdapter.PREFER_FOR:
        return DataAdapter(value)

    return None


class CustomEncoder(json.JSONEncoder):
    @staticmethod
    def is_debug() -> bool:
        return False

    def default(self, obj: any) -> any:
        if isinstance(obj, OutputAdapter):
            return obj.to_json()

        adapted = smart_adapt(obj, self.is_debug())
        if adapted:
            return adapted

        return PythonAdapter(obj).to_json()


class DebugCustomEncoder(CustomEncoder):
    @staticmethod
    def is_debug() -> bool:
        return True


def process_debug_value(value):
    processed = smart_adapt(value, True)
    return processed if processed else str(value)


def build_result(user_result: typing.Optional[any], xdash_state: XDashState, error: typing.Optional[Exception]) -> any:
    output_results = xdash_state.results()
    if user_result is not None and output_results:
        # user_result implies no error
        return {"error": "'output_*' should not be combined with a 'return'"}
    elif user_result is not None:
        output = user_result
    else:
        output = output_results[0] if isinstance(output_results, list) and len(output_results) == 1 else output_results

    result = {}
    if error:
        result["error"] = error
    else:
        result["result"] = output

    if xdash_state.debug:
        stdout, stderr = xdash_state.capture_io
        result["stdout"] = stdout.getvalue()
        result["stderr"] = stderr.getvalue()
        result["debug"] = [process_debug_value(value) for value in xdash_state.debug_data]

    # TODO notifications ?
    return result


def capture(is_debug: bool = False, script_name: typing.Optional[str] = None, start_line: int = 0):
    def decorate(user_fct):
        def exec_user_fct(data_nodes):
            original_io = (sys.stdout, sys.stderr)
            capture_io = (StringIO(), StringIO())
            sys.stdout, sys.stderr = capture_io

            user_result = None
            error = None
            xdash_state = XDashState(is_debug, capture_io)
            try:
                user_result = user_fct(DataNodesProxy(data_nodes), XDashApi(xdash_state))
            except BaseException as ex:
                tb = traceback.TracebackException.from_exception(ex)

                # Subtract setup lines at the top of the script so that the user sees line numbers
                # relative to their own code, not our infrastructure code.
                if script_name and start_line != 0:
                    for frame in tb.stack:
                        if script_name == frame.filename:
                            frame.lineno -= start_line

                error = "".join(tb.format())
            finally:
                sys.stdout, sys.stderr = original_io

            json_output = build_result(user_result, xdash_state, error)
            return json.dumps(json_output, allow_nan=True, cls=DebugCustomEncoder if is_debug else CustomEncoder)

        return exec_user_fct

    return decorate
