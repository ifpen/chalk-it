import os
import shutil

def find_and_copy_files(src_directory, dst_directory, extensions, other_files):
    file_names = []
    for root, dirs, files in os.walk(src_directory):
        for file in files:
            # Check if file ends with any of the specified extensions or is in the list of other files to copy
            if file.endswith(tuple(extensions)) or file in other_files:
                file_names.append(os.path.join(root, file))
                # Prepare the destination path
                dst_path = os.path.join(dst_directory, os.path.relpath(root, src_directory))
                os.makedirs(dst_path, exist_ok=True)
                shutil.copy(os.path.join(root, file), dst_path)
    return file_names

# Directory names
src_directory = "taipy_docs"
dst_directory = "examples"

# Extensions of the files to be copied and specific file names
extensions = [".py",".xprjson", ".csv", ".ppg", ".html", ".json", ".txt"]
other_files_to_copy = ["example.md"]  # Example file names

# Call the function
file_names = find_and_copy_files(src_directory, dst_directory, extensions, other_files_to_copy)

# Optionally print the list of file names
for file_name in file_names:
    print(file_name)
