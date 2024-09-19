# Basic displays

Basic widgets typically perform display of numeric values. 

## Value display

**Value display** is a generic display widget, which is intended to operate on primitive datatypes string and number.

Among its parameters (in tab, "Graphical Properties") :

- decimalDigits : decimal precision of number. Default value is 3

## KPI display

Is card-like display.

## Real-time KPI display

Like KPI display, but also provides a memory graph of past values.

Examples :

* [advanced-kpi-py.xprjson](basic/advanced-kpi-py.xprjson)
* [advanced-kpi-js.xprjson](basic/advanced-kpi-js.xprjson)

## Status led

For displaying binary status (on/off)

## Progress bar

Enables to display a progress over a range. See example :

* [progress-bar.xprjson](basic/progress-bar.xprjson)

## Full-circular, semi-circular or arch-circular gauges

Are adapted for displaying score values, that have a well defined min/max range.

The other widgets are adapted for real-time display:

* **Status led** : for displaying binary status (on/off)

More advance displays (like [Label](wdg-annotation-video.md#label), [Markdown](wdg-annotation-video.md#markdown) or [HTML](wdg-annotation-video.md#html)) can be found in the [Annotation & Video] category.

