# Contributor guide

## Setup

For Python setup, run:

```sh
pip install -r requirements.txt

# For pipenv
pipenv install --dev
# Activating pipenv shell
pipenv shell
```

See also: 

- [front-end setup](./front-end/README.md)
- [front-end contributor guide](./front-end/CONTRIBUTING.md)

## Debug

```sh
cd front-end
npm start
python server.py
```

## Build

```sh
python build.py
```

tar.gz build result will be placed on the *./build/dist* directory.


