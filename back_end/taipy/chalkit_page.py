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
from .chalkit_json_adapter import FunctionJsonAdapter


class ChalkitPage(Page):

    def __init__(
        self,
        xprjson_file_name: str = "new_project.xprjson",
        TAIPY_GUI_DESIGN_MODE: bool = False,
    ):
        super().__init__(
            resource_handler=PureHTMLResourceHandler(
                xprjson_file_name, TAIPY_GUI_DESIGN_MODE
            ),
            metadata={"xprjson_file_name": xprjson_file_name},
        )
        FunctionJsonAdapter().register()
