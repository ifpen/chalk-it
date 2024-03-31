import sys
from pathlib import Path
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *


# Define URLs and dataset names
BASE_URL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series"
CUMULATIVE = True  # Whether to use cumulative or daily numbers
DATASET_NAMES = ["time_series_covid19_deaths_global.csv"]  # Example dataset


def fetch_and_prepare_covid_data(dataset_name):
    """Fetch COVID data and return it as a pandas DataFrame."""
    url = f"{BASE_URL}/{dataset_name}"
    df = pd.read_csv(url)
    df = df.drop(columns=["Lat", "Long"]).groupby("Country/Region").sum()
    return df


def get_countries_list(covid_data_frame):
    return covid_data_frame.index.tolist()


def get_covid_filtered(covid_data_frame, selected_country):
    sel = covid_data_frame.loc[selected_country]
    return sel.to_dict("split")


def echarts_option(covid_df, selected_countries):
    series = []
    yAxisName = ""
    countries = []
    for k in range(len(selected_countries)):
        selectedCountry = selected_countries[k]
        series.append(
            {
                "name": f"Death for {selectedCountry}",
                "type": "line",
                "animation": False,
                "areaStyle": {},
                "lineStyle": {"width": 1},
                "markArea": {"silent": True},
                "data": covid_df["data"][k],
            }
        )
        countries.append(selectedCountry)

    option = {
        "title": {
            "text": f"Covid data for {countries}",
            "subtext": "CSSE at Johns Hopkins University",
            "left": "center",
            "align": "right",
        },
        "grid": {"bottom": 80},
        "toolbox": {
            "feature": {
                "dataZoom": {"yAxisIndex": "none"},
                "restore": {},
                "saveAsImage": {},
            }
        },
        "tooltip": {
            "trigger": "axis",
            "axisPointer": {
                "type": "cross",
                "animation": False,
                "label": {"backgroundColor": "#505765"},
            },
        },
        "dataZoom": [
            {"show": True, "realtime": True, "start": 0, "end": 100},
            {"type": "inside", "realtime": True, "start": 0, "end": 100},
        ],
        "xAxis": [
            {
                "type": "category",
                "boundaryGap": False,
                "axisLine": {"onZero": False},
                "data": covid_df["columns"],
            }
        ],
        "yAxis": [
            {
                "name": yAxisName,
                "type": "value",
            }
        ],
        "series": series,
    }

    return option


def on_change(state, var, val):
    if var == "selected_countries":
        covid_filtered = get_covid_filtered(covid_data_frame, val)
        state.option_e = echarts_option(covid_filtered, val)


# Main code
dataset_name = DATASET_NAMES[0]
covid_data_frame = fetch_and_prepare_covid_data(dataset_name)
countries_list = get_countries_list(covid_data_frame)
selected_countries = ["France"]  # List of countries to process
covid_filtered = get_covid_filtered(covid_data_frame, selected_countries)
option_e = echarts_option(covid_filtered, selected_countries)

page = DesignerPage("covid_page.xprjson", designer_mode=True)
