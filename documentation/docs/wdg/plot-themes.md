# Plots themes

## Plotly

As of now, plotly line, bars and pie are themed along the other widgets. 3D widgets are also partially customized.
But Generic and Real Time need customization from the user.

To do so, they will need to create a new datanode "layout" object and then apply it to the "Layout" actuator.
Here is an example of the structure of the layout object:

```javascript
var layout = {
  "xaxis": {
    "tickfont": {
      "color": "var(--widget-color)"
    }
  },
  "yaxis": {
    "tickfont": {
      "color": "var(--widget-color)"
    }
  },
  "zaxis": {
    "tickfont": {
      "color": "var(--widget-color)"
    }
  },
  "paper_bgcolor": "rgba(0,0,0,0)",
  "plot_bgcolor": "rgba(0,0,0,0)",
  "colorway": [
    "var(--widget-color-2)", 
    "var(--widget-color-5)", 
    "var(--widget-color-6)", 
    "var(--widget-color-7)"
  ],
  "legend": {
    "font": {
      "color": "var(--widget-color)",
    }
  }
};

return layout;
```

This example shows all colors in the Plotly config for wich we support CSS Custom Properties (ie. `var(---widget-color)`).

To be perfectly clear about Themes colors, each Theme has 8 colors. Here is how they are used:

```CSS
var(--widget-color-0); // Project background color, if not overriden with the color picker in the "Dashboard Panel" left sidebar panel
var(--widget-color-1); // Text color, same as var(--widget-color)
var(--widget-color-2); // Primary color
var(--widget-color-3); // Active color, derivated from the primary color
var(--widget-color-4); // Hove color, derivated from the primary color
var(--widget-color-5); // Accent color, used for charts
var(--widget-color-6); // Accent color, used for charts
var(--widget-color-7); // Accent color, used for charts
```

Theses colors can not be overriden globally.

For Plotly charts types Line, Bars and Pie, they can be overriden in the widget "Graphical Properties" right side bar, for each chart **individually**.

## eCharts

eCharts widgets needs an "option" datanodes to be functionnal. Inside this datanode, the user can add datas and a lots of parameters like colors.
By default, the `color` key inside the `option` object is not defined, we automatically apply colors to match the current project theme like so:

```javascript
var option = {
  "color": [
    "var(--widget-color-2)", 
    "var(--widget-color-5)", 
    "var(--widget-color-6)", 
    "var(--widget-color-7)"
  ]
};

return option;
```
