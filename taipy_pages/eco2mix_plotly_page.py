import sys
import pandas as pd
import requests
import plotly.graph_objects as go
import plotly.express as px
import re
from pathlib import Path
from datetime import datetime, timedelta

sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *

# Variables declaration, first date (yesterday) and sampling mode
# Get today's date
today = datetime.now()
# Calculate yesterday's date
yesterday = today - timedelta(days=1)
# Format yesterday's date in the specified format
date = yesterday.strftime("%Y-%m-%d")
bSampling = True


# Function to create query URL
def create_query_url(date):
    date_url = date.replace("-", "%2F")
    return f"https://odre.opendatasoft.com/api/records/1.0/search/?dataset=eco2mix-national-tr&q=&rows=96&sort=-date_heure&facet=nature&facet=date_heure&refine.date_heure={date_url}"


# REST web-service call
def fetch_data(url):
    response = requests.get(url, headers={"Content-Type": "application/json"})
    if response.status_code == 200:
        return response.json()["records"]
    else:
        return []


# Processing data
def process_data(records):
    df = pd.json_normalize(records).dropna().reset_index(drop=True)
    df.rename(columns=lambda x: re.sub("^fields\.", "", x), inplace=True)
    df["date_heure"] = pd.to_datetime(df["date_heure"])
    df.set_index("date_heure", inplace=True)
    column_mapping = {
        "nucleaire": "Nuclear",
        "hydraulique": "Hydraulic",
        "eolien": "Wind",
        "gaz": "Gas",
        "bioenergies": "Bioenergies",
        "solaire": "Solar",
        "fioul": "Fuel oil",
    }
    df.rename(columns=column_mapping, inplace=True)
    return df[
        ["Nuclear", "Hydraulic", "Wind", "Gas", "Bioenergies", "Solar", "Fuel oil"]
    ]


# Further processing for energy sum
def calculate_energy(df):
    dff = df.resample("H").mean()
    return dff.sum()


# Plotting functions
def plot_data(df, date, bSampling):
    if not bSampling:
        fig = go.Figure()
        for col in df.columns:
            fig.add_trace(
                go.Scatter(
                    x=df.index,
                    y=df[col],
                    hoverinfo="x+y",
                    mode="lines",
                    line=dict(width=0.5),
                    name=col,
                    stackgroup="one",
                )
            )
        layout = dict(
            showlegend=True,
            xaxis_type="date",
            yaxis=dict(type="linear", range=[0, 90000], ticksuffix=" MW"),
            xaxis_title="Time",
            yaxis_title="Power [MW]",
            title=f"Daily electrical power for {date}",
        )
        fig.update_layout(layout)
    else:
        dff = df.resample("H").mean()
        fig = px.bar(dff, barmode="stack")
        layout = dict(
            showlegend=True,
            xaxis_type="date",
            yaxis=dict(type="linear", range=[0, 90000], ticksuffix=" MW"),
            xaxis_title="Time",
            yaxis_title="Power [MW]",
            title=f"Daily electrical power for {date}",
        )
        fig.update_layout(layout)
    return fig


def plot_pie(total_energy_GWh):
    labels_with_units = [f"{label} (GWh)" for label in total_energy_GWh.index]
    fig = go.Figure(
        data=[
            go.Pie(labels=labels_with_units, values=total_energy_GWh.values, hole=0.3)
        ]
    )
    fig.update_layout(title_text="Total energy production by sector")
    return fig


# Main execution flow
def main_exec(date, bSampling):
    query_url = create_query_url(date)
    records = fetch_data(query_url)
    df = process_data(records)
    energy_sum = calculate_energy(df)
    fig_data = plot_data(df, date, bSampling)
    fig_pie = plot_pie(energy_sum / 1000)  # Convert to GWh
    return df, fig_data, fig_pie


def update_exec(df, date, bSampling):
    energy_sum = calculate_energy(df)
    fig_data = plot_data(df, date, bSampling)
    fig_pie = plot_pie(energy_sum / 1000)  # Convert to GWh
    return fig_data, fig_pie


df, fig_data, fig_pie = main_exec(date, bSampling)


def on_change(state, var, val):
    if var == "date":
        df, state.fig_data, state.fig_pie = main_exec(val, state.bSampling)
    elif var == "bSampling":
        state.fig_data, state.fig_pie = update_exec(state.df, state.date, val)


page = ChalkitPage("eco2mix_plotly_page.xprjson")
