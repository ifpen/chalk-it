from pathlib import Path
import json
from taipy.gui import JsonAdapter
from types import FunctionType

base_path = (Path(__file__).parent).resolve()
file_name = base_path / "config.xprjson"
json_data = ""
has_file_saved = False
file_list = {}

def load_file(state):
    state.json_data = Path(state.file_name).read_text()

def save_file(state, name, payload):
    if "data" not in payload:
        return
    with open(file_name, "w") as f:
        f.write(payload["data"])
        state.has_file_saved = True

# file should only be within base path
def select_file(state, name, payload):
    if "file_name" not in payload:
        return
    potential_file_path = base_path / payload['file_name']
    if potential_file_path.exists():
        state.file_name = str(potential_file_path)
        
def get_file_list(state, name):
    # Use glob to find .xprjson files directly within the base directory.
    file_names = [file.name for file in base_path.glob('*.xprjson')]
    file_list_obj = {
        'file_names': file_names,
        'base_path': str(base_path)
    }
    state.file_list = json.dumps(file_list_obj)

# Called from a file loader widgets
def upload_file(state, name, payload):
    print('file data', payload["file_data"])
    

class FunctionJsonAdapter(JsonAdapter):
    def parse(self, o):
        if isinstance(o, FunctionType):
            return o.__name__
        # if isinstance(o, Icon):
        #     return o._to_dict()
        # if isinstance(o, _MapDict):
        #     return o._dict
        # if isinstance(o, _TaipyBase):
        #     return o.get()
        # if isinstance(o, (datetime, date, time)):
        #     return _date_to_string(o)
        if isinstance(o, Path):
            return str(o)
        if "plotly.graph_objs._figure.Figure" in str(type(o)):
            return json.loads(o.to_json(validate=True, pretty=False))
    #    if "matplotlib.figure.Figure" in str(type(o)): # seems impossible in other thread than main thread
    #        buf = io.BytesIO()
    #        o.savefig(buf, format='png')
    #        buf.seek(0)
    #        img_str = base64.b64encode(buf.read()).decode('UTF-8')    
    #        return img_str
        if "pandas.core.frame.DataFrame" in str(type(o)):
            return json.loads(o.to_json(orient='split'))
        if "folium.folium.Map" in str(type(o)):
            return o._repr_html_()
        if "geopandas.geodataframe.GeoDataFrame" in str(type(o)):
            return json.loads(o.to_json())
        # if "PIL.Image.Image" in str(type(o)):
        #     return image_to_base64(o)            

FunctionJsonAdapter().register()