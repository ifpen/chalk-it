from setuptools import setup, find_packages
import os

NAME = "py-chalk-it"
VERSION = "0.3.1"

with open("README.MD", "r") as fh:
    readme = fh.read()

setup(
    name=NAME,
    version=VERSION,
	packages=['chlkt'], # or find_packages(),
    description='Rapid webapplications with Python',
	long_description=readme,
    long_description_content_type="text/markdown",
	url='https://github.com/ifpen/chalk-it',
    install_requires=[
        'flask',
    ],
    author="IFP Energies nouvelles",
    author_email="xdash@ifpen.fr",
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
        'console_scripts': [
            'chalk-it=chlkt.server:main',
        ]
    }
)
