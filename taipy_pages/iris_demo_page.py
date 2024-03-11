import sys
from pathlib import Path
# Add the parent directory of `back_end` to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from back_end import *
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

def plot_data(df, point_of_interest):
    fig = px.scatter(df, x="sepal width (cm)", y="sepal length (cm)", color="target", 
                     size='petal length (cm)', hover_data=['petal width (cm)'])
    # Add a scatter trace for the point of interest with a big plus marker
    fig.add_trace(px.scatter(x=[point_of_interest["sepal_width"]], 
                            y=[point_of_interest["sepal_length"]],
                            size=[point_of_interest["petal_length"]], # Optional, depends on if you want the size to matter
                            ).update_traces(marker=dict(symbol='cross', size=12, line=dict(width=2)), 
                                            mode='markers'))    
    return fig

def make_prediction(clf, input_data):
    df = pd.DataFrame(input_data, index=[0])
    prediction = clf.predict(df)
    return iris.target_names[prediction][0]

# Example input for prediction
input_data = {"sepal_width": 5.4, "sepal_length": 2.7, "petal_length": 3, "petal_width": 0.5}

# Main execution
iris = load_dataset()
df = create_dataframe(iris)
clf = train_classifier(iris)
fig = plot_data(df, input_data)


def on_change(state, var, val):

    if var == 'input_data':
        state.prediction = make_prediction(clf, val)
        plot_data(df, val)
        

# Define xprjson file name
xprjson_file_name = "iris_demo_page"
# Create a Page instance with the resource handler
page = Page(PureHTMLResourceHandler())