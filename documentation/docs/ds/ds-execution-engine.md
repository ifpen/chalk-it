# Execution engine

Chalk'it execution engine implements a synchronous/reactive scheduling algorithm.

DataNode instances are the nodes of a direct acyclic graph where edges are data dependencies. They each own a _status_ describing their latest execution state. _Last update_ time indicates the time of the last successful execution.

## DataNodes status

May have one of the following values :

- _None_ : execution of the dataNode has not happened yet.
- _Pending_ : execution of the dataNode is pending. This happens when a web-service call takes some time to complete.
- _OK_ : last execution of the dataNode has completed sucessfully.
- _Error_ : last execution has completed with error.

## Execution rules

- DataNode is executed if and only if all its predecessors completed their execution with an _OK_ status.
- Every time a dataNode is succesfully computed (status "OK"), it triggers the execution of all its successors.
- Graph execution is interrupted at dataNodes with an _Error_ status. Their successors are not executed.

## Scheduling instance

- At first start, graph is scheduled in a breadth-first order starting from source nodes. This is the first schedule instance.
- Some dataNodes might be updated through different ways : widget value written to dataNode, file imported into dataNode, formula modification, user refresh ![Update](img/refresh-icon.png "Update") of dataNode, [periodic behavior](../ds/ds-execution-engine/#Sample-Time), [chalkit scheduler API](../../chalkitapi/#sScheduler-features) ... Such update launches the execution of the corresponding dataNode and a new scheduling instance.

## Execution flow control parameters

The graph execution is controlled by the execution flow control parameters specified in dataNodes.

### Auto Start

When set to _false_, the associated dataNode is not executed on first execution of the dashboard nor in subsequent ones.

Otherwise, i.e. when set to _true_, default dataNodes execution behavior applies: all nodes are executed by the Chalk'it runtime when all their predecessors successfully completed.

For example, **Auto Start** can be set to _false_ to avoid executing a heavy computation web-service at project load.

Default value is true.

### Sample Time

- When different from 0, the dataNode is executed every _sample time_. It's useful for ensuring a periodic real-time execution behavior.
- Every time a non null sample time is defined, the execution engine computes the greatest common divisor and use it as a its base timer.

Sample time is expressed in seconds and must be a multiple of 0.1s. Default value is 0.

### Explicit Trigger

- When set to _true_, the dataNode, in terms of execution flow control, is considered as a source node. It is no longer executed when a direct predecessor is updated. With this setting, it is only executed when it is explicitly triggered by an associated [push button](../../wdg/wdg-basic-inputs/#push-button) widget, by [chalkit scheduler APIs](../../chalkitapi/#Scheduler-features), or by a click on the dataNode refresh icon ![Update](img/refresh-icon.png "Update") present in the dataNodes list of tabs 1 or 3. Please refer to the [Triggered POST](../../ds/ds-reference/#triggered-post) example above.
- Otherwise (i.e. when set to _false_), default dataNodes execution behavior applies. Useful for implementing a form-like behavior (setting independently all required dataNode inputs, without executing it with each update, then explicitly triggering its execution).

Default value is false.

When a direct predecessor is updated, the dataNode, with an Explicit Trigger set to _true_ and a previous succesfull computation (status _"OK"_), triggers the execution of all its successors.

### Execution flow control parameters : summary

The table below summarizes the _execution flow control parameters_ for the currently available dataNode types in Chalk'it. The checkbox in the table indicates that the property can be customized by the user (true or false). Otherwise, they have the default value indicated above.

| Type                                                                       |     Auto Start     |    Sample Time     |  Explicit Trigger  |
| -------------------------------------------------------------------------- | :----------------: | :----------------: | :----------------: |
| [Variable](../../ds/ds-basics/#variable)                                   |                    |                    |                    |
| [Python Script](../../ds/ds-reference/#python-script)    | :heavy_check_mark: |                    | :heavy_check_mark: |
| [JavaScript Script (client-side)](../../ds/ds-reference#javascript-script) | :heavy_check_mark: |                    | :heavy_check_mark: |
| [REST web-service](../../ds/ds-reference/#rest-web-services)               | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |
| Generic text file reader                                                   |                    |                    |                    |
| Generic binary file reader                                                 |                    |                    |                    |
| [CSV file reader](../../ds/ds-reference/#csv-file-reader)                  |                    |                    |                    |
| [CSV file player](../../ds/ds-reference/#csv-file-player)                  |                    | :heavy_check_mark: |                    |
| Unzip file                                                                 |                    |                    |                    |
| [Geolocation](../../ds/ds-reference/#geolocation)                          |                    |                    |                    |
| [Clock](../../ds/ds-reference/#clock)                                      | :heavy_check_mark: | :heavy_check_mark: |                    |
| [Delay](../../ds/ds-reference/#delay)                                      |                    |                    |                    |
| [Memory](../../ds/ds-reference/#memory)                                    |                    |                    |                    |
| MQTT                                                                       |                    |                    |                    |
| [WebSocket receive](../../ds/ds-reference/#websocket-receive)              | :heavy_check_mark: |                    |                    |
| [WebSocket send](../../ds/ds-reference/#websocket-send)                    | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: |

Depending on the _execution flow control parameters_ and the the data flow dependency, the dataNode execution is summarized in the following tables:

**For nonperiodic dataNodes (Sample Time == 0)**

| Cases | Auto Start | Explicit Trigger | Run at project load | Run after predecessor update | Run after a user trigger\* |
| :---: | :--------: | :--------------: | :-----------------: | :--------------------------: | :------------------------: |
|  1#   |  `False`   |     `False`      |         No          |             Yes              |            Yes             |
|  2#   |   `True`   |     `False`      |         Yes         |             Yes              |            Yes             |
|  3#   |  `False`   |      `True`      |         No          |              No              |            Yes             |
|  4#   |   `True`   |      `True`      |         Yes         |       No (last value)        |            Yes             |

\*By an associated [push button](../../wdg/wdg-basic-inputs/#push-button) widget, by a click on the dataNode update icon ![Update](img/refresh-icon.png "Update"), or by using [executeDataNode API](../../chalkitapi/#executeDataNode).

**For periodic dataNodes (Sample Time > 0)**

| Cases    | Auto Start    | Explicit Trigger | Run at project load | Run after predecessor update | Run after a user trigger\* |
| :------: | :-----------: | :--------------: | :-----------------: | :--------------------------: | :------------------------: |
| 5#       | `False`       | `False`          | No                  | Yes                          | Yes                        |
| 6#       | `True`        | `False`          | Yes                 | Yes                          | Yes                        |
| 7#       | `False`       | `True`           | No                  | No                           | Yes**                      |
| 8#       | `True`        | `True`           | Yes                 | No (last value)              | Yes**                      |

\*\*For cases 7# and 8#, when the user explicitly triggers the periodic dataNode, the _Explicit Trigger_ option is turned to `False`.

## DataNodes capabilities

In addition to execution flow control parameters, dataNodes may have common capabilites depending on their type.

### setInput with formula

Python or JavaScript code can be written to define input to dataNode computation.

### setValue from widget

Currently only [Variable](../../ds/ds-basics/#variable) and [Memory](../../ds/ds-basics/#memory) dataNodes have this property. It indicates that their workspace value can be modified by widgets that have write capabilities (such as sliders ([horizontal slider](../../wdg/wdg-basic-inputs/#horizontal-slider) ...), [value](../../wdg/wdg-basic-inputs/#value), editable [table](../../wdg/wdg-basic-inputs/#table) ...).

### setValue from file

The value of the dataNode can be assigned from a file. See example in [Push button](../../wdg/wdg-basic-inputs/#push-button).

### setValue from script

Python or JavaScript code can be written to define input to [Variable](../../ds/ds-basics/#variable) and [Memory](../../ds/ds-basics/#memory) dataNodes, using chalkit API functions:

- [setVariable](../../chalkitapi/#setVariable)
- [setVariableProperty](../../chalkitapi/#setVariableProperty)
- [setVariables](../../chalkitapi/#setVariables)

This is useful to init and reset variables. See example [reset-counter.xprjson](/ds/xprjson/reset-counter.xprjson).

The assessment of these functions is handled at the end of the current scheduling instance.

### DataNodes capabilities : summary

The table below summarizes currently available dataNodes in Chalk'it, as well as their major properties in terms of _execution flow_ and _data flow_.

| Type                                                                    | setInput with formula | setValue from widget | setValue from file | setValue from script |
| ----------------------------------------------------------------------- | :-------------------: | :------------------: | :----------------: | :------------------: |
| [Variable](../../ds/ds-basics/#variable)                                |                       |  :heavy_check_mark:  | :heavy_check_mark: |                      |
| [Python Script](../../ds/ds-reference/#python-script) |  :heavy_check_mark:   |                      |                    |  :heavy_check_mark:  |
| [JavaScript Script (client-side)](../../ds/ds-basics#javascript-script) |  :heavy_check_mark:   |                      |                    |  :heavy_check_mark:  |
| [REST web-service](../../ds/ds-basics)                                  |  :heavy_check_mark:   |                      |                    |  :heavy_check_mark:  |
| Generic text file reader                                                |                       |                      | :heavy_check_mark: |                      |
| Generic binary file reader                                              |                       |                      | :heavy_check_mark: |                      |
| [CSV file reader](../../ds/ds-reference/#csv-file-reader)               |                       |                      | :heavy_check_mark: |                      |
| [CSV file player](../../ds/ds-reference/#csv-file-player)               |                       |                      | :heavy_check_mark: |                      |
| Unzip file                                                              |                       |                      | :heavy_check_mark: |                      |
| [Geolocation](../../ds/ds-reference/#geolocation)                       |                       |                      |                    |                      |
| [Clock](../../ds/ds-reference/#clock)                                   |                       |                      |                    |                      |
| [Delay](../../ds/ds-reference/#memory)                                  |                       |                      |                    |                      |
| [Memory](../../ds/ds-reference/#delay)                                  |                       |                      |                    |
| MQTT                                                                    |                       |                      |                    |                      |
| [WebSocket receive](../../ds/ds-reference/#websocket-receive)           |                       |                      |                    |                      |
| [WebSocket send](../../ds/ds-reference/#websocket-send)                 |  :heavy_check_mark:   |                      |                    |                      |
