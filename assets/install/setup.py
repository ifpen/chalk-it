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


from setuptools import setup, find_packages
import json

NAME = "taipy-designer"
VERSION = "0.0.0" # Do not touch. Will be overwritten by version.json

with open("README.md", "r") as fh:
    readme = fh.read()

setup(
    name=NAME,
    version=VERSION,
    packages=find_packages(),
    description="Rapid webapplications with Python",
    long_description=readme,
    long_description_content_type="text/markdown",
    url="https://github.com/ifpen/chalk-it",
    install_requires=["flask", "pathvalidate", "watchdog", "flask-sock", "pytz"],
    author="IFP Energies nouvelles",
    author_email="chalk-it@ifpen.fr",
    license="Apache License 2.0",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Environment :: Console",
        "Environment :: Web Environment",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Database :: Front-Ends",
        "Topic :: Scientific/Engineering :: Information Analysis",
        "Topic :: Scientific/Engineering :: Visualization",
        "Topic :: Software Development :: Libraries :: Application Frameworks",
        "Topic :: Software Development :: Widget Sets",
    ],
    python_requires=">=3.6",
    include_package_data=True,
    entry_points={
        "console_scripts": [
            "chalk-it=chlkt.main:Main.main",
        ]
    },
)
