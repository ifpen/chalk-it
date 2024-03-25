Chalk'it lite is the ideal companion for quickly building a GUI on top of a Taipy application.


The development of a web-application with Chalk'it lite is based on the following concepts:

- Widget: Graphic object defined by a rectangle in the HTML page for User interface. It interacts with the workspace via connection points called actuators. Actions are as diverse as clicking a button, entering text or numeric values, scrolling cursors, selecting items from drop-down lists. Widgets allow complex visualizations thanks to the integrated libraries, such as Plotly.js, Charts, Vega (JavaScript) or Plotly and Matplotlib (both Python). Methods for visualizing data on maps based on Leaflet.js are also added.
- Connection: Notion defining the link between a widget (via its actuator) and a DataNode.
- Document: JSON document describing the whole working model including the Chalk'it lite dashboard. The document has the extension xprjson, and is similar to the ipynb format of Jupyter notebooks.
- Page: The result of the xprjson document is an HTML page that contains the dashboard. This page is the web application. It can be hosted on a static page server and shared thanks to its link to considerably facilitate exchanges. A Chalk'it lite page is an HTML file which includes the xprjson document file and its associated JavaScript and CSS runtime libraries.
