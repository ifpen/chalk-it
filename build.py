from pathlib import Path
import subprocess
import shutil
import os
from dotenv import dotenv_values
from datetime import datetime


BUILD_FRONT_END = True

# Set source and destination directories
src_dir = 'assets/install'
dst_dir = 'build'

# Create destination directory if it doesn't exist
if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

if not Path('front-end/.env.prod').exists():
    hutil.copy('front-end/.env.sample', 'front-end/.env.prod')
	
# Path to the .env.prod file
env_file_path = 'front-end/.env.prod'

# Load variables from the .env.prod file
env_vars = dotenv_values(env_file_path)

# Accessing the variables
a = env_vars.get('VERSION_XDASH_A')
b = env_vars.get('VERSION_XDASH_B')
c = env_vars.get('VERSION_XDASH_C')	


def getVersion():

    if c == '0':
        date_today = datetime.now()
        date_start = datetime.strptime("01/01/2000", "%m/%d/%Y")
        result = abs((date_start - date_today).days)
        return result
    else:
        return c

front_end_build_dir_name = 'xdash_' + a + '.' + b + '.' + str(getVersion())


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
if (BUILD_FRONT_END):

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
build_dir = os.path.join('./front-end/build', front_end_build_dir_name)
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
