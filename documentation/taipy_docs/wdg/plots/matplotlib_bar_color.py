from taipy.gui import Gui
from taipy_designer import *
import matplotlib.pyplot as plt
import numpy as np

import matplotlib.colors as colors

gui = Gui()

import matplotlib.pyplot as plt

fig, ax = plt.subplots()

fruits = ['apple', 'blueberry', 'cherry', 'orange']
counts = [40, 100, 30, 55]
bar_labels = ['red', 'blue', '_red', 'orange']
bar_colors = ['tab:red', 'tab:blue', 'tab:red', 'tab:orange']

ax.bar(fruits, counts, label=bar_labels, color=bar_colors)

ax.set_ylabel('fruit supply')
ax.set_title('Fruit supply by kind and color')
ax.legend(title='Fruit color')

page = DesignerPage("matplotlib_bar_color.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)