# Copyright 2023-2024 IFP Energies nouvelles
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.


import glob
from pathlib import Path
import subprocess
import shutil
import os
from dotenv import dotenv_values
from datetime import datetime
import json

BUILD_FRONT_END = True

# Set source and destination directories
src_dir = "assets/install"
dst_dir = "build"

# Create destination directory if it doesn't exist
if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

# Load Python version from version.json
with open("version.json", "r") as fh:
    version_json = json.load(fh)
    VERSION = (
        str(version_json["major"])
        + "."
        + str(version_json["minor"])
        + "."
        + str(version_json["patch"])
    )

# Path to the front-end version.json file
version_file_path = "front-end/version.json"

# Load variables from the version.json file
f = open(version_file_path, "r")
version_vars = json.load(f)
f.close()

# Path to the .env.prod file
env_file_path = "front-end/.env.prod"

# Load variables from the .env.prod file
env_vars = dotenv_values(env_file_path)

# Accessing the variables
a = str(version_vars["A"])
b = str(version_vars["B"])
c = str(version_vars["C"])
isLiteBuild = env_vars.get("LITE_BUILD")


def get_version():
    if c == "0":
        date_today = datetime.now()
        date_start = datetime.strptime("01/01/2000", "%m/%d/%Y")
        result = abs((date_start - date_today).days)
        return result
    else:
        return c


front_end_build_dir_name = "chalkit_" + a + "." + b + "." + str(get_version())

# Get the list of all files and directories in the "build" directory
file_list = os.listdir(dst_dir)

# Loop through all files and directories in the "build" directory
for file_name in file_list:
    # Construct the full file path
    file_path = os.path.join(dst_dir, file_name)

    # Check if the file path is a dst_dir
    if os.path.isdir(file_path):
        # Use shutil.rmtree() to remove the dst_dir and its contents
        shutil.rmtree(file_path)
    else:
        # Use os.remove() to remove the file
        os.remove(file_path)

# Remove everything in build directory
if BUILD_FRONT_END:

    def run_npm(*args):
        shell = os.name == "nt"  # True on Windows, False on Unix/Linux/MacOS
        try:
            subprocess.run(args, shell=shell, check=True, cwd="./front-end")
        except subprocess.CalledProcessError as e:
            print(f"Error running '{' '.join(args)}': {e}")
            exit(1)

    if not (
        os.path.exists("./front-end/node_modules")
        and os.path.isdir("./front-end/node_modules")
    ):
        run_npm("npm", "install")

    if not (
        os.path.exists("./front-end/bower_components")
        and os.path.isdir("./front-end/bower_components")
    ):
        run_npm("bower", "install")

    # Run npm build command in front-end directory
    if isLiteBuild:
        run_npm("npm", "run", "build:lite")
    else:
        run_npm("npm", "run", "build")

# Copy build result to ./build/chlkt directory
build_dir = os.path.join("./front-end/build", front_end_build_dir_name)
shutil.copytree(build_dir, "./build/chlkt")

# Copy .whl file to ./build/chlkt directory
# Specify the source directory and pattern
source_directory = "./front-end/"
pattern = "chalkit_python_api-*.whl"

# Use glob to find the matching file
matching_files = glob.glob(source_directory + pattern)

if matching_files:
    # Assign the path of the first matching file
    source_path = matching_files[0]
    destination_directory = "./build/chlkt/"

    shutil.copy(source_path, destination_directory)
else:
    print("chalkit_python_api-*.whl file not found.")

# Copy main.py and associated .py files to ./build/chlkt directory
cwd = os.getcwd()
build_path = Path("./build/chlkt/")

# Ensure the directory exists
build_path.mkdir(parents=True, exist_ok=True)

file_paths = ["./main.py", "./back_end/__init__.py"]

for file_path in file_paths:
    shutil.copy(file_path, build_path)

# Copy directories to build_path with their structure
directories_to_copy = {
    "./back_end/taipy/": "taipy",
    "./back_end/app/": "app",
    "./back_end/render/": "render",
    "./back_end/common/": "common",
}

# Add additional directory if it is not a lite build
if not isLiteBuild:
    directories_to_copy["./documentation/Templates/"] = "Templates"

for src_path, dest_name in directories_to_copy.items():
    dest_path = build_path / dest_name
    # Check if the destination path already exists to avoid shutil.copytree error
    if dest_path.exists():
        shutil.rmtree(dest_path)  # Remove the existing directory to replace it
    shutil.copytree(src_path, dest_path)

# Copy all files from source directory to destination directory
for filename in os.listdir(src_dir):
    src_path = os.path.join(src_dir, filename)
    dst_path = os.path.join(dst_dir, filename)
    shutil.copy(src_path, dst_path)


# This function checks if various Python commands exist in the system PATH.
def get_python_command():
    # Need to keep this order
    commands_to_check = ["python", "python3", "python2", "py"]

    for cmd in commands_to_check:
        if shutil.which(cmd):
            # Returns the available command
            return cmd

    # If no Python command was found
    raise SystemExit("Python not found. Please install Python.")


def update_version_in_setup_file(file_path, new_version):
    # Define the line prefix to search for
    line_prefix = 'VERSION = "'
    line_suffix = '" # Do not touch. Will be overwritten by version.json'

    # Initialize an empty list to hold the updated lines
    updated_lines = []

    # Open the file and read the lines
    with open(file_path, "r") as file:
        lines = file.readlines()

        # Loop through each line in the file
        for line in lines:
            # Check if the line contains the version definition
            if line.strip().startswith(line_prefix) and line.strip().endswith(
                line_suffix
            ):
                # Replace the version number in the line
                updated_line = f"{line_prefix}{new_version}{line_suffix}\n"
                updated_lines.append(updated_line)
            else:
                # If not the version line, keep the line as is
                updated_lines.append(line)

    # Write the updated lines back to the file
    with open(file_path, "w") as file:
        file.writelines(updated_lines)


# Example usage:
file_path = "./build/setup.py"  # Path to your setup.py file
new_version = VERSION  # New version number to update to
update_version_in_setup_file(file_path, new_version)


# Get available python command
python_cmd = get_python_command()

# Run setup.py command from ./assets directory
subprocess.run([python_cmd, "../build/setup.py", "sdist"], cwd="./build/")
