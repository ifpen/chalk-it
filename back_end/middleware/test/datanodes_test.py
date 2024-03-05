import pickle

from chalkit_python_api import PICKLE_MIME
from chalkit_python_api.datanodes import DataNodesProxy
from chalkit_python_api.outputs import bytes_to_b64


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
