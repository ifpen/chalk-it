import pathlib
import typing as t
from flask import send_from_directory
from taipy.gui.custom import ResourceHandler

class PureHTMLResourceHandler(ResourceHandler):
    id = "htmlresource"

    def get_resources(self, path: str) -> t.Any:
        """Get the resources from the specified path."""
        root_dir = pathlib.Path(__file__).resolve().parent / ".."
        
        if not path or path == "index.html" or "." not in path:
            return send_from_directory(root_dir, "index.html")
        
		# Serve the requested file if it exists
        file_path = root_dir / path
        if file_path.is_file():
            return send_from_directory(root_dir, path)
        
        return ("File not found", 404)
