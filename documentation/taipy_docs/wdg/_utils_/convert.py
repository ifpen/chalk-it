import os
import json
import copy

            
def write_python_file(filename, datanodes):
    python_variables_code = ""
    python_variables_code += "from taipy.gui import Gui\n"
    python_variables_code += "from taipy_designer import *\n\n"
    
    for node in datanodes:
        if node["type"] == "JSON_var_plugin":
            variable_name = node["settings"]["name"]
            json_var = node["settings"]["json_var"]
            python_variables_code += f"{variable_name} = {json.dumps(json.loads(json_var), indent=2)}\n\n"
 
    python_variables_code += 'gui = Gui()\n'      
    new_xprjson_file_name = filename.replace('.xprjson', '_modif.xprjson')      
    python_variables_code += 'page = ChalkitPage("' + new_xprjson_file_name + '")\n'
    python_variables_code += 'gui.add_page("page", page)\n'
    python_variables_code += 'gui.run(run_browser=True, use_reloader=False)\n'
    
    # Construct the new file name by adding _modif before the .xprjson extension
    new_file_name = filename.replace('.xprjson', '.py')
    new_file_path = os.path.join('.', new_file_name)
    
    # Save the modified data back to a new file with the modified name
    with open(new_file_path, 'w') as file:
        file.write(python_variables_code)
            
def remove_datanodes(filename, xprjson):
    # Remove the 'data' field from the dictionary, if it exists
    if 'data' in xprjson and 'datanodes' in xprjson['data']:
        xprjson['data']['datanodes'] = []
    
    if 'libraries' in xprjson:
        xprjson['libraries'] = {
		"pyodideStandard": [],
		"pyodideMicropip": []
	}
    
    # Construct the new file name by adding _modif before the .xprjson extension
    new_file_name = filename.replace('.xprjson', '_modif.xprjson')
    new_file_path = os.path.join('.', new_file_name)
    
    # Save the modified data back to a new file with the modified name
    with open(new_file_path, 'w') as file:
        json.dump(xprjson, file, indent=4)  # You can adjust the indent as per your needs

# Scan through each file in the directory
for filename in os.listdir('.'):
    # Check if the file has a .xprjson extension
    if filename.endswith('.xprjson'):
        # Construct the full path to the file
        print ('processing file: ' + filename)
        file_path = os.path.join('.', filename)
        # Open and read the .xprjson file
        with open(file_path, 'r') as file:
            # Assuming the file content is in valid JSON format
            xprjson = json.load(file)
            datanodes = {}
            if 'data' in xprjson and 'datanodes' in xprjson['data']:
                datanodes = copy.deepcopy(xprjson['data']['datanodes'])
            write_python_file(filename, datanodes)
            remove_datanodes(filename, xprjson)