# User manual of Chalk'it

The documentation is built using MkDocs

## Installation

First install Python 3 from <https://www.python.org/downloads/>

Then, install MkDocs

```sh
pip install mkdocs==1.3.0
pip install mkdocs-material==8.2.15
pip install mkdocstrings[python-legacy]
```

## Template build

Reference xprjson are in the docs directory. Run the following code to build the templates directory:

```sh
python copy_templates.py
```

## Serve when writing

```sh
mkdocs serve
```