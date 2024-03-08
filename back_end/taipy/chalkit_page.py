import json
import os
import inspect
from taipy.gui.custom import Page
import typing as t
from .resource_handler import ResourceHandler, PureHTMLResourceHandler

class ChalkitPage(Page):
    def __init__(
        self, resource_handler: ResourceHandler = PureHTMLResourceHandler(), binding_variables: t.Optional[t.List[str]] = [], **kwargs
    ) -> None:
        super().__init__(resource_handler=resource_handler, binding_variables=binding_variables, **kwargs)
        
        #self._resource_handler = resource_handler
        #self._binding_variables = binding_variables
        
        # # Get the path of the script that is creating an instance of this class
        # self.caller_file = inspect.stack()[1].filename
        # self.caller_dir = os.path.dirname(self.caller_file)
        # self.filepath = os.path.join(self.caller_dir, xpjrson_file_name)
        
        # self.current_xprjson_content = ''
        
        # if not os.path.exists(self.filepath):
        #     # Create the file if it does not exist
        #     with open(self.filepath, 'w') as file:
        #         json.dump({}, file)
        # else:
        #     # Open the file for further processing
        #     with open(self.filepath, 'r') as file:
        #         self.current_xprjson_content = json.load(file)
