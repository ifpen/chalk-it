import pathlib
import typing as t
from flask import send_from_directory, send_file
from taipy.gui.custom import ResourceHandler

class PureHTMLResourceHandler(ResourceHandler):
    id = "chalk-it"

    def get_resources(self, path: str, base_bundle_path: str) -> t.Any:
        """Get the resources from the specified path."""
        root_dir = pathlib.Path(__file__).resolve().parent / ".." / ".." / ".."
        
        if not path or path == "index.html" or "." not in path:
            return send_from_directory(root_dir, "index.html")
        
		# Serve the requested file if it exists
        file_path = root_dir / path
        if file_path.is_file():
            return send_from_directory(root_dir, path)        
        if "taipy-gui-base.js" in path:
            return send_file(base_bundle_path)
        return ("File not found", 404)
