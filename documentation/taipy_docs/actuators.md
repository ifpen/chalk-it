

#### Basic inputs and controls

| Widget            | actuator(s) name(s) | Chalk'it type (JS)       | Taipy type (py) | Read | Write | File | Execute | 
| ----------------- | ------------------- | ------------------------ | --------------- | ---- | ----- | ---- | ------- |
| Numeric input     | value               | Number                   | float           | X    | X     |      |         |
| Text input        | value               | String                   | str             | X    | X     |      |         |
| Checkbox          | value               | Boolean                  | bool            | X    | X     |      |         |
| Switch            | value               | Boolean                  | bool            | X    | X     |      |         |
| Horizontal slider | value               | Number                   | float           | X    | X     |      |         |
| Horizontal slider | min(*)              | Number                   | float           | X    |       |      |         |
| Horizontal slider | max(*)              | Number                   | float           | X    |       |      |         |
| Vertical slider   | value               | Number                   | float           | X    | X     |      |         |
| Vertical slider   | min(*)              | Number                   | float           | X    |       |      |         |
| Vertical slider   | max(*)              | Number                   | float           | X    |       |      |         |
| Double slider     | minValue            | Number                   | float           | X    | X     |      |         |
| Double slider     | maxValue            | Number                   | float           | X    | X     |      |         |
| Double slider     | minRange(*)         | Number                   | float           | X    |       |      |         |
| Double slider     | maxRange(*)         | Number                   | float           | X    |       |      |         |
| Push button       | trigger             | --                       | --              |      |       |      | X       |
| Load file         | value               | String(***)              | str             |      |       | X    |         |
| Save to file      | value               | String                   | str             | X    |       |      |         |
| Select            | keys                | Array of String          | list            | X    |       |      |         |
| Select            | values              | Array of String          | list            | X    |       |      |         |
| Select            | selectedValue       | String                   | str             | X    | X     |      |         |
| Multi-select      | value               | Array of String          | list            | X    |       |      |         |
| Multi-select      | selectedValue       | Array of String          | list            | X    | X     |      |         |
| List              | value               | Array of String          | list            | X    | X     |      |         |
| List              | selectedValue       | Array of String          | list            | X    | X     |      |         |
| Table             | value               | Array of Array of String | list            | X    | X(**) |      |         |

- (*) When rangeActuator parameter is true
- (**) When editableCol parameter is set
- (***) String by default. Base64 encoded binary if binaryFileInput is true

#### Basic displays

| Widget              | actuator(s) name(s) | Chalk'it type (JS)       | Taipy type (py) | Read | Write | File | Execute | 
| ------------------- | ------------------- | ------------------------ | --------------- | ---- | ----- | ---- | ------- |
| Value display       | value               | String or Number         | float or str    | X    |       |      |         |
| KPI value           | value               | Number                   | float           | X    |       |      |         |
| Advanced KPI value  | extendedValue       | Specific JSON            | dict            | X    |       |      |         |
| Status led          | extendedValue       | Boolean                  | bool            | X    |       |      |         |
| Progress bar        | value               | Number                   | float           | X    |       |      |         |
| Full-circular gauge | value               | Number                   | float           | X    |       |      |         |
| Semi-circular gauge | value               | Number                   | float           | X    |       |      |         |
| Arch-circular gauge | value               | Number                   | float           | X    |       |      |         |

#### Plots

| Widget              | actuator(s) name(s) | Chalk'it type (JS/Pyodide) | Taipy type (py)   | Read | Write | File | Execute | 
| ------------------- | ------------------- | -------------------------- | ----------------- | ---- | ----- | ---- | ------- |
| Plotly line         | x                   | Array of Number            | list              | X    |       |      |         |
| Plotly line         | yi(*)               | Array of Number            | list              | X    |       |      |         |
| Plotly bar          | xi(*)               | Array of String            | list              | X    |       |      |         |
| Plotly bar          | yi(*)               | Array of Number            | list              | X    |       |      |         |
| Plotly pie          | labeles             | Array of Number            | list              | X    |       |      |         |
| Plotly pie          | values              | Array of Number            | list              | X    |       |      |         |
| Plotly 3D surface   | x                   | Array of Number            | list              | X    |       |      |         |
| Plotly 3D surface   | y                   | Array of Number            | list              | X    |       |      |         |
| Plotly 3D surface   | z                   | Array of Number            | list              | X    |       |      |         |
| Plotly Generic JS   | data                | JSON (data)                | dict              | X    |       |      |         |
| Plotly Generic JS   | layout              | JSON (layout)              | dict              | X    |       |      |         |
| Plotly Generic JS   | selection           | JSON (select)              | dict              |      | X     |      |         |
| Plotly Generic Py   | fig                 | Plotly.Figure              | Plotly.Figure     | X    |       |      |         |
| Plotly Real-time    | y1                  | Number                     | float             | X    |       |      |         |
| Plotly Real-time    | layout              | JSON (layout)              | dict              | X    |       |      |         |
| Matplotlib          | fig                 | Matplotlib.Figure          | Matplotlib.Figure | X    |       |      |         |
| Vega Generic        | spec                | JSON (spec)                | dict              | X    |       |      |         |
| ECharts Generic     | option              | JSON (option)              | dict              | X    |       |      |         |

- (*) i stands for a number between 1 and 16 depending on the numberOfAxis parameter

#### Geo & Time

| Widget              | actuator(s) name(s) | Chalk'it type (JS)         | Taipy type (py)   | Read | Write | File | Execute | 
| ------------------- | ------------------- | -------------------------- | ----------------- | ---- | ----- | ---- | ------- |
| Leafet maps         | geoJSONi(*)         | geoJSON                    | dict              | X    |       |      |         |
| Leafet maps         | heatMapi(*)         | JSON                       | dict              | X    |       |      |         |
| Leafet maps         | lineHeatMapi(*)     | JSON                       | dict              | X    |       |      |         |
| Leafet maps         | choroplethi(*)      | JSON                       | dict              | X    |       |      |         |
| Leafet maps         | imageOverlayi(*)    | JSON                       | dict              | X    |       |      |         |
| Leafet maps         | svgOverlayi(*)      | JSON                       | dict              | X    |       |      |         |
| Leafet maps         | selectedGeoJSON(**) | geoJSON                    | dict              |      | X     |      |         |
| Leafet maps         | selectedPoint(**)   | JSON                       | dict              |      | X     |      |         |
| Folium map          | _repr_html_         | String                     | str               |  X   |       |      |         |
| Address auto-compl. | value               | String                     | str               |  X   | X     |      |         |
| Simple calendar     | dateValue           | String                     | str               |  X   | X     |      |         |
| Date-range calendar | startDateValue      | String                     | str               |  X   | X     |      |         |
| Date-range calendar | endDateValue        | String                     | str               |  X   | X     |      |         |
| Year calendar       | CalendarValues      | JSON                       | dict              |  X   |       |      |         |
| Year calendar       | SelectedDate        | String                     | str               |  X   | X     |      |         |
| Simple clock        | timeValue           | String                     | str               |  X   | X     |      |         |

- (*) if enabling actuators are set
- (**) if enabling actuators are set

#### Annotation & Video

| Widget              | actuator(s) name(s) | Chalk'it type (JS)         | Taipy type (py)   | Read | Write | File | Execute | 
| ------------------- | ------------------- | -------------------------- | ----------------- | ---- | ----- | ---- | ------- |
| Info                | value(*)            | String                     | str               | X    |       |      |         |
| Label               | value(*)            | String                     | str               | X    |       |      |         |
| Image               | base64Image(*)      | String                     | str               | X    |       |      |         |
| Markdown            | text                | String                     | str               | X    |       |      |         |
| Generic HTML        | html                | String                     | str               | X    |       |      |         |
| Camera              | base64Image         | String                     | str               |      | X     |      |         |
| Camera              | mimeType            | String                     | str               |      | X     |      |         |
| Camera              | imageData           | String                     | str               |      | X     |      |         |

- (*) if enableActuator is set