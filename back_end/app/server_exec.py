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


import sys
import os
import hashlib
import logging
import re
import traceback
from concurrent.futures import Executor
from typing import Optional, Union, Dict

from flask import Blueprint, Response
from flask import make_response, json, request

# Path to the directory you want to add to sys.path
middelware_path = './back_end/middleware/src/'

# Check if the directory exists before adding it to sys.path for developpment mode
if os.path.exists(middelware_path):
    sys.path.append(middelware_path)
else:
    # production mode
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    
logger = logging.getLogger(__name__)

REQUEST_ID_KEY = "x-request-id"


def _get_request_id() -> Optional[str]:
    return request.headers[REQUEST_ID_KEY] if REQUEST_ID_KEY in request.headers else None


def _propagate_request_id(response: Response) -> Response:
    req_id = _get_request_id()
    if req_id:
        response.headers.set(REQUEST_ID_KEY, req_id)
    return response


def _sign(image: str, code: str) -> str:
    """
    Basic signature that mimics the real functionality.
    Given that the local server has no authentication and anyone can request a signature, we do not
    bother with something more robust.
    :param image:
    :param code:
    :return:
    """
    m = hashlib.sha256()
    m.update(image.encode('utf8'))
    m.update(code.encode('utf8'))
    m.digest()
    return m.hexdigest()


def _shift(script: str) -> str:
    """
    Add an indentation level
    :param script:
    :return:
    """
    return "\n".join(["  " + line for line in re.split(r"\r?\n", script)]) + "\n"


def _evaluate(script: str, data_nodes: str, is_debug: bool) -> str:
    """
    Evaluate a user's script
    :param script:
    :param data_nodes: string containing the json dictionary with the data of the previous datanodes
    :param is_debug:
    :return: json string with the response object expected by the dashboard
    """

    script = f"""
from chalkit_python_api.outputs import capture
import json
import base64

@capture(is_debug={is_debug}, script_name='<string>', start_line=7)
def script(dataNodes, chalkit):
{_shift(script)}

result = script(data_nodes)
"""
    global_vars = {
        "data_nodes": json.loads(data_nodes)
    }
    exec(script, global_vars)
    return global_vars["result"]


def create_python_exec_blueprint(executor: Optional[Executor] = None) -> Blueprint:
    exec_bp = Blueprint('exec-python', __name__, url_prefix='/exec')
    images_bp = Blueprint('images', __name__, url_prefix='/images')
    exec_bp.register_blueprint(images_bp)

    exec_bp.after_request(_propagate_request_id)

    @images_bp.route('/sign', methods=['POST'])
    def images_sign():
        image: str = request.json['image']
        code: str = request.json['code']
        return _sign(image, code)

    @exec_bp.route('/eval', methods=['POST'])
    def exec_eval() -> Union[Response, Dict[str, any]]:
        payload = request.json

        image = payload["image"] if "image" in payload else ""

        script = payload["script"]
        if payload["signature"] != _sign(image, script):
            make_response("Invalid signature", 403)

        try:
            if image != "":
                raise ValueError("Image does not exist")

            if executor is None:
                result_json = _evaluate(script, payload["dataNodes"], payload["isDebug"])
            else:
                result_json = executor.submit(_evaluate, script, payload["dataNodes"], payload["isDebug"]).result()

            return Response(result_json, mimetype='application/json')

        except ModuleNotFoundError:
            logger.exception("_evaluate failed; chalkit_python_api probably missing")
            error_msg = f"EvalError: Missing import (check chalkit_python_api)\n\n{traceback.format_exc()}"
        except SyntaxError as ex:
            logger.exception("_evaluate failed; Probably an invalid script")
            if executor and ex.__cause__:
                ex = ex.__cause__
            msg = "".join(traceback.format_exception(ex))
            error_msg = f"EvalError: Syntax error\n\n{msg}"
        except Exception as ex:
            logger.exception("_evaluate failed; Possibly a chalkit_python_api version missmatch ?")
            error_msg = f"EvalError: {traceback.format_exc()}"
        return {
            "error": error_msg
        }

    return exec_bp
