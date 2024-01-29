import pandas as pd
import re
df = pd.json_normalize(dataNodes["eco2mix-national-tr"]["records"]).dropna().reset_index(drop=True)
df.rename(columns=lambda x: re.sub('^fields\.', '', x), inplace=True)
# Convert the column to datetime
df['date_heure'] = pd.to_datetime(df['date_heure'])

# Set the column as the index
df.set_index('date_heure', inplace=True)

# dictionary mapping old column names to new column names
column_mapping = {
    'nucleaire': 'Nuclear',
    'hydraulique': 'Hydraulic',
    'eolien': 'Wind',
    'gaz': 'Gas',
    'bioenergies': 'Bioenergies',
    'solaire': 'Solar',
    'fioul': 'Fuel oil'
}

# rename the columns
df.rename(columns=column_mapping, inplace=True)
filières = ['Nuclear', 'Hydraulic', 'Wind', 'Gas', 'Bioenergies', 'Solar', 'Fuel oil']
return df[filières]