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


from setuptools import find_namespace_packages, setup, find_packages
import os
import sys
import tarfile

NAME = "taipy-designer"
VERSION = "0.0.0" # Do not touch. Will be overwritten by version.json

with open("README.md", "r") as fh:
    readme = fh.read()

def extract_tar_gz_package(python_version: str):
    file_path = f"{os.getcwd()}{os.path.sep}src{os.path.sep}taipy-designer-{python_version}.tar.gz"
    if tarfile.is_tarfile(file_path):
        with tarfile.open(file_path, "r:gz") as tar_ref:
            tar_ref.extractall(f"{os.getcwd()}{os.path.sep}src")

_python_version = (sys.version_info[0], sys.version_info[1])

if _python_version < (3, 8):
    sys.exit("Python >=3.8 is required to install taipy-designer")

if _python_version == (3, 8):
    extract_tar_gz_package("3.8")
elif _python_version == (3, 9):
    extract_tar_gz_package("3.9")
elif _python_version == (3, 10):
    extract_tar_gz_package("3.10")
elif _python_version == (3, 11):
    extract_tar_gz_package("3.11")
elif _python_version == (3, 12):
    extract_tar_gz_package("3.12")

setup(
    name=NAME,
    version=VERSION,
    package_dir={"": "src"},
    packages=find_namespace_packages(where="src") + find_packages(
        include=["taipy", "taipy.designer", "taipy.designer.*"]
    ),
    description="Rapid web applications with Python",
    long_description=readme,
    long_description_content_type="text/markdown",
    install_requires=["taipy-gui==3.1.2", "pathvalidate", "pyt"],
    author="Avaiga",
    author_email="dev@taipy.io",
    python_requires=">=3.8",
    include_package_data=True,
)
