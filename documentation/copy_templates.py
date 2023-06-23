import os
import shutil

# specify the source directory
source_dir = "./docs"

# specify the destination directory
dest_dir = "./templates-from-docs"

# use os.walk to iterate through all subdirectories
for root, dirs, files in os.walk(source_dir):
    for file in files:
        # get the full path of the file
        file_path = os.path.join(root, file)
        
        # check if the file has a .json extension
        if file.endswith(".xprjson"):
            # construct the destination file path
            #dest_file_path = os.path.join(dest_dir, os.path.relpath(file_path, source_dir))
            
            # create the destination directory if it doesn't exist
            #dest_dir_path = os.path.dirname(dest_file_path)
            #if not os.path.exists(dest_dir_path):
            #    os.makedirs(dest_dir_path)
            
            # copy the file to the destination directory
            #shutil.copy2(file_path, dest_file_path)
            shutil.copy2(file_path, dest_dir)
