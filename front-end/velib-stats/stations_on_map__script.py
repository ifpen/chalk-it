import geopandas as gpd
import json

dfs = dataNodes["dfg"][["geometry","name","capacity","numbikesavailable"]]
dfs_json = dfs.to_json()
dfs_dict = json.loads(dfs_json)
dfs_dict["properties"] = {"description": "Velib stations"}
return dfs_dict
