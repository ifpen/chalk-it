# Chalk'it APIs

Chalk'it offers a set of APIs through **_chalkit_** that address several primary functionalities:

- Scheduler APIs: Facilitate the scheduling process by enabling the modification of dataNode variables and triggering the scheduler.
- Dashboard APIs: Support the developpement of multi-dashboard applications and widget display.
- Notification APIs: Enable the creation, management, and delivery of real-time alerts and updates to users supporting both blocking (popup) and non-blocking notifications.
- Datanode IOs

## JavaScript

### Scheduler features

The main feature allows the setting of dataNode variables in a script, replicating the behavior of a user interacting with a basic input/control widget.

The assessment of these functions is handled at the end of the current scheduling instance.

#### setVariable

```JavaScript
chalkit.scheduler.setVariable(dataNodeName, dataNodeValue);
```

This API assigns the value _dataNodeValue_ to the dataNode identified by dataNode["_dataNodeName_"].

- dataNodeName _(string)_: The name of the dataNode.
- dataNodeValue: The value to be assigned to the dataNode, which can be any JavaScript primitive type (number, string, boolean), array or JSON.

For example, to update the following dataNode named _info_person_:

```JavaScript
{
  "name": "John Doe",
  "age": "30"
}
```

Use this code:

```JavaScript
chalkit.scheduler.setVariable("info_person", {"name": "Jane Doe","age": "25"});
```

#### setVariableProperty

```JavaScript
chalkit.scheduler.setVariableProperty(dataNodeName, propertyPath, dataNodeValue);
```

This API allows to modify a specific property within a dataNode (not the entire dataNode). It assigns the value _dataNodeValue_ to the specified property path: dataNode["_dataNodeName_"]._propertyPath_.

- dataNodeName _(string)_: The name of the dataNode.
- propertyPath _(array|string)_: The path to the property to be modified, supporting nested structures.
- dataNodeValue: The value to be set to the dataNode property, can be of any JavaScript primitive type (number, string, boolean), array or JSON.

For example, given this dataNode named _info_address_:

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
chalkit.scheduler.setVariableProperty("info_person", ["address","details","street"], "West 23rd Street");
```

#### setVariables

```JavaScript
chalkit.scheduler.setVariables(dataNodeNames, dataNodeValues);
```

This API sets each value _dataNodeValues[i]_ to dataNode["_dataNodeNames[i]_"], where _i:0 .. length-1_ of _dataNodeNames_.

- dataNodeNames _(array)_: An array of dataNode names.
- dataNodeValues _(array)_: An array of values, matching the order and size of dataNodeNames.

For example, to update _info_person_ and another dataNode _info_gender_:

```JavaScript
{"gender": "male"}
```

you can use the following code:

```JavaScript
chalkit.scheduler.setVariables(["info_person","info_gender"], [{"name": "Jane Doe","age": "25"},{"gender": "female"}]);
```

#### executeDataNode

```JavaScript
chalkit.scheduler.executeDataNode(dataNodeName);
```

This API triggers the scheduler with the source node identified as _dataNodeName_ (the name of the dataNode that must be a string).

This functionality can be useful for a dataNode with [explicit trigger](ds/ds-execution-engine.md#explicit-trigger) flag set to true. Its execution can be explicitly triggered by this API, in addition to being triggered by an associated [push button](wdg/wdg-basic-inputs.md#push-button) widget or by clicking on the dataNode update icon ![Update](ds/img/refresh-icon.png "Update") present in the dataNodes list.

#### executeDataNodes

```JavaScript
chalkit.scheduler.executeDataNodes(dataNodeNames);
```

This API is similar to _executeDataNode_, except it launches the schedule with multiple source nodes defined in the _dataNodeNames_ array, where each name is represented as a string.

### Dashboard features

The main feature allow navigation between Chalk'it pages with parameter transfer. When landing at the target page, specified dataNodes of type _Variable_ can have their initial values modified, as described below.

#### goToPage

The method:

```JavaScript
chalkit.dashboard.goToPage(pageNumber)
```

allows to show only the targed page. It is the main method for building multi-page app with custom navigation control.

- pageNumber _(number)_: The target page number.

#### viewPage

```JavaScript
chalkit.dashboard.viewPage(pageUrl, inputVals, bNewTab)
```

Navigates to _pageUrl_, setting the values of the specified dataNodes in _inputVals_.

- pageUrl _(string)_: The URL of the target page.
- inputVals _(array)_: An array of objects with structure.

  ```JSON
  {"dsName": "dataNodeName", "dsVal" : "dataNodeValue"}
  ```

  _dsName_ should be of type string. _dsVal_ can be of any JavaScript primitive type (number, string, boolean), array or JSON.

- bNewTab _(boolean)_: Opens the page in a new tab if true.

#### viewProject

Similar to view page, but applies for projects.

```JavaScript
chalkit.dashboard.viewProject(projectUrl, inputVals, bNewTab)
```

#### hideWidget

```JavaScript
chalkit.dashboard.hideWidget(widgetName)
```

Hides the display of the widget.

- widgetName _(string)_: The name of the widget, which can be obtained by hovering over the widget target, in the edit mode. The widget is visible by default.

#### showWidget

```JavaScript
chalkit.dashboard.showWidget(widgetName)
```

Makes the display of the widget visible.

#### disableWidget

```JavaScript
chalkit.dashboard.disableWidget(widgetName)
```

Disables the interaction with a widget. The widget is enabled by default.

#### enableWidget

```JavaScript
chalkit.dashboard.enableWidget(widgetName)
```

Enables the interaction with a widget.

### Notification features

These features facilitate the creation and delivery of blocking and non-blocking notifications, supporting various types such as error, success, info, and warning.

### swalert

```JavaScript
chalkit.notification.swalert(title, message, type)
```

Creates and displays a blocking notification using the SweetAlert library:

![sweet alert](ds/img/sweet-alert.PNG "swalert")

- title _(string)_: The title of the notification.
- message _(string)_: The content of the notification message.
- type _(string)_: The type of the notification. Accepted values are "error", "success", "warning", or "info".

### notify

```JavaScript
chalkit.notification.notify(dataNodeName, message, type)
```

Creates and displays a non-blocking notification, which will appear in the notification window under the bell icon ![bell icon](ds/img/bell-icon.PNG "bell icon
"):

![Notification window](ds/img/notify-window.PNG "Notify window")

- dataNodeName _(string)_: The name of the associated dataNode. If dataNodeName is undefined or an empty string, the script source where the API is called will be used as the default.
- message _(string)_: The content of the notification message.
- type _(string)_: The type of the notification. Accepted values are "error", "success", "warning", or "info".

## Python

The Python API deals with input and outputs for Python scripts and also offers a port of the JavaScript API to interact with the scheduler and the dashboard.

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

### Scheduler interactions

::: chalkit_python_api.public_api.SchedulerActions
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

### Notification interactions

::: chalkit_python_api.public_api.NotificationActions
options:
show_source: false
heading_level: 4
show_signature_annotations: true
show_object_full_path: false
show_root_toc_entry: false
separate_signature: true
show_signature_annotations: false
