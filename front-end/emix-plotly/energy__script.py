df = dataNodes["df"]
dff = df.resample('H').mean()
return dff.sum()
