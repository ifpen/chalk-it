// ┌────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                            │ \\
// ├────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2018-2023 IFPEN                                                │ \\
// | Licensed under the Apache License, Version 2.0                             │ \\
// ├────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Ameur HAMDOUNI, Tristan BARTEMENT,    │ \\
// │                      Guillaume CORBELIN                                    │ \\
// └────────────────────────────────────────────────────────────────────────────┘ \\
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.scoringFullCircularGauge = { value: 75 };
modelsHiddenParams.scoringSemiCircularGauge = { value: 75 };
modelsHiddenParams.scoringArchCircularGauge = { value: 75 };

// Parameters
modelsParameters.scoringFullCircularGauge = {
  label: '',
  inheritLabelFromData: true,
  min: 0,
  max: 100,
  unit: '',
  valueColor: 'var(--widget-color)',
  thick: 10,
  thicknessColor: 'var(--widget-range-color)',
  duration: 1500,
  thicknessBackgroundColor: 'var(--widget-segment-color)',
};
modelsParameters.scoringSemiCircularGauge = {
  label: '',
  inheritLabelFromData: true,
  min: 0,
  max: 100,
  unit: '',
  valueColor: 'var(--widget-color)',
  thick: 10,
  thicknessColor: 'var(--widget-range-color)',
  duration: 1500,
  thicknessBackgroundColor: 'var(--widget-segment-color)',
};
modelsParameters.scoringArchCircularGauge = {
  label: '',
  inheritLabelFromData: true,
  min: 0,
  max: 100,
  unit: '',
  valueColor: 'var(--widget-color)',
  thick: 10,
  thicknessColor: 'var(--widget-range-color)',
  duration: 1500,
  thicknessBackgroundColor: 'var(--widget-segment-color)',
};

// Layout (default dimensions)
modelsLayout.scoringFullCircularGauge = { height: '15vh', width: '11vw' };
modelsLayout.scoringSemiCircularGauge = { height: '15vh', width: '11vw' };
modelsLayout.scoringArchCircularGauge = { height: '15vh', width: '11vw' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function scoringWidgetsPluginClass() {
  var selfClass = this;
  var idCircularGauge = 0;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                   Dipatch functions (public)                       | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.scoringFullCircularGauge = function (idDivContainer, idWidget, idInstance, bInteractive) {
    idCircularGauge++;
    return new selfClass.scoringCircularGaugeWidget(idDivContainer, idCircularGauge, idInstance, bInteractive, 'full');
  };

  this.scoringSemiCircularGauge = function (idDivContainer, idWidget, idInstance, bInteractive) {
    idCircularGauge++;
    return new selfClass.scoringCircularGaugeWidget(idDivContainer, idCircularGauge, idInstance, bInteractive, 'semi');
  };

  this.scoringArchCircularGauge = function (idDivContainer, idWidget, idInstance, bInteractive) {
    idCircularGauge++;
    return new selfClass.scoringCircularGaugeWidget(idDivContainer, idCircularGauge, idInstance, bInteractive, 'arch');
  };

  this.clear = function () {
    idCircularGauge = 0;
  };

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         Circular Gauge                             | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.scoringCircularGaugeWidget = function (idDivContainer, idWidget, idInstance, bInteractive, typeWidget) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive, typeWidget);

    var self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('style', 'text-align: center; height: inherit; width: inherit; cursor: inherit');
      widgetHtml.setAttribute('id', 'div-for-ng-gauge' + idWidget);
      $('#' + idDivContainer).html(widgetHtml);
      var gaugeSize = Math.min($('#div-for-ng-gauge' + idWidget).width(), $('#div-for-ng-gauge' + idWidget).height());
      var modelObj = 'gaugeValues.val' + idWidget;
      var divContent = angular.element(
        '<ng-gauge id="ng-gauge' +
          idWidget +
          '" style="' +
          this.valueColor() +
          '" size="' +
          gaugeSize +
          '" type="' +
          typeWidget +
          '" thick="' +
          modelsParameters[idInstance].thick +
          '" min="' +
          modelsParameters[idInstance].min +
          '" max="' +
          modelsParameters[idInstance].max +
          '" value="' +
          modelObj +
          '"' +
          '" cap="round" label="' +
          modelsParameters[idInstance].label +
          '" duration="' +
          modelsParameters[idInstance].duration +
          '"' +
          this.thicknessColor() +
          this.thicknessBackgroundColor() +
          '" append="' +
          modelsParameters[idInstance].unit +
          '"></ng-gauge>'
      );

      var target = document.getElementById('div-for-ng-gauge' + idWidget);
      angular.element(target).append(divContent);

      angular
        .element(document.body)
        .injector()
        .invoke([
          '$compile',
          '$rootScope',
          function ($compile, $rootScope) {
            var scope = angular.element(divContent).scope();
            if (!$rootScope.gaugeValues) {
              $rootScope.gaugeValues = {};
            }
            $rootScope.gaugeValues['val' + idWidget] = modelsHiddenParams[idInstance].value;
            $compile(divContent)(scope);
          },
        ]);
      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Numeric value',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        if (!typeof val === 'number') {
          return;
        }
        modelsHiddenParams[idInstance].value = val;
        angular
          .element(document.body)
          .injector()
          .invoke([
            '$compile',
            '$rootScope',
            function ($compile, $rootScope) {
              $rootScope.gaugeValues['val' + idWidget] = val;
              $rootScope.safeApply();
            },
          ]);
      },
      getValue: function () {
        return $('#ng-gauge' + idWidget)[0].value; // or modelsHiddenParams[idInstance].value ?
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
        }
      },
      clearCaption: function () {
        modelsParameters[idInstance].label = '';
        self.render();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.scoringCircularGaugeWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'scoring',
    widgetsDefinitionList: {
      scoringFullCircularGauge: {
        factory: 'scoringFullCircularGauge',
        title: 'Full-circular gauge',
        icn: 'full-circular-gauge',
        help: 'wdg/wdg-scoring-gauge/',
      },
      scoringSemiCircularGauge: {
        factory: 'scoringSemiCircularGauge',
        title: 'Semi-circular gauge',
        icn: 'semi-circular-gauge',
        help: 'wdg/wdg-scoring-gauge/',
      },
      scoringArchCircularGauge: {
        factory: 'scoringArchCircularGauge',
        title: 'Arch-circular gauge',
        icn: 'widgets icn-arch-circular-gauge',
        help: 'wdg/wdg-scoring-gauge/',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
scoringWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var scoringWidgetsPlugin = new scoringWidgetsPluginClass();

/*******************************************************************/
/**************************** plugin load **************************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(scoringWidgetsPlugin);
