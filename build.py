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
from datetime import datetime
import json
import argparse
import sys

# Create the parser
parser = argparse.ArgumentParser(description="Process the build type.")

# Add the build_type optional argument
parser.add_argument(
    "--buildtype",
    choices=["pip", "hosted", "local"],
    default="pip",
    help="Specify the type of build: 'pip' or 'hosted'.",
)

# Parse the arguments
args = parser.parse_args()

BUILD_FRONT_END = True
BUILD_TYPE = args.buildtype

print("building for target: ", BUILD_TYPE)

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
env_file_path = "front-end/version.json"

# Load variables from the version.json file
f = open(env_file_path, "r")
env_vars = json.load(f)
f.close()

# Accessing the variables
a = str(env_vars["A"])
b = str(env_vars["B"])
c = str(env_vars["C"])

suffix_version = a + "." + b

if BUILD_TYPE == "pip":

    # Define the path to the front-end directory
    directory = "front-end"
    input_file_path = os.path.join(directory, ".env.prod.pip")
    output_file_path = os.path.join(directory, ".env.prod")

    # Version suffix to add
    version_suffix = suffix_version + "/"  # You can change this to any version you need

    # Read the input file
    with open(input_file_path, "r") as file:
        lines = file.readlines()

    # Modify the content
    modified_lines = []
    for line in lines:
        if line.startswith("URL_BASE_FOR_EXPORT"):
            # Split the line at '=' and strip spaces, then add the version suffix
            key, value = line.strip().split("=", 1)
            modified_line = f"{key}={value.strip()}{version_suffix}\n"
            modified_lines.append(modified_line)
        else:
            modified_lines.append(line)

    # Write the modified content to the new file
    with open(output_file_path, "w") as file:
        file.writelines(modified_lines)

    print(f"File saved as: {output_file_path}")

elif BUILD_TYPE == "hosted":
    # Define the path to the front-end directory
    directory = "front-end"
    input_file_path = os.path.join(directory, ".env.prod.hosted")
    output_file_path = os.path.join(directory, ".env.prod")

    shutil.copy(input_file_path, output_file_path)
   
elif BUILD_TYPE == "local":
    # Define the path to the front-end directory
    directory = "front-end"
    input_file_path = os.path.join(directory, ".env.prod.local")
    output_file_path = os.path.join(directory, ".env.prod")

    shutil.copy(input_file_path, output_file_path)

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

    # Run npm build command in front-end directory
    run_npm("npm", "run", "build")

if (BUILD_TYPE == "pip" or BUILD_TYPE == "local"):

    # Copy build result to ./build/chlkt directory
    shutil.copytree("./front-end/build", "./build/chlkt")

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
    build_path = "./build/chlkt/"
    file_paths = ["./main.py", "./assets/misc/__init__.py"]

    for file_path in file_paths:
        shutil.copy(file_path, build_path)

    # Copy app server
    shutil.copytree("./back_end/app/", "./build/chlkt/app/")

    # for gunicorn rendering of pages
    shutil.copytree("./back_end/render/", "./build/chlkt/render/")

    # for gunicorn rendering of pages
    shutil.copytree("./back_end/common/", "./build/chlkt/common/")

    # copy backend runner
    shutil.copytree(
        "./back_end/middleware/src/chalkit_python_api/",
        "./build/chlkt/chalkit_python_api/",
    )

    # Copy templates
    shutil.copytree("./documentation/Templates/", "./build/chlkt/Templates/")

    # Copy all files from source directory to destination directory
    for filename in os.listdir(src_dir):
        src_path = os.path.join(src_dir, filename)
        dst_path = os.path.join(dst_dir, filename)
        shutil.copy(src_path, dst_path)

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
    python_cmd = sys.executable

    # Run setup.py command from ./assets directory
    subprocess.run([python_cmd, "../build/setup.py", "sdist"], cwd="./build/")
