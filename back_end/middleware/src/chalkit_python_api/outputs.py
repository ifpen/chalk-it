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
from io import StringIO
from typing import Any, Optional

from chalkit_python_api.adapters import DataAdapter, ImageAdapter, JsonAdapter, OutputAdapter, PythonAdapter
from chalkit_python_api.datanodes import DataNodesProxy
from chalkit_python_api.public_api import ChalkitApi
from chalkit_python_api.state import ChalkitState

PANDAS_MAX_ROWS = 20
PANDAS_MAX_COLS = None


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

    result["sideEffects"] = chalkit_state.side_effects

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
