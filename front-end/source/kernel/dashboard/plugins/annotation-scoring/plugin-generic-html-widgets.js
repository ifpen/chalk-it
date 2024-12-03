// ┌────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                            │ \\
// ├────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                                │ \\
// | Licensed under the Apache License, Version 2.0                             │ \\
// ├────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Ghiles HIDEUR, Guillaume CORBELIN, Tristan BARTEMENT │ \\
// └────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

import React from 'react';
import ReactDOM from 'react-dom';
import MyComponent from './MyComponent';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.annotationHtml = {
  html: '',
};

// Parameters
modelsParameters.annotationHtml = {
  fontsize: 0.3,
  backgroundColor: 'rgba(0, 0, 0, 0)',
  textColor: 'var(--widget-color)',
  valueFontFamily: 'var(--widget-font-family)',
  textAlign: 'left',
  displayBorder: false,
  centerVertically: true,
};

// Layout (default dimensions)
modelsLayout.annotationHtml = { height: '240px', width: '460px', minWidth: '50px', minHeight: '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function genericHtmlWidgetPluginClass() {
  this.genericHtmlWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    if (_.isUndefined(modelsParameters[idInstance].textAlign)) modelsHiddenParams[idInstance].textAlign = 'left'; // fix old projects

    this.enable = function () {};

    this.disable = function () {};

    this.rescale = function () {
      this.render();
    };

    if (_.isUndefined(modelsParameters[idInstance].centerVertically)) {
      modelsParameters[idInstance].centerVertically = true;
    }

    this.hasScrollBar = function (element) {
      return element.get(0).scrollHeight > element.get(0).clientHeight;
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      var styleCenterVertically = '';
      ReactDOM.render(<MyComponent />, widgetHtml);
      $('#' + idDivContainer).html(widgetHtml);

    };

    const _HTML_DESCRIPTOR = new WidgetActuatorDescription(
      'html',
      'Html content',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    this.getActuatorDescriptions = function () {
      return [_HTML_DESCRIPTOR];
    };

    this.html = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].html = val;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].html;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.genericHtmlWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'annotation',
    widgetsDefinitionList: {
      annotationHtml: {
        factory: 'genericHtmlWidget',
        title: 'Generic HTML',
        icn: 'generic-html',
        help: 'wdg/wdg-annotation-video/#generic-html',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
genericHtmlWidgetPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var genericHtmlWidgetPlugin = new genericHtmlWidgetPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(genericHtmlWidgetPlugin);
