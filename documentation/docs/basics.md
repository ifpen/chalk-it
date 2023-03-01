Chalk'it features a synchronous/reactive real-time and multi-rhythm execution engine, which is the “leader orchestra” of the execution of calculations and interactions. It also features an intuitive designer dashboards by simple drag&drop.

The development of a web-application with Chalk'it is based on the following concepts:

- Workspace: Concept analogous to the workspace of Matlab or IPython. It contains JSON or Python objects that have a given state and are accessible to other tool entities.
- DataNode: Concept analogous to a cell of a Notebook Jupyter. It can be seen as a function which should produce a JSON result or a Python object (only for the Pyodide dataNode). DataNodes can also have an execution period.
- “dataNodes” keyword: Concept for creating a dataflow between dataNodes (aka nodes). It is used inside a script-like DataNode to express a data and execution dependency with a predecessor node.
- Execution graph: Dependency relationships defined by the “dataNodes” keyword that organize the application logic. User actions on widgets trigger the execution of the concerned dataflow.
- Widget: Graphic object defined by a rectangle in the HTML page for User interface. It interacts with the workspace via connection points called actuators. Actions are as diverse as clicking a button, entering text or numeric values, scrolling cursors, selecting items from drop-down lists. Widgets allow complex visualizations thanks to the integrated libraries, such as Plotly.js, Charts, Vega (JavaScript) or Plotly and Matplotlib (both Python). Methods for visualizing data on maps based on Leaflet.js are also added.
- Connection: Notion defining the link between a widget (via its actuator) and a DataNode.
- Document: JSON document describing the whole working model including the Chalk'it dashboard. The document has the extension xprjson, and is similar to the ipynb format of Jupyter notebooks.
- Page: The result of the xprjson document is an HTML page that contains the dashboard. This page is the web application. It can be hosted on a static page server and shared thanks to its link to considerably facilitate exchanges. A Chalk'it page is an HTML file which includes the xprjson document file and its associated JavaScript and CSS runtime libraries.
