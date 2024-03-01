import sys
from pathlib import Path
# Add the parent directory of `back_end` to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end.taipylink.resource_handler import PureHTMLResourceHandler
from back_end.taipylink.chalkit_manager import *

import pandas as pd
from sklearn import datasets
from sklearn.ensemble import RandomForestClassifier
import plotly.express as px
from taipy.gui.custom import Page


prediction = '--'

def load_dataset():
    iris = datasets.load_iris()
    return iris

def create_dataframe(iris):
    df = pd.DataFrame(data=iris.data, columns=iris.feature_names)
    df["target"] = iris.target
    target_names = {0: "Setosa", 1: "Versicolour", 2: "Virginica"}
    df['target'] = df['target'].map(target_names)
    return df

def train_classifier(iris):
    clf = RandomForestClassifier()
    clf.fit(iris.data, iris.target)
    return clf

def plot_data(df):
    fig = px.scatter(df, x="sepal width (cm)", y="sepal length (cm)", color="target", 
                     size='petal length (cm)', hover_data=['petal width (cm)'])
    return fig

def make_prediction(clf, input_data):
    df = pd.DataFrame(input_data, index=[0])
    prediction = clf.predict(df)
    return iris.target_names[prediction][0]

# Main execution
iris = load_dataset()
df = create_dataframe(iris)
clf = train_classifier(iris)
fig = plot_data(df)

# Example input for prediction
input_data = {"sepal_width": 5.4, "sepal_length": 2.7, "petal_length": 3, "petal_width": 0.5}

def on_change(state, var, val):

    if var == 'input_data':
        state.prediction = make_prediction(clf, val)


page = Page(PureHTMLResourceHandler())