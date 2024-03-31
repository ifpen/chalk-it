from taipy.gui import Gui
from taipy_designer import *

gui = Gui()

# Open the file in read mode ('r')
with open('sample.html', 'r') as file:
    # Read the content of the file into a string
    html_content = file.read()


page = ChalkitPage("html_doc.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)