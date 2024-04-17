from collections.abc import Callable
from io import BytesIO


def bytes_to_b64(data: bytes) -> str:
    from base64 import standard_b64encode

    return standard_b64encode(data).decode('ascii')


def with_io(fct: Callable[[BytesIO], None]) -> bytes:
    buffer = BytesIO()
    fct(buffer)
    return buffer.getvalue()
