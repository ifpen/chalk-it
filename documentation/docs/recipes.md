# Some useful recipes

## JavaScript recipes

### Simple key/value JSON to table (linewise)

```javascript
return [_.keys(dataNodes["vehicle"]), _.values(dataNodes["vehicle"])];
```

* See [json-to-table-linewise-js.xprjson](recipes/json-to-table-linewise-js.xprjson)

### Simple key/value JSON to table (columnwise)

```javascript
return _.unzip([_.keys(dataNodes["vehicle"]), _.values(dataNodes["vehicle"])]);
```

* See [json-to-table-columnwise-js.xprjson](recipes/json-to-table-columnwise-js.xprjson)

### Read CSV, display content and write it to file

See [csv-read-write-js.xprjson](recipes/csv-read-write-js.xprjson)

### Plotly

#### x-axis with time

* See [plotly-with-date-time-js.xprjson](recipes/plotly-with-date-time-js.xprjson)

### Read xlsx file from URL and convert it to JSON

* See [xls-from-url-to-json-js.xprjson](recipes/xls-from-url-to-json-js.xprjson)
