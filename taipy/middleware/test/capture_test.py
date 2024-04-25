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
import pickle
from collections.abc import Callable
from io import BytesIO
from typing import Any, Optional

from chalkit_python_api import PICKLE_MIME
from chalkit_python_api.outputs import ChalkitApi, capture
from chalkit_python_api.utils import bytes_to_b64


def test_base64_to_bytes_should_mirror_bytes_to_b64():
    assert ChalkitApi.base64_to_bytes(bytes_to_b64(b"deadbeef")) == b"deadbeef"


def do_capture(
    function: Callable[[dict[str, Any], ChalkitApi], Any], data: Optional[dict[str, Any]] = None, debug=False
):
    @capture(debug)
    def script(data_nodes, chalkit):
        return function(data_nodes, chalkit)

    result_json = script(data or {})
    return json.loads(result_json)


def test_capture_result_should_contain_returned_result():
    def script(*_):
        return 42

    result = do_capture(script)
    assert result["result"] == 42


def test_capture_should_contain_stdout_when_debugging():
    def script(*_):
        print(42)

    result = do_capture(script, debug=True)
    assert result["stdout"] == "42\n"


def test_capture_should_ignore_stdout_when_not_debugging():
    def script(*_):
        print("msg")

    result = do_capture(script, debug=False)
    assert "stdout" not in result


def test_capture_should_contain_stderr_when_debugging():
    def script(*_):
        import sys

        print("nope", file=sys.stderr)
        print("nope", file=sys.stderr)

    result = do_capture(script, debug=True)
    assert result["stderr"] == "nope\nnope\n"


def test_capture_should_not_contain_stderr_when_not_debugging():
    def script(*_):
        import sys

        print("err", file=sys.stderr)

    result = do_capture(script, debug=False)
    assert "stderr" not in result


def test_capture_should_contain_debug_output_when_debugging():
    def script(_, chalkit):
        chalkit.debug("msg")
        chalkit.debug(42)

    result = do_capture(script, debug=True)
    assert result["debug"] == ["msg", "42"]


def test_capture_should_not_contain_debug_output_when_not_debugging():
    def script(_, chalkit):
        chalkit.debug("msg")

    result = do_capture(script, debug=False)
    assert "debug" not in result


def test_capture_should_return_errors():
    def script(*_):
        table = {}
        return table["missing input"]

    result = do_capture(script)
    assert "error" in result


def test_capture_should_correct_traces():
    from inspect import currentframe, getframeinfo

    # We expect an error on line 3. We shift by 4 to get a "-11" that may not appear in the test framework's stack

    lineno = getframeinfo(currentframe()).lineno

    @capture(script_name=__file__, start_line=lineno + 2 + 14)
    def script(*_):
        table = {}
        return table["missing input"]

    result_json = script({})
    result = json.loads(result_json)
    error = result["error"]
    assert "line -11," in error


def test_capture_should_use_proxy_to_unpickle_selectively():
    pickled_42 = {
        "content": bytes_to_b64(pickle.dumps(42)),
        "type": PICKLE_MIME,
        "isBinary": True,
    }
    trap_a = {
        "content": "xyz",
    }
    trap_b = {
        "content": "xyz",
        "type": "text",
        "isBinary": True,
    }

    def script(args, *_):
        return [args["pickled"], args["int"], args["a"], args["b"]]

    result = do_capture(script, {"pickled": pickled_42, "int": 43, "a": trap_a, "b": trap_b})
    assert result["result"] == [42, 43, trap_a, trap_b]


# ## Test default conversions


def test_returned_images_default_to_png():
    def script(*_):
        from PIL import Image

        return Image.new('RGB', (60, 30), color='red')

    result = do_capture(script)["result"]
    assert result["isBinary"] and result["type"] == "image/png"


def test_any_data_can_be_forcibly_pickled():
    pickled_42 = {
        "content": bytes_to_b64(pickle.dumps(42)),
        "type": PICKLE_MIME,
        'name': 'builtins.int',
        "isBinary": True,
    }

    def script(_, chalkit):
        return chalkit.as_python(42)

    result = do_capture(script)["result"]
    assert result == pickled_42


class MyTestClass:
    pass


def test_returned_python_objects_should_be_pickled_by_default():
    def script(*_):
        return MyTestClass()

    result = do_capture(script)["result"]
    assert result["isBinary"] and result["type"] == PICKLE_MIME and result["name"] == "capture_test.MyTestClass"


def test_returned_bytes_should_default_to_binary_data():
    def script(*_):
        return b'Hello world'

    result = do_capture(script)["result"]
    assert (
        result["isBinary"] and result["type"] == "application/octet-stream" and result["content"] == "SGVsbG8gd29ybGQ="
    )


def test_returned_bytesio_should_default_to_binary_data():
    def script(*_):
        return BytesIO(b'Hello world')

    result = do_capture(script)["result"]
    assert (
        result["isBinary"] and result["type"] == "application/octet-stream" and result["content"] == "SGVsbG8gd29ybGQ="
    )


def test_returned_matplotlib_figure_should_default_to_svg():
    def script(*_):
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots()
        fruits = ['apple', 'blueberry', 'cherry', 'orange']
        counts = [40, 100, 30, 55]
        ax.bar(fruits, counts)
        return fig

    result = do_capture(script)["result"]
    assert result["type"] == "image/svg+xml"


def test_returned_plotly_figure_should_default_to_json():
    def script(*_):
        import plotly.express as px

        fig = px.line(x=["a", "b", "c"], y=[1, 3, 2])
        return fig

    result = do_capture(script)["result"]
    assert "data" in result and "layout" in result and result["data"][0]["x"] == ["a", "b", "c"]


def test_returned_numpy_array_should_default_to_json():
    def script(*_):
        import numpy as np

        return np.array([1, 2, 3])

    result = do_capture(script)["result"]
    assert result == [1, 2, 3]


def test_returned_pandas_serie_should_default_to_json():
    def script(*_):
        import numpy as np
        import pandas as pd

        return pd.Series([1, 2, np.nan])

    result = do_capture(script)["result"]
    assert result == {'data': [1.0, 2.0, None], 'index': [0, 1, 2], 'name': None}


def test_as_data_should_save_numpy_arrays():
    def script(_, chalkit):
        import numpy as np

        return chalkit.as_data(np.array([1, 2, 3]))

    result = do_capture(script)["result"]
    assert result["isBinary"] and result["type"] == "application/octet-stream" and "content" in result


def test_returned_pandas_dataframe_should_default_to_json():
    def script(*_):
        import pandas as pd

        return pd.DataFrame({"A": [1, 2, 3]})

    result = do_capture(script)["result"]
    assert result == {"columns": ["A"], 'data': [[1], [2], [3]], 'index': [0, 1, 2]}


def test_pandas_dataframes_should_debug_as_html():
    def script(_, chalkit):
        import pandas as pd

        chalkit.debug(pd.DataFrame({"A": [1, 2, 3]}))

    result = do_capture(script, debug=True)["debug"][0]
    assert not result["isBinary"] and result["type"] == "text/html"


def test_as_data_should_pass_mime_and_name_along():
    def script(_, chalkit):
        return chalkit.as_data(b'aaa', mime_type="application/magic", name="file.file")

    result = do_capture(script)["result"]
    assert (
        result["isBinary"]
        and result["type"] == "application/magic"
        and result["name"] == "file.file"
        and result["content"] == "YWFh"
    )


def test_single_output_return_the_value():
    def script(_, chalkit):
        chalkit.output(1)

    result = do_capture(script)["result"]
    assert result == 1


def test_multiple_outputs_return_an_array():
    def script(_, chalkit):
        chalkit.output(1)
        chalkit.output("2")
        chalkit.output(3)

    result = do_capture(script)["result"]
    assert result == [1, "2", 3]


def test_named_outputs_return_an_object():
    def script(_, chalkit):
        chalkit.output(1, "a")
        chalkit.output("2", "b")

    result = do_capture(script)["result"]
    assert result == {"a": 1, "b": "2"}


def test_mixing_named_and_unnammed_outputs_should_raise_an_error():
    def script(_, chalkit):
        chalkit.output(1)
        chalkit.output(2, "b")

    result = do_capture(script)
    assert "error" in result


def test_mixing_return_and_outputs_should_raise_an_error():
    def script(_, chalkit):
        chalkit.output(1)
        return 2

    result = do_capture(script)
    assert "error" in result


class TestSideEffects:
    @staticmethod
    def test_side_effects_should_be_empty_by_default():
        def script(*_):
            pass

        sideEffects = do_capture(script, debug=True)["sideEffects"]
        assert sideEffects == []

    @staticmethod
    def test_side_effects_should_capture__set_variable():
        def script(_, chalkit: ChalkitApi):
            chalkit.dashboard.set_variable("node", 42)

        sideEffects = do_capture(script, debug=True)["sideEffects"]
        assert sideEffects == [{"name": "setVariables", "args": [{"node": 42}]}]

    @staticmethod
    def test_side_effects_should_capture__set_variables():
        def script(_, chalkit: ChalkitApi):
            chalkit.dashboard.set_variables({"node1": 42, "node2": ["a", "b", "c"]})

        sideEffects = do_capture(script, debug=False)["sideEffects"]
        assert sideEffects == [{"name": "setVariables", "args": [{"node1": 42, "node2": ["a", "b", "c"]}]}]

    @staticmethod
    def test_side_effects_should_capture__set_variable_property():
        def script(_, chalkit: ChalkitApi):
            chalkit.dashboard.set_variable_property("node1", ["x", 1], False)

        sideEffects = do_capture(script, debug=True)["sideEffects"]
        assert sideEffects == [{"name": "setVariableProperty", "args": ["node1", ["x", 1], False]}]

    @staticmethod
    def test_side_effects_should_capture__execute_datanodes():
        def script(_, chalkit: ChalkitApi):
            chalkit.dashboard.execute_datanode("node1")
            chalkit.dashboard.execute_datanodes(["node2", "node3"])

        sideEffects = do_capture(script, debug=False)["sideEffects"]
        assert sideEffects == [
            {"name": "executeDataNodes", "args": [["node1"]]},
            {"name": "executeDataNodes", "args": [["node2", "node3"]]},
        ]

    @staticmethod
    def test_side_effects_should_capture__view_page():
        def script(_, chalkit: ChalkitApi):
            chalkit.dashboard.view_page("http://url.org")

        sideEffects = do_capture(script, debug=True)["sideEffects"]
        assert sideEffects == [{"name": "viewPage", "args": ["http://url.org", None, False]}]

    @staticmethod
    def test_side_effects_should_capture__view_project():
        def script(_, chalkit: ChalkitApi):
            chalkit.dashboard.view_project("http://url.org/dashboard", [{"dsName": "param", "dsVal": 42}], True)

        sideEffects = do_capture(script, debug=True)["sideEffects"]
        assert sideEffects == [
            {"name": "viewProject", "args": ["http://url.org/dashboard", [{"dsName": "param", "dsVal": 42}], True]}
        ]

    @staticmethod
    def test_side_effects_should_capture_multiple_calls():
        def script(_, chalkit: ChalkitApi):
            chalkit.dashboard.go_to_page(12)
            chalkit.dashboard.enable_widget("widgetA")
            chalkit.dashboard.disable_widget("widgetB")
            chalkit.dashboard.show_widget("widgetC")
            chalkit.dashboard.hide_widget("widgetD")

        sideEffects = do_capture(script, debug=True)["sideEffects"]
        assert sideEffects == [
            {"name": "goToPage", "args": [12]},
            {"name": "enableWidget", "args": ["widgetA"]},
            {"name": "disableWidget", "args": ["widgetB"]},
            {"name": "showWidget", "args": ["widgetC"]},
            {"name": "hideWidget", "args": ["widgetD"]},
        ]
