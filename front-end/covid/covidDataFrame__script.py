from io import StringIO
import pandas as pd

covid = pd.read_csv(StringIO(dataNodes["covidDataJohnHopkins"]["content"]))

covid = covid.drop(columns=['Lat', 'Long']).groupby('Country/Region').sum()

return covid