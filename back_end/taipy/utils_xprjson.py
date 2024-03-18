from datetime import datetime
import pytz

def _getDateTime():
    # Choose the timezone
    timezone = pytz.timezone('Europe/Paris')
    # Get the current date and time in the specified timezone
    current_time = datetime.now(timezone)
    # Format the date and time
    formatted_time = current_time.strftime('%a %b %d %Y %H:%M:%S GMT%z')
    # Adjust the format to include a colon in the timezone part
    formatted_time_with_colon = formatted_time[:-2] + ':' + formatted_time[-2:]

    return formatted_time_with_colon

def _remove_extension(filename, extension=".xprjson"):
    if filename.endswith(extension):
        return filename[:-len(extension)]
    return filename

def update_xprjson(xprjson, name):
    xprjson['meta']['date'] = _getDateTime()
    xprjson['meta']['name'] = _remove_extension(name)
    
    return xprjson