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


import json
import sys
import traceback
from collections.abc import Callable
from io import BytesIO, StringIO
from typing import Any, Optional, Union

from chalkit_python_api import PICKLE_MIME
from chalkit_python_api.datanodes import DataNodesProxy

PANDAS_MAX_ROWS = 20
PANDAS_MAX_COLS = None


def bytes_to_b64(data: bytes) -> str:
    from base64 import standard_b64encode

    return standard_b64encode(data).decode('ascii')


def with_io(fct: Callable[[BytesIO], None]) -> bytes:
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


class ChalkitState:
    capture_io: tuple[StringIO, StringIO]
    debug_data: list[Any]

    def __init__(self, debug, capture_io):
        self._results = None
        self.debug_data = []  # primitives/json, images, -> str
        self.debug = debug
        self.capture_io = capture_io

    def _result_as_dict(self) -> dict[str, Any]:
        if self._results:
            if isinstance(self._results, list):
                raise RuntimeError("There are positional outputs")
            else:
                return self._results
        else:
            self._results = {}
            return self._results

    def _result_as_list(self) -> list[Any]:
        if self._results:
            if isinstance(self._results, dict):
                raise RuntimeError("There are keyed outputs")
            else:
                return self._results
        else:
            self._results = []
            return self._results

    def results(self) -> Optional[Union[dict[str, Any], list[Any]]]:
        return self._results

    def add_output(self, value: Any, key: Optional[str] = None) -> None:
        if key:
            self._result_as_dict()[str(key)] = value
        else:
            self._result_as_list().append(value)

    def add_debug(self, value: Any) -> None:
        if self.debug:
            self.debug_data.append(value)


class ChalkitApi:
    """An instance of `ChalkitApi` is provided to user scripts as `chalkit`. It can be used by scripts to interact
     with Chalk'it.

    Aside from utility fonctions, it provides a set of methods to build the script's output. The `output` method
    can be used as an alternative to a return statement. If called multiple times the results will be combined as a
    JSON array or object.

    As Chalk'it can only handle JSON data, any returned python object will be converted according to a set of
    heuristics. Lists, dicts, string and numbers will be directly mapped to their JSON equivalent; Plots from known
    libraries will be converted to images (preferably SVG); etc. As a last resort, the object will be pickled and sent
    as binary data. If this fails, an error is raised.

    The `as_*` methods can be used to force the results to use a specific conversion:

        dataframe = compute_my_data()
        return [chalkit.as_json(dataframe), chalkit.as_python(dataframe)]

    The `output_*` methods a juste conveniences to return a converted value. `chalkit.output_json(dataframe)` is the
    same as `chalkit.output(chalkit.as_json(dataframe))`.

    """

    def __init__(self, state: ChalkitState):
        self._state = state

    @staticmethod
    def base64_to_bytes(b64: str) -> bytes:
        """Reverts data encoded as a string using base 64 to raw `bytes`.

        All binary data moved around as JSON in Chalk'it is encoded as base 64 strings. This method is provided
        as an easy way to get the data back into a binary form.

        Parameters:
            b64: the base64 encoded string

        Returns:
            the decoded raw binary data
        """
        from base64 import standard_b64decode

        return standard_b64decode(b64)

    @staticmethod
    def as_json(value: Any) -> OutputAdapter:
        """
        This method instructs Chalk'it to convert a result to a JSON representation.

        Note:
            Technically, all data is ultimately converted to JSON. But using a plotly plot as an example, this method
            will output the plot's JSON configuration, whereas `as_image` would return an image of the plot encoded
            into JSON using base64.

        Args:
            value: a return value for the script

        Returns:
            `value` either wrapped or converted. The returned object is not intended to be used by the user's script
             but returned as it is.
        """
        return JsonAdapter(value)

    @staticmethod
    def as_python(value: Any) -> OutputAdapter:
        """
        This method instructs Chalk'it to pickle a result, the main use case being moving Python objects from a
        Python datanode to another.

        The JSON encoding used will be recognized if the value is used in another Python datanode and the object will
        be automatically un-pickled, meaning `dataNodes["previous-python-node"]` will directly evaluate to the
        un-pickled object.

        Args:
            value: a return value for the script

        Returns:
            `value` either wrapped or converted. The returned object is not intended to be used by the user's script
             but returned as it is.
        """
        return PythonAdapter(value)

    @staticmethod
    def as_image(value: Any) -> OutputAdapter:
        """
        This method instructs Chalk'it to convert the result (like a plot figure) into an image.

        Args:
            value: a return value for the script

        Returns:
            `value` either wrapped or converted. The returned object is not intended to be used by the user's script
             but returned as it is.
        """
        return ImageAdapter(value)

    @staticmethod
    def as_data(value: Any, mime_type: Optional[str] = None, name: Optional[str] = None) -> OutputAdapter:
        """
        This method instructs Chalk'it to output the result as binary data using its JSON convention.

        Object of known types, like numpy arrays, will be saved as binary data. This behavior is very discretionary.

        The most obvious use case is returning raw data from `bytes` or a `BytesIO` using Chalk'it conventions, with
        the possibility to attach a MIME type.

        The resulting JSON looks like:

            {
              "content": "ZHJncnNk",
              "isBinary": true,
              "type": "application/octet-stream",
              "name": "my_file.bin"
            }

        Only the first two fields are guarantied / necessary. The `type` is a MIME type and help datanodes and widgets
        handle the data. The `name` is often an original filename and may be used when downloading the content
        as a file.

        Args:
            value: a return value for the script
            mime_type: A MIME type to be added to the resulting JSON object.
            name: a name (usually a file name) to be added to the resulting JSON object.

        Returns:
            `value` either wrapped or converted. The returned object is not intended to be used by the user's script
             but returned as it is.
        """
        return DataAdapter(value, mime_type, name)

    def output(self, value: Any, key: Optional[str] = None) -> None:
        """
        Provides an alternative way to return data, as opposed to the `return` statement.

        Multiple calls build an array; using keys yield an object:

            # Equivalent simple returns
            chalkit.output(42)
            # Or
            return 42

            # Equivalent array returns
            chalkit.output(1)
            chalkit.output(2)
            chalkit.output(3)
            # Or
            return [1, 2, 3]

            # Equivalent object returns
            chalkit.output(1, key="a")
            chalkit.output(2, key="b")
            # Or
            return {"a": 1, "b": 2}

        Mixing `output` and `return` is an error, as is using `output` with and without keys.

        Args:
            value: a return value for the script
            key: if provided, attach `value` as the `key` attribute of a JSON object.
        """
        self._state.add_output(value, key)

    def output_json(self, value: Any, key: Optional[str] = None) -> None:
        """
        Same as `chalkit.output(chalkit.as_json(value), key)`.

        Args:
            value: a return value for the script
            key:
        """
        self._state.add_output(self.as_json(value), key)

    def output_python(self, value: Any, key: Optional[str] = None) -> None:
        """
            Same as `chalkit.output(chalkit.as_python(value), key)`.

        Args:
            value: a return value for the script
            key:
        """
        self._state.add_output(self.as_python(value), key)

    def output_image(self, value: Any, key: Optional[str] = None) -> None:
        """
        Same as `chalkit.output(chalkit.as_image(value), key)`.

        Args:
            value: a return value for the script
            key:
        """
        self._state.add_output(self.as_image(value), key)

    def output_data(self, value: Any, key: Optional[str] = None) -> None:
        """
        Same as `chalkit.output(chalkit.as_data(value), key)`.

        Args:
            value: a return value for the script
            key:
        """
        self._state.add_output(self.as_data(value), key)

    def debug(self, value: Any) -> None:
        """
        Output debug information.

        This method does nothing when not invoked while editing a script in the Python datanode editor. In the editor,
        the `value` with be displayed as conveniently as possible. This is intended to be similar to a `print`, or more
        accurately a `logger.debug(value)`, with some additional rendering, like images being displayed, etc.

        Args:
            value: the value to display
        """
        self._state.add_debug(value)

    def notify(self):
        pass
        # TODO


def smart_adapt(value: Any, is_debug: bool = False) -> Optional[OutputAdapter]:
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

    def default(self, obj: Any) -> Any:
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


def build_result(user_result: Optional[Any], chalkit_state: ChalkitState, error: Optional[Exception]) -> Any:
    output_results = chalkit_state.results()
    if user_result is not None and output_results:
        # user_result implies no error
        return {"error": "'output_*' should not be combined with a 'return'"}
    elif user_result is not None:
        output = user_result
    else:
        output = output_results[0] if isinstance(output_results, list) and len(output_results) == 1 else output_results

    result: dict[str, Any] = {}
    if error:
        result["error"] = error
    else:
        result["result"] = output

    if chalkit_state.debug:
        stdout, stderr = chalkit_state.capture_io
        result["stdout"] = stdout.getvalue()
        result["stderr"] = stderr.getvalue()
        result["debug"] = [process_debug_value(value) for value in chalkit_state.debug_data]

    # TODO notifications ?
    return result


def capture(is_debug: bool = False, script_name: Optional[str] = None, start_line: int = 0):
    def decorate(user_fct):
        def exec_user_fct(data_nodes):
            original_io = (sys.stdout, sys.stderr)
            capture_io = (StringIO(), StringIO())
            sys.stdout, sys.stderr = capture_io

            user_result = None
            error = None
            chalkit_state = ChalkitState(is_debug, capture_io)
            try:
                user_result = user_fct(DataNodesProxy(data_nodes), ChalkitApi(chalkit_state))
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

            json_output = build_result(user_result, chalkit_state, error)
            return json.dumps(json_output, allow_nan=True, cls=DebugCustomEncoder if is_debug else CustomEncoder)

        return exec_user_fct

    return decorate
