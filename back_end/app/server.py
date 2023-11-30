from flask import Flask, send_file, jsonify, make_response, json, request, redirect, send_from_directory, render_template_string, url_for
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

class AppConfig:
    def __init__(self, args):
        # Extract arguments and set default values
        self.DEBUG = args.dev
        self.xprjson = args.xprjson_file
        self.run_port = args.app_port or 7854
        self.app_ip = args.app_ip or '127.0.0.1'
        self.server_url = f"http://{self.app_ip}:{self.run_port}"

        # Set up directories
        self.dir_home = os.path.expanduser("~")
        self.dir_settings_path = os.path.join(self.dir_home, '.chalk-it')
        self.settings_file_path = os.path.join(self.dir_settings_path, 'settings.json')

        if self.DEBUG:
            self._setup_development_paths()
        else:
            self._setup_production_paths()

    def _setup_development_paths(self):
        # Development mode paths
        self.dir_name = os.path.dirname(__file__)
        self.dir_temp_path = os.path.join(self.dir_name, '../../documentation/Templates/Projects')
        self.dir_images_path = os.path.join(self.dir_name, '../../documentation/Templates/Images')
        self.dir_project_path = os.path.join(self.dir_name, '../../')
        self.static_folder_path = "../../front-end"

    def _setup_production_paths(self):
        # Production mode paths
        self.dir_temp_name = os.path.dirname(__file__)
        self.dir_temp_path = os.path.join(self.dir_temp_name, '../Templates/Projects')
        self.dir_images_path = os.path.join(self.dir_temp_name, '../Templates/Images')
        self.dir_name = os.getcwd()
        self.dir_project_path = self.dir_name
        self.static_folder_path = "../"

class RootManager:
    def __init__(self, config):
        self.config = config
        self.app = Flask(__name__, static_folder=config.static_folder_path, static_url_path='')
        self.setting_manager = SettingManager(config)
        self.template_manager = TemplateManager(config)
        self.project_manager = ProjectManager(config)
        self.file_manager = FileManager(config)
        self._setup_routes()

    def _configure_cors(self, response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST')
        return response
    
    @staticmethod
    def send_success(json_obj):
        response = make_response(json.dumps({"d": json.dumps(json_obj)}), 200)
        return response
    
    # Handle errors and return a formatted response
    def _send_error(self, error):
        logging.error(error, exc_info=True)

        # Extract exception type from the error message
        exception_type = error.split(":")[0].strip()
        response = make_response(json.dumps({"d": json.dumps({"Success": False, "Msg": f"Error Type: {exception_type}, Details: {error}"})}), 500)
        return response

    def _setup_routes(self):
            # Set up CORS headers after each request
            @self.app.after_request
            def after_request(response):
                return self._configure_cors(response)

            self._add_route('/GetFiles', self._get_files, methods=['POST'])
            self._add_route('/GetPythonDataList', self._get_python_data_list, methods=['POST'])
            self._add_route('/GetImages', self._get_template_image, methods=['GET'])
            self._add_route('/SaveSettings', self._save_settings, methods=['POST'])
            self._add_route('/ReadSettings', self._read_settings, methods=['POST'])
            self._add_route('/ReadTemplate', self._read_template, methods=['POST'])
            self._add_route('/SaveProject', self._save_project, methods=['POST'])
            self._add_route('/ReadProject', self._read_project, methods=['POST'])
            self._add_route('/RenameProject', self._rename_project, methods=['POST'])
            self._add_route('/CheckNewProjectName', self._check_new_project_name, methods=['POST'])
            self._add_route('/GetProjectStatus', self._get_project_status, methods=['POST'])
            self._add_route('/heartbeat', self._heartbeat)
            self._add_route('/', self._static_files, defaults={'path': ''})
            self._add_route('/<path:path>', self._static_files, methods=['GET'])

    def _add_route(self, route, method, **options):
        self.app.route(route, **options)(method)

    def _get_files(self):
        try:
            return self.file_manager.get_files()
        except Exception as err:
            return self._send_error(err)

    def _get_python_data_list(self):
        return RootManager.send_success({
            "Success": True,
            "Msg": None,
            "FileList": [],
        })

    def _get_template_image(self):
        image_name = request.args.get('image')
        return self.template_manager.get_template_image(image_name)

    def _save_settings(self):
        try:
            decoded_data_json = json.loads(b64decode(request.json['FileData'].encode()).decode())
            return self.setting_manager.save_settings(decoded_data_json)
        except OSError as err:
            return self._send_error(err)

    def _read_settings(self):
        try:
            return self.setting_manager.read_settings()
        except OSError as err:
            return self._send_error(err)

    def _read_template(self):
        try:
            template_name = request.json.get('FileName')
            return self.template_manager.read_template(template_name)
        except Exception as err:
            return self._send_error(err)

    def _save_project(self):
        try:
            file_name = request.json['FileName']
            file_data = request.json['FileData']
            offset = request.json['Offset']
            return self.project_manager.save_project(file_name, file_data, offset)
        except Exception as err:
            return self._send_error(err)

    def _read_project(self):
        try:
            file_name = request.json['FileName']
            offset = request.json['Offset']
            return self.project_manager.read_project(file_name, offset)
        except OSError as err:
            return self._send_error(err)

    def _rename_project(self):
        file_name = request.json.get('FileName')
        new_file_name = request.json.get('NewFileName')
        return self.project_manager.rename_project(file_name, new_file_name)

    def _check_new_project_name(self):
        try:
            file_name = request.json.get('FileName')
            new_file_name = request.json.get('NewFileName')
            return self.project_manager.check_new_project_name(file_name, new_file_name)
        except Exception as err:
            return self._send_error(err)

    def _get_project_status(self):
        try:
            return self.project_manager.get_project_status()
        except Exception as err:
            return self._send_error(err)

    def _heartbeat(self):
        return jsonify({"status": "healthy"})

    def _static_files(self, path: str):
        """
            Handles requests for static files.
        """
        return self.file_manager.static_files(path)
    
class SettingManager:
    def __init__(self, config):
        self.config = config

    def save_settings(self, decoded_data_json):
        if os.access(self.config.settings_file_path, os.F_OK):
            with open(self.config.settings_file_path, 'r', encoding='utf8') as file:
                file_data = file.read()
            file_data_json = json.loads(file_data)
            file_data_json.update(decoded_data_json)
            with open(self.config.settings_file_path, 'w', encoding='utf8') as file:
                json.dump(file_data_json, file, indent=2)
            return RootManager.send_success({
                "Success": True,
                "Msg": "OK"
            })
        else:
            return RootManager.send_success({
                "Success": False,
                "Msg": "KO"
            })

    def read_settings(self):
        if os.access(self.config.settings_file_path, os.F_OK):
            with open(self.config.settings_file_path, 'r', encoding='utf8') as file:
                file_data = file.read()
            encoded_data = b64encode(json.dumps(json.loads(file_data)).encode()).decode()
        else:
            os.makedirs(self.config.dir_settings_path, exist_ok=True)
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
            with open(self.config.settings_file_path, 'w', encoding='utf8') as file:
                file.write(default_settings)

        file_stats = os.stat(self.config.settings_file_path)
        nb_bytes = file_stats.st_size
        return RootManager.send_success({
            "Success": True,
            "Msg": None,
            "Offset": 0,
            "NbBytes": nb_bytes,
            "LastChunk": True,
            "ReadOnly": False,
            "FileData": encoded_data,
            "Array": None
        })
    
class TemplateManager:
    def __init__(self, config):
        self.config = config

    def read_template(self, template_name):
        template_path = os.path.join(self.config.dir_temp_path, template_name)
        with open(template_path, 'r', encoding='utf8') as file:
            file_data = file.read()
        encoded_data = b64encode(file_data.encode()).decode()
        file_stats = os.stat(template_path)
        nb_bytes = file_stats.st_size
        return RootManager.send_success({
            "Success": True,
            "Msg": None,
            "Offset": 0,
            "NbBytes": nb_bytes,
            "LastChunk": True,
            "ReadOnly": False,
            "FileData": encoded_data,
            "Array": None
        })

    def get_template_image(self, image_name):
        image_path = os.path.join(self.config.dir_images_path, f'{image_name}.png')
        return send_file(image_path, mimetype='image/png')

class ProjectManager:
    def __init__(self, config):
        self.config = config

    def save_project(self, file_name, file_data, offset):
        if file_data and offset != -1:
            decoded_data_json = json.loads(b64decode(file_data.encode()).decode())
            project_name = decoded_data_json.get("meta").get("name")
            os.makedirs(self.config.dir_project_path, exist_ok=True)
            path_project_file = os.path.join(self.config.dir_project_path, f"{project_name}.xprjson")
            with open(path_project_file, 'w', encoding='utf8') as file:
                file.write(json.dumps(decoded_data_json, indent=2))
        return RootManager.send_success({
            "Success": True,
            "Msg": "OK"
        })

    def read_project(self, file_name, offset):
        encoded_data = ""
        path_project_file = os.path.join(self.config.dir_project_path, file_name)
        if offset != -1 and os.access(path_project_file, os.F_OK):
            with open(path_project_file, 'r', encoding='utf8') as file:
                file_data = json.load(file)
            encoded_data = b64encode(json.dumps(file_data).encode()).decode()
        file_stats = os.stat(path_project_file)
        nb_bytes = file_stats.st_size
        return RootManager.send_success({
            "Success": True,
            "Msg": None,
            "Offset": 0,
            "NbBytes": nb_bytes,
            "LastChunk": True,
            "ReadOnly": False,
            "FileData": encoded_data,
            "Array": None
        })

    def rename_project(self, file_name, new_file_name):
        try:
            path_project_file = os.path.join(self.config.dir_project_path, file_name)
            new_path_project_file = os.path.join(self.config.dir_project_path, new_file_name)
            os.rename(path_project_file, new_path_project_file)
            return RootManager.send_success({
                "Success": True,
                "Msg": "OK"
            })
        except Exception:
            return RootManager.send_success({
                "Success": False,
                "Msg": "KO"
            })

    def check_new_project_name(self, file_name, new_file_name):
        path_project_file = os.path.join(self.config.dir_project_path, file_name)
        new_path_project_file = os.path.join(self.config.dir_project_path, new_file_name)
        if os.access(new_path_project_file, os.F_OK):
            return RootManager.send_success({
                "Success": True,
                "Msg": "KO"
            })
        else:
            return RootManager.send_success({
                "Success": True,
                "Msg": "OK"
            })

    def get_project_status(self):
        return RootManager.send_success({
            "Success": True,
            "Msg": """{
                        "OpenedBy": "",
                        "Shared": "False",
                        "SecuredLink": "False"
                    }"""
        })

class FileManager:
    def __init__(self, config):
        self.config = config

    def get_files(self):
        path_dir = ""
        file_type = request.json['FileType']
        if file_type == "project":
            path_dir = self.config.dir_project_path
        elif file_type == "template":
            path_dir = self.config.dir_temp_path
        files = Path(path_dir).glob('*.xprjson')
        file_list = [{
            "Name": file.stem,
            "FileName": file.name,
            "Description": "",
            "GroupeName": "",
            "Python": None,
            "Tags": [],
            "URL": f'{self.config.server_url}/GetImages?image={file.stem}',
            "Path": str(file.parent)
        } for file in files]
        # sort the file list by 'Name' key in ascending order
        file_list = sorted(file_list, key=lambda k: k['Name'], reverse=False)
        return RootManager.send_success({
            "Success": True,
            "Msg": None,
            "FileList": file_list,
            "Path": path_dir,
            "Python": None
        })

    def _dashboard(self, xprjson):
        # Load configuration from json file
        with open(xprjson, 'r') as config_file:
            config_data = json.load(config_file)

        # Read the HTML template
        index_view_path = os.path.join(self.config.dir_temp_name, 'index-view-2.930.8710.html')
        with open(index_view_path, 'r') as template_file:
            template_data = template_file.read()

        # Inject the JSON data into the template
        template_data_with_config = template_data.replace('jsonContent = {};', f'var jsonContent = {json.dumps(config_data)};')

        # Render the HTML with the configuration inlined
        return render_template_string(template_data_with_config)

    def static_files(self, path: str):
        """
        Handles requests for static files.
        """
        if path and not path.endswith('/'):
            return send_from_directory('.', path)

        if self.config.xprjson is not None:
            return self._dashboard(self.config.xprjson)

        return redirect(url_for('static', filename='index.html'))
    
class Main:
    @classmethod
    def _configure_logging(cls):
        logging.basicConfig()
        logging.getLogger('werkzeug').setLevel(logging.ERROR)

    @classmethod
    def _open_browser(cls, server_url):
        """
        Opens a new web browser window with the server URL.
        """
        webbrowser.open_new(server_url)

    @classmethod
    def _create_app(cls, config):
        root_manager = RootManager(config)
        return root_manager.app

    @classmethod
    def _run_python_pool(cls, app, args):
        python_pool: Optional[Executor] = ProcessPoolExecutor(args.python_workers) if args.python_workers else None
        if python_pool:
            from server_exec import create_python_exec_blueprint
            app.register_blueprint(create_python_exec_blueprint(python_pool))

    @classmethod
    def _run_file_sync(cls, app, args, config):
        if args.sync:
            from .server_file_sync import create_file_sync_blueprint, FILE_SYNC_WS_ENDPOINT
            server_ws_url = f"{config.server_url.replace('http', 'ws')}{FILE_SYNC_WS_ENDPOINT}"
            blueprint = create_file_sync_blueprint(args.sync, args.sync_clear, server_ws_url)
            app.register_blueprint(blueprint)
            app.config['SOCK_SERVER_OPTIONS'] = {'ping_interval': 25}

    @classmethod
    def _print_startup_info(cls, config):
        print('User home directory:', config.dir_home)
        print('Current working directory:', config.dir_name)
        print(f'Chalk\'it launched on {config.server_url}')

    @classmethod
    def _start_application(cls, app, config):
        if (not config.DEBUG) and (config.xprjson is None):
            threading.Timer(2, lambda: cls._open_browser(config.server_url)).start()
        app.run(debug=config.DEBUG, port=config.run_port)

    @classmethod
    def _parse_command_line_arguments(cls):
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

        return parser.parse_args()
    
    # Main function to run the application
    @classmethod
    def main(cls):
        # Parse command-line arguments
        args = cls._parse_command_line_arguments()
        config = AppConfig(args)
        app = cls._create_app(config)

        cls._configure_logging()
        mode_message = "development" if config.DEBUG else "production"
        print(f"Running in {mode_message} mode")

        cls._run_python_pool(app, args)
        cls._run_file_sync(app, args, config)
        cls._print_startup_info(config)
        cls._start_application(app, config)