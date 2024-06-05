// ┌──────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                              │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                                  │ \\
// | Licensed under the Apache License, Version 2.0                               │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Ghiles HIDEUR, Tristan BARTEMENT, Guillaume CORBELIN   │ \\
// └──────────────────────────────────────────────────────────────────────────────┘ \\

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
    var self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.saveFile = function () {
      const filename = modelsParameters[idInstance].fileName;
      let str = modelsHiddenParams[idInstance].value;
      if (!str) return;

      str = 'data:text/plain;charset=utf-8,' + str;
      const data = encodeURI(str);
      const link = document.createElement('a');
      link.setAttribute('href', data);
      link.setAttribute('download', filename);
      link.click();
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'button-save-to-file-widget-html' + idWidget);
      widgetHtml.setAttribute('class', 'button-widget-html');
      var valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 2); // keepRatio
      var fontSize = 0.5;
      if (!_.isUndefined(modelsParameters[idInstance].buttonFontSize)) {
        fontSize = modelsParameters[idInstance].buttonFontSize;
      }
      var styleDef =
        'style="text-align: center; vertical-align: middle;' +
        'font-size: calc(7px + ' +
        fontSize * getFontFactor() +
        'vw + 0.4vh); height: ' +
        valueHeightPx +
        'px; display:table-cell; ' +
        this.buttonFontFamily() +
        '" class="btn btn-block btn-lg ' +
        idInstance +
        'widgetCustomColor';

      this.setButtonColorStyle();

      // conversion to enable HTML tags
      const text = this.getTransformedText('text');

      var divContent = '';
      divContent = '<a ' + styleDef + '" id="button-save-to-file' + idWidget + '">' + '  ' + text + '  ' + '</a>';

      widgetHtml.innerHTML = divContent;
      //
      const showWidget = this.showWidget();
      let displayStyle = 'display: table;';
      if (!showWidget) {
        displayStyle = 'display: none;';
      }
      const enableWidget = this.enableWidget();
      let enableStyle = 'pointer-events: initial; opacity:initial;';
      if (!enableWidget) {
        enableStyle = 'pointer-events: none; opacity:0.5;';
      }
      //
      widgetHtml.setAttribute('style', 'height: ' + valueHeightPx + 'px;' + displayStyle + enableStyle);
      $('#' + idDivContainer).html(widgetHtml);

      $('#button-save-to-file' + idWidget).on('click', function () {
        self.saveFile();
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
var saveToFileButtonWidgetsPlugin = new saveToFileButtonWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(saveToFileButtonWidgetsPlugin);
