from flask import Flask, send_file, jsonify, make_response, json, request, redirect, send_from_directory, render_template_string, logging
import os
from pathlib import Path
import json
import re

app = Flask(__name__)

xprjson = 'dashboard.xprjson'
DEBUG = False

def get_version(start_path):
    """
    Search for a file with a pattern 'index-view-<version>.html' in the specified directory
    and extract the version number.
    
    :param start_path: Directory path where to start the search
    :return: The version number as a string if found, else None
    """
    pattern = re.compile(r'index-view-(\d+\.\d+\.\d+)\.html')
    for file in os.listdir(start_path):
        match = pattern.match(file)
        if match:
            return "-"+ match.group(1)
    return "" #debug mode


dir_home = os.path.expanduser("~")

dir_settings_path = os.path.join(dir_home, '.chalk-it')
settings_file_path = os.path.join(dir_settings_path, 'settings.json')

if (DEBUG):
    dir_name = os.path.dirname(__file__)
    dir_html_tmp = dir_name
else:
    dir_temp_name = os.path.dirname(__file__)
    dir_html_tmp = os.path.join(os.path.dirname(__file__), './../')

print(dir_html_tmp)
	
VERSION = get_version(dir_html_tmp)

def throw_error(error):
    logging.error(error, exc_info=True)
    d = json.dumps({
        "Success": False,
        "Msg": f"Error: {error}"
    })
    response = make_response(json.dumps({"d": d}), 500)
    return response


def send_success(json_obj):
    d = json.dumps(json_obj)
    response = make_response(json.dumps({"d": d}), 200)
    return response


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST')
    return response
	

def dashboard(xprjson):
    # Load configuration from json file
    with open(xprjson, 'r') as config_file:
        config_data = json.load(config_file)

    # Read the HTML template
    index_view_path = os.path.join(os.path.dirname(dir_temp_name), 'index-view' + VERSION + '.html')
    with open(index_view_path, 'r') as template_file:
        template_data = template_file.read()

    # Inject the JSON data into the template
    template_data_with_config = template_data.replace('jsonContent = {};', f'var jsonContent = {json.dumps(config_data)};')

    # Render the HTML with the configuration inlined
    return render_template_string(template_data_with_config)
	
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>', methods=['GET'])
def static_files(path: str):
    if path == '' or path.endswith('/'):
        return dashboard(xprjson)
    else:
        return send_from_directory('..', path)
		
		
if __name__ == '__main__':
    app.run(port=8000)