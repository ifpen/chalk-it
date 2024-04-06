from taipy.gui import Gui
from taipy_designer import *
import pandas as pd
from sklearn import datasets
from sklearn.ensemble import RandomForestClassifier
import plotly.express as px


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

# Example input for prediction
input_data = {"sepal_width": 5.4, "sepal_length": 2.7, "petal_length": 3, "petal_width": 0.5}

# Main execution
iris = load_dataset()
df = create_dataframe(iris)
clf = train_classifier(iris)
fig = plot_data(df)

def on_change(state, var, val):

    if var == 'input_data':
        state.prediction = make_prediction(clf, val)

# Create a Chalk'it Page instance with the resource handler
page = DesignerPage("iris_demo_page.xprjson", designer_mode=True)

gui = Gui()
gui.add_page("iris", page)

gui.run(run_browser=True, use_reloader=False)