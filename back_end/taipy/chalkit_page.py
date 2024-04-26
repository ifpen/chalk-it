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


from taipy.gui.custom import Page
from .resource_handler import PureHTMLResourceHandler
from .chalkit_json_adapter import register_json_adapter


class ChalkitPage(Page):
    def __init__(
        self,
        xprjson_file_name: str = None,
        designer_mode: bool = False,
    ):
        # Automatically set the default file name if in designer mode and no file specified
        if xprjson_file_name is None and designer_mode is True:
            xprjson_file_name = "new_project.xprjson"

        # Ensure an xprjson file name is provided when not in designer mode
        if xprjson_file_name is None and designer_mode is False:
            raise ValueError(
                "You must specify an xprjson file name when creating a ChalkitPage with designer_mode set to False, "
                "e.g., ChalkitPage('your_project.xprjson')."
            )

        # Initialize the parent class with the necessary resources and metadata
        super().__init__(
            resource_handler=PureHTMLResourceHandler(xprjson_file_name, designer_mode),
            metadata={"xprjson_file_name": xprjson_file_name},
        )
        register_json_adapter()
