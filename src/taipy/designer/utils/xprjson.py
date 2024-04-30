# © 2021-2024, Avaiga Pte Ltd. All Rights Reserved. The use of the Taipy software and any part thereof is governed by
# Avaiga Pte Ltd’s Software License and Maintenance Agreement. Unauthorised use, reproduction and modification is
# strictly not allowed.

from datetime import datetime
import pytz


def _get_date_time():
    # Choose the timezone
    timezone = pytz.timezone("Europe/Paris")
    current_time = datetime.now(timezone)
    # Return the date and time in ISO 8601 format
    return current_time.isoformat()


def _remove_extension(filename, extension=".xprjson"):
    if filename.endswith(extension):
        return filename[: -len(extension)]
    return filename


def update_xprjson(xprjson, name):
    xprjson["meta"]["date"] = _get_date_time()
    xprjson["meta"]["name"] = _remove_extension(name)

    return xprjson
