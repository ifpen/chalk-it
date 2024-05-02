import os
import shutil
import json

# specify the source directory
source_dir = "./docs"

# specify the destination directory
dest_dir = "./templates-from-docs"

# check if the destination directory exists, if not create it
if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

# initialize a dictionary to keep track of xprjson files and their paths
xprjson_index = {}

# use os.walk to iterate through all subdirectories
for root, dirs, files in os.walk(source_dir):
    for file in files:
        # get the full path of the file
        file_path = os.path.join(root, file)
        
        # check if the file has a .xprjson extension
        if file.endswith(".xprjson"):
            # copy file to the destination directory
            shutil.copy2(file_path, dest_dir)
            # update the dictionary with the file and its original path
            xprjson_index[file] = root

# specify the path for the JSON index file
index_file_path = os.path.join(dest_dir, "xprjson_docs_index.json")

# write the index mapping to a JSON file
with open(index_file_path, 'w') as f:
    json.dump(xprjson_index, f, indent=4)
