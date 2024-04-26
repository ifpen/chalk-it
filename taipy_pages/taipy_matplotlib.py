import sys
import matplotlib.pyplot as plt
import io, base64
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))
from src.taipy.designer import *

# End user code starts here
fig, ax = plt.subplots()

fruits = ["apple", "blueberry", "cherry", "orange"]
counts = [40, 100, 30, 55]
bar_labels = ["red", "blue", "_red", "orange"]
bar_colors = ["tab:red", "tab:blue", "tab:red", "tab:orange"]

ax.bar(fruits, counts, label=bar_labels, color=bar_colors)
ax.set_ylabel("fruit supply")
ax.set_title("Fruit supply by kind and color")
ax.legend(title="Fruit color")

buf = io.BytesIO()
fig.savefig(buf, format="png")
buf.seek(0)
img_str = "data:image/png;base64," + base64.b64encode(buf.read()).decode("UTF-8")

page = DesignerPage("taipy_matplotlib.xprjson", designer_mode=True)
