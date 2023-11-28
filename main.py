# Should become the main entry point
# shoud import server.py ....
# should handle commande line arguements

import os

current_directory = os.getcwd()
directory_name = os.path.basename(current_directory)

if directory_name == 'chlkt':
    # Poduction mode
    from app.server import Main
else:
    # Developpe mode
    from back_end.app.server import Main

if __name__ == "__main__":
    Main.main()