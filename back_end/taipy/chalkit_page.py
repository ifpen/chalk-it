import json
import os
import inspect
from taipy.gui.custom import Page, ResourceHandler
import typing as t
from .resource_handler import PureHTMLResourceHandler
import pathlib
import typing as t
from os import sep

class ChalkitPage(Page):
    def __init__(self, file_path: str):
        root_path = f"{str(pathlib.Path(inspect.stack()[1].filename).parent.resolve())}{sep}"
        # Define xprjson file name
        xprjson_file_name = file_path # not working  yet
        super().__init__(resource_handler=PureHTMLResourceHandler(), metadata={"file_path": root_path + file_path})
        
        # if not os.path.exists(self.filepath):
        #     # Create the file if it does not exist
        #     with open(self.filepath, 'w') as file:
        #         json.dump({}, file)
        # else:
        #     # Open the file for further processing
        #     with open(self.filepath, 'r') as file:
        #         self.current_xprjson_content = json.load(file)
