import pandas as pd

dfg = dataNodes["dfg"]

return {
  "Number of available bikes": "{:,}".format(int(dfg['numbikesavailable'].sum())).replace(',', ' '),
  "Number of available docks": "{:,}".format(int(dfg['numdocksavailable'].sum())).replace(',', ' '),
  "Capacity" : "{:,}".format(int(dfg['capacity'].sum())).replace(',', ' '),
  "Number of full stations": "{:,}".format(int(dfg['station_full'].sum())).replace(',', ' '),
  "Number of empty stations": "{:,}".format(int(dfg['station_empty'].sum())).replace(',', ' '),
  "Number of renting stations": "{:,}".format(int(dfg['is_renting'].sum())).replace(',', ' '),
  "Max capacity" : int(dfg['capacity'].max())

}
