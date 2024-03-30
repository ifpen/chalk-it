# Actuators

Actuators are connection (binding) points between widgets and Python variables.

Widgets expect that the Python variables to connect, at their actuators level, have a compatible type.

Actuators may have the following causalities:

- Read: read and display the value of the connected Python variable
- Write: write to the connected Python variable
- File: handle file loading (from the dashboard) for the Python code that will use it
- Execute: execute Python functions

Actuators with both Read/Write causality typically first read the variables to initialize the associated control, that will be available next for user input.

## Basic inputs and controls

| Widget            | Actuator(s) name(s) | Variable types (py) | Read | Write | File | Execute | 
| ----------------- | ------------------- | ------------------- | -----| ----- | ---- | ------- |
| Numeric input     | value               | int,float           | X    | X     |      |         |
| Text input        | value               | str                 | X    | X     |      |         |
| Checkbox          | value               | bool                | X    | X     |      |         |
| Switch            | value               | bool                | X    | X     |      |         |
| Horizontal slider | value               | int,float           | X    | X     |      |         |
| Horizontal slider | min(*)              | int,float           | X    |       |      |         |
| Horizontal slider | max(*)              | int,float           | X    |       |      |         |
| Vertical slider   | value               | int,float           | X    | X     |      |         |
| Vertical slider   | min(*)              | int,float           | X    |       |      |         |
| Vertical slider   | max(*)              | int,float           | X    |       |      |         |
| Double slider     | minValue            | int,float           | X    | X     |      |         |
| Double slider     | maxValue            | int,float           | X    | X     |      |         |
| Double slider     | minRange(*)         | int,float           | X    |       |      |         |
| Double slider     | maxRange(*)         | int,float           | X    |       |      |         |
| Trigger button    | trigger{i}          | --                  |      |       |      | X       |
| Load file button  | trigger{i}          | --                  |      |       | X    |         |
| Load file button  | file_path           | str                 |      |       | X    |         |
| Select            | keys                | list,tuple          | X    |       |      |         |
| Select            | values              | list,tuple          | X    |       |      |         |
| Select            | selectedValue       | str                 | X    | X     |      |         |
| Multi-select      | value               | list,tuple          | X    |       |      |         |
| Multi-select      | selectedValue       | list                | X    | X     |      |         |
| List              | value               | list,tuple          | X    | X     |      |         |
| List              | selectedValue       | list                | X    | X     |      |         |
| Editable table    | value               | list                | X    | X(**) |      |         |

- (*) When rangeActuator parameter is true
- (**) When editableCol parameter is set

## Basic displays

| Widget              | Actuator(s) name(s) | Variable types (py)  | Read | Write | File | Execute | 
| ------------------- | ------------------- | -------------------- | ---- | ----- | ---- | ------- |
| Value display       | value               | int,float or str     | X    |       |      |         |
| KPI value           | value               | int,float            | X    |       |      |         |
| Status led          | extendedValue       | bool                 | X    |       |      |         |
| Progress bar        | value               | int,float            | X    |       |      |         |
| Full-circular gauge | value               | int,float            | X    |       |      |         |
| Semi-circular gauge | value               | int,float            | X    |       |      |         |
| Arch-circular gauge | value               | int,float            | X    |       |      |         |

## Plots

| Widget              | Actuator(s) name(s) | Variable types (py)  | Read | Write | File | Execute | 
| ------------------- | ------------------- | -------------------- | ---- | ----- | ---- | ------- |
| Plotly line         | x                   | list,numpy.array     | X    |       |      |         |
| Plotly line         | y{i}(*)             | list,numpy.array     | X    |       |      |         |
| Plotly bar          | x{i}(*)             | list,numpy.array     | X    |       |      |         |
| Plotly bar          | y{i}(*)             | list,numpy.array     | X    |       |      |         |
| Plotly pie          | labels              | list,numpy.array     | X    |       |      |         |
| Plotly pie          | values              | list,numpy.array     | X    |       |      |         |
| Plotly Generic Py   | fig                 | Plotly.Figure        | X    |       |      |         |
| Matplotlib          | fig                 | Matplotlib.Figure    | X    |       |      |         |
| ECharts Generic     | option              | dict (option)        | X    |       |      |         |

- (*) {i} stands for a number between 1 and 16 depending on the numberOfAxis parameter

## Geo & Time

| Widget              | Actuator(s) name(s) | Variable types (py) | Read | Write | File | Execute | 
| ------------------- | ------------------- | ------------------- | ---- | ----- | ---- | ------- |
| Leafet maps         | geoJSON{i}(*)       | dict (geoJSON)      | X    |       |      |         |
| Leafet maps         | heatMap{i}(*)       | dict                | X    |       |      |         |
| Leafet maps         | lineHeatMap{i}(*)   | dict                | X    |       |      |         |
| Leafet maps         | choropleth{i}(*)    | dict                | X    |       |      |         |
| Leafet maps         | imageOverlay{i}(*)  | dict                | X    |       |      |         |
| Leafet maps         | svgOverlay{i}(*)    | dict                | X    |       |      |         |
| Leafet maps         | selectedGeoJSON(**) | dict (geoJSON)      |      | X     |      |         |
| Leafet maps         | selectedPoint(**)   | dict                |      | X     |      |         |
| Folium map          | _repr_html_         | Folium.Map          |  X   |       |      |         |
| Address auto-compl. | value               | str                 |  X   | X     |      |         |
| Simple calendar     | dateValue           | str (yyyy-mm-dd)    |  X   | X     |      |         |
| Date-range calendar | startDateValue      | str (yyyy-mm-dd)    |  X   | X     |      |         |
| Date-range calendar | endDateValue        | str (yyyy-mm-dd)    |  X   | X     |      |         |
| Year calendar       | CalendarValues      | dict                |  X   |       |      |         |
| Year calendar       | SelectedDate        | str (yyyy-mm-dd)    |  X   | X     |      |         |
| Simple clock        | timeValue           | str (hh:mm)         |  X   | X     |      |         |

- (*) if enabling actuators are set. {i} stands for a number between 1 and 16 depending on the corresponding parameter
- (**) if enabling actuators are set

## Annotation & Video

| Widget              | Actuator(s) name(s)   | Variable types (py)   | Read | Write | File | Execute | 
| ------------------- | --------------------- | --------------------- | ---- | ----- | ---- | ------- |
| Info                | value(*)              | str                   | X    |       |      |         |
| Label               | value(*)              | str                   | X    |       |      |         |
| Import Image        | base64Image(*)        | str                   | X    |       |      |         |
| Connect Image       | base64Image           | PIL.Image             | X    |       |      |         |
| Markdown            | text                  | str (Markdown)        | X    |       |      |         |
| Generic HTML        | html                  | str (HTML)            | X    |       |      |         |
| Camera              | base64Image           | str                   |      | X     |      |         |
| Camera              | mimeType              | str                   |      | X     |      |         |
| Camera              | imageData             | str                   |      | X     |      |         |

- (*) if enableActuator is set