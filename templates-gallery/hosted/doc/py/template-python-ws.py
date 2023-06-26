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