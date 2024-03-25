# Basic inputs and controls

**Basic inputs and controls** widgets allow the dashboard end-user to set numeric values (such as [Horizontal slider](#horizontal-slider) or [Numeric input](#numeric-input) widgets), binary values (such as [Checkbox](#checkbox) or [Switch](#switch) widgets) or text values (such as [Text input](#text-input) widget). More complex ones operate on lists or arrays (like [select](#select) or [list](#list)). Some examples are illustrated below. 

All these widgets can only be connected to a dataNode-types with [setValue from widget](../../ds/ds-execution-engine/#setvalue-from-widget) or [setValue from file](../../ds/ds-execution-engine/#setvalue-from-file) capabilities.

## Numeric input

**Numeric input** is a numeric input widget, which is intended to operate on the primitive datatype *number*.

Among its parameters (in tab, "Graphical Properties") :

* *validationButton* : adds a validation button to the right of the widget. When the validation button is clicked, the widget content is written to the connected dataNode.
* *validationOnFocusOut* : when focus is lost, widget content is written to the connected dataNode. The default value is *true*.
* *isPassword* : hides edited text as a password
* *decimalDigits* : decimal precision of number. Default value is 3

## Text input

**text input** is a text input widget, which is intended to operate on the primitive datatype *number*.

Among its parameters (in tab, "Graphical Properties") :

* *validationButton* : adds a validation button to the right of the widget. When the validation button is clicked, the widget content is written to the connected dataNode.
* *validationOnFocusOut* : when focus is lost, widget content is written to the connected dataNode. The default value is *true*.
* *isPassword* : hides edited text as a password

## Horizontal slider

**Horizontal slider** allows to set the value of a dataNode field of primitive datatype "number", between its *min* and *max* parameters. The *step* parameter controls the slider increment value.

## Vertical slider

Similar to the [Horizontal slider](#horizontal-slider) above with a different orientation.

## Double slider

This slider has two handles, allowing to set both a *minValue* and a *maxValue* ranging between the values of *minRange* and *maxRange* parameters. When *rangeActuator* parameter is set to *true*, new *minRange* and *maxRange* actuators appear in the "Data connection" tab, enabling to set these actuators from other Python variables.

## Checkbox

**Checkbox** widget allows to set the value of a boolean dataNode field.

## Switch

Similar to [Checkbox](#checkbox)

## Simple switch

Allows to set discrete values.

## Push button

**Push button** widget has two different behaviors, depending on its *fileInput* parameter (located in "Graphical Properties" tab).

* If *fileInput* is false, the button works as a trigger for connected dataNode (i.e. when the user clicks the button, dataNode execution is forced)
* If *fileInput* is true, the button works as file reader. When the user selects a file, its content is copied to:
  * [Variable](../../ds/ds-basics/#variable)
  * [CSV file reader](../../ds/ds-reference/#csv-file-reader)
  * [CSV file player](../../ds/ds-reference/#csv-file-player)
  * Generic file reader

Examples :

* First, create a sample file Input.json with the following content

``` javascript
{
    "length": 25,
    "width": 10
}
```

Then run [buttons.xprjson](/wdg/basic/buttons.xprjson)

## Select

**Select** widget has three actuators:

* **keys**: an array describing the options that can be selected.
* **values**: an array describing the corresponding values that can be written. This actuator is optional.
* **selectedValue**: the dataNode where the selected output will be written, the selected *key* or its corresponding *value*, if an array of values has been specified.

With the following array of **keys**

``` javascript
["choice1", "choice2"]
```

and an (optional) array of **values** that the widget will output to the **selectedValue** actuator when the corresponding option is selected

``` javascript
[1, 2]
```

If **values** actuator is not specifed, the **selectedValue** will contain the value of the item selected in the **keys** array.
Otherwise, the **selectedValue** will contain the item from the **values** array corresponding to the selected key.

* [combo-box-py.xprjson](/wdg/basic/combo-box-py.xprjson)
* [combo-box-js.xprjson](/wdg/basic/combo-box-js.xprjson)

![combo-box](basic/combo-box.png)

## List

**List** widget expects a JavaScript array as its **value** input, such as :

``` javascript
["one", "two", "three"]
```

**selectedValue** specifies the data source that will contain the selected item from the list.

![list](basic/list.png)

Example :

* [list-py.xprjson](/wdg/basic/list-py.xprjson)
* [list-js.xprjson](/wdg/basic/list-js.xprjson)

## Multi-select

Example :

* [multi-select-py.xprjson](/wdg/basic/multi-select-py.xprjson)
* [multi-select-js.xprjson](/wdg/basic/multi-select-js.xprjson)

## Table

**Table** widget expects its **value** input to reference a JavaScript array, containing subarrays, all of the same dimension, such as :

``` javascript
[
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    [5, 6, 9, 11, 15, 16, 20, 20, 16, 12, 7, 5]
]
```

This array will be displayed as :

![table](tables/table.png)

Example : [table.xprjson](/wdg/tables/table.xprjson)

Table may be editable if it is connected to a [variable](../../ds/ds-basics/#variable)-type dataNode. *Editable* property can be set in a column-basis using the parameter *editableCols*. For example, if editableCols equals [0,1,2], columns 0, 1 and 2 are editable (i.e. cells in these columns, excluding headers, can be modified). The modifications will be assigned to the connected [variable](../../ds/ds-basics/#variable)-type dataNode.

Tables and editable tables may also be two dimentional.

![editable-table-2D](tables/editable-table-2D.png)

Examples : 

* [table-editable.xprjson](/wdg/tables/table-editable.xprjson)
* [editable-table-2D.xprjson](/wdg/tables/editable-table-2D.xprjson)

