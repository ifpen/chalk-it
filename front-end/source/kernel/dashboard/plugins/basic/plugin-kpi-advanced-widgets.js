// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Ghiles HIDEUR, Tristan BARTEMENT, Guillaume CORBELIN  │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import * as echarts from 'echarts';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout, modelsTempParams } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.advancedKpiCard = {
  value: '--',
  subLabel: '--',
};

// Parameters
modelsParameters.advancedKpiCard = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  valuePosition: 'bottom',
  valueFontSize: 3,
  valueColor: 'var(--widget-color)',
  valueFontFamily: 'var(--widget-font-family)',
  decimalDigits: 3,
  subLabelFontSize: 0.5,
  subLabelColor: 'var(--widget-subtext-color)',
  subLabelFontFamily: 'var(--widget-font-family)',
  borderShadow: false,
  graphColor: 'var(--widget-label-color)',
  /*"backgroundColor": "#FFFFFF"*/
};

//Temporary params (not to be serialized)
modelsTempParams.advancedKpiCard = {
  echartsInstance: '',
  echartsListData: [],
};

// Layout (default dimensions)
modelsLayout.advancedKpiCard = {
  height: '120px',
  width: '280px',
  minWidth: '64px',
  minHeight: '32px',
};

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function advancedKpiWidgetsPluginClass() {
  this.advancedKpiCardWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;
    let refreshInterval = 1000;

    this.enable = function () {};

    this.disable = function () {};

    this.rescale = function () {
      this.render();
    };

    this.initEcharts = function (idDivEcharts) {
      modelsTempParams[idInstance].echartsInstance = echarts.init(document.getElementById(idDivEcharts));
    };

    this.getEchartsData = function () {
      let now = Date.now() + refreshInterval;
      return {
        name: now.toString(),
        value: [now, modelsHiddenParams[idInstance].value],
      };
    };

    this.pushEchartsListData = function (data) {
      modelsTempParams[idInstance].echartsListData.push(data);
    };

    this.shiftEchartsListData = function () {
      modelsTempParams[idInstance].echartsListData.shift();
    };

    this.getEchartsListData = function () {
      return modelsTempParams[idInstance].echartsListData;
    };

    this.getEchartsOptions = function () {
      return {
        xAxis: {
          type: 'time',
          boundaryGap: false,
          axisLabel: false,
          axisLine: false,
          splitLine: {
            show: false,
          },
        },
        yAxis: {
          type: 'value',
          boundaryGap: ['', ''],
          axisLabel: false,
          axisLine: false,
          splitLine: {
            show: false,
          },
        },
        visualMap: {
          type: 'continuous',
          show: false,
          realtime: true,
          inRange: {
            color: self.graphColor(),
          },
        },
        grid: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        },
        series: [
          {
            type: 'line',
            smooth: 0.25,
            showSymbol: false,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: self.graphColor(),
                },
                {
                  offset: 1,
                  color: '#ffffff',
                },
              ]),
            },
            data: modelsTempParams[idInstance].echartsListData,
          },
        ],
        animationDuration: 0,
        animationDurationUpdate: refreshInterval,
        animationEasing: 'linear',
        animationEasingUpdate: 'linear',
      };
    };

    this.initEchartsOptions = function () {
      let options = this.getEchartsOptions();
      try {
        modelsTempParams[idInstance].echartsInstance.setOption(options);
      } catch (e) {
        console.log(e);
      }
    };

    this.setEchartsOptions = function (data) {
      modelsTempParams[idInstance].echartsInstance.setOption({
        series: [
          {
            data: data,
          },
        ],
      });
    };

    this.updateEcharts = function (idDivEcharts) {
      if (bInteractive) {
        if (_.isUndefined(modelsTempParams[idInstance].windowValue)) {
          modelsTempParams[idInstance].windowValue = modelsHiddenParams[idInstance].window;
        }
        this.initEcharts(idDivEcharts);
        this.initEchartsOptions();

        if (modelsHiddenParams[idInstance].window == -1) {
          this.pushEchartsListData(this.getEchartsData());
          this.setEchartsOptions(this.getEchartsListData());
        } else if (modelsHiddenParams[idInstance].window >= 0) {
          if (modelsTempParams[idInstance].windowValue == 0) {
            this.shiftEchartsListData();
          }
          this.pushEchartsListData(this.getEchartsData());
          this.setEchartsOptions(this.getEchartsListData());
          if (modelsTempParams[idInstance].windowValue != 0) {
            --modelsTempParams[idInstance].windowValue;
          }
        }
        self.enable();
      } else {
        this.initEcharts(idDivEcharts);
        this.initEchartsOptions();

        var preview = modelsTempParams[idInstance].echartsInstance.getDataURL();
        modelsTempParams[idInstance].echartsInstance.dispose();
        $('#' + idDivEcharts).html('<img src="' + preview + '"/>');
        self.disable();
      }
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      if (modelsParameters[idInstance].borderShadow) {
        widgetHtml.setAttribute('class', 'card-kpi-container card-shadow');
      } else {
        widgetHtml.setAttribute('class', 'card-kpi-container');
      }

      var divContent = '<div class="card-kpi">';
      divContent = divContent + '<div class="card-body">';
      divContent = divContent + '<div id="items-' + idWidget + '" class="row align-items-center">';

      var labelContent = '';
      labelContent = labelContent + '<h5 id="advanced-card-label-' + idWidget + '" class="card-mt-0 text-truncate"';
      labelContent =
        labelContent +
        ' style="text-align:center; margin-bottom: 4rem;' +
        this.labelFontSize() +
        this.labelColor() +
        this.labelFontFamily() +
        '"></h5>';

      var valueContent = '';
      valueContent =
        valueContent +
        '<div id="advanced-card-value-' +
        idWidget +
        '" class="card-value" style="text-align:center; margin-bottom: 1.7rem;';
      valueContent = valueContent + this.valueFontSize() + this.getValueColor() + this.valueFontFamily() + '"></div>';

      var subLabelContent = '';
      subLabelContent =
        subLabelContent +
        '<div id="advanced-card-sub-label-' +
        idWidget +
        '" class="card-value" style="text-align:center; margin-bottom: 2rem; ';
      subLabelContent =
        subLabelContent + this.subLabelFontSize() + this.subLabelColor() + this.subLabelFontFamily() + '"></div>';

      var echartsDivContent = '';
      var idDivEcharts = 'echarts' + idWidget;
      if (bInteractive) {
        idDivEcharts = idDivEcharts + 'c';
      }
      echartsDivContent =
        echartsDivContent +
        '<div id="' +
        idDivEcharts +
        '" style="text-align:left; height: 11.9vh; width: 100%; background-color: transparent"></div>';

      if (modelsParameters[idInstance].valuePosition == 'top') {
        divContent = valueContent + subLabelContent + labelContent + echartsDivContent;
      } else {
        divContent = labelContent + valueContent + subLabelContent + echartsDivContent;
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
      /**************************label*********************/
      if (modelsParameters[idInstance].displayLabel) {
        // conversion to enable HTML tags
        const labelText = this.getTransformedText('label');
        $('#advanced-card-label-' + idWidget)[0].innerHTML = labelText;
      } else {
        $('#advanced-card-label-' + idWidget).hide();
      }

      /**************************Value*********************/
      $('#advanced-card-value-' + idWidget)[0].innerText = self.valueFormat(modelsHiddenParams[idInstance].value);

      /**************************subLabel******************/
      $('#advanced-card-sub-label-' + idWidget)[0].innerText = self.valueFormat(
        modelsHiddenParams[idInstance].subLabel
      );

      /**************************echarts*******************/
      this.updateEcharts(idDivEcharts);
    };

    /************************************************/
    const JSON_SCHEMA = {
      $schema: WidgetPrototypesManager.SCHEMA_VERSION,
      $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:advancedKpiCardWidget',
      type: 'object',
      properties: {
        value: { type: ['string', 'number', 'boolean'] },
        subLabel: { type: ['string', 'number', 'boolean'] },
      },
      required: ['value', 'subLabel'],
    };
    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'extendedValue',
      'Current value and sub-label',
      WidgetActuatorDescription.READ,
      JSON_SCHEMA
    );
    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR];
    };

    this.extendedValue = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance] = val;
      },
      getValue: function () {
        return modelsHiddenParams[idInstance];
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
  this.advancedKpiCardWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'advancedKpiCard',
    widgetsDefinitionList: {
      advancedKpiCard: { factory: 'advancedKpiCardWidget', title: 'Advanced KPI value', icn: 'kpi-advanced' },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
advancedKpiWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var advancedKpiWidgetsPlugin = new advancedKpiWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(advancedKpiWidgetsPlugin);
