# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.


from pathlib import Path
import typing as t
from flask import send_from_directory
from taipy.gui.custom import ResourceHandler

from src.taipy.designer.config import _DesignerConfig
from .common import TemplateUtils


class DesignerResourceHandler(ResourceHandler):
    id = "htmlresource"

    def __init__(self, xprjson_file_name: str):
        super().__init__()
        self.xprjson_file_name = xprjson_file_name

    def get_root_directory(self) -> Path:
        """Dynamically set the root directory based on the existence of 'index.html'."""
        # For production mode
        prod_root_dir: Path = (Path(__file__).parent.parent).resolve()
        if (prod_root_dir / "index.html").exists():
            return prod_root_dir
        # For develop mode
        front_end_path = (
            Path(__file__).parent / ".." / ".." / ".." / "front-end"
        ).resolve()
        if not (front_end_path / "build_version.txt").exists():
            raise RuntimeError(
                "specific build version file 'build_version.txt' not found in front-end folder"
            )
        with open(front_end_path / "build_version.txt", "r") as f:
            build_version = f.read().strip()
        return (front_end_path / "build" / build_version).resolve()

    def get_resources(self, path: str, base_bundle_path: str) -> t.Any:
        """Get the resources from the specified path."""
        root_dir: Path = self.get_root_directory()  # Set root_dir dynamically
        if not path or path == "index.html" or "." not in path:
            if _DesignerConfig().get_designer_mode():
                return send_from_directory(root_dir, "index.html")
            xprjson_path: Path = (Path.cwd() / self.xprjson_file_name).resolve()
            if xprjson_path.is_file():
                return TemplateUtils.render_template(
                    str(root_dir), str(xprjson_path), "index-taipy-view"
                )

        # Serve the requested file if it exists
        file_path: Path = root_dir / path
        if file_path.is_file():
            return send_from_directory(root_dir, path)

        return ("File not found", 404)
