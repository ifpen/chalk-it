from taipy.gui import Gui
from taipy.designer import Page


# Open the file in read mode ('r')
with open('example.md', 'r') as file:
    # Read the content of the file into a string
    markdown_content = file.read()


page = Page("m_markdown.xprjson")
gui = Gui()
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)
