from flask import Flask, send_file, jsonify, make_response, json, request, redirect, send_from_directory, render_template_string
import os
from pathlib import Path
import json
from base64 import b64decode, b64encode
import logging
import webbrowser
import threading
import argparse
import json
import logging
import os
import threading
import webbrowser
from base64 import b64decode, b64encode
from concurrent.futures import Executor, ProcessPoolExecutor
from pathlib import Path
from typing import Optional





def create_parser():
    # create the top-level parser
    parser = argparse.ArgumentParser()
    parser.add_argument('--dev', action='store_true', help='run in development mode')
    parser.add_argument('--syncDir', dest='sync', help='''if given a directory, the edited dashboard
     will project the definition of some datanodes (like scripts) as files.
     Requires "pathvalidate", "watchdog" and "flask-sock".''')
    parser.add_argument('--clearSyncDir', dest='sync_clear', action='store_true',
                        help='if set, the "syncDir" directory will be cleared on startup. Please use responsively.')
    parser.add_argument('--pythonWorkers', dest='python_workers', type=int,
                        help='''Size of pool used to evaluate user's python scripts.''')
    parser.add_argument('--render', dest='xprjson_file', type=str, help='render project in HTML page mode')
    parser.add_argument('--port', dest='app_port', type=int, help='change Flask TCP port')
    parser.add_argument('--ip', dest='app_ip', type=str, help='change Flask TCP address')						
    
    return parser


args = create_parser().parse_args()

if args.dev:
    DEBUG = True
else:
    DEBUG = False
	
xprjson = args.xprjson_file

app = Flask(__name__)

if args.app_port is None:
    run_port = 7854
else:
    run_port = args.app_port

if args.app_ip is None:
    app_ip = '127.0.0.1'
else:
    app_ip = args.app_ip
server_url = f"http://{app_ip}:{run_port}"

dir_home = os.path.expanduser("~")

dir_settings_path = os.path.join(dir_home, '.chalk-it')
settings_file_path = os.path.join(dir_settings_path, 'settings.json')

if DEBUG:
    dir_name = os.path.dirname(__file__)

    dir_temp_path = os.path.join(dir_name, '../documentation/Templates/Projects')
    dir_images_path = os.path.join(dir_name, '../documentation/Templates/Images')

    dir_project_path = dir_name
else:
    dir_temp_name = os.path.dirname(__file__)

    dir_temp_path = os.path.join(dir_temp_name, './Templates/Projects')
    dir_images_path = os.path.join(dir_temp_name, './Templates/Images')

    dir_name = os.getcwd()
    dir_project_path = dir_name


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


@app.route('/GetFiles', methods=['POST'])
def get_files():
    try:
        path_dir = ""
        file_type = request.json['FileType']
        if file_type == "project":
            path_dir = dir_project_path
        elif file_type == "template":
            path_dir = dir_temp_path
        files = Path(path_dir).glob('*.xprjson')
        file_list = [{
            "Name": file.stem,
            "FileName": file.name,
            "Description": "",
            "GroupeName": "",
            "Python": None,
            "Tags": [],
            "URL": f'{server_url}/GetImages?image={file.stem}',
            "Path": str(file.parent)
        } for file in files]

        # sort the file list by 'Name' key in ascending order
        file_list = sorted(file_list, key=lambda k: k['Name'], reverse=False)

        return send_success({
            "Success": True,
            "Msg": None,
            "FileList": file_list,
            "Path": path_dir,
            "Python": None
        })
    except Exception as err:
        return throw_error(err)


@app.route('/GetPythonDataList', methods=['POST'])
def get_python_data_list():
    return send_success({
        "Success": True,
        "Msg": None,
        "FileList": [],
    })


@app.route('/GetImages', methods=['GET'])
def get_image():
    image_path = os.path.join(
        dir_images_path, request.args.get('image') + ".png")
    return send_file(image_path, mimetype='image/png')


@app.route('/SaveSettings', methods=['POST'])
def save_settings():
    try:
        decoded_data_json = json.loads(
            b64decode(request.json['FileData'].encode()).decode())
        if os.access(settings_file_path, os.F_OK):
            with open(settings_file_path, 'r', encoding='utf8') as file:
                file_data = file.read()
            file_data_json = json.loads(file_data)
            file_data_json.update(decoded_data_json)
            with open(settings_file_path, 'w', encoding='utf8') as file:
                json.dump(file_data_json, file, indent=2)
            return send_success({
                "Success": True,
                "Msg": "OK"
            })
        else:
            return send_success({
                "Success": False,
                "Msg": "KO"
            })
    except OSError as err:
        return throw_error(err)


@app.route('/ReadSettings', methods=['POST'])
def read_settings():
    try:
        if os.access(settings_file_path, os.F_OK):
            with open(settings_file_path, 'r', encoding='utf8') as file:
                file_data = file.read()
            encoded_data = b64encode(json.dumps(
                json.loads(file_data)).encode()).decode()
        else:
            os.makedirs(dir_settings_path, exist_ok=True)
            default_settings = json.dumps({
                "data": {},
                "projects": [],
                "dataNode": [],
                "tags": [],
                "updatedAt": "",
                "createdAt": "",
                "scope": {},
                "info": {},
                "settings": {},
                "profile": {
                    "userName": "Guest",
                    "Id": "-1"
                },
                "help": {
                    "isDiscoverDone": False,
                    "displayHelp": True,
                    "discoverSteps": [0, 0, 0, 0, 0]
                }
            }, indent=2)
            encoded_data = b64encode(default_settings.encode()).decode()
            with open(settings_file_path, 'w', encoding='utf8') as file:
                file.write(default_settings)

        file_stats = os.stat(settings_file_path)
        nb_bytes = file_stats.st_size
        return send_success({
            "Success": True,
            "Msg": None,
            "Offset": 0,
            "NbBytes": nb_bytes,
            "LastChunk": True,
            "ReadOnly": False,
            "FileData": encoded_data,
            "Array": None
        })
    except OSError as err:
        return throw_error(err)


@app.route('/ReadTemplate', methods=['POST'])
def read_template():
    try:
        template_name = request.json.get('FileName')
        template_path = os.path.join(dir_temp_path, template_name)
        with open(template_path, 'r', encoding='utf8') as file:
            file_data = file.read()
        encoded_data = b64encode(file_data.encode()).decode()
        file_stats = os.stat(template_path)
        nb_bytes = file_stats.st_size
        return send_success({
            "Success": True,
            "Msg": None,
            "Offset": 0,
            "NbBytes": nb_bytes,
            "LastChunk": True,
            "ReadOnly": False,
            "FileData": encoded_data,
            "Array": None
        })
    except Exception as err:
        return throw_error(err)


@app.route('/SaveProject', methods=['POST'])
def save_project():
    try:
        file_name = request.json['FileName']
        file_data = request.json['FileData']
        offset = request.json['Offset']
        if file_data and offset != -1:
            decoded_data_json = json.loads(
                b64decode(file_data.encode()).decode())
            project_name = decoded_data_json.get("meta").get("name")
            os.makedirs(dir_project_path, exist_ok=True)
            path_project_file = os.path.join(
                dir_project_path, project_name + ".xprjson")
            with open(path_project_file, 'w', encoding='utf8') as file:
                file.write(json.dumps(decoded_data_json, indent=2))
        return send_success({
            "Success": True,
            "Msg": "OK"
        })
    except Exception as err:
        return throw_error(err)


@app.route('/ReadProject', methods=['POST'])
def read_project():
    try:
        encoded_data = ""
        file_name = request.json['FileName']
        offset = request.json['Offset']
        path_project_file = os.path.join(dir_project_path, file_name)
        if offset != -1 and os.access(path_project_file, os.F_OK):
            with open(path_project_file, 'r', encoding='utf8') as file:
                file_data = json.load(file)
            encoded_data = b64encode(json.dumps(file_data).encode()).decode()

        file_stats = os.stat(path_project_file)
        nb_bytes = file_stats.st_size
        return send_success({
            "Success": True,
            "Msg": None,
            "Offset": 0,
            "NbBytes": nb_bytes,
            "LastChunk": True,
            "ReadOnly": False,
            "FileData": encoded_data,
            "Array": None
        })
    except OSError as err:
        return throw_error(err)


@app.route('/RenameProject', methods=['POST'])
def rename_project():
    try:
        file_name = request.json.get('FileName')
        new_file_name = request.json.get('NewFileName')
        path_project_file = os.path.join(dir_project_path, file_name)
        new_path_project_file = os.path.join(dir_project_path, new_file_name)
        os.rename(path_project_file, new_path_project_file)
        return send_success({
            "Success": True,
            "Msg": "OK"
        })
    except Exception as err:
        return send_success({
            "Success": False,
            "Msg": "KO"
        })


@app.route('/CheckNewProjectName', methods=['POST'])
def check_new_project_name():
    try:
        file_name = request.json.get('FileName')
        new_file_name = request.json.get('NewFileName')
        path_project_file = os.path.join(dir_project_path, file_name)
        new_path_project_file = os.path.join(dir_project_path, new_file_name)
        if os.access(new_path_project_file, os.F_OK):
            return send_success({
                "Success": True,
                "Msg": "KO"
            })
        else:
            return send_success({
                "Success": True,
                "Msg": "OK"
            })

    except Exception as err:
        return throw_error(err)


@app.route('/GetProjectStatus', methods=['POST'])
def get_project_status():
    try:
        return send_success({
            "Success": True,
            "Msg": """{
                        "OpenedBy": "",
                        "Shared": "False",
                        "SecuredLink": "False"
                    }"""
        })
    except Exception as err:
        return throw_error(err)


@app.route("/heartbeat")
def heartbeat():
    return jsonify({"status": "healthy"})

def dashboard(xprjson):
    # Load configuration from json file
    with open(xprjson, 'r') as config_file:
        config_data = json.load(config_file)

    # Read the HTML template
    index_view_path = os.path.join(dir_temp_name, 'index-view-2.930.8710.html')
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
        if xprjson is None:
            return redirect('index.html')
        else:
            return dashboard(xprjson)
    else:
        return send_from_directory('.', path)


def open_browser():
    webbrowser.open_new(server_url)


def main():
    if DEBUG:
        print("Running in development mode")
    else:
        print("Running in production mode")

    python_pool: Optional[Executor] = None
    if args.python_workers:
        python_pool = ProcessPoolExecutor(args.python_workers)
    from server_exec import create_python_exec_blueprint
    app.register_blueprint(create_python_exec_blueprint(python_pool))

    if args.sync:
        from server_file_sync import create_file_sync_blueprint, FILE_SYNC_WS_ENDPOINT

        server_ws_url = f"{server_url.replace('http', 'ws')}{FILE_SYNC_WS_ENDPOINT}"
        blueprint = create_file_sync_blueprint(args.sync, args.sync_clear, server_ws_url)
        app.register_blueprint(blueprint)
        app.config['SOCK_SERVER_OPTIONS'] = {'ping_interval': 25}

    print('User home directory : ' + dir_home)
    print('Current working directory : ' + dir_name)
    print(f'Chalk\'it launched on {server_url}')
    if (not DEBUG) and (xprjson is None):
        threading.Timer(2, open_browser).start()
    app.run(debug=DEBUG, port=run_port)


if __name__ == '__main__':
    logging.basicConfig()
    logging.getLogger('werkzeug').setLevel(logging.ERROR)

    main()
