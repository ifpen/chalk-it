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


from flask import (
    Flask,
    Blueprint,
    make_response,
    render_template_string,
    send_from_directory,
    Response,
    jsonify,
)
import logging
import re
import os
import json
from pathlib import Path
from typing import Any, Dict, Union


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
                return RenderApp.dashboard(RenderApp.XPRJSON_PATH)
            return send_from_directory(str(RenderApp.BASE_DIR), path)

    @classmethod
    def get_version(cls) -> str:
        """
        Search for a file with a pattern 'index-view-<version>.html' in the specified directory
        and extract the version number.

        :return: The version number as a string if found, else None
        """
        VERSION_PATTERN = re.compile(r"index-view-(\d+\.\d+\.\d+)\.html")
        for file in os.listdir(str(cls.BASE_DIR)):
            match = VERSION_PATTERN.match(file)
            if match:
                return "-" + match.group(1)
        return ""  # debug mode

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

    @classmethod
    def dashboard(cls, xprjson_path: str) -> str:
        """
        Generates the dashboard HTML content by dynamically injecting configuration data
        from a JSON file into the dashboard's template HTML.

        Parameters:
        - xprjson_path (str): The filesystem path to the configuration JSON file. This file
                            contains the configuration data to be injected into the dashboard
                            template.
        Returns:
        - str: The dashboard HTML content with the configuration data injected.
        """
        VERSION: str = cls.get_version()
        template_data_with_config: str = ""
        with open(xprjson_path, "r") as config_file:
            config_data = json.load(config_file)

        index_view_path: Path = cls.BASE_DIR / f"index-view{VERSION}.html"

        with open(index_view_path, "r") as template_file:
            template_data: str = template_file.read()

            template_data_with_config: str = template_data.replace(
                "jsonContent = {};", f"jsonContent = {json.dumps(config_data)};"
            )

        return render_template_string(template_data_with_config)

    @classmethod
    def start_runtime(cls, root_dir: Path, xprjson_path: str) -> Union[Response, str]:
        """
        *** FOR TAIPY DESIGNER ***
        Initializes and starts the application runtime for TAIPY Designer by serving
        the dynamically generated dashboard HTML content.

        - root_dir (Path): The root directory path where the index HTML file is located. This
                        path is also set as the base directory for the application.
        - xprjson_path (str): The filesystem path to the configuration JSON file, which is passed
                            to the `dashboard` method to generate the dynamically configured
                            dashboard HTML content.

        Returns:
        - Union[Response, str]: A Flask Response object that serves the generated dashboard HTML
                                content. In case of any errors during file operations, a string
                                describing the error might be returned.

        Raises:
        - See `dashboard` method for possible exceptions related to reading configuration and
        template files.
        """
        cls.BASE_DIR = root_dir
        return cls.dashboard(xprjson_path)

    def run(self, port: int = 8000) -> None:
        self.app.run(port=port)


if __name__ == "__main__":
    my_flask_app = RenderApp()
    my_flask_app.run()
