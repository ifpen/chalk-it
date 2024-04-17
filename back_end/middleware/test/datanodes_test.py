# Copyright 2023-2024 IFP Energies nouvelles
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.


import pickle

from chalkit_python_api import PICKLE_MIME
from chalkit_python_api.datanodes import DataNodesProxy
from chalkit_python_api.utils import bytes_to_b64


def test_datanode_proxy_should_unpickle_only_once():
    pickled_dic = {
        "content": bytes_to_b64(pickle.dumps({})),
        "type": PICKLE_MIME,
        "isBinary": True,
    }
    proxy = DataNodesProxy({"x": pickled_dic})
    x = proxy["x"]
    assert x == {} and x is proxy["x"]


def test_datanode_proxy_should_not_unpickle_when_not_asked():
    pickled_dic = {
        "content": bytes_to_b64(pickle.dumps({})),
        "type": PICKLE_MIME,
        "isBinary": True,
    }
    proxy = DataNodesProxy({"x": pickled_dic}, transform=False)
    assert proxy["x"] == pickled_dic
