Chalk'it lite is the ideal companion for quickly building a GUI on top of a [Taipy](https://taipy.io) application.

The development of a web-application with Chalk'it lite is based on the following concepts:

- [Widget](wdg/wdg.md): Graphic object defined by a rectangle in the HTML page for User interface. It interacts with the Python variables via connection points called [actuators](actuators.md). Actions are as diverse as clicking a button (for executing a Python function), entering text or numeric values, scrolling cursors, selecting items from drop-down lists. Widgets allow complex visualizations thanks to the integrated libraries, such as Plotly and Matplotlib (both Python). Methods for visualizing data on maps based on Leaflet.js and Folium are also available.
- Connection: Notion defining the link between a widget (via its actuator) and a variable.
- Document: JSON document describing the whole working model including the Chalk'it lite dashboard. The document has the extension `.xprjson`, and is similar to the ipynb format of Jupyter notebooks.
- Page: The result of the `.xprjson` document is an HTML page that contains the dashboard.