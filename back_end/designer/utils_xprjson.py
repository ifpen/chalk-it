# Copyright 2023-2024 IFP Energies nouvelles
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.


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