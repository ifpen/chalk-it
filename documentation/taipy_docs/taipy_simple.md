# Simple application

Let this simple Taipy application. Add Chalk'it lite (`chlkt`) import to activate it.

```python
from taipy.gui import Gui
from chlkt import *

a = 1
b = 5
c = a + b

page = ChalkitPage("sliders_value.xprjson")

gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
```

Let's save this code into `simple_app.py`.

This web-application has 3 Python variables: `a`, `b` and `c`. It simply does the addition of `a` and `b` into `c`.

It defines a Chalk'it lite page named `sliders_value.xprjson`, that will contain the GUI definition.

It creates a Gui instance from taipy.gui to host the Chalk'it lite page.

Let's run it first:

```sh
python simple_app.py
```

Chalk'it lite is automatically started on the browser at http://127.0.0.1:5000.

Let's build its GUI using drag and drop with Chalk'it lite.

Widgets are dropped in the *Widgets* main tabset to the dashboard edition zone.

![selected-widget](wdg/selected-widget.png)

Add two *Horizontal sliders* to the dashboard, from *Basic inputs & controls* category. In the same way, add a *KPI dispay* widget from *Basic Displays* category.

Dashboard shall look like this:

![connect-widget](wdg/simple-app-edit.png)

A simple click on the top-right widget's pencil will open its parameterization sidebar. This form is divided into three tabs: **Variables connection** and **Graphical properties** and **Aspect**.

![connect-widget](wdg/connect-widget.png)

Using this procedure, connect the two sliders to `a` and `b`, and the KPI dispaly to `c`.

To make our dashboard interactive, add the following `on_change` callback as follows:

```python
from taipy.gui import Gui
from chlkt import *

a = 1
b = 5
c = a + b

def on_change(state, var, val):
    if (var == "a" or var == "b"):
        state.c = state.a + state.b

page = ChalkitPage("sliders_value.xprjson")

gui = Gui()
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)
```

Your interactive dashboard is ready. Switch to preview tab to play !


![connect-widget](wdg/view-simple.png)

