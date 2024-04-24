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


from flask import render_template_string
import re
import os
import json
from pathlib import Path


class TemplateUtils:

    @classmethod
    def get_version(cls, root_dir: str) -> str:
        """
        Search for a file with a pattern 'index-view-<version>.html' in the specified directory
        and extract the version number.

        Parameters:
        - root_dir (Path): The root directory path where the index HTML file is located. This
                path is also set as the base directory for the application.

        :return: The version number as a string if found, else None
        """
        VERSION_PATTERN = re.compile(r"index-view-(\d+\.\d+\.\d+)\.html")
        for file in os.listdir(str(root_dir)):
            match = VERSION_PATTERN.match(file)
            if match:
                return "-" + match.group(1)
        return ""  # debug mode

    @classmethod
    def render_template(cls, root_dir: str, xprjson_path: str, file_name: str) -> str:
        """
        Generates the dashboard HTML content by dynamically injecting configuration data
        from a JSON file into the dashboard's template HTML.

        Parameters:
        - xprjson_path (str): The filesystem path to the configuration JSON file. This file
                            contains the configuration data to be injected into the dashboard
                            template.
        - file_name (str): The base name of the template HTML file.
                        The method dynamically appends the version number obtained from
                        `get_version` method to this base name to locate the final template file.
        - root_dir (Path): The root directory path where the index HTML file is located. This
                        path is also set as the base directory for the application.

        Returns:
        - str: The dashboard HTML content with the configuration data injected.
        """
        VERSION: str = cls.get_version(root_dir)
        template_data_with_config: str = ""
        config_data: object = {}
        with open(xprjson_path, "r") as config_file:
            config_data = json.load(config_file)

        index_view_path: Path = root_dir / f"{file_name}{VERSION}.html"

        with open(index_view_path, "r") as template_file:
            template_data: str = template_file.read()

            template_data_with_config: str = template_data.replace(
                "jsonContent = {};", f"jsonContent = {json.dumps(config_data)};"
            )

        return render_template_string(template_data_with_config)
