// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI, Benoît LEHMAN,  │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

const USE_PLOTLY_VALIDATION = false;

const colorway = [
  'var(--widget-color-2)',
  'var(--widget-color-5)',
  'var(--widget-color-6)',
  'var(--widget-color-7)',
  'var(--widget-color-8)',
  'var(--widget-color-9)',
  'var(--widget-color-10)',
  'var(--widget-color-11)',
  'var(--widget-color-12)',
  'var(--widget-color-13)',
];

const textColor = 'var(--widget-color)';
const gridColor = 'var(--widget-plotly-background-color)';
const axisParams = {
  title: '',
  tickfont: {
    color: textColor,
  },
};
const plotlyBackground = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
};
const plotlyColorParams = {
  ...plotlyBackground,
  colorway: colorway,
  legend: {
    font: {
      color: textColor,
    },
  },
};

const genericPlotlyGridColor = {
  xaxis: {
    gridcolor: gridColor,
  },
  yaxis: {
    gridcolor: gridColor,
  },
  zaxis: {
    gridcolor: gridColor,
  },
};
const genericPlotlyColor = {
  template: {
    layout: {
      ...genericPlotlyGridColor,
      colorway: colorway,
      font: {
        color: textColor,
      },
    },
  },
};

// Very minimalistic plotly validation
const _SCHEMA_PLOTLY_DATA = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:plotly_data',
  type: 'array',
  items: {
    type: 'object',
    properties: { type: { type: 'string' } },
    required: ['type'],
  },
};

const _SCHEMA_PLOTLY_LAYOUT = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:plotly_layout',
  type: 'object',
};

// Parameters
modelsParameters.plotlyLine = {
  numberOfAxis: 1,
  layout: {
    ...plotlyColorParams,
    // all "layout" attributes: #layout
    title: '', // more about "layout.title": #layout-title
    xaxis: {
      // all "layout.xaxis" attributes: #layout-xaxis
      title: 'x', // more about "layout.xaxis.title": #layout-xaxis-title
      tickfont: {
        color: textColor,
      },
    },
    yaxis: {
      title: 'y',
      tickfont: {
        color: textColor,
      },
    },
    showlegend: true,
    margin: {
      l: 50,
      r: 50,
      b: 100,
      t: 100,
      pad: 4,
    },
  },
  hideModeBar: false,
};

modelsParameters.plotlyBar = {
  numberOfAxis: 1,
  layout: {
    ...plotlyColorParams,
    // all "layout" attributes: #layout
    title: '', // more about "layout.title": #layout-title
    barmode: 'group',
    xaxis: {
      // all "layout.xaxis" attributes: #layout-xaxis
      title: 'x', // more about "layout.xaxis.title": #layout-xaxis-title
      tickfont: {
        color: textColor,
      },
    },
    yaxis: {
      title: 'y',
      tickfont: {
        color: textColor,
      },
    },
    showlegend: true,
    margin: {
      l: 50,
      r: 50,
      b: 100,
      t: 100,
      pad: 4,
    },
  },
  hideModeBar: false,
};

modelsParameters.plotlyPie = {
  layout: {
    ...plotlyColorParams,
    // all "layout" attributes: #layout
    title: '',
    showlegend: true,
    margin: {
      l: 50,
      r: 50,
      b: 100,
      t: 100,
      pad: 4,
    },
  },
  hideModeBar: false,
};

modelsParameters.plotly3dSurface = {
  layout: {
    ...plotlyColorParams,
    // all "layout" attributes: #layout
    title: '', // more about "layout.title": #layout-title
    scene: {
      xaxis: {
        // all "layout.xaxis" attributes: #layout-xaxis
        title: 'x', // more about "layout.xaxis.title": #layout-xaxis-title
      },
      yaxis: {
        title: 'y',
      },
      zaxis: {
        title: 'z',
      },
    },
    showlegend: true,
    margin: {
      l: 50,
      r: 50,
      b: 100,
      t: 100,
      pad: 4,
    },
  },
  hideModeBar: false,
};

modelsParameters.plotlyGeneric = {
  enforceTextColor: true,
  textColor: textColor,
  enforceBackgroundTransparency: true,
  hideModeBar: false,
};

modelsParameters.plotlyPyGeneric = {
  enforceTextColor: true,
  textColor: textColor,
  enforceBackgroundTransparency: true,
  hideModeBar: false,
};

modelsParameters.plotlyRealTime = {
  enforceTextColor: true,
  textColor: textColor,
  enforceBackgroundTransparency: true,
  //numberOfAxis: 1,
  hideModeBar: false,
};

// Hidden parameters
modelsHiddenParams.plotlyLine = {
  ...modelsParameters.plotlyLine,
  data: [
    {
      type: 'scatter', // all "scatter" attributes: https://plot.ly/javascript/reference/#scatter
      x: [0, 1, 2], // more about "x": #scatter-x
      y: [0, 4, 0], // #scatter-y
      name: 'trace 0',
    },
  ],
  selection: [{}],
};

modelsHiddenParams.plotlyBar = {
  ...modelsParameters.plotlyBar,
  data: [
    {
      type: 'bar', // all "scatter" attributes: https://plot.ly/javascript/reference/#scatter
      x: ['first', 'second'], // more about "x": #scatter-x
      y: [1, 2], // #scatter-y
    },
  ],
  selection: [{}],
};

modelsHiddenParams.plotlyPie = {
  ...modelsParameters.plotlyPie,
  data: [
    {
      type: 'pie',
      labels: ['half1', 'half2'],
      values: [0.5, 0.5],
      // marker: { colors: [] },
      sort: false,
    },
  ],
  selection: [{}],
};

modelsHiddenParams.plotly3dSurface = {
  ...modelsParameters.plotly3dSurface,
  data: [
    {
      type: 'surface',
      x: [1, 2, 3],
      y: [1, 2, 3],
      z: [
        [4, 5, 6],
        [16, 19, 20],
        [10, 18, 23],
      ],
    },
  ],
  selection: [{}],
};

modelsHiddenParams.plotlyRealTime = {
  data: [
    {
      //'x': [],
      y: [],
      mode: 'lines',
    },
  ],
  layout: {
    ...plotlyBackground,
    ...genericPlotlyColor,
  },
  selection: [{}],
};

modelsHiddenParams.plotlyGeneric = {
  data: [{}],
  layout: {
    ...plotlyBackground,
    ...genericPlotlyColor,
  },
  selection: [{}],
};

modelsHiddenParams.plotlyPyGeneric = {
  fig: {
    layout: {
      ...plotlyBackground,
      ...genericPlotlyColor,
    },
  },
  selection: [{}],
};

modelsTempParams.plotlyLine = { lastData: {}, lastLayout: {} };
modelsTempParams.plotlyBar = { lastData: {}, lastLayout: {} };
modelsTempParams.plotlyPie = { lastData: {}, lastLayout: {} };
modelsTempParams.plotly3dSurface = { lastData: {}, lastLayout: {} };
modelsTempParams.plotlyGeneric = { lastData: {}, lastLayout: {} };
modelsTempParams.plotlyPyGeneric = { lastData: {}, lastLayout: {} };
modelsTempParams.plotlyRealTime = { lastData: {}, lastLayout: {} };

// Layout (default dimensions)
modelsLayout.plotlyLine = { height: '30vh', width: '30vw', minWidth: '100px', minHeight: '100px' };
modelsLayout.plotlyBar = { height: '30vh', width: '30vw', minWidth: '100px', minHeight: '100px' };
modelsLayout.plotlyPie = { height: '30vh', width: '30vw', minWidth: '100px', minHeight: '100px' };
modelsLayout.plotly3dSurface = { height: '30vh', width: '30vw', minWidth: '378px', minHeight: '305px' };
modelsLayout.plotlyGeneric = { height: '30vh', width: '30vw', minWidth: '50px', minHeight: '32px' };
modelsLayout.plotlyPyGeneric = { height: '30vh', width: '30vw', minWidth: '50px', minHeight: '32px' };
modelsLayout.plotlyRealTime = { height: '30vh', width: '30vw', minWidth: '100px', minHeight: '100px' };

const _SCHEMA_PLOTLY_NUMERIC_DATA = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:plotly_numeric_data',
  anyOf: [
    { type: 'number' },
    {
      type: 'array',
      items: { type: 'number' },
    },
  ],
};

const _SCHEMA_PLOTLY_ANY_DATA = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:plotly_any_data',
  anyOf: [
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    {
      type: 'array',
      items: {
        anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      },
    },
  ],
};

function _createPlotlyAnyDataDescriptor(name) {
  return new WidgetActuatorDescription(
    name,
    'Array of values to plot',
    WidgetActuatorDescription.READ,
    _SCHEMA_PLOTLY_ANY_DATA
  );
}

function _createPlotlyNumericDataDescriptor(name) {
  return new WidgetActuatorDescription(
    name,
    'Array of numeric values to plot',
    WidgetActuatorDescription.READ,
    _SCHEMA_PLOTLY_NUMERIC_DATA
  );
}

function _isAxisLinear(layout, axis) {
  return layout && layout[axis] && layout[axis]['type'] === 'linear';
}

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function plotlyWidgetsPluginClass() {
  let pId = 0;
  const self = this;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         createPlotlyDiv                            | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  function createPlotlyDiv(idDivContainer, pId, bInteractive) {
    const self = this;
    const widgetHtml = document.createElement('div');
    let idDivPlotly = 'plotly' + pId;
    if (bInteractive) {
      idDivPlotly += 'c';
    }
    widgetHtml.setAttribute('id', idDivPlotly);
    widgetHtml.setAttribute('class', 'js-plotly-plot');
    $('#' + idDivContainer).html(widgetHtml);
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                      createWidget (public)                         | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.createWidget = function (idDivContainer, typeWidget, idInstance, bInteractive) {
    pId = pId + 1;
    createPlotlyDiv(idDivContainer, pId, bInteractive);
    switch (typeWidget) {
      case 'plotlyLine':
        return new this.linePlotlyWidget(idDivContainer, pId, idInstance, bInteractive);
      case 'plotlyBar':
        return new this.barPlotlyWidget(idDivContainer, pId, idInstance, bInteractive);
      case 'plotlyPie':
        return new this.piePlotlyWidget(idDivContainer, pId, idInstance, bInteractive);
      case 'plotly3dSurface':
        return new this.d3surfacePlotlyWidget(idDivContainer, pId, idInstance, bInteractive);
      case 'plotlyGeneric':
        return new this.genericPlotlyWidget(idDivContainer, pId, idInstance, bInteractive);
      case 'plotlyPyGeneric':
        return new this.genericPlotlyPythonWidget(idDivContainer, pId, idInstance, bInteractive);
      case 'plotlyRealTime':
        return new this.realTimePlotlyWidget(idDivContainer, pId, idInstance, bInteractive);
    }
  };

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                       copyWidget (public)                          | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.copyWidget = function (wcIdStr, modelJsonIdStr, oldWidgetObj, instanceId, bInteractive) {
    // TODO : handle persistance like with PerfectWidgets
    return this.createWidget(wcIdStr, modelJsonIdStr, instanceId, bInteractive);
  };

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         clear (public)                             | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.clear = function () {
    pId = 0;
  };

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                           Plotly base                              | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  function basePlotlyWidget(idDivContainer, idWidget, idInstance, bInteractive) {
    this.bIsInteractive = bInteractive;
    let idDivPlotly = 'plotly' + idWidget;
    if (bInteractive) {
      idDivPlotly += 'c';
    }
    const self = this;

    this.enableWidget = function () {
      if (_.isUndefined(modelsParameters[idInstance].enableWidget)) {
        modelsParameters[idInstance].enableWidget = true;
      }
      if (bInteractive) {
        return modelsParameters[idInstance].enableWidget;
      } else {
        return true;
      }
    };

    this.showWidget = function () {
      if (_.isUndefined(modelsParameters[idInstance].showWidget)) {
        modelsParameters[idInstance].showWidget = true;
      }
      if (bInteractive) {
        return modelsParameters[idInstance].showWidget;
      } else {
        return true;
      }
    };
    // Convert CSS Custom Properties (ie: var(--widget-color)) to hexa codes
    this.getColorValueFromCSSProperty = function (value) {
      let color = value;
      if (color.includes('var(--')) {
        const realValue = value.substring(4, value.length - 1);
        color = window.getComputedStyle(document.documentElement).getPropertyValue(realValue);
      }
      return color;
    };

    // Check if a key exists in a deeply nested object
    this.checkNested = function (obj, level, ...rest) {
      if (obj === undefined) return false;
      if (rest.length == 0 && obj.hasOwnProperty(level)) return true;
      return this.checkNested(obj[level], ...rest);
    };

    /**
     * Retrieves the transformed text by handling HTML tags.
     * If the text does not contain HTML tags, it is returned as is.
     *
     * @param {string} text - The input text to transform.
     * @returns {string} The transformed text without HTML tags.
     */
    this.getTransformedText = function (text) {
      if (text) {
        // Check if the text has HTML tags
        const hasHtmlTags = $('<div>').html(text).children().length > 0;
        if (!hasHtmlTags) {
          // If the text does not have HTML tags, parse it as HTML
          const parser = new DOMParser();
          text = parser.parseFromString('<!doctype html><body>' + text, 'text/html').body.textContent;
        }
      }
      return text;
    };

    this.render = function () {
      /* Conversion to enable HTML tags */
      const layout = modelsParameters[idInstance]?.layout;
      if (layout?.title) {
        layout.title = _.isObject(layout.title)
          ? this.getTransformedText(layout.title.text)
          : this.getTransformedText(layout.title);
      }

      /* Apply colors from modelsParameters */
      let hiddenLayout = modelsHiddenParams[idInstance].fig?.layout ?? modelsHiddenParams[idInstance].layout;
      if (hiddenLayout) {
        // For generic plotly
        const plotlyParams = [
          { key: 'enforceBackgroundTransparency', value: plotlyBackground },
          { key: 'enforceTextColor', value: genericPlotlyColor },
        ];

        plotlyParams.forEach((param) => {
          if (modelsParameters[idInstance][param.key]) {
            hiddenLayout = _.merge({}, param.value, hiddenLayout);
          } else {
            _.forIn(param.value, (value, key) => {
              if (_.has(hiddenLayout, key)) {
                if (_.isEqual(hiddenLayout[key], value)) {
                  _.unset(hiddenLayout, key);
                }
              }
            });
          }
        });

        // For generic plotly
        if (hiddenLayout.template?.layout && modelsParameters[idInstance].enforceTextColor) {
          const layout = hiddenLayout.template.layout;
          if (layout.font?.color) {
            const fontColor = modelsParameters[idInstance]?.textColor ?? textColor;
            layout.font.color = this.getColorValueFromCSSProperty(fontColor);
          }
          ['xaxis', 'yaxis', 'zaxis'].forEach((axis) => {
            if (layout[axis]?.gridcolor) {
              layout[axis].gridcolor = this.getColorValueFromCSSProperty(gridColor);
            }
          });
        }

        hiddenLayout = JSON.parse(JSON.stringify(hiddenLayout));
        const modelLayout = modelsParameters[idInstance].layout
          ? JSON.parse(JSON.stringify(modelsParameters[idInstance].layout))
          : hiddenLayout;

        // Set colorway
        if (this.checkNested(modelLayout, 'colorway')) {
          hiddenLayout.colorway = modelLayout.colorway.map((color) => this.getColorValueFromCSSProperty(color));
        }
        // Set x, y, z Axis ticks color
        ['xaxis', 'yaxis', 'zaxis'].forEach((axis) => {
          if (this.checkNested(modelLayout, axis, 'tickfont', 'color')) {
            hiddenLayout[axis].tickfont.color = this.getColorValueFromCSSProperty(modelLayout[axis].tickfont.color);
          }
        });
        // Set legend color
        if (this.checkNested(modelLayout, 'legend', 'font', 'color')) {
          hiddenLayout.legend.font.color = this.getColorValueFromCSSProperty(modelLayout.legend.font.color);
        }
        // Set paper_bgcolor
        if (this.checkNested(modelLayout, 'paper_bgcolor')) {
          hiddenLayout.paper_bgcolor = this.getColorValueFromCSSProperty(modelLayout.paper_bgcolor);
        }
        // Set plot_bgcolor
        if (this.checkNested(modelLayout, 'plot_bgcolor')) {
          hiddenLayout.plot_bgcolor = this.getColorValueFromCSSProperty(modelLayout.plot_bgcolor);
        }
      }

      //
      const showWidget = this.showWidget();
      let displayStyle = 'display: inherit;';
      if (!showWidget) {
        displayStyle = 'display: none;';
      }
      const enableWidget = this.enableWidget();
      let enableStyle = 'pointer-events: initial; opacity:initial;';
      if (!enableWidget) {
        enableStyle = 'pointer-events: none; opacity:0.5;';
      }
      //
      let elem = $('#plotly' + idWidget)[0];
      if (bInteractive) {
        elem = $('#plotly' + idWidget + 'c')[0];
      }
      elem.setAttribute(
        'style',
        'text-align:center; height: inherit; width: inherit; background-color: transparent;' +
          displayStyle +
          enableStyle
      );

      $('#' + idDivPlotly).html('');

      const data = modelsHiddenParams[idInstance].fig?.data ?? modelsHiddenParams[idInstance].data;
      /* MBG issue bad width at runtime for Ploty widgets*/
      if (this.bIsInteractive) {
        if (hiddenLayout && hiddenLayout.autosize) {
          delete hiddenLayout.width;
          delete hiddenLayout.height;
        }
        const opts = modelsParameters[idInstance].hideModeBar ? { displayModeBar: false } : {};
        Plotly.newPlot(idDivPlotly, data, hiddenLayout, opts);
        this.setSelectionActuator();
      } else {
        const plotlyDivSelector = `#${idDivPlotly}`;

        // Create the Plotly DIV
        $(plotlyDivSelector).html();

        // Function to check if data or layout has changed
        const hasChanged = (currentData, currentLayout, idInstance) => {
          const lastData = modelsTempParams[idInstance].lastData;
          const lastLayout = modelsTempParams[idInstance].lastLayout;

          return !(_.isEqual(currentData, lastData) && _.isEqual(currentLayout, lastLayout));
        };

        const updateStoredState = (currentData, currentLayout, idInstance) => {
          modelsTempParams[idInstance].lastData = currentData;
          modelsTempParams[idInstance].lastLayout = currentLayout;
        };

        // Function to check if a Plotly plot exists on the given DIV
        const plotExists = (plotDiv) => {
          return plotDiv && plotDiv.data !== undefined;
        };

        if (plotExists(idDivPlotly)) {
          // MBG tmp optim
          if (hasChanged(data, hiddenLayout, idInstance)) {
            // Purge existing plot before updating to prevent any lingering processes or data
            Plotly.purge(idDivPlotly);
            Plotly.react(idDivPlotly, data, hiddenLayout);
          }
        } else {
          Plotly.newPlot(idDivPlotly, data, hiddenLayout);
        }

        // Update stored state and timestamp
        updateStoredState(data, hiddenLayout, idInstance);
      }
    };

    this.setSelectionActuator = function () {
      // MBG 17/02/2021
      this.bIsInteractive = bInteractive;
      let idDivPlotly = 'plotly' + idWidget;
      if (bInteractive) {
        idDivPlotly += 'c';
        const graphDiv = document.getElementById(idDivPlotly);
        graphDiv.on('plotly_selected', function (eventData) {
          if (!_.isUndefined(eventData)) {
            // Create array of array [numberOfTrace][dataSelected] and [numberOfTrace][customData]
            const dataSelected = Array(graphDiv.data.length)
              .fill(null)
              .map(() => []);
            const customSelected = Array(graphDiv.data.length)
              .fill(null)
              .map(() => []);

            eventData.points.forEach(function (point) {
              if (!_.isUndefined(point.pointNumber)) {
                const traceNumber = point.curveNumber;
                const index = point.pointNumber;

                dataSelected[traceNumber].push(index);

                if (!_.isUndefined(graphDiv.data[traceNumber].customdata)) {
                  customSelected[traceNumber].push(graphDiv.data[traceNumber].customdata[index]);
                }
              }

              if (!_.isUndefined(point.pointNumbers)) {
                const traceNumber = point.pointNumbers.curveNumber;
                pointNumbers.forEach(function (d) {
                  dataSelected[traceNumber].push(d);

                  if (!_.isUndefined(graphDiv.data[traceNumber].customdata)) {
                    customSelected[traceNumber].push(graphDiv.data[traceNumber].customdata[d]);
                  }
                });
              }
            });

            const selectionDescriptor = dataSelected.map(function (d, index) {
              return {
                trace: index,
                selection: d,
                customdata: customSelected[index],
              };
            });

            self.selection.setValue(selectionDescriptor);
            self.selection.updateCallback(self.selection, self.selection.getValue());
          } else {
            //      graphDiv.emit('plotly_deselect', null)
            //  self.selection.setValue({ "range": {} });
            //self.selection.updateCallback(self.selection, self.selection.getValue());
          }
        });
        graphDiv.on('plotly_deselect', function () {
          //     Plotly.restyle(graphDiv, { selectedpoints: [null] });
          self.selection.setValue({ range: {} });
          self.selection.updateCallback(self.selection, self.selection.getValue());
        });
      }
    };

    self.render();

    this.getByName = function (key) {
      if (this.hasOwnProperty(key)) {
        return this[key];
      }
    };

    this.getInteractive = function () {
      return this.bIsInteractive;
    };

    this.setInteractive = function (bInteractive) {
      if (bInteractive != this.bIsInteractive) {
        this.bIsInteractive = bInteractive;
        this.render();
      }
    };

    this.rescale = function () {
      if (this.bIsInteractive) {
        Plotly.Plots.resize($('#' + idDivPlotly)[0]);
      } else {
        this.render(); // to optimize here
      }
    };
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                           Plotly line                              | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.linePlotlyWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    this.numberOfAxis = modelsParameters[idInstance].numberOfAxis;

    /* Theme backward compatibility */
    if (!_.isUndefined(modelsParameters[idInstance].layout)) {
      modelsParameters[idInstance].layout = { ...plotlyColorParams, ...modelsParameters[idInstance].layout };
      // Set axis ticks color
      ['xaxis', 'yaxis'].forEach((axis) => {
        if (!_.isUndefined(modelsParameters[idInstance].layout[axis])) {
          modelsParameters[idInstance].layout[axis] = { ...axisParams, ...modelsParameters[idInstance].layout[axis] };
        }
      });
    }

    // cleanup first
    if (modelsHiddenParams[idInstance].data.length > this.numberOfAxis) {
      modelsHiddenParams[idInstance].data.splice(this.numberOfAxis, modelsHiddenParams[idInstance].data.length);
    }

    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      const result = [
        data && _isAxisLinear(data['layout'], 'xaxis')
          ? _createPlotlyNumericDataDescriptor('x')
          : _createPlotlyAnyDataDescriptor('x'),
      ];

      if (data && data.numberOfAxis) {
        const yLinear = _isAxisLinear(data['layout'], 'yaxis');
        for (let i = 1; i <= data.numberOfAxis; i++) {
          const name = 'y' + i;
          result.push(yLinear ? _createPlotlyNumericDataDescriptor(name) : _createPlotlyAnyDataDescriptor(name));
        }
      }

      return result;
    };

    this.x = {
      setValue: function (val) {
        //AEF
        if (_.isUndefined(val)) {
          swal('Invalid data value', 'value in x axis is undefined !', 'error');
          return;
        }
        if (!Array.isArray(val)) {
          if (typeof val == 'number' || typeof val == 'string' || typeof val == 'bigint') {
            val = [val];
            console.log('value in x axis is converted to an array.');
            //swal("Invalid data type", "value in x axis is converted to an array.", "warning");
          } else {
            swal('Invalid data type', 'x axis must be an array !', 'error');
            return;
          }
        }
        //
        modelsHiddenParams[idInstance].data[0].x = val;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].data[0].x;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
      setCaption: function (caption, bCaptionManuallyChanged) {
        modelsParameters[idInstance].layout.xaxis.title = caption;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
      },
    };

    for (let i = 1; i <= this.numberOfAxis; i++) {
      const axisName = 'y' + i;
      if (i > 1) {
        if (_.isUndefined(modelsHiddenParams[idInstance].data[i - 1])) {
          modelsHiddenParams[idInstance].data[i - 1] = { x: [], y: [], name: 'caption ' + (i - 1) };
        }
      }

      this[axisName] = {
        index: i - 1,

        setValue: function (val) {
          //AEF
          const i = this.index + 1;
          if (_.isUndefined(val)) {
            swal('Invalid data value', 'value in ' + 'y' + i + ' axis is undefined !', 'error');
            return;
          }
          if (!Array.isArray(val)) {
            if (typeof val == 'number' || typeof val == 'string' || typeof val == 'bigint') {
              val = [val];
              console.log('value in ' + 'y' + i + ' axis is converted to an array.');
              //swal("Invalid data type", "value in " + "y" + i + " axis is converted to an array.", "warning");
            } else {
              swal('Invalid data type', 'y' + i + ' axis must be an array !', 'error');
              return;
            }
          }
          //
          modelsHiddenParams[idInstance].data[this.index].y = val;
          modelsHiddenParams[idInstance].data[this.index].x = modelsHiddenParams[idInstance].data[0].x; // same x axis
          modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
          self.render();
        },
        getValue: function () {
          return modelsHiddenParams[idInstance].data[this.index].y;
        },
        addValueChangedHandler: function (n) {},
        removeValueChangedHandler: function (n) {},
        setCaption: function (caption, bCaptionManuallyChanged) {
          if (modelsParameters[idInstance].numberOfAxis == 1) {
            modelsParameters[idInstance].layout.yaxis.title = caption;
            modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
          } else {
            modelsHiddenParams[idInstance].data[this.index].name = caption;
            modelsParameters[idInstance].layout.yaxis.title = '';
            modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
          }
        },
      };
    }
  };
  // Inherit from base Plotly class
  this.linePlotlyWidget.prototype = basePlotlyWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                           Plotly bar                               | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.barPlotlyWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    this.numberOfAxis = modelsParameters[idInstance].numberOfAxis;

    /* Theme backward compatibility */
    if (!_.isUndefined(modelsParameters[idInstance].layout)) {
      modelsParameters[idInstance].layout = { ...plotlyColorParams, ...modelsParameters[idInstance].layout };
      // Set axis ticks color
      ['xaxis', 'yaxis'].forEach((axis) => {
        if (!_.isUndefined(modelsParameters[idInstance].layout[axis])) {
          modelsParameters[idInstance].layout[axis] = { ...axisParams, ...modelsParameters[idInstance].layout[axis] };
        }
      });
    }

    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      const result = [];

      if (data && data.numberOfAxis) {
        const xLinear = _isAxisLinear(data['layout'], 'xaxis');
        const yLinear = _isAxisLinear(data['layout'], 'yaxis');
        for (let i = 1; i <= data.numberOfAxis; i++) {
          result.push(xLinear ? _createPlotlyNumericDataDescriptor('x' + i) : _createPlotlyAnyDataDescriptor('x' + i));
          result.push(yLinear ? _createPlotlyNumericDataDescriptor('y' + i) : _createPlotlyAnyDataDescriptor('y' + i));
        }
      }

      return result;
    };

    // cleanup first
    if (modelsHiddenParams[idInstance].data.length > this.numberOfAxis) {
      modelsHiddenParams[idInstance].data.splice(this.numberOfAxis, modelsHiddenParams[idInstance].data.length);
    }

    delete this.x;

    for (let k = 1; k <= 2; k++) {
      const strAxis = k === 1 ? 'x' : 'y';

      for (let i = 1; i <= this.numberOfAxis; i++) {
        const axisName = strAxis + i;

        if (i > 1) {
          if (strAxis === 'x') {
            if (_.isUndefined(modelsHiddenParams[idInstance].data[i - 1])) {
              modelsHiddenParams[idInstance].data[i - 1] = { x: [], y: [], type: 'bar' };
            }
          }
        }

        this[axisName] = {
          index: i - 1,
          strAxis: strAxis,
          setValue: function (val) {
            modelsHiddenParams[idInstance].data[this.index][this.strAxis] = val;
            modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
            self.render();
          },
          getValue: function () {
            return modelsHiddenParams[idInstance].data[this.index][this.strAxis];
          },
          addValueChangedHandler: function (n) {},
          removeValueChangedHandler: function (n) {},
          setCaption: function (caption, bCaptionManuallyChanged) {
            if (modelsParameters[idInstance].numberOfAxis == 1) {
              modelsParameters[idInstance].layout[this.strAxis + 'axis'].title = caption;
              modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
            } else {
              modelsHiddenParams[idInstance].data[this.index].name = caption;
              //modelsParameters[idInstance].layout[this.strAxis + 'axis'].title = ''; // MBG 03/08/2017
            }
          },
        };
      }
    }
  };
  // Inherit from base Plotly class
  this.barPlotlyWidget.prototype = basePlotlyWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                           Plotly pie                               | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.piePlotlyWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    /* Theme backward compatibility */
    if (!_.isUndefined(modelsParameters[idInstance].layout)) {
      modelsParameters[idInstance].layout = { ...plotlyColorParams, ...modelsParameters[idInstance].layout };
    }

    const _LABELS_DESCRIPTOR = new WidgetActuatorDescription(
      'labels',
      'Array of labels',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_STRING_ARRAY
    );
    const _VALUES_DESCRIPTOR = new WidgetActuatorDescription(
      'values',
      'Array of numeric values',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER_ARRAY
    );
    // const _COLORS_DESCRIPTOR = new WidgetActuatorDescription(
    //   "colors",
    //   "Array of colors (as CSS strings, for ex. 'blue', '#0000FF' or 'rgb(0,0,255)')",
    //   WidgetActuatorDescription.READ,
    //   WidgetPrototypesManager.SCHEMA_STRING_ARRAY
    // );
    this.getActuatorDescriptions = function () {
      return [_LABELS_DESCRIPTOR, _VALUES_DESCRIPTOR /* _COLORS_DESCRIPTOR */];
    };

    this.labels = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].data[0].labels = val;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].data[0].labels;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
    };

    this.values = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].data[0].values = val;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].data[0].values;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
    };

    // this.colors = {
    //   setValue: function (val) {
    //     if (Array.isArray(val) && !_.isUndefined(val) && val != []) {
    //       modelsHiddenParams[idInstance].data[0].marker.colors = val;
    //       modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
    //       self.render();
    //     }
    //   },
    //   getValue: function () {
    //     return modelsHiddenParams[idInstance].layout.colorway;
    //   },
    //   addValueChangedHandler: function (n) {},
    //   removeValueChangedHandler: function (n) {},
    // };
  };
  // Inherit from base Plotly class
  this.piePlotlyWidget.prototype = basePlotlyWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                       Plotly 3D Surface                            | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.d3surfacePlotlyWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    /* Theme backward compatibility */
    if (!_.isUndefined(modelsParameters[idInstance].layout)) {
      modelsParameters[idInstance].layout = { ...plotlyColorParams, ...modelsParameters[idInstance].layout };
      delete modelsParameters[idInstance].layout.colorway;
      delete modelsParameters[idInstance].layout.legend;
    }

    const _X_DESCRIPTOR = new WidgetActuatorDescription(
      'x',
      "1d array for the grid's Xs",
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER_ARRAY
    );
    const _Y_DESCRIPTOR = new WidgetActuatorDescription(
      'y',
      "1d array for the grid's Ys",
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER_ARRAY
    );
    const _Z_DESCRIPTOR = new WidgetActuatorDescription(
      'z',
      "2d array of arrays for the grid's Zs",
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER_ARRAY_2D
    );
    this.getActuatorDescriptions = function () {
      return [_X_DESCRIPTOR, _Y_DESCRIPTOR, _Z_DESCRIPTOR];
    };

    this.x = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].data[0].x = val;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].data[0].x;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
      setCaption: function (caption, bCaptionManuallyChanged) {
        modelsParameters[idInstance].layout.scene.xaxis.title = caption;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
      },
    };

    this.y = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].data[0].y = val;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].data[0].y;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
      setCaption: function (caption, bCaptionManuallyChanged) {
        modelsParameters[idInstance].layout.scene.yaxis.title = caption;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
      },
    };

    this.z = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].data[0].z = val;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].data[0].z;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
      setCaption: function (caption, bCaptionManuallyChanged) {
        modelsParameters[idInstance].layout.scene.zaxis.title = caption;
        modelsHiddenParams[idInstance].layout = modelsParameters[idInstance].layout;
      },
    };
  };
  // Inherit from base Plotly class
  this.d3surfacePlotlyWidget.prototype = basePlotlyWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         Plotly Generic                             | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.genericPlotlyWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    const _DATA_DESCRIPTOR = new WidgetActuatorDescription(
      'data',
      'Plotly data array',
      WidgetActuatorDescription.READ,
      USE_PLOTLY_VALIDATION ? undefined : _SCHEMA_PLOTLY_DATA,
      USE_PLOTLY_VALIDATION
        ? (data) => (Plotly.validate(data, {}) || []).map((_) => new WidgetActuatorValidationError(_.msg))
        : undefined
    );
    const _LAYOUT_DESCRIPTOR = new WidgetActuatorDescription(
      'layout',
      'Plotly layout object',
      WidgetActuatorDescription.READ,
      USE_PLOTLY_VALIDATION ? undefined : _SCHEMA_PLOTLY_LAYOUT,
      USE_PLOTLY_VALIDATION
        ? (layout) => (Plotly.validate([], layout) || []).map((_) => new WidgetActuatorValidationError(_.msg))
        : undefined
    );
    const _SELECTION_DESCRIPTOR = new WidgetActuatorDescription(
      'selection',
      'Plotly selection',
      WidgetActuatorDescription.WRITE
    );
    this.getActuatorDescriptions = function () {
      return [_DATA_DESCRIPTOR, _LAYOUT_DESCRIPTOR, _SELECTION_DESCRIPTOR];
    };

    this.data = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].data = val;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].data;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
    };

    this.layout = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].layout = val;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].layout;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
    };

    this.selection = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].selection = val;
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].selection;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
    };
  };
  // Inherit from base Plotly class
  this.genericPlotlyWidget.prototype = basePlotlyWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         Plotly Python Generic                      | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.genericPlotlyPythonWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    const _FIG_DESCRIPTOR = new WidgetActuatorDescription(
      'fig',
      'Plotly figure object',
      WidgetActuatorDescription.READ
    );
    const _SELECTION_DESCRIPTOR = new WidgetActuatorDescription(
      'selection',
      'Plotly selection',
      WidgetActuatorDescription.WRITE
    );
    this.getActuatorDescriptions = function () {
      return [_FIG_DESCRIPTOR, _SELECTION_DESCRIPTOR];
    };

    this.fig = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].fig = val;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].fig;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
    };

    this.selection = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].selection = val;
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].selection;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
    };
  };
  // Inherit from base Plotly class
  this.genericPlotlyPythonWidget.prototype = basePlotlyWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                        Plotly Real-time                            | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.realTimePlotlyWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    var self = this;

    this.numberOfAxis = 1; //modelsParameters[idInstance].numberOfAxis;

    const _LAYOUT_DESCRIPTOR = new WidgetActuatorDescription(
      'layout',
      'Plotly layout object',
      WidgetActuatorDescription.READ,
      USE_PLOTLY_VALIDATION ? undefined : _SCHEMA_PLOTLY_LAYOUT,
      USE_PLOTLY_VALIDATION
        ? (layout) => (Plotly.validate([], layout) || []).map((_) => new WidgetActuatorValidationError(_.msg))
        : undefined
    );
    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'y1',
      'Numeric value to add to the plot',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    this.getActuatorDescriptions = function () {
      // const data = model || modelsParameters[idInstance];
      const result = [];

      /*if (data && data.numberOfAxis) {
                for (let i = 1; i <= data.numberOfAxis; i++) {
                    result.push('y' + i);
                }
            }*/
      result.push(_VALUE_DESCRIPTOR);
      result.push(_LAYOUT_DESCRIPTOR);

      return result;
    };

    // cleanup first
    if (modelsHiddenParams[idInstance].data.length > this.numberOfAxis) {
      modelsHiddenParams[idInstance].data.splice(this.numberOfAxis, modelsHiddenParams[idInstance].data.length);
    }

    for (let i = 1; i <= this.numberOfAxis; i++) {
      const axisName = 'y' + i;
      if (i > 1) {
        if (_.isUndefined(modelsHiddenParams[idInstance].data[i - 1])) {
          modelsHiddenParams[idInstance].data[i - 1] = { x: [], y: [], name: 'caption ' + (i - 1) };
        }
      }

      this[axisName] = {
        index: i - 1,

        setValue: function (val) {
          var time = new Date();
          //console.log('this.index=' + this.index);
          //modelsHiddenParams[idInstance].data[this.index].x = [time];
          //modelsHiddenParams[idInstance].data[this.index].y = [val];
          var idDivPlotly = 'plotly' + idWidget;
          if (bInteractive) {
            idDivPlotly = idDivPlotly + 'c';
          }
          Plotly.extendTraces(
            idDivPlotly,
            {
              //x : [[time]],
              y: [[val]],
            },
            [this.index]
          );
        },
        getValue: function () {
          return modelsHiddenParams[idInstance].data[this.index].y;
        },
        addValueChangedHandler: function (n) {},
        removeValueChangedHandler: function (n) {},
        setCaption: function (caption, bCaptionManuallyChanged) {
          /*
                    if (modelsParameters[idInstance].numberOfAxis == 1) {
                        modelsParameters[idInstance].layout.yaxis.title = caption;
                    } else {
                        modelsHiddenParams[idInstance].data[this.index].name = caption;
                        modelsParameters[idInstance].layout.yaxis.title = '';
                    }*/
        },
      };
    }

    this.layout = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].layout = val;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].layout;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
    };

    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
  };
  // Inherit from base Plotly class
  this.realTimePlotlyWidget.prototype = basePlotlyWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'plotly',
    widgetsDefinitionList: {
      plotlyLine: {
        factory: 'linePlotlyWidget',
        title: 'Plotly line',
        icn: 'plotly-line',
        help: 'wdg/wdg-plots/#plotly-line',
      },
      plotlyBar: {
        factory: 'barPlotlyWidget',
        title: 'Plotly bar',
        icn: 'plotly-bar',
        help: 'wdg/wdg-plots/#plotly-bar',
      },
      plotlyPie: {
        factory: 'piePlotlyWidget',
        title: 'Plotly pie',
        icn: 'plotly-pie',
        help: 'wdg/wdg-plots/#plotly-pie',
      },
      plotly3dSurface: {
        factory: 'd3surfacePlotlyWidget',
        title: 'Plotly 3D surface',
        icn: 'plotly-3D',
        help: 'wdg/wdg-plots/#plotly-3d-surface',
      },
      plotlyGeneric: {
        factory: 'genericPlotlyWidget',
        title: 'Plotly JavaScript generic',
        icn: 'plotly-javascript-generic',
        help: 'wdg/wdg-plots/#plotly-generic',
      },
      plotlyPyGeneric: {
        factory: 'genericPlotlyPythonWidget',
        title: 'Plotly Python generic',
        icn: 'plotly-python-generic',
        help: 'wdg/wdg-plots/#plotly-python-generic',
      },
      plotlyRealTime: { factory: 'realTimePlotlyWidget', title: 'Plotly real-time', icn: 'plotly-real-time' },
    },
  };
}

var plotlyWidgetsPlugin = new plotlyWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(plotlyWidgetsPlugin);
