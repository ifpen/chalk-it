import pandas as pd
import re

df_rt = pd.json_normalize(dataNodes["stations_status_json"]["records"])
df_rt.rename(columns=lambda x: re.sub('^fields\.', '', x), inplace=True)
df_rt = df_rt.drop('datasetid', axis=1)
df_rt = df_rt.drop('recordid', axis=1)

df_rt['lat'] = df_rt['coordonnees_geo'].apply(lambda x: x[0])
df_rt['lng'] = df_rt['coordonnees_geo'].apply(lambda x: x[1])

df_rt['is_renting'] = df_rt['is_renting'].replace(['OUI', 'NON'], [1, 0])
df_rt['is_installed'] = df_rt['is_installed'].replace(['OUI', 'NON'], [1, 0])


return xdash.as_python(df_rt)