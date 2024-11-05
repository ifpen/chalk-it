// ┌──────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                              │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                                  │ \\
// | Licensed under the Apache License, Version 2.0                               │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Ghiles HIDEUR, Tristan BARTEMENT, Guillaume CORBELIN   │ \\
// └──────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
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
modelsHiddenParams.saveToFileButton = {
  value: '',
};

// Parameters
modelsParameters.saveToFileButton = {
  text: 'Save to file',
  fileName: 'export.txt',
  enableBase64Export: false,
  buttonFontSize: 0.3,
  buttonFontFamily: 'var(--widget-font-family)',
  buttonTextColor: 'var(--widget-button-primary-text)',
  buttonDefaultColor: 'var(--widget-button-primary-color)',
  buttonActiveColor: 'var(--widget-button-active-color)',
  buttonHoverColor: 'var(--widget-button-hover-color)',
};

// Layout (default dimensions)
modelsLayout.saveToFileButton = { height: '6vh', width: '8vw', minWidth: '55px', minHeight: '24px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function saveToFileButtonWidgetsPluginClass() {
  this.buttonSaveToFileWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.saveFile = function () {
      const instanceParams = modelsParameters[idInstance];
      const hiddenParams = modelsHiddenParams[idInstance];
      const fileName = instanceParams.fileName;
      const str = hiddenParams.value;
      instanceParams.enableBase64Export ??= false;

      if (!str) return;

      const dataUrl = instanceParams.enableBase64Export
        ? `data:text/plain;base64,${btoa(unescape(encodeURIComponent(str)))}`
        : `data:text/plain;charset=utf-8,${encodeURIComponent(str)}`;

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      link.click();
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      const $widgetHtml = $('<div>', {
        id: 'button-save-to-file-widget-html' + idWidget,
        class: 'button-widget-html',
      });
      const $container = $('#' + idDivContainer);
      const valueHeightPx = Math.min($container.height(), $container.width() / 2); // keepRatio

      const fontSize = modelsParameters[idInstance]?.buttonFontSize || 0.5;
      const fontFactor = fontSize * getFontFactor();

      const styles = `
        text-align: center;
        vertical-align: middle;
        font-size: calc(7px + ${fontFactor}vw + 0.4vh);
        height: ${valueHeightPx}px;
        display: table-cell;
        ${this.buttonFontFamily()}
      `;
      const classes = `btn btn-block btn-lg ${idInstance}widgetCustomColor`;

      this.setButtonColorStyle();

      const text = this.getTransformedText('text');
      const divContent = `<a style="${styles}" class="${classes}" id="button-save-to-file${idWidget}">${text}</a>`;

      $widgetHtml.html(divContent);

      const showWidget = this.showWidget();
      const enableWidget = this.enableWidget();

      $widgetHtml.css({
        height: valueHeightPx + 'px',
        display: showWidget ? 'table' : 'none',
        'pointer-events': enableWidget ? 'initial' : 'none',
        opacity: enableWidget ? 'none' : '0.5',
      });

      $('#' + idDivContainer).html($widgetHtml);

      this.applyDisplayOnWidget();

      $('#button-save-to-file' + idWidget).on('click', () => {
        this.saveFile();
      });
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'File content',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
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
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.buttonSaveToFileWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'saveToFileButton',
    widgetsDefinitionList: {
      saveToFileButton: {
        factory: 'buttonSaveToFileWidget',
        title: 'Save to file button',
        icn: 'export-to-file',
        help: 'wdg/wdg-basics/#save-to-file-button',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
saveToFileButtonWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
const saveToFileButtonWidgetsPlugin = new saveToFileButtonWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(saveToFileButtonWidgetsPlugin);
