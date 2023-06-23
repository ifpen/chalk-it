from pathlib import Path
import subprocess
import shutil
import os

BUILD_FRONT_END = True

# Set source and destination directories
src_dir = 'assets/install'
dst_dir = 'build'

# Create destination directory if it doesn't exist
if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

# Remove everything in build directory
if (BUILD_FRONT_END):
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

    if not Path('front-end/.env.prod').exists():
        shutil.copy('front-end/.env.sample', 'front-end/.env.prod')

    def run_npm(*args):
        try:
            subprocess.run(args, shell=True, check=True, cwd='./front-end')
        except subprocess.CalledProcessError as e:
            print(f"Error running '{' '.join(args)}': {e}")
            exit(1)

    if not(os.path.exists('./front-end/node_modules') and os.path.isdir('./front-end/node_modules')):
        run_npm('npm', 'install')

    if not(os.path.exists('./front-end/bower_components') and os.path.isdir('./front-end/bower_components')):
        run_npm('bower','install')

    # Run npm build command in front-end directory
    run_npm('npm', 'run', 'build')

    # Copy build result to ./build/chlkt directory
    build_dir = os.path.join('./front-end/build', os.listdir('./front-end/build')[0])
    shutil.copytree(build_dir, './build/chlkt')

# Copy server.py and associated .py files to ./build/chlkt directory
cwd = os.getcwd()
shutil.copy('./front-end/server.py', './build/chlkt/')
shutil.copy('./assets/misc/__init__.py', './build/chlkt/')

# Copy templates
shutil.copytree('./documentation/Templates/', './build/chlkt/Templates/')

# Copy all files from source directory to destination directory
for filename in os.listdir(src_dir):
    src_path = os.path.join(src_dir, filename)
    dst_path = os.path.join(dst_dir, filename)
    shutil.copy(src_path, dst_path)

# Run setup.py command from ./assets directory
subprocess.run(['python', '../build/setup.py', 'sdist'], cwd='./build/')
