import typing


class DataNodesProxy:
    _values: typing.Dict[str, any]

    def __init__(self, data: typing.Dict[str, any], transform: bool = True, proxy: bool = True):
        # TODO transforms
        # TODO proxy
        self._values = {k: v for k, v in data.items()}

    def __getitem__(self, key: str) -> any:
        return self._values[key]
