# Local prototyping with Flask

[Flask](https://flask.palletsprojects.com/) pacakge allows to simply run a Python script as a webservice. This can be easily done as illustrated below.

## Setup instructions

- Download Python 3.7.2 (or another Python version >= 3.6) from <https://www.python.org/downloads/> and install it
- Install required packages to create a web-service from your Python code

```sh
pip install flask
pip install flask_restful
pip install flask_cors
```

- Install commonly used packages for scientific computing :

```sh
pip install numpy
pip install scipy
```

If you are behind a proxy, you might need to specify it. Example :

```sh
pip --proxy our-proxy:8082  install numpy
```

## Simple template

Download this [simple template](/py/template-python-ws.py) and save it to *template-python-ws.py* file.

```python
from flask import Flask, request
from flask_restful import Resource, Api
from flask_cors import CORS
import json
import numpy as np

app = Flask(__name__)
CORS(app)
api = Api(app)

class Test(Resource):

  def post(self):

    input = json.loads(request.data)
    A = input["A"]
    B = input["B"]
    sum = np.add(A,B)
    product = np.multiply(A,B)

    output = {
      "sum": sum.tolist(),
      "product" : product.tolist()
    }

    return output

api.add_resource(Test, '/basicVect')

if __name__ == '__main__':
    app.run(debug=True)
```

then run:

```sh
python template-python-ws.py
```

your server should be listening on localhost, port 5000.

## Chalk'it project

Open the following simple Chalk'it project to test the python web-service.

* [python-webservice.xprjson](/py/xprjson/python-webservice.xprjson)
