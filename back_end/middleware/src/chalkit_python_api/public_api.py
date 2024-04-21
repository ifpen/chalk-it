from typing import Any, Optional, TypedDict, Union

from chalkit_python_api.adapters import DataAdapter, ImageAdapter, JsonAdapter, OutputAdapter, PythonAdapter
from chalkit_python_api.state import ChalkitState
from chalkit_python_api.utils import JSON


class ParamValue(TypedDict):
    dsName: str
    dsVal: JSON


ParamValues = list[ParamValue]
PropertyPath = list[Union[int, str]]


class DashboardActions:
    """
    This class provides a port of the javascript API. An instance of it is provided to user scripts as
    `chalkit.dashboard`. It allows some interactions with the dashboard. Use with caution as these introduce side
    effects to data nodes executions.
    """

    def __init__(self, state: ChalkitState):
        self._state = state

    def set_variable(self, datanode_name: str, json_value: JSON) -> None:
        """
        Update the value of a dataNode.

        The change happens at the end of the evaluation of the current dataNode. This may trigger the re-evaluation
        of downstream dataNodes. Most dataNodes that are not `Variable` can't be updated.

        Args:
            datanode_name: the name of the dataNode
            json_value: the new value, must convert to JSON
        """
        self.set_variables({datanode_name: json_value})

    def set_variables(self, datanodes_values: dict[str, JSON]) -> None:
        """
        Update the value of multiple dataNodes (see `set_variable`).

        Args:
            datanodes_values: dictionary mapping dataNode names to their new values. Values must convert to JSON.
        """
        self._state.add_side_effect("setVariables", datanodes_values)

    def set_variable_property(self, datanode_name: str, property_path: PropertyPath, json_value: JSON) -> None:
        """
        Update part of the value of a dataNode (see `set_variable`).

        See the javascript version for more details.

        Args:
            datanode_name: the name of the dataNode
            property_path: Path in the old value where to set the new value. Sequence of strings (object keys) and
                           integers (array index).
            json_value: the new value to insert, must convert to JSON

        """
        self._state.add_side_effect("setVariableProperty", datanode_name, property_path, json_value)

    def execute_datanode(self, datanode_name: str) -> None:
        """
        Schedules the evaluation of a dataNode.

        This is mostly meant for dataNodes with the explicit trigger flag. This will cascade to downstream dataNodes.
        Args:
            datanode_name: the name of the dataNode
        """
        self.execute_datanodes([datanode_name])

    def execute_datanodes(self, datanode_names: list[str]) -> None:
        """
        Schedules the evaluation of multiple dataNodes (see `execute_datanode).

        Args:
            datanode_names: the names of a group of dataNodes
        """
        self._state.add_side_effect("executeDataNodes", datanode_names)

    def view_page(self, page_url: str, input_vals: Optional[ParamValues] = None, new_tab=False) -> None:
        """
        Navigates to pageUrl, setting the values of the specified dataNodes in inputVals.

        Args:
            page_url: target page URL
            input_vals: optional array of structures of type `{"dsName": "dataNodeName", "dsVal" : "dataNodeValue"}`.
                        `dsName` must be a string. `dsVal` must convert to JSON.
            new_tab: open in new tab when true
        """
        self._state.add_side_effect("viewPage", page_url, input_vals, new_tab)

    def view_project(self, project_url: str, input_vals: Optional[ParamValues] = None, new_tab=False) -> None:
        """
        Similar to `view_page`, but for projects.

        Args:
            project_url: URL of an xprjson file
            input_vals:
            new_tab: open in new tab when true
        """
        self._state.add_side_effect("viewProject", project_url, input_vals, new_tab)

    def go_to_page(self, num_page: int) -> None:
        """
        Changes the current page in constrained dashboard mode.

        Args:
            num_page: the page to display
        """
        self._state.add_side_effect("goToPage", num_page)

    def enable_widget(self, widget_name: str) -> None:
        """
        (re)enables a widget, making it interactive.

        Args:
            widget_name: the name of a widget (can be obtained by hovering over a widget in the edit mode)
        """
        self._state.add_side_effect("enableWidget", widget_name)

    def disable_widget(self, widget_name: str) -> None:
        """
        Disables a widget, making it non-interactive. All widgets are initially enabled.

        Args:
            widget_name: the name of a widget (can be obtained by hovering over a widget in the edit mode)
        """
        self._state.add_side_effect("disableWidget", widget_name)

    def show_widget(self, widget_name: str) -> None:
        """
        Makes a widget visible. All widgets are initially visible.

        Args:
            widget_name: the name of a widget (can be obtained by hovering over a widget in the edit mode)
        """
        self._state.add_side_effect("showWidget", widget_name)

    def hide_widget(self, widget_name: str) -> None:
        """
        Hides a widget. All widgets are initially visible.

        Args:
            widget_name: the name of a widget (can be obtained by hovering over a widget in the edit mode)
        """
        self._state.add_side_effect("hideWidget", widget_name)


class ChalkitApi:
    """An instance of `ChalkitApi` is provided to user scripts as `chalkit`. It can be used by scripts to interact
     with Chalk'it.

    Aside from utility fonctions, it provides a set of methods to build the script's output. The `output` method
    can be used as an alternative to a return statement. If called multiple times the results will be combined as a
    JSON array or object.

    As Chalk'it can only handle JSON data, any returned python object will be converted according to a set of
    heuristics. Lists, dicts, string and numbers will be directly mapped to their JSON equivalent; Plots from known
    libraries will be converted to images (preferably SVG); etc. As a last resort, the object will be pickled and sent
    as binary data. If this fails, an error is raised.

    The `as_*` methods can be used to force the results to use a specific conversion:

        dataframe = compute_my_data()
        return [chalkit.as_json(dataframe), chalkit.as_python(dataframe)]

    The `output_*` methods a juste conveniences to return a converted value. `chalkit.output_json(dataframe)` is the
    same as `chalkit.output(chalkit.as_json(dataframe))`.

    """

    def __init__(self, state: ChalkitState):
        self._state = state
        self._dashboard = DashboardActions(state)

    @property
    def dashboard(self) -> DashboardActions:
        return self._dashboard

    @staticmethod
    def base64_to_bytes(b64: str) -> bytes:
        """Reverts data encoded as a string using base 64 to raw `bytes`.

        All binary data moved around as JSON in Chalk'it is encoded as base 64 strings. This method is provided
        as an easy way to get the data back into a binary form.

        Parameters:
            b64: the base64 encoded string

        Returns:
            the decoded raw binary data
        """
        from base64 import standard_b64decode

        return standard_b64decode(b64)

    @staticmethod
    def as_json(value: Any) -> OutputAdapter:
        """
        This method instructs Chalk'it to convert a result to a JSON representation.

        Note:
            Technically, all data is ultimately converted to JSON. But using a plotly plot as an example, this method
            will output the plot's JSON configuration, whereas `as_image` would return an image of the plot encoded
            into JSON using base64.

        Args:
            value: a return value for the script

        Returns:
            `value` either wrapped or converted. The returned object is not intended to be used by the user's script
             but returned as it is.
        """
        return JsonAdapter(value)

    @staticmethod
    def as_python(value: Any) -> OutputAdapter:
        """
        This method instructs Chalk'it to pickle a result, the main use case being moving Python objects from a
        Python datanode to another.

        The JSON encoding used will be recognized if the value is used in another Python datanode and the object will
        be automatically un-pickled, meaning `dataNodes["previous-python-node"]` will directly evaluate to the
        un-pickled object.

        Args:
            value: a return value for the script

        Returns:
            `value` either wrapped or converted. The returned object is not intended to be used by the user's script
             but returned as it is.
        """
        return PythonAdapter(value)

    @staticmethod
    def as_image(value: Any) -> OutputAdapter:
        """
        This method instructs Chalk'it to convert the result (like a plot figure) into an image.

        Args:
            value: a return value for the script

        Returns:
            `value` either wrapped or converted. The returned object is not intended to be used by the user's script
             but returned as it is.
        """
        return ImageAdapter(value)

    @staticmethod
    def as_data(value: Any, mime_type: Optional[str] = None, name: Optional[str] = None) -> OutputAdapter:
        """
        This method instructs Chalk'it to output the result as binary data using its JSON convention.

        Object of known types, like numpy arrays, will be saved as binary data. This behavior is very discretionary.

        The most obvious use case is returning raw data from `bytes` or a `BytesIO` using Chalk'it conventions, with
        the possibility to attach a MIME type.

        The resulting JSON looks like:

            {
              "content": "ZHJncnNk",
              "isBinary": true,
              "type": "application/octet-stream",
              "name": "my_file.bin"
            }

        Only the first two fields are guarantied / necessary. The `type` is a MIME type and help datanodes and widgets
        handle the data. The `name` is often an original filename and may be used when downloading the content
        as a file.

        Args:
            value: a return value for the script
            mime_type: A MIME type to be added to the resulting JSON object.
            name: a name (usually a file name) to be added to the resulting JSON object.

        Returns:
            `value` either wrapped or converted. The returned object is not intended to be used by the user's script
             but returned as it is.
        """
        return DataAdapter(value, mime_type, name)

    def output(self, value: Any, key: Optional[str] = None) -> None:
        """
        Provides an alternative way to return data, as opposed to the `return` statement.

        Multiple calls build an array; using keys yield an object:

            # Equivalent simple returns
            chalkit.output(42)
            # Or
            return 42

            # Equivalent array returns
            chalkit.output(1)
            chalkit.output(2)
            chalkit.output(3)
            # Or
            return [1, 2, 3]

            # Equivalent object returns
            chalkit.output(1, key="a")
            chalkit.output(2, key="b")
            # Or
            return {"a": 1, "b": 2}

        Mixing `output` and `return` is an error, as is using `output` with and without keys.

        Args:
            value: a return value for the script
            key: if provided, attach `value` as the `key` attribute of a JSON object.
        """
        self._state.add_output(value, key)

    def output_json(self, value: Any, key: Optional[str] = None) -> None:
        """
        Same as `chalkit.output(chalkit.as_json(value), key)`.

        Args:
            value: a return value for the script
            key:
        """
        self._state.add_output(self.as_json(value), key)

    def output_python(self, value: Any, key: Optional[str] = None) -> None:
        """
            Same as `chalkit.output(chalkit.as_python(value), key)`.

        Args:
            value: a return value for the script
            key:
        """
        self._state.add_output(self.as_python(value), key)

    def output_image(self, value: Any, key: Optional[str] = None) -> None:
        """
        Same as `chalkit.output(chalkit.as_image(value), key)`.

        Args:
            value: a return value for the script
            key:
        """
        self._state.add_output(self.as_image(value), key)

    def output_data(self, value: Any, key: Optional[str] = None) -> None:
        """
        Same as `chalkit.output(chalkit.as_data(value), key)`.

        Args:
            value: a return value for the script
            key:
        """
        self._state.add_output(self.as_data(value), key)

    def debug(self, value: Any) -> None:
        """
        Output debug information.

        This method does nothing when not invoked while editing a script in the Python datanode editor. In the editor,
        the `value` with be displayed as conveniently as possible. This is intended to be similar to a `print`, or more
        accurately a `logger.debug(value)`, with some additional rendering, like images being displayed, etc.

        Args:
            value: the value to display
        """
        self._state.add_debug(value)

    def notify(self):
        pass
        # TODO
