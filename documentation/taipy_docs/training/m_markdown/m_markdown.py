from taipy.gui import Gui
from taipy_designer import *

gui = Gui()

# Open the file in read mode ('r')
with open('example.md', 'r') as file:
    # Read the content of the file into a string
    markdown_content = file.read()


page = DesignerPage("m_markdown.xprjson", designer_mode=True)
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)