#!/bin/bash

# Declaration
POTENTIAL_VERSIONS=("3.8" "3.9" "3.10" "3.11")

compile() {
    PYTHON_PATH=$1
    ZIP_FILE=$2
    # create new working dir
    cp -R build/taipy-temp build/src/taipy
    # generate pyi
    $PYTHON_PATH -O -m compileall build/src/taipy/designer -b -f
    # Generate pyi
    $PYTHON_PATH -m pip install mypy
    stubgen build/src/taipy -o ./build/src
    # Remove unnecessary files
    find build/src/taipy/designer -name '*.py' -delete
    find build/src/taipy/ -type d -name  "__pycache__" -exec rm -r {} +
    # create tar.gz file
    cd build/src
    tar -czvf $ZIP_FILE taipy/
    cd ../../
    # remove current working dir
    rm -rf build/src/taipy
}

# Script Execution
cp -fR build/src/taipy/. build/taipy-temp
rm -rf build/src/taipy

for VERSION in "${POTENTIAL_VERSIONS[@]}"; do
    if command -v "python$VERSION" &> /dev/null; then
        compile "python$VERSION" "taipy-designer-$VERSION.tar.gz"
    fi
done

rm -rf build/taipy-temp

find build/src -name '*.py' -delete
