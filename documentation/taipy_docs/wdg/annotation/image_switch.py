from PIL import Image
import os

from taipy.gui import Gui
from taipy.designer import Page

# Get the directory of the current Python script
dir_path = os.path.dirname(os.path.abspath(__file__))

# Build the absolute path to the image
setosa_path = os.path.join(dir_path, "Kosaciec_szczecinkowaty_Iris_setosa.jpg")
virginica_path = os.path.join(dir_path, "Iris_virginica.jpg")
versicolor_path = os.path.join(dir_path, "1280px-Iris_versicolor_3.jpg")

iris_flower_types = ["Setosa", "Virginica", "Versicolor"]

setosa = Image.open(setosa_path)
virginica = Image.open(virginica_path)
versicolor = Image.open(versicolor_path)

image_to_dispaly = setosa

selected_flower_type = "Setosa"


def on_change(state, var, val):
    if var == "selected_flower_type":
        if val == "Setosa":
            state.image_to_dispaly = setosa
        elif val == "Virginica":
            state.image_to_dispaly = virginica
        elif val == "Versicolor":
            state.image_to_dispaly = versicolor


gui = Gui()
page = Page("image_switch.xprjson")
gui.add_page("page", page)
gui.run(design=True, run_browser=True, use_reloader=False)
