from taipy.gui import Gui
from taipy.designer import *

gui = Gui()

# Open the file in read mode ('r')
with open('sample.html', 'r') as file:
    # Read the content of the file into a string
    html_content = file.read()


page = DesignerPage("html_doc.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)