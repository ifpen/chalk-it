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
    description='A 360° open-source platform from Python pilots to production-ready web apps.',
	long_description=readme,
    long_description_content_type="text/markdown",
	url='https://github.com/Avaiga/taipy',
    install_requires=[
        'flask',
        'pytz'
    ],
    author="IFPEN",
    author_email="xdash@ifpen.fr",
    license="IFPEN collaboration framework",
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
        'console_scripts': [
            'chalk-it=chlkt.main:Main.main',
        ]
    }
)
