import os
import shutil
import zipfile

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
extensions = [".py",".xprjson", ".csv", ".jpg", ".html", ".json", ".txt"]
other_files_to_copy = ["example.md"]  # Example file names

# Call the function
file_names = find_and_copy_files(src_directory, dst_directory, extensions, other_files_to_copy)

# Optionally print the list of file names
for file_name in file_names:
    print(file_name)

def zip_dir(source_dir, output_file):
    """Zip the contents of the source directory and save it to the output file."""
    with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                zipf.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), os.path.join(source_dir, '..')))

def main():
    source_directory = 'examples'  # Directory to zip
    target_directory = 'taipy_docs'  # Directory where the zip file will be moved
    zip_file = 'examples.zip'  # Name of the zip file
    
    # Create zip file
    zip_dir(source_directory, zip_file)
    print(f"Created zip file {zip_file} from directory {source_directory}")
    
    # Ensure target directory exists
    if not os.path.exists(target_directory):
        os.makedirs(target_directory)

    # Full path where the zip will be moved
    target_zip_path = os.path.join(target_directory, zip_file)

    # Check if the file already exists at the destination
    if os.path.exists(target_zip_path):
        os.remove(target_zip_path)
        print(f"Removed existing file at {target_zip_path}")

    # Move zip file to the target directory
    shutil.move(zip_file, target_directory)
    print(f"Moved {zip_file} to directory {target_directory}")

if __name__ == "__main__":
    main()
