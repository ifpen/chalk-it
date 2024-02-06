// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Tristan BARTEMENT, Guillaume CORBELIN  │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'underscore';
import * as echarts from 'echarts';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Parameters
modelsParameters.echartsGeneric = {};

const echartsDefaultColors = [
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
modelsHiddenParams.echartsGeneric = {
  option: {
    color: echartsDefaultColors,
  },
  selection: {},
};

// Layout (default dimensions)
modelsLayout.echartsGeneric = { height: '30vh', width: '30vw', minWidth: '50px', minHeight: '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function echartsWidgetsPluginClass() {
  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                       createEchartsDiv                             | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  function createEchartsDiv(idDivContainer, pId, bInteractive) {
    var widgetHtml = document.createElement('div');
    var idDivEcharts = 'echarts' + pId;
    if (bInteractive) {
      idDivEcharts = idDivEcharts + 'c';
    }
    widgetHtml.setAttribute('id', idDivEcharts);
    widgetHtml.setAttribute(
      'style',
      'text-align:center; height: inherit; width: inherit; background-color: transparent'
    );
    $('#' + idDivContainer).html(widgetHtml);
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                            Echarts Generic                         | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.genericEchartsWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    this.rescale = function () {
      this.render();
    };

    this.updateValue = function (object) {
      if (modelsHiddenParams[idInstance].selection) {
        modelsHiddenParams[idInstance].selection = object;
        if (!_.isUndefined(self.selection.updateCallback)) {
          self.selection.updateCallback(self.selection, self.selection.getValue());
        }
      }
    };

    // Convert CSS Custom Properties (ie: var(--widget-color)) to hexa codes
    this.getColorValueFromCSSProperty = function (value) {
      var color = value;
      if (color.includes('var(--')) {
        var realValue = value.substring(4, value.length - 1);
        color = window.getComputedStyle(document.documentElement).getPropertyValue(realValue);
      }
      return color;
    };

    this.render = function () {
      // Deep copy to prevent changing modelsHiddenParams[idInstance].option when setting colors
      var opt = JSON.parse(JSON.stringify(modelsHiddenParams[idInstance].option));
      // Set default colors if none
      if (!opt.hasOwnProperty('color')) {
        opt.color = echartsDefaultColors;
      }
      // Convert colors to hexa
      opt.color = opt.color.map((color) => this.getColorValueFromCSSProperty(color));

      createEchartsDiv(idDivContainer, idWidget, bInteractive);

      // use configuration item and data specified to show chart
      if (bInteractive) {
        var myChart = echarts.init(document.getElementById('echarts' + idWidget + 'c'));
        try {
          myChart.setOption(opt);
        } catch (e) {
          console.log(e);
        }
        myChart.on('datazoom', (e) => {
          self.updateValue({
            start: e.start,
            end: e.end,
          });
        });
      } else {
        var myChart = echarts.init(document.getElementById('echarts' + idWidget));
        try {
          myChart.setOption(opt);
        } catch (e) {
          console.log(e);
        }
        var preview = myChart.getDataURL();
        myChart.dispose();
        $('#echarts' + idWidget).html('<img src="' + preview + '"/>');
      }
    };

    const _OPTION_DESCRIPTOR = new WidgetActuatorDescription(
      'option',
      'Chart definition',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_ANY_OBJECT
    );
    const _SELECTION_DESCRIPTOR = new WidgetActuatorDescription(
      'selection',
      'Current selection',
      WidgetActuatorDescription.WRITE,
      WidgetPrototypesManager.SCHEMA_ANY_OBJECT
    );
    this.getActuatorDescriptions = function () {
      return [_OPTION_DESCRIPTOR, _SELECTION_DESCRIPTOR];
    };

    this.option = {
      setValue: function (val) {
        if (val != modelsHiddenParams[idInstance].option && val != '' && !_.isUndefined(val)) {
          modelsHiddenParams[idInstance].option = val; // eliminate circular dependencies
          self.render();
        }
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].option;
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

    self.render();
  };

  // Inherit from baseWidget class
  this.genericEchartsWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'echarts',
    widgetsDefinitionList: {
      echartsGeneric: {
        factory: 'genericEchartsWidget',
        title: 'Echarts generic',
        icn: 'echarts-generic-javascript',
        help: 'wdg/wdg-plots/#echarts',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
echartsWidgetsPluginClass.prototype = basePlugin.prototype;

var echartsWidgetsPlugin = new echartsWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(echartsWidgetsPlugin);
