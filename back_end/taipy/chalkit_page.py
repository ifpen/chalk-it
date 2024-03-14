from taipy.gui.custom import Page
from .resource_handler import PureHTMLResourceHandler
from .chalkit_json_adapter import FunctionJsonAdapter

class ChalkitPage(Page):
    def __init__(self, xprjson_file_name: str = "new_project.xprjson"):
        super().__init__(resource_handler=PureHTMLResourceHandler(), metadata={"xprjson_file_name": xprjson_file_name})
        FunctionJsonAdapter().register()
