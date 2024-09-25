// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Benoit LEHMAN                                          │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\

import { ScatterplotLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
                    
   
      // 1 - Create The Mapbox Map
      // Need a valid Token

      const map = new mapboxgl.Map({
        container: newDivId,
        accessToken: 'valid token',
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [-122.45, 37.78],
        zoom: 12,
      });

      // 2 - Create a mapboxOverlay on the map for DeckGL layer

      map.once('load', () => {
        const deckOverlay = new MapboxOverlay({
          interleaved: true,
          layers: [
            new ScatterplotLayer({
              id: 'deckgl-circle',
              data: [
                {position: [-122.45, 37.78]}
              ],
              getPosition: d => d.position,
              getFillColor: [255, 0, 0, 100],
              getRadius: 1000,
            })
          ]
        });
      
        map.addControl(deckOverlay);
      });
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
