import typing

from chalkit_python_api import PICKLE_MIME


class DataNodesProxy:
    _values: typing.Dict[str, any]
    _cache: typing.Dict[str, any]
    _transform: bool

    def __init__(self, data: typing.Dict[str, any], transform: bool = True):
        self._transform = transform
        self._values = {k: v for k, v in data.items()}
        self._cache = {}

    def __getitem__(self, key: str) -> typing.Optional[any]:
        if key in self._cache:
            return self._cache[key]

        if key in self._values:
            value = self._values[key]

            if self._transform:
                if (
                    isinstance(value, dict)
                    and 'type' in value
                    and 'isBinary' in value
                    and 'content' in value
                    and value['type'] == PICKLE_MIME
                    and value['isBinary']
                    and isinstance(value['content'], str)
                ):
                    from base64 import standard_b64decode
                    from pickle import loads

                    data = standard_b64decode(value['content'])
                    value = loads(data)

                self._cache[key] = value

            return value
        else:
            return None
