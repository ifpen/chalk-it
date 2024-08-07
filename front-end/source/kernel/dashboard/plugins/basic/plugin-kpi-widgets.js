// ┌───────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                               │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                                   │ \\
// | Licensed under the Apache License, Version 2.0                                │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Mongi BEN GAID, Tristan BARTEMENT, Guillaume CORBELIN   │ \\
// └───────────────────────────────────────────────────────────────────────────────┘ \\
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

import { getFontFactor } from 'kernel/dashboard/scaling/scaling-utils';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.kpiCard = { value: '--' };

// Parameters
modelsParameters.kpiCard = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  valuePosition: 'bottom',
  valueFontSize: 2,
  valueColor: 'var(--widget-color)',
  valueFontFamily: 'var(--widget-font-family)',
  decimalDigits: 3,
  unit: 'unitText',
  displayUnit: false,
  unitFontSize: 0.5,
  unitColor: 'var(--widget-label-color)',
  borderShadow: false /*,
    "backgroundColor": "#FFFFFF"*/,
};

// Layout (default dimensions)
modelsLayout.kpiCard = {
  height: '16vh',
  width: '18vw',
  minWidth: '64px',
  minHeight: '32px',
};

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function kpiWidgetsPluginClass() {
  this.kpiCardWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;
    var unitContent = '';

    this.enable = function () {};

    this.disable = function () {};

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      if (modelsParameters[idInstance].borderShadow) {
        widgetHtml.setAttribute('class', 'card-kpi-container card-shadow');
      } else {
        widgetHtml.setAttribute('class', 'card-kpi-container ');
      }

      var divContent = '<div class="card-kpi">';
      divContent = divContent + '<div class="card-body">';
      divContent = divContent + '<div class="row align-items-center">';

      var labelContent = '';
      if (modelsParameters[idInstance].displayLabel) {
        // conversion to enable HTML tags
        const labelText = this.getTransformedText('label');
        labelContent = labelContent + '<h5 class="card-mt-0 text-truncate"';
        labelContent =
          labelContent +
          ' style="text-align:center;' +
          this.labelFontSize() +
          this.labelColor() +
          this.labelFontFamily() +
          '">' +
          labelText;
        labelContent = labelContent + '</h5>';
      }

      var valueContent = '';
      valueContent =
        valueContent + '<div id="card-value-' + idWidget + '" class="card-value" style="text-align:center;';
      valueContent = valueContent + this.valueFontSize() + this.valueColor() + this.valueFontFamily() + '">' + '</div>';

      if (modelsParameters[idInstance].valuePosition == 'top') {
        divContent = valueContent + labelContent;
      } else {
        divContent = labelContent + valueContent;
      }

      divContent = divContent + '</div>';
      divContent = divContent + '</div>';
      divContent = divContent + '</div>';

      widgetHtml.innerHTML = divContent;
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
      widgetHtml.setAttribute('style', displayStyle + enableStyle);
      $('#' + idDivContainer).html(widgetHtml);
      this.applyDisplayOnWidget();
      $('#card-value-' + idWidget)[0].innerText = self.valueFormat(modelsHiddenParams[idInstance].value);

      unitContent =
        '<span id ="unit-span' +
        idWidget +
        '" style="text-align: left; color: ' +
        modelsParameters[idInstance].unitColor +
        '; font-size: calc(7px + ' +
        modelsParameters[idInstance].unitFontSize * getFontFactor() +
        'vw + 0.4vh);">' +
        modelsParameters[idInstance].unit +
        '</span>';

      if (modelsParameters[idInstance].unit != '' && modelsParameters[idInstance].displayUnit) {
        $('#card-value-' + idWidget).append(unitContent);
      }

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Current value',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_ANY_PRIMITIVE
    );
    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        $('#card-value-' + idWidget)[0].innerText = self.valueFormat(modelsHiddenParams[idInstance].value);
        if (modelsParameters[idInstance].unit != '' && modelsParameters[idInstance].displayUnit) {
          $('#card-value-' + idWidget).append(unitContent);
        }
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].value;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
      setCaption: function (caption, bCaptionManuallyChanged) {
        if (modelsParameters[idInstance].inheritLabelFromData) {
          self.captionHelper(caption, self.bIsInteractive, bCaptionManuallyChanged);
          self.render();
        }
      },
      clearCaption: function () {
        if (modelsParameters[idInstance].inheritLabelFromData) {
          modelsParameters[idInstance].label = '';
        }
        self.render();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.kpiCardWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'kpiCard',
    widgetsDefinitionList: {
      kpiCard: { factory: 'kpiCardWidget', title: 'KPI value', icn: 'kpi' },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
kpiWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var kpiWidgetsPlugin = new kpiWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(kpiWidgetsPlugin);
