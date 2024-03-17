from taipy.gui.custom import Page
from .resource_handler import PureHTMLResourceHandler
from .chalkit_json_adapter import FunctionJsonAdapter
from .template_xprjson import xprjson_template
from .utils_xprjson import update_xprjson
import os
import sys
from pathlib import Path
import json

class ChalkitPage(Page):
    def __init__(self, xprjson_file_name: str = "new_project.xprjson"):
        super().__init__(resource_handler=PureHTMLResourceHandler(), metadata={"xprjson_file_name": xprjson_file_name})
        FunctionJsonAdapter().register()
        
        # Get the absolute path of the main module
        BASE_PATH: Path = Path(sys.argv[0]).resolve().parent
        # Let's write a Python code snippet that checks for the existence of a file named xprjson_file_name.
        # If the file does not exist, the code will create it based on a given string template 'strtem'.
        # File path
        file_path = BASE_PATH / xprjson_file_name

        # Check if the file exists
        if not os.path.exists(file_path):
            # If the file does not exist, create it with the contents of 'strtem'
            with open(file_path, 'w') as file:
                xprjson = xprjson_template
                xprjson = update_xprjson(xprjson, xprjson_file_name)
                file.write(json.dumps(xprjson_template))
            print("File " + xprjson_file_name + " created.")
        else:
            print("File " + xprjson_file_name + " already exists.")

