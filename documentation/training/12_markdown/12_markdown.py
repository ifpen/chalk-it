from taipy.gui import Gui
from chlkt import *

gui = Gui()

# Open the file in read mode ('r')
with open('example.md', 'r') as file:
    # Read the content of the file into a string
    markdown_content = file.read()


page = ChalkitPage("12_markdown.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)