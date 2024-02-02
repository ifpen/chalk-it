// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Ghiles HIDEUR                 │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import { pyodideManager } from 'kernel/base/pyodide-loader';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Parameters
modelsParameters.plotlyPyGeneric = {};
modelsParameters.matplotlib = {};

// Hidden params
modelsHiddenParams.plotlyPyGeneric = {
  fig: '',
};
modelsHiddenParams.matplotlib = {
  fig: '',
};

// Layout (default dimensions)
modelsLayout.plotlyPyGeneric = { height: '30vh', width: '30vw', minWidth: '50px', minHeight: '32px' };
modelsLayout.matplotlib = { height: '30vh', width: '30vw', minWidth: '50px', minHeight: '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function pyodideWidgetsPluginClass() {
  var hiddenDivDpi = document.createElement('div');
  hiddenDivDpi.setAttribute('style', 'height: 1in; width: 1in; left: 100%; position: fixed; top: 100%;');
  hiddenDivDpi.setAttribute('id', 'hiddenDivDpi');
  document.body.appendChild(hiddenDivDpi);

  var dpi_x = document.getElementById('hiddenDivDpi').offsetWidth;
  var dpi_y = document.getElementById('hiddenDivDpi').offsetHeight;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                          createVegaDiv                             | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  function createDiv(idDivContainer, idDivPythonWidget) {
    var widgetHtml = document.createElement('div');
    widgetHtml.setAttribute('id', idDivPythonWidget);
    widgetHtml.setAttribute(
      'style',
      'text-align:center; height: inherit; width: inherit; background-color: transparent'
    );
    $('#' + idDivContainer).html(widgetHtml);
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                      Plotly Python Generic                         | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.genericPlotlyPythonWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    this.rescale = function () {
      //this.render();
    };

    this.render = async function () {
      var idDivPlotlyPy = 'plotlyPython' + idWidget;
      if (bInteractive) {
        idDivPlotlyPy = idDivPlotlyPy + 'c';
      }
      createDiv(idDivContainer, idDivPlotlyPy);

      let pydDataNodeName = modelsHiddenParams[idInstance].fig;
      if (pydDataNodeName) {
        if (datanodesManager.getDataNodeByName(pydDataNodeName).status() == 'OK') {
          let renderingScript = 'fig = globalScope["' + pydDataNodeName + '"]\n';
          renderingScript =
            renderingScript +
            `
# convert figure to JSON
fig_json = fig.to_json(
validate=True,
pretty=False)
fig_json
`;
          try {
            const output = await pyodideManager.runPythonScript(renderingScript);
            const plotDef = JSON.parse(output);
            if (bInteractive) {
              Plotly.newPlot(idDivPlotlyPy, plotDef.data, plotDef.layout, plotDef.config);
            } else {
              $('#' + idDivPlotlyPy).html('');
              $('#' + idDivPlotlyPy).html('<img id="png-export-' + idDivPlotlyPy + '"></img>');
              var img_png = $('#png-export-' + idDivPlotlyPy);
              var img_url;
              Plotly.newPlot(idDivPlotlyPy, plotDef.data, plotDef.layout, plotDef.config).then(function (gd) {
                Plotly.toImage(gd, {
                  height: $('#' + idDivContainer).height(),
                  width: $('#' + idDivContainer).width(),
                }).then(function (url) {
                  img_url = url;
                  Plotly.purge(gd);
                  img_png.attr('src', img_url);
                  gd.style.minHeight = gd.parentNode.style.minHeight;
                  gd.style.minWidth = gd.parentNode.style.minWidth;
                  gd.style.width = gd.parentNode.style.width;
                  gd.style.height = gd.parentNode.style.height;

                  img_png[0].style.minHeight = parseInt(gd.parentNode.style.minHeight) + 'px';
                  img_png[0].style.minWidth = parseInt(gd.parentNode.style.minWidth) + 'px';
                  img_png[0].style.width = parseFloat(gd.parentNode.style.width) + 'vw';
                  img_png[0].style.height = parseFloat(gd.parentNode.style.height) + 'vh';
                });
              });
            }
          } catch (err) {
            console.log(err);
          }
        }
      }
    };

    const _FIG_DESCRIPTOR = new WidgetActuatorDescription(
      'fig',
      'Plotly figure object',
      WidgetActuatorDescription.READ
    );
    this.getActuatorDescriptions = function () {
      return [_FIG_DESCRIPTOR];
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

    // GHI #235
    pyodideManager.loadPyodideLibs({
      standardLibs: [],
      micropipLibs: ['plotly'],
    });

    self.render();
  };

  // Inherit from baseWidget class
  this.genericPlotlyPythonWidget.prototype = baseWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         Matplotlib Generic                         | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.genericMatplotlibWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    this.render = async function () {
      var idDivMatplotlib = 'innerMatplotlib' + idWidget;
      if (bInteractive) {
        idDivMatplotlib = idDivMatplotlib + 'c';
      }
      createDiv(idDivContainer, idDivMatplotlib);

      let pydDataNodeName = modelsHiddenParams[idInstance].fig;
      if (pydDataNodeName) {
        if (datanodesManager.getDataNodeByName(pydDataNodeName).status() == 'OK') {
          let renderingScript = 'fig = globalScope["' + pydDataNodeName + '"]\n';
          let size_x = $('#' + idDivMatplotlib).width() / dpi_x;
          let size_y = $('#' + idDivMatplotlib).height() / dpi_y;

          // plt.figure(figsize=(800/my_dpi, 800/my_dpi), dpi=my_dpi)
          renderingScript = renderingScript + 'fig.set_size_inches(' + size_x + ',' + size_y + ')\n';
          renderingScript =
            renderingScript +
            `
import io, base64
buf = io.BytesIO()
fig.savefig(buf, format='png')
buf.seek(0)
img_str = 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')
img_str
`;
          try {
            const output = await pyodideManager.runPythonScript(renderingScript);

            $('#' + idDivMatplotlib).html('<img id="png-export-' + idDivMatplotlib + '"></img>');
            var img_png = $('#png-export-' + idDivMatplotlib);
            var img_url = output;
            img_png.attr('src', img_url);

            //let gd = document.getElementById(idDivMatplotlib);
            img_png[0].style.width = 'inherit'; //parseFloat(gd.parentNode.style.width) + 'vw';
            img_png[0].style.height = 'inherit'; //parseFloat(gd.parentNode.style.height) + 'vh';
          } catch (err) {
            console.log(err);
          }
        }
      }
    };

    const _FIG_DESCRIPTOR = new WidgetActuatorDescription(
      'fig',
      'Matplotlib figure object',
      WidgetActuatorDescription.READ
    );
    this.getActuatorDescriptions = function () {
      return [_FIG_DESCRIPTOR];
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

    // GHI #235
    pyodideManager.loadPyodideLibs({
      standardLibs: ['matplotlib'],
      micropipLibs: [],
    });

    self.render();
  };

  // Inherit from baseWidget class
  this.genericMatplotlibWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'pyodide',
    widgetsDefinitionList: {
      plotlyPyGeneric: {
        factory: 'genericPlotlyPythonWidget',
        title: 'Plotly Python generic',
        icn: 'plotly-python-generic',
        help: 'wdg/wdg-plots/#plotly-python-generic',
      },
      matplotlib: {
        factory: 'genericMatplotlibWidget',
        title: 'Matplotlib generic',
        icn: 'matplolib-generic',
        help: 'wdg/wdg-plots/#matplotlib',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
pyodideWidgetsPluginClass.prototype = basePlugin.prototype;

var pyodideWidgetsPlugin = new pyodideWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(pyodideWidgetsPlugin);
