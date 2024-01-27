filtered_df = dataNodes["dfg"][["lat","lng","bikes_availability_rate"]]

availability_data = filtered_df.rename(columns={'bikes_availability_rate': 'Bikes availability rate'}).to_dict('records')

return {"data": availability_data, "config": dataNodes["heatmap_cfg"]}
