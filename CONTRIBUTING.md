# Contributor guide

## Setup

For Python setup, run:

```sh
pip install -r requirements.txt
```

Front-end build setup procedure have to be done following [front-end setup](./front-end/README.md)

See also:

-   [front-end setup](./front-end/README.md)
-   [front-end contributor guide](./front-end/CONTRIBUTING.md)

## Debug

To run Chalk'it from sources, use:

```sh
cd front-end
npm start
cd ..
python main.py --dev
```

## Build

Chalk'it may be build either as a pip package or as a full front-end statically hosted web-application.

-   Build a Python package

    ```sh
    python build.py --buildtype pip
    ```

tar.gz build result will be placed on the _./build/dist_ directory.
