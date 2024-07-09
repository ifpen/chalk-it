from io import StringIO
from typing import Any, Literal, Optional, TypedDict, Union

from chalkit_python_api.utils import JSON

ActionsName = Literal[
    "scheduler.setVariables",
    "scheduler.setVariableProperty",
    "scheduler.executeDataNodes",
    "dashboard.viewPage",
    "dashboard.viewProject",
    "dashboard.goToPage",
    "dashboard.enableWidget",
    "dashboard.disableWidget",
    "dashboard.showWidget",
    "dashboard.hideWidget",
    "notification.notify",
    "notification.swalert",
]


class SideEffect(TypedDict):
    name: ActionsName
    args: list[JSON]


class ChalkitState:
    capture_io: tuple[StringIO, StringIO]
    debug_data: list[Any]
    side_effects: list[SideEffect]

    def __init__(self, debug, capture_io):
        self._results = None
        self.debug_data = []  # primitives/json, images, -> str
        self.debug = debug
        self.capture_io = capture_io
        self.side_effects = []

    def add_side_effect(self, name: ActionsName, *args: JSON):
        self.side_effects.append({"name": name, "args": list(args)})

    def _result_as_dict(self) -> dict[str, Any]:
        if self._results:
            if isinstance(self._results, list):
                raise RuntimeError("There are positional outputs")
            else:
                return self._results
        else:
            self._results = {}
            return self._results

    def _result_as_list(self) -> list[Any]:
        if self._results:
            if isinstance(self._results, dict):
                raise RuntimeError("There are keyed outputs")
            else:
                return self._results
        else:
            self._results = []
            return self._results

    def results(self) -> Optional[Union[dict[str, Any], list[Any]]]:
        return self._results

    def add_output(self, value: Any, key: Optional[str] = None) -> None:
        if key:
            self._result_as_dict()[str(key)] = value
        else:
            self._result_as_list().append(value)

    def add_debug(self, value: Any) -> None:
        if self.debug:
            self.debug_data.append(value)
