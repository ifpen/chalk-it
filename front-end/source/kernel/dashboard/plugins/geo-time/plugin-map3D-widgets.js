// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Benoit LEHMAN                                          │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\
import { Deck } from '@deck.gl/core';
// import { MapboxLayer } from '@deck.gl/mapbox';

import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget } from '../widget-base';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// models
modelsHiddenParams.map3D = {};

// Parameters
modelsParameters.map3D = {};

// Layout (default dimensions)
modelsLayout.map3D = { height: '5vh', width: '19vw', minWidth: '100px', minHeight: '100px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function map3DWidgetPluginClass() {
  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         map 3D widget                              | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  this.map3DWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    this.enable = function () {};
    this.disable = function () {};
    this.updateValue = function (e) {};
    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      const widgetHtml = document.createElement('div');
      widgetHtml.setAttribute(
        'style',
        'display: table;text-align: left; height: inherit; width: inherit; cursor: inherit'
      );
      const newDivId = 'div-for-map3D' + idWidget;
      widgetHtml.setAttribute('id', newDivId);
      $('#' + idDivContainer).html(widgetHtml);
      const deckGlInstance = new Deck({
        mapStyle: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        mapboxApiAccessToken: 'your-mapbox-access-token',
        container: newDivId,
        controller: true,
        initialViewState: {
          longitude: -0.6414350308477879,
          latitude: 43.412733329460025,
          zoom: 18,
          minZoom: 5,
          maxZoom: 30,
          pitch: 40.5,
        },
      });
      $('.mapboxgl-control-container').remove();
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.map3DWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'map3D',
    widgetsDefinitionList: {
      map3D: {
        factory: 'map3DWidget',
        title: 'map 3D',
        icn: 'map',
        help: 'wdg/wdg-geo-time/#map-3D',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
map3DWidgetPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
const map3DPlugin = new map3DWidgetPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(map3DPlugin);
