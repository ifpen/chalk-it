// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Ghiles HIDEUR                 │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Parameters
modelsParameters.matplotlib = {};

modelsHiddenParams.matplotlib = {
  fig: {
    type: 'png',
    content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  },
};

// Layout (default dimensions)
modelsLayout.matplotlib = { height: '30vh', width: '30vw', minWidth: '50px', minHeight: '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function pyodideWidgetsPluginClass() {
  const hiddenDivDpi = document.createElement('div');
  hiddenDivDpi.setAttribute('style', 'height: 1in; width: 1in; left: 100%; position: fixed; top: 100%;');
  hiddenDivDpi.setAttribute('id', 'hiddenDivDpi');
  document.body.appendChild(hiddenDivDpi);

  const dpi_x = document.getElementById('hiddenDivDpi').offsetWidth;
  const dpi_y = document.getElementById('hiddenDivDpi').offsetHeight;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                          createDiv                                 | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  function createDiv(idDivContainer, idDivPythonWidget) {
    const widgetHtml = document.createElement('div');
    widgetHtml.setAttribute('id', idDivPythonWidget);
    $('#' + idDivContainer).html(widgetHtml);
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         Matplotlib Generic                         | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.genericMatplotlibWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    this.render = async function () {
      let idDivMatplotlib = 'innerMatplotlib' + idWidget;
      if (bInteractive) {
        idDivMatplotlib += 'c';
      }

      createDiv(idDivContainer, idDivMatplotlib);

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
      let elem = $('#' + idDivMatplotlib);

      elem.attr(
        'style',
        'text-align:center; height: inherit; width: inherit; background-color: transparent; margin: auto; object-fit: contain; ' +
          displayStyle +
          enableStyle
      );
      this.applyDisplayOnWidget();
      let size_x = $('#' + idDivMatplotlib).width() / dpi_x;
      let size_y = $('#' + idDivMatplotlib).height() / dpi_y;

      const output = modelsHiddenParams[idInstance].fig;

      $('#' + idDivMatplotlib).html('<img id="png-export-' + idDivMatplotlib + '"></img>');
      const img_bin = $('#png-export-' + idDivMatplotlib);
      const img_url = 'data:' + output.type + ';base64,' + output.content;
      img_bin.attr('src', img_url);

      img_bin[0].style.width = 'inherit';
      img_bin[0].style.height = 'inherit';
      img_bin[0].style['object-fit'] = 'contain';
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

    self.render();
  };

  // Inherit from baseWidget class
  this.genericMatplotlibWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'pyodide',
    widgetsDefinitionList: {
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
