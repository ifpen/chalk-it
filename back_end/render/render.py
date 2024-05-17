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
import logging
from flask import (
    Flask,
    Blueprint,
    make_response,
    send_from_directory,
    Response,
    jsonify,
)
from pathlib import Path
from typing import Any, Dict

sys.path.append(str(Path(__file__).resolve().parent.parent))
from ..common import TemplateUtils


class RenderApp:
    XPRJSON_PATH = "path/dashboard.xprjson"
    DEBUG = False
    # Determine the base directory for HTML templates
    BASE_DIR = (
        (Path(__file__).parent / ".." / ".." / "front-end").resolve()
        if not DEBUG
        else (Path(__file__).parent.parent).resolve()
    )

    def __init__(self) -> None:
        self.app: Flask = Flask(__name__)
        self.dashboard_bp: Blueprint = Blueprint("dashboard", __name__)
        self.setup_routes()
        self.app.register_blueprint(self.dashboard_bp)

    def setup_routes(self) -> None:
        @self.dashboard_bp.after_request
        def add_cors_headers(response: Response) -> Response:
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST"
            return response

        @self.dashboard_bp.route("/", defaults={"path": ""})
        @self.dashboard_bp.route("/<path:path>", methods=["GET"])
        def static_files(path: str) -> Any:
            if path == "" or path.endswith("/"):
                return TemplateUtils.render_template(
                    RenderApp.BASE_DIR, RenderApp.XPRJSON_PATH, "index-view"
                )
            return send_from_directory(str(RenderApp.BASE_DIR), path)

    def throw_error(self, error: str) -> Response:
        """
        Log an error and return a 500 response with a JSON payload.
        """
        logging.error(error, exc_info=True)
        error_response: Dict[str, Any] = {"Success": False, "Msg": f"Error: {error}"}
        return make_response(jsonify({"d": error_response}), 500)

    def send_success(self, json_obj: Dict[str, Any]) -> Response:
        """
        Return a 200 response with a JSON payload.
        """
        return make_response(jsonify({"d": json_obj}), 200)

    def run(self, port: int = 8000) -> None:
        self.app.run(port=port)


if __name__ == "__main__":
    my_flask_app = RenderApp()
    my_flask_app.run()
