# Chalk'it APIs

Chalk'it offers a set of APIs through **_chalkit_** that serve several primary purposes:

- Scheduler APIs: Facilitate the scheduling process by enabling the modification of dataNode variables and launching the scheduler.
- Dashboard APIs: Support the developpement of multi-dashboard applications and the display of widgets.
- Datanode IOs

## JavaScript and Pyodide

### Scheduler features

The main feature allows the setting of dataNode variables in a script, replicating the behavior of a user interacting with a basic input/control widget.

The assessment of these functions is handled at the end of the current scheduling instance.

#### setVariable

```JavaScript
chalkit.setVariable(dataNodeName, dataNodeValue);
```

This API sets the value _dataNodeValue_ to the dataNode identified by dataNode["_dataNodeName_"].

- dataNodeName: The name of the dataNode, must be a string.
- dataNodeValue: The value to be assigned to the dataNode, which can be any JavaScript primitive type (number, string, boolean), array or JSON.

For example, if you have a dataNode _info_person_ that contains:

```JavaScript
{
  "name": "John Doe",
  "age": "30"
}
```

To modify it by another JSON value, you can use the following code:

```JavaScript
chalkit.setVariable("info_person", {"name": "Jane Doe","age": "25"});
```

#### setVariableProperty

```JavaScript
chalkit.setVariableProperty(dataNodeName, propertyPath, dataNodeValue);
```

This API allows to modify a specific property within a dataNode (not the entire dataNode). It assigns the value _dataNodeValue_ to the specified property path: dataNode["_dataNodeName_"]._propertyPath_.

- dataNodeName: The name of the dataNode, must be a string.
- propertyPath: The path of the dataNode property to be modified, supporting JavaScript primitive types (number, string, boolean), array or JSON.
- dataNodeValue: The value to be set to the dataNode property, can be of any JavaScript primitive type (number, string, boolean), array or JSON.

For example, if you have a dataNode _info_address_ that contains:

```JavaScript
{
  "name": "personal address",
  "address": {
    "city": "New York",
    "details":{
      "street": "123 Main St",
      "zipCode": "10001",
      "country": "USA"
    }
  }
}
```

To update the value of the street property in the nested structure within _info_address_, you can use the following code:

```JavaScript
chalkit.setVariableProperty("info_person", ["address","details","street"], "West 23rd Street");
```

#### setVariables

```JavaScript
chalkit.setVariables(dataNodeNames, dataNodeValues);
```

This API sets each value _dataNodeValues[i]_ to dataNode["_dataNodeNames[i]_"], where i:0 .. length-1 of _dataNodeNames_.

- dataNodeNames: An array containing the names of dataNodes, each as a string.
- dataNodeValues: An array containing the corresponding values for the dataNodes, can be of any JavaScript primitive type (number, string, boolean), array or JSON. This array must match the size of dataNodeNames.

For example, to modify at the same time the previous dataNode _info_person_ and another dataNode _info_gender_ that contains:

```JavaScript
{"gender": "male"}
```

you can use the following code:

```JavaScript
chalkit.setVariables(["info_person","info_gender"], [{"name": "Jane Doe","age": "25"},{"gender": "female"}]);
```

#### executeDataNode

```JavaScript
chalkit.executeDataNode(dataNodeName);
```

This API allows to launch the schedule with the source node identified as _dataNodeName_ (the name of the dataNode that must be a string).

This functionality can be useful for a dataNode with [explicit trigger](../ds/ds-execution-engine/#Explicit-Trigger) flag set to true. Its execution can be explicitly triggered by this API, in addition to being triggered by an associated [push button](../wdg/wdg-basic-inputs/#push-button) widget or by clicking on the dataNode update icon ![Update](ds/img/refresh-icon.png "Update") present in the dataNodes list.

#### executeDataNodes

```JavaScript
chalkit.executeDataNodes(dataNodeNames);
```

This API is similar to _executeDataNode_, except it launches the schedule with multiple source nodes defined in the _dataNodeNames_ array, where each name is represented as a string.

### Dashboard features

The main feature allow navigation between Chalk'it pages with parameter transfer. When landing at the target page, specified dataNodes of type _Variable_ can have their initial values modified, as described below.

#### goToPage

In [constrained dashboard mode](../export/export#scaling-methods-for-the-constrained-dashboard), the method:

```JavaScript
chalkit.goToPage(pageNumber)
```

allows to show only the targed page. It is the main method for building multi-page app with custom navigation control.

#### viewPage

```JavaScript
chalkit.viewPage(pageUrl, inputVals, bNewTab)
```

Navigates to _pageUrl_, setting the values of the specified dataNodes in inputVals.

- pageUrl: target page URL
- inputVals: an array of structures of type

  ```JSON
  {"dsName": "dataNodeName", "dsVal" : "dataNodeValue"}
  ```

  dsName should be of type string. dsVal can be of any JavaScript primitive type (number, string, boolean), array or JSON.

- bNewTab: open in new tab when true.

#### viewProject

Similar to view page, but applies for projects.

```JavaScript
chalkit.viewProject(projectUrl, inputVals, bNewTab)
```

#### hideWidget

```JavaScript
chalkit.hideWidget(widgetName)
```

Hides the display of the widget.

- widgetName: the name of the widget, which can be obtained by hovering over the widget target, in the edit mode. The widget is visible by default.

#### showWidget

```JavaScript
chalkit.showWidget(widgetName)
```

Makes the display of the widget visible.

#### disableWidget

```JavaScript
chalkit.disableWidget(widgetName)
```

Disables the access of the widget. The widget is enabled by default.

#### enableWidget

```JavaScript
chalkit.enableWidget(widgetName)
```

Enables the access of the widget (interactive).

## Python

The Python API deals with input and outputs for Python scripts and also offers a port of the JavaScript API to interact with the dashboard.

### Input/ouputs helpers
::: chalkit_python_api.public_api.ChalkitApi
    options:
      show_source: false
      heading_level: 4
      show_signature_annotations: true
      show_object_full_path: false
      show_root_toc_entry: false
      separate_signature: true
      show_signature_annotations: false

### Dashboard interactions
::: chalkit_python_api.public_api.DashboardActions
    options:
      show_source: false
      heading_level: 4
      show_signature_annotations: true
      show_object_full_path: false
      show_root_toc_entry: false
      separate_signature: true
      show_signature_annotations: false
