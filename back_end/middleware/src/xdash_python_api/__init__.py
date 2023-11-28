# Hack for matplotlib
# Its default backend with pyodide does not work en web workers.
# This provides a usable default out of the box without loading the package.
import os
os.environ["MPLBACKEND"] = "SVG"

PICKLE_MIME = 'application/x-python-pickle'
