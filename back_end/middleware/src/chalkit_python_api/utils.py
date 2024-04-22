from collections.abc import Callable
from io import BytesIO
from typing import Any, TypeAlias

# Ideal typing, but does not pass validation. Recheck when updating python version.
# JSON: TypeAlias = dict[str, "JSON"] | list["JSON"] | str | int | float | bool | None

# Inexact but usable typing. But does not play well with mkdoc and result is impossible to read.
# JSON: TypeAlias = dict[str, Any] | list[Any] | str | int | float | bool | None
JSON: TypeAlias = Any


def bytes_to_b64(data: bytes) -> str:
    from base64 import standard_b64encode

    return standard_b64encode(data).decode('ascii')


def with_io(fct: Callable[[BytesIO], None]) -> bytes:
    buffer = BytesIO()
    fct(buffer)
    return buffer.getvalue()
