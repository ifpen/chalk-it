# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.

import typing as t

from taipy.gui.custom import Page as CustomPage
from .config import _DesignerConfig
from .resource_handler import DesignerResourceHandler


class Page(CustomPage):
    def __init__(
        self,
        xprjson_file_name: t.Optional[str] = None,
    ):
        # Automatically set the default file name if in designer mode and no file specified
        if xprjson_file_name is None and _DesignerConfig().get_designer_mode() is True:
            xprjson_file_name = "new_project.xprjson"

        # Ensure an xprjson file name is provided when not in designer mode
        if xprjson_file_name is None and _DesignerConfig().get_designer_mode() is False:
            raise ValueError(
                "You must specify an xprjson file name when creating a ChalkitPage with designer_mode set to False, "
                "e.g., ChalkitPage('your_project.xprjson')."
            )

        # Initialize the parent class with the necessary resources and metadata
        super().__init__(
            resource_handler=DesignerResourceHandler(str(xprjson_file_name)),
            metadata={"xprjson_file_name": xprjson_file_name},
        )
