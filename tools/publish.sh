#!/bin/bash

python3.10 -m pip install build

cp -fR src/taipy/. taipy-temp

compile() {
    PYTHON_PATH=$1
    ZIP_FILE=$2
    # create new working dir
    cp -R taipy-temp taipy
    # generate pyi
    $PYTHON_PATH -O -m compileall taipy/designer -b -f
    # Generate pyi
    $PYTHON_PATH -m pip install mypy
    stubgen taipy -o ./
    # Remove unnecessary files
    find taipy/designer -name '*.py' -delete
    find taipy -type d -name  "__pycache__" -exec rm -r {} +
    # zip folder
    zip -r $ZIP_FILE taipy
    # remove current working dir
    rm -rf taipy
}

compile python3.8 ./src/taipy-3.8.zip
compile python3.9 ./src/taipy-3.9.zip
compile python3.10 ./src/taipy-3.10.zip
compile python3.11 ./src/taipy-3.11.zip

rm -rf taipy-temp

find src -name '*.py' -delete

python3.10 -m build
