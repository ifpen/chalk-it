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
from common import TemplateUtils


class RenderApp:
    def __init__(self) -> None:
        """Initialize the Flask app, configure paths, and set up routes."""
        # Instance-specific attributes
        self.XPRJSON_FILE_PATH = (
            Path(__file__).resolve().parent.parent.parent / "untitled.xprjson"
        )
        self.DEBUG = False
        # Determine the base directory for HTML templates
        self.BASE_DIR = (
            Path(__file__).resolve().parent.parent.parent / "front-end" / "build"
        )

        # Flask app and blueprint setup
        self.app: Flask = Flask(__name__)
        self.dashboard_bp: Blueprint = Blueprint("dashboard", __name__)
        self.setup_routes()
        self.app.register_blueprint(self.dashboard_bp)

    def setup_routes(self) -> None:
        """Set up all routes and CORS handling for the application."""

        @self.dashboard_bp.after_request
        def add_cors_headers(response: Response) -> Response:
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST"
            return response

        @self.dashboard_bp.route("/", defaults={"path": ""})
        @self.dashboard_bp.route("/<path:path>", methods=["GET"])
        def static_files(path: str) -> Any:
            """
            Serve static files or render the template if the path is empty or ends with "/".
            """
            # Check if BASE_DIR is a valid directory
            if not self.BASE_DIR.is_dir():
                return make_response(
                    jsonify(
                        {
                            "error": f"Base directory not found or invalid: {self.BASE_DIR}"
                        }
                    ),
                    500,
                )

            if not path or path.endswith("/"):
                # Check if the XPRJSON file exists
                if not self.XPRJSON_FILE_PATH.exists():
                    return make_response(
                        jsonify({"error": f"File not found: {self.XPRJSON_FILE_PATH}"}),
                        404,
                    )

                return TemplateUtils.render_template(
                    self.BASE_DIR, self.XPRJSON_FILE_PATH, "index-view.html"
                )
            return send_from_directory(str(self.BASE_DIR), path)

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


# Create an instance of the app
app = RenderApp().app

if __name__ == "__main__":
    # Configure basic logging
    logging.basicConfig(level=logging.DEBUG if RenderApp().DEBUG else logging.INFO)

    app.run()
