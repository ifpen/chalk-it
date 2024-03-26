from taipy.gui import Gui
from chlkt import *

import pandas as pd
import numpy as np
from datetime import datetime
import random

gui = Gui()

# Generate date range
start_date = "2020-06-02"  # Note: months in Python are 1-12, unlike JavaScript's 0-11
end_date = datetime.now().strftime("%Y-%m-%d")
date_range = pd.date_range(start=start_date, end=end_date, freq='D')

# Generate log-normal values
# Adjusted to achieve a similar distribution as d3.randomLogNormal(3, 2.2)
mu, sigma = 3, 2.2
values = np.random.lognormal(mean=np.log(mu ** 2 / np.sqrt(sigma ** 2 + mu ** 2)), 
                             sigma=np.sqrt(np.log(1.0 + (sigma ** 2 / mu ** 2))), 
                             size=len(date_range))

# Format dates and combine with values
table_for_calendar = [{"date": d.strftime("%Y-%m-%d"), "value": val} for d, val in zip(date_range, values)]

# Shuffle the list
values_shuffled = random.sample(table_for_calendar, len(table_for_calendar))

# Create the final object
calendar_values_object = {
    "start": start_date,
    "end": end_date,
    "values": values_shuffled
}

# If needed, print or use `calendar_values_object`

selected_date = "2020-06-02"

page = ChalkitPage("15_year_calendar.xprjson")
gui.add_page("page", page)
gui.run(run_browser=True, use_reloader=False)