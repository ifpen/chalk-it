import json
import sys
import traceback
import typing
from io import BytesIO, StringIO


class OutputAdapter:
    def to_json(self):
        pass


class JsonAdapter(OutputAdapter):
    def __init__(self, value: any):
        self._value = value

    def to_json(self):
        return self._value  # TODO coerce


class ImageAdapter(OutputAdapter):
    def __init__(self, value: any):
        self._value = value

    def to_json(self):
        cls = type(self._value)
        module = cls.__module__
        name = cls.__name__

        if module == "matplotlib.figure" and name == "Figure":
            # TODO change backend
            buffer = BytesIO()
            self._value.savefig(buffer, format='svg')
            buffer.seek(0)
            image_svg = buffer.getvalue()
            buffer.close()

            import base64

            return {
                "content": base64.standard_b64encode(image_svg).decode('ascii'),
                "type": "image/svg+xml",
                "isBinary": True,
            }
        elif module == "plotly.graph_objs._figure" and name == "Figure":
            # TODO comment in case fixed
            # TODO use json
            data = self._value.to_image(format="svg")
            import base64

            return {
                "content": base64.standard_b64encode(data).decode('ascii'),
                "type": "image/svg+xml",
                "isBinary": True,
            }

        return None


class PythonAdapter(OutputAdapter):
    def __init__(self, value: any):
        self._value = value

    def to_json(self):
        import base64
        import pickle

        return {
            "content": base64.standard_b64encode(pickle.dumps(self._value)).decode('ascii'),
            "type": "application/python+pickle",
            "name": type(self._value).__module__ + "." + type(self._value).__name__,
            "isBinary": True,
        }


class XDashState:
    capture_io: typing.Tuple[StringIO, StringIO]
    debug_data: typing.List[any]

    def __init__(self, debug, capture_io):
        self._results = None
        self.debug_data = []  # primitives/json, images, -> str
        self.debug = debug
        self.capture_io = capture_io
        pass

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
        self._debug = False
        self._state = state

    @staticmethod
    def as_json(value) -> OutputAdapter:
        return JsonAdapter(value)

    @staticmethod
    def as_python(value) -> OutputAdapter:
        return PythonAdapter(value)

    @staticmethod
    def as_image(value) -> OutputAdapter:
        return ImageAdapter(value)

    def output(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(value, key)

    def output_json(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(self.as_json(value), key)

    def output_python(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(self.as_python(value), key)

    def output_image(self, value: any, key: typing.Optional[str] = None) -> None:
        self._state.add_output(self.as_image(value), key)

    def debug(self, value: any):
        self._state.add_debug(value)

    def notify(self):
        pass
        # TODO


class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, OutputAdapter):
            return obj.to_json()
        elif obj.__class__.__module__ == "numpy" and obj.__class__.__name__ == "ndarray":
            return obj.tolist()
        else:
            return json.JSONEncoder.default(self, obj)


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
        result["result"] = output  # TODO

    if xdash_state.debug:
        stdout, stderr = xdash_state.capture_io
        result["stdout"] = stdout.getvalue()
        result["stderr"] = stderr.getvalue()
        result["debug"] = xdash_state.debug_data  # TODO coerce

    # TODO notifications
    return result
    # XDashApi Debug => force printable. No pickle.


def capture(user_fct):
    def exec_user_fct(data_nodes):
        original_io = (sys.stdout, sys.stderr)
        capture_io = (StringIO(), StringIO())
        sys.stdout, sys.stderr = capture_io

        user_result = None
        error = None
        xdash_state = XDashState(True, capture_io)
        try:
            user_result = user_fct(data_nodes, XDashApi(xdash_state))
        except BaseException:
            error = traceback.format_exc()
        finally:
            sys.stdout, sys.stderr = original_io

        json_output = build_result(user_result, xdash_state, error)
        return json.dumps(json_output, cls=CustomEncoder)

    return exec_user_fct
