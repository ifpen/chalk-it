covid = dataNodes["covidDataFrame"]

sel = covid.loc[dataNodes["selectedCountry"]]

return sel.to_dict('split')
