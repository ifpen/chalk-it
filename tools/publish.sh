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

VERSIONS=("3.8" "3.9" "3.10" "3.11")
FOUND_VERSION=""

for VERSION in "${VERSIONS[@]}"; do
    if command -v "python$VERSION" &> /dev/null; then
        compile "python$VERSION" "./src/taipy-designer-$VERSION.zip"
        FOUND_VERSION=$VERSION
    fi
done

rm -rf taipy-temp

find src -name '*.py' -delete

"python$FOUND_VERSION" -m build
