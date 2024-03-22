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


from pathlib import Path
import typing as t
from flask import send_from_directory, send_file
from taipy.gui.custom import ResourceHandler

class PureHTMLResourceHandler(ResourceHandler):
    id = "htmlresource"
    run_mode = "editor"

    def get_root_directory(self) -> Path:
        """Dynamically set the root directory based on the existence of 'index.html'."""
        # For develop mode
        prod_root_dir = (Path(__file__).parent.parent).resolve()
        
        if not (prod_root_dir / "index.html").exists():
            # For develop mode
            root_dir = (Path(__file__).parent / ".." / ".." / "front-end").resolve()
        else:
            # For production mode
            root_dir = prod_root_dir
        
        return root_dir

    def get_resources(self, path: str, base_bundle_path: str) -> t.Any:
        """Get the resources from the specified path."""
        root_dir = self.get_root_directory()  # Set root_dir dynamically
        
        if not path or path == "index.html" or "." not in path:
            return send_from_directory(root_dir, "index.html")
        
		# Serve the requested file if it exists
        file_path = root_dir / path
        if file_path.is_file():
            return send_from_directory(root_dir, path)
        
        # if "taipy-gui-base.js" in path:
        #     return send_file(base_bundle_path)

        return ("File not found", 404)
