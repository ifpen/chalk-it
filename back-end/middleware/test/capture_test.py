import json

from xdash_python_api.outputs import capture


def test_capture():
    @capture
    def script(dataNodes, xdash):
        return 42

    result_json = script("{}")
    print(result_json)
    result = json.loads(result_json)
    assert result["result"] == 42
