from taipy.gui import Gui
import sys
from pathlib import Path

# Add the parent directory of `back_end` to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *
from PIL import Image, ImageOps

gui = Gui()

# def convert_to_grayscale(image, intensity):
#     """Convert an image to grayscale with a given intensity."""
#     if intensity < 0:
#         intensity = 0
#     if intensity > 1:
#         intensity = 1
#     return ImageOps.grayscale(image).point(lambda x: x * intensity + 255 * (1 - intensity))

# image = Image.open("XN_Fruehjahrswiese_00.jpg")

# greyscale_intensity = 0

# def on_change(state, var, val):
#     if (var=="greyscale_intensity"):
#         state.image = convert_to_grayscale(state.image, val)

page = ChalkitPage("09_pillow_image.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)