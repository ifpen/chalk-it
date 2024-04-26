# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.


from taipy.gui.custom import Page as CustomPage
from .resource_handler import DesignerResourceHandler


class Page(CustomPage):
    def __init__(
        self,
        xprjson_file_name: str = "new_project.xprjson",
    ):
        super().__init__(
            resource_handler=DesignerResourceHandler(xprjson_file_name),
            metadata={"xprjson_file_name": xprjson_file_name},
        )
