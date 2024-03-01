import json
import os
import inspect

class Page:
    def __init__(self, filename):
        # Get the path of the script that is creating an instance of this class
        caller_file = inspect.stack()[1].filename
        caller_dir = os.path.dirname(caller_file)

        self.filepath = os.path.join(caller_dir, filename)

        if not os.path.exists(self.filepath):
            # Create the file if it does not exist
            with open(self.filepath, 'w') as file:
                json.dump({}, file)
        else:
            # Open the file for further processing
            with open(self.filepath, 'r') as file:
                self.data = json.load(file)

    # Additional methods for processing the file can be added here
