// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Ameur HAMDOUNI                │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import 'leaflet';

// !! Order matters, a lot !!
import 'simpleheat';
import 'leaflet-modal';
import 'idb';
import 'leaflet.offline';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet.markercluster';
import 'leaflet.awesome-markers';

import _ from 'lodash';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout, modelsTempParams } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { nFormatter, syntaxHighlight } from 'kernel/datanodes/plugins/thirdparty/utils';
import { dashState } from 'angular/modules/dashboard/dashboard';
import bbox from '@mapbox/geojson-extent';
import * as d3 from 'd3';
import { initTileSevers } from './plugin-map-widgets-tiles';
import { setOfflineSupport } from './plugin-map-widgets-offline';

import {
  _SCHEMA_SELECTED_POINT,
  _SCHEMA_IMAGE_OVERLAY,
  _SCHEMA_SVG_POINT_OVERLAY,
  _SCHEMA_SVG_OVERLAY,
  __SCHEMA_VALUED_COORD,
  __SCHEMA_COORD,
  __SCHEMA_HEATMAP_DENSITY_CONFIG,
  __SCHEMA_HEATMAP_CONFIG,
  _SCHEMA_HEATMAP_DENSITY,
  _SCHEMA_HEATMAP_DENSITY_SAMPLED,
  _SCHEMA_HEATMAP,
  _SCHEMA_HEATMAP_SAMPLED,
  __SCHEMA_GEOJSON_COORD,
  __SCHEMA_GEOJSON_COORDINATES,
  _SCHEMA_LINE_HEATMAP,
  __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE,
  __SCHEMA_GEOJSON_GEOMETRY_ALL,
  _SCHEMA_CHOROPLETH,
  _SCHEMA_GEOJSON,
  _SCHEMA_SELECTED_GEOJSON,
} from 'kernel/dashboard/plugins/geo-time/plugin-map-widgets-schemas';

import {
  getLayerInformation,
  updateLayerInformation,
  addDrawingFeatures,
  cutLayer,
  updateSelectedGeoJSON,
} from './plugin-map-geoman';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Hidden params (memory)
modelsHiddenParams.hereMaps = { inputGeoJson: {}, mapMatchingResult: {}, heatMapData: {} };
modelsHiddenParams.openStreetMaps = {
  geoJson: { geoJsonLayers: [], geoJsonBounds: [] },
  choropleth: { choroplethLayers: [], choroplethBounds: [] },
  lineHeatMap: { lineHeatMapLayers: [], lineHeatMapBounds: [] },
  heatMap: { heatMapData: [], heatMapBuffer: [] },
  imageOverlay: { imageData: [] },
  svgOverlay: { svgData: [], svgElements: [] },
  legends: [],
  colors: [
    '#800080',
    '#FF00FF',
    '#000080',
    '#0000FF',
    '#008080',
    '#00FFFF',
    '#FFFF00',
    '#800000',
    '#6666ff',
    '#cc6699',
    '#66ff66',
    '#666699',
    '#996633',
    '#ff0000',
    '#669999',
    '#ffff99',
  ],
};

// Temporary params (not to be serialized)
modelsTempParams.openStreetMaps = {
  geoJson: { geoJsonLayers: [] },
  choropleth: { choroplethLayers: [] },
  lineHeatMap: { lineHeatMapLayers: [] },
  heatMap: { heatMapLayers: [] },
  imageOverlay: { imageLayers: [] },
  svgOverlay: { svgLayers: [] },
  mapObj: null,
};

// Parameters
modelsParameters.openStreetMaps = {
  geoJson: { numberOfLayers: 1 },
  choropleth: { numberOfLayers: 0 },
  heatMap: { numberOfLayers: 0, sampledDisplay: false, densityHeatMap: false },
  lineHeatMap: { numberOfLayers: 0 },
  imageOverlay: { numberOfLayers: 0 },
  svgOverlay: { numberOfLayers: 0 /*, 'sampledDisplay': false*/ },
  defaultCenter: { latitude: 48.872063, longitude: 2.331773, zoom: 16 },
  offlineSupport: false,
  tileServer: 'MapboxStreets',
  drawingFeatures: false,
  drawingFeaturesOptions: {
    point: true,
    line: true,
    polygon: true,
    rectangle: true,
    modal: false,
  },
  captureClickEvent: false,
  markerCluster: true,
};

// Layout (default dimensions)
modelsLayout.openStreetMaps = { height: '300px', width: '540px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function mapWidgetsPluginClass() {
  // MBG : TODO refactor and improve : ajoute du vide en bas du document
  var arrowDef = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrowDef.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  arrowDef.setAttribute('width', '0');
  arrowDef.setAttribute('height', '0');
  var arrowDefStr =
    '<defs><marker id="styledArrow" markerUnits="strokeWidth" markerWidth="12" markerHeight="12" viewBox="0 0 12 12" refX="6" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 L6,6 L2,2" style="fill: black;"></path></marker></defs>';
  arrowDef.innerHTML = arrowDefStr;
  var hiddenDiv = document.createElement('div');
  hiddenDiv.setAttribute('style', 'width:0px; height:0px; margin:0px; padding: 0px');
  hiddenDiv.setAttribute('id', 'hiddenDiv');
  hiddenDiv.appendChild(arrowDef);
  document.body.appendChild(hiddenDiv);

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         Open Street Maps                           | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  this.openStreetMapsWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    let drawingFeatures = modelsParameters[idInstance].drawingFeatures;
    let captureClickEvent = modelsParameters[idInstance].captureClickEvent;
    let userMarkerCluster = modelsParameters[idInstance].markerCluster;
    let drawControlConfig = {
      drawCircle: false,
      drawCircleMarker: false,
      drawText: false,
      drawMarker: true,
      drawPolyline: true,
      drawPolygon: true,
      drawRectangle: true,
    };

    // backwards compatibility
    const instanceOptions = modelsParameters[idInstance].drawingFeaturesOptions;
    if (instanceOptions.polygone !== undefined) {
      instanceOptions.polygon = instanceOptions.polygone;
      delete instanceOptions.polygone;
    }

    if (drawingFeatures) {
      drawControlConfig = {
        drawCircle: false,
        drawCircleMarker: false,
        drawText: false,
        drawMarker: modelsParameters[idInstance].drawingFeaturesOptions.point,
        drawPolyline: modelsParameters[idInstance].drawingFeaturesOptions.line,
        drawPolygon: modelsParameters[idInstance].drawingFeaturesOptions.polygon,
        drawRectangle: modelsParameters[idInstance].drawingFeaturesOptions.rectangle,
      };
    }

    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    // For HeatMap legends
    // based on old d3 3.3. to upgrade
    var body = d3.select('body');
    var length = 100;
    var colorStops = [0, 25, 50, 75, 100];

    this.numberOfGeoJsonLayers = modelsParameters[idInstance].geoJson.numberOfLayers;
    if (modelsParameters[idInstance].choropleth) {
      this.numberOfChoroplethLayers = modelsParameters[idInstance].choropleth.numberOfLayers;
    } else {
      this.numberOfChoroplethLayers = 0;
    }
    if (modelsParameters[idInstance].lineHeatMap) {
      this.numberOfLineHeatMapLayers = modelsParameters[idInstance].lineHeatMap.numberOfLayers;
    } else {
      this.numberOfLineHeatMapLayers = 0;
    }
    this.numberOfHeatMapLayers = modelsParameters[idInstance].heatMap.numberOfLayers;

    // handle old projects with no heatMapBuffer
    if (_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapBuffer)) {
      modelsHiddenParams[idInstance].heatMap.heatMapBuffer = [];
    }

    // handle old projects with no imageOverlay
    if (_.isUndefined(modelsParameters[idInstance].imageOverlay)) {
      this.numberOfImageLayers = 0;
      modelsParameters[idInstance].imageOverlay = { numberOfLayers: 0 };
    } else {
      this.numberOfImageLayers = modelsParameters[idInstance].imageOverlay.numberOfLayers;
    }
    if (_.isUndefined(modelsHiddenParams[idInstance].imageOverlay)) {
      modelsHiddenParams[idInstance].imageOverlay = { imageData: [] };
    }

    // handle old projects with no svgOverlay
    if (_.isUndefined(modelsParameters[idInstance].svgOverlay)) {
      this.numberOfSvgLayers = 0;
      modelsParameters[idInstance].svgOverlay = { numberOfLayers: 0 };
    } else {
      this.numberOfSvgLayers = modelsParameters[idInstance].svgOverlay.numberOfLayers;
    }
    if (_.isUndefined(modelsHiddenParams[idInstance].svgOverlay)) {
      modelsHiddenParams[idInstance].svgOverlay = { svgData: [], svgElements: [] };
    }

    // handle old projects with no lineHeatMap
    if (_.isUndefined(modelsParameters[idInstance].lineHeatMap)) {
      this.numberOfLineHeatMapLayers = 0;
      modelsParameters[idInstance].lineHeatMap = { numberOfLayers: 0 };
    } else {
      this.numberOfLineHeatMapLayers = modelsParameters[idInstance].lineHeatMap.numberOfLayers;
    }
    if (_.isUndefined(modelsHiddenParams[idInstance].lineHeatMap)) {
      modelsHiddenParams[idInstance].lineHeatMap = { lineHeatMapLayers: [], lineHeatMapBounds: [] };
    }

    // handle old projects with no choropleth
    if (_.isUndefined(modelsParameters[idInstance].choropleth)) {
      this.numberOfChoroplethLayers = 0;
      modelsParameters[idInstance].choropleth = { numberOfLayers: 0 };
    } else {
      this.numberOfChoroplethLayers = modelsParameters[idInstance].choropleth.numberOfLayers;
    }
    if (_.isUndefined(modelsHiddenParams[idInstance].choropleth)) {
      modelsHiddenParams[idInstance].choropleth = { choroplethLayers: [], choroplethBounds: [] };
    }

    var mapLayers;

    // cloning of tmp params
    if (_.isUndefined(self.mapLayers)) {
      self.mapLayers = jQuery.extend(true, {}, modelsTempParams.openStreetMaps);
    }

    var currentBaseLayer;
    this.configStore = [];

    // cleanup first
    // -- geoJson
    if (modelsHiddenParams[idInstance].geoJson.geoJsonLayers.length > self.numberOfGeoJsonLayers) {
      modelsHiddenParams[idInstance].geoJson.geoJsonLayers.splice(self.numberOfGeoJsonLayers);
    }
    if (modelsHiddenParams[idInstance].geoJson.geoJsonBounds.length > self.numberOfGeoJsonLayers) {
      modelsHiddenParams[idInstance].geoJson.geoJsonBounds.splice(self.numberOfGeoJsonLayers);
    }

    if (self.mapLayers.geoJson.geoJsonLayers.length > self.numberOfGeoJsonLayers) {
      self.mapLayers.geoJson.geoJsonLayers.splice(self.numberOfGeoJsonLayers);
    }

    // -- choropleth
    if (modelsHiddenParams[idInstance].choropleth.choroplethLayers.length > self.numberOfChoroplethLayers) {
      modelsHiddenParams[idInstance].choropleth.choroplethLayers.splice(self.numberOfChoroplethLayers);
    }
    if (modelsHiddenParams[idInstance].choropleth.choroplethBounds.length > self.numberOfChoroplethLayers) {
      modelsHiddenParams[idInstance].choropleth.choroplethBounds.splice(self.numberOfChoroplethLayers);
    }

    if (self.mapLayers.choropleth.choroplethLayers.length > self.numberOfChoroplethLayers) {
      self.mapLayers.choropleth.choroplethLayers.splice(self.numberOfChoroplethLayers);
    }
    // -- lineHeatMap
    if (modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers.length > self.numberOfLineHeatMapLayers) {
      modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers.splice(self.numberOfLineHeatMapLayers);
    }
    if (modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds.length > self.numberOfLineHeatMapLayers) {
      modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds.splice(self.numberOfLineHeatMapLayers);
    }

    if (self.mapLayers.lineHeatMap.lineHeatMapLayers.length > self.numberOfLineHeatMapLayers) {
      self.mapLayers.lineHeatMap.lineHeatMapLayers.splice(self.numberOfLineHeatMapLayers);
    }
    // -- heatMap
    if (modelsHiddenParams[idInstance].heatMap.heatMapData.length > self.numberOfHeatMapLayers) {
      modelsHiddenParams[idInstance].heatMap.heatMapData.splice(self.numberOfHeatMapLayers);
      modelsHiddenParams[idInstance].legends.splice(self.numberOfHeatMapLayers);
    }

    if (modelsHiddenParams[idInstance].heatMap.heatMapBuffer.length > self.numberOfHeatMapLayers) {
      modelsHiddenParams[idInstance].heatMap.heatMapBuffer.splice(self.numberOfHeatMapLayers);
      modelsHiddenParams[idInstance].legends.splice(self.numberOfHeatMapLayers);
    }

    if (self.mapLayers.heatMap.heatMapLayers.length > self.numberOfHeatMapLayers) {
      self.mapLayers.heatMap.heatMapLayers.splice(self.numberOfHeatMapLayers);
    }

    // -- imageOverlay
    if (modelsHiddenParams[idInstance].imageOverlay.imageData.length > self.numberOfImageLayers) {
      modelsHiddenParams[idInstance].imageOverlay.imageData.splice(self.numberOfImageLayers);
    }

    if (self.mapLayers.imageOverlay.imageLayers.length > self.numberOfImageLayers) {
      self.mapLayers.imageOverlay.imageLayers.splice(self.numberOfImageLayers);
    }

    // -- svgOverlay
    if (modelsHiddenParams[idInstance].svgOverlay.svgData.length > self.numberOfSvgLayers) {
      modelsHiddenParams[idInstance].svgOverlay.svgData.splice(self.numberOfSvgLayers);
      modelsHiddenParams[idInstance].svgOverlay.svgElements.splice(self.numberOfSvgLayers);
    }

    if (self.mapLayers.svgOverlay.svgLayers.length > self.numberOfSvgLayers) {
      self.mapLayers.svgOverlay.svgLayers.splice(self.numberOfSvgLayers);
    }

    this.getColorScale = function (colorScaleName, reverseColorScale, min, max) {
      // Default interpolator
      var interpolator = d3['interpolateYlOrRd'];
      // Availlable interpolator : https://github.com/d3/d3-scale-chromatic

      if (
        !_.isUndefined(colorScaleName) &&
        !_.isUndefined(d3[colorScaleName]) &&
        colorScaleName.includes('interpolate')
      ) {
        interpolator = d3[colorScaleName];
      }

      if (!_.isUndefined(reverseColorScale) && reverseColorScale) {
        return d3.scaleSequential().interpolator(interpolator).domain([max, min]);
      } else {
        return d3.scaleSequential().interpolator(interpolator).domain([min, max]);
      }
    };

    this.goToFirstRadioButton = function () {
      if (dashState.tabActive == 'play') {
        if (self.numberOfHeatMapLayers > 0) {
          var nbRadioShadow = 0;
          if (!_.isUndefined($("input[name='leaflet-base-layers']"))) {
            nbRadioShadow = $("input[name='leaflet-base-layers']").length;
          }
          // temporary hack, waiting for fix in leaflet
          for (var k = 0; k < nbRadioShadow; k++) {
            if ($.contains(document.getElementById(idInstance + 'c'), $("input[name='leaflet-base-layers']")[k])) {
              if (!_.isUndefined(modelsHiddenParams[idInstance])) {
                if (modelsHiddenParams[idInstance].legends != []) {
                  $("input[name='leaflet-base-layers']")[k].click();
                  var zeroKey = _.keys(modelsHiddenParams[idInstance].legends)[0];
                  self.showLegend(zeroKey);
                  self.currentBaseLayer = zeroKey;
                  self.mapInPlayLoaded = true;
                  document.removeEventListener('play-tab-loaded', self.goToFirstRadioButton);
                  return;
                }
              }
            }
          }
        }
      }
    };

    this.getLayerInformation = getLayerInformation;
    this.updateLayerInformation = updateLayerInformation;
    this.updateSelectedGeoJSON = updateSelectedGeoJSON;
    this.cutLayer = cutLayer;

    if (captureClickEvent) {
      this.selectedPoint = {
        updateCallback: function () {},
        getValue: function () {
          return modelsHiddenParams[idInstance].selectedPoint;
        },
        setValue: function (val) {
          /* not needed : datanode should not update this widget */
        },
        addValueChangedHandler: function (updateDataFromWidget) {
          this.updateCallback = updateDataFromWidget;
        },
        removeValueChangedHandler: function (updateDataFromWidget) {},
        setCaption: function (caption) {},
        clearCaption: function () {},
      };
    }

    if (drawingFeatures) {
      this.selectedGeoJson = {
        updateCallback: function () {},
        getValue: function () {
          return modelsHiddenParams[idInstance].selectedGeoJson;
        },
        setValue: function (val) {
          modelsHiddenParams[idInstance].selectedGeoJson = val;
        },
        addValueChangedHandler: function (updateDataFromWidget) {
          if (widgetConnector.widgetsConnection[idInstance].sliders.selectedGeoJson.dataNode !== 'None') {
            this.updateCallback = updateDataFromWidget;
          }
        },
        removeValueChangedHandler: function (updateDataFromWidget) {},
        setCaption: function (caption) {},
        clearCaption: function () {},
      };
    }

    this.modal = function (options) {
      if (modelsParameters[idInstance].drawingFeaturesOptions.modal) {
        var _layerInfos = self.getLayerInformation(options.leafletId);
        var _tmp = [
          '<div class="modal-header"><h4>{title} </h4></div>',
          '<h5 class="pull-left" style="padding-left: 10px"><a>Please add a title and a short description</a></h5>',
          '<div class="modal-body">',
          '<div class="row">{content}</div>',
          '</div>',
          '<div class="modal-footer">',
          '<input id="dialog-ok" type="submit" class="bouton {OK_CLS}" value="Ok">',
          '<input id="dialog-ok" type="submit" class="bouton  {CANCEL_CLS}" value="Cancel">',
          '</div>',
        ].join('');
        var _cntt = [
          '<table>',
          '<body>',
          '<tr>',
          '<td style="width: 40%;padding-top: 20px;">Title</td>',
          '<td style="width: 60%;padding-top: 20px;">',
          '<textarea type="text" class="form-control"  style="width:190px;max-width: 200px ;max-height: 40px  ;color: #34495e" rows="1" id="modalInput1"  placeholder="Enter title">',
          _layerInfos.title,
          '</textarea>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td style="width: 30%;padding-top: 20px;">Description</td>',
          '<td style="width: 70%;padding-top: 20px;">',
          '<textarea type="text" class="form-control"  style="width:190px;max-width: 200px ;max-height: 70px  ;color: #34495e" rows="2" id="modalInput2"  placeholder="Enter Description">',
          _layerInfos.description,
          '</textarea>',
          '</td>',
          '</tr>',
          '</body>',
          '</table>',
        ].join('');

        if (options.type === 'editPoint') {
        }
        self.map.openModal({
          leafletId: options.leafletId || 'NA',
          content: _cntt,
          template: _tmp,
          okText: 'Ok',
          title: _layerInfos.title,
          description: _layerInfos.description,
          cancelText: 'Cancel',
          OK_CLS: 'modal-ok',
          CANCEL_CLS: 'modal-cancel',
          MODAL_CONTENT_CLS: 'modal-content modal-content-black',
          width: 350,

          onShow: function (evt) {
            var modal = evt.modal;
            L.DomEvent.on(modal._container.querySelector('.modal-ok'), 'click', function () {
              options.title = document.getElementById('modalInput1').value;
              options.description = document.getElementById('modalInput2').value;
              var d = new Date();
              options.timeStamp = d.toISOString(); // MBG 10/09/2020
              self.updateLayerInformation(options.leafletId, options, modelsHiddenParams, idInstance, self);
              modal.hide();
            }).on(modal._container.querySelector('.modal-cancel'), 'click', function () {
              modal.hide();
            });
          },
        });
      }
    };

    this.addDrawingFeatures = addDrawingFeatures;

    this.render = function (fromApi) {
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'openStreetMap' + idWidget);
      //
      const showWidget = this.showWidget();
      let displayStyle = 'display: block;';
      if (!showWidget) {
        displayStyle = 'display: none;';
      }
      const enableWidget = this.enableWidget();
      let enableStyle = 'pointer-events: inherit; opacity:initial;';
      if (!enableWidget) {
        enableStyle = 'pointer-events: none; opacity:0.5;';
      }
      //
      const elem = $('#' + idDivContainer)[0];
      elem.setAttribute('style', 'width: inherit; height: inherit;' + displayStyle + enableStyle);
      widgetHtml.setAttribute('style', 'width: inherit; height: inherit;');
      if (fromApi) {
        return;
      }
      document.addEventListener('play-tab-loaded', self.goToFirstRadioButton);
      self.mapInPlayLoaded = false;
      $('#' + idDivContainer).html(widgetHtml);
      this.applyDisplayOnWidget();
      self.map.eachLayer(function (layer) {
        self.map.removeLayer(layer);
      });
      self.map = L.map('openStreetMap' + idWidget, { preferCanvas: true }).setView(
        [modelsParameters[idInstance].defaultCenter.latitude, modelsParameters[idInstance].defaultCenter.longitude],
        modelsParameters[idInstance].defaultCenter.zoom
      );

      // MBG for Olivier L.
      modelsTempParams[idInstance].mapObj = self.map;
      if (captureClickEvent) {
        if (this.bIsInteractive) {
          self.map.on('click', function (evt) {
            if (modelsHiddenParams[idInstance].selectedPoint) {
              modelsHiddenParams[idInstance].selectedPoint = {
                lat: evt.latlng.lat,
                lag: evt.latlng.lng,
              };
              self.selectedPoint.updateCallback(self.selectedPoint, self.selectedPoint.getValue());
            } else {
              modelsHiddenParams[idInstance].selectedPoint = {
                lat: evt.latlng.lat,
                lag: evt.latlng.lng,
              };
              self.selectedPoint.updateCallback(self.selectedPoint, self.selectedPoint.getValue());
            }
          });
        }
      }

      if (!this.bIsInteractive) {
        self.map.dragging.disable();
        self.map.touchZoom.disable();
        self.map.doubleClickZoom.disable();
        self.map.scrollWheelZoom.disable();
        self.map.boxZoom.disable();
        self.map.keyboard.disable();
      }

      // list of possible tile servers
      var tileServers = initTileSevers();

      var ts = 'MapboxStreets';
      if (!_.isUndefined(modelsParameters[idInstance].tileServer)) {
        if (_.includes(_.keys(tileServers), modelsParameters[idInstance].tileServer)) {
          ts = modelsParameters[idInstance].tileServer;
        } else {
          /* TODO : good error message at edit mode to send */
        }
      }

      var tileConf = {
        url: tileServers[ts].url,
        maxZoom: tileServers[ts].maxZoom,
        attribution:
          'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          tileServers[ts].attribution,
      };

      if (!_.isUndefined(tileServers[ts].subdomains)) {
        tileConf.subdomains = tileServers[ts].subdomains;
      }

      if (!_.isUndefined(tileServers[ts].id)) {
        tileConf.id = tileServers[ts].id;
      }

      if (!_.isUndefined(tileServers[ts].apikey)) {
        tileConf.apikey = tileServers[ts].apikey;
      }

      if (!_.isUndefined(tileServers[ts].format)) {
        tileConf.format = tileServers[ts].format;
      }

      if (!_.isUndefined(tileServers[ts].style)) {
        tileConf.style = tileServers[ts].style;
      }

      if (!_.isUndefined(tileServers[ts].tileSize)) {
        tileConf.tileSize = tileServers[ts].tileSize;
      }

      if (!_.isUndefined(tileServers[ts].zoomOffset)) {
        tileConf.zoomOffset = tileServers[ts].zoomOffset;
      }

      if (!_.isUndefined(tileServers[ts].accessToken)) {
        tileConf.accessToken = tileServers[ts].accessToken;
      }

      if (modelsParameters[idInstance].offlineSupport) {
        setOfflineSupport(self, tileConf, modelsParameters, idInstance, idWidget, tileServers, ts);
      } else {
        self.baseLayer = L.tileLayer(tileServers[ts].url, tileConf);
        self.baseLayer.addTo(self.map);
      }

      L.control.scale().addTo(self.map);

      self.map.zoomControl.setPosition('topright'); // MBG 07/02/2019 : avoid disturbing legend view

      self.ctrl = L.control
        .layers(
          {},
          {},
          {
            position: 'topright',
            collapsed: true,
            autoZIndex: true,
          }
        )
        .addTo(self.map);

      if (drawingFeatures) {
        self.map.pm.addControls(drawControlConfig);
        self.addDrawingFeatures(self, modelsHiddenParams, idInstance);
      }

      // solve tile display issues on startup
      setTimeout(() => {
        self.map.invalidateSize();
        try {
          for (let i = 0; i < self.numberOfGeoJsonLayers; i++) {
            if (
              !_.isUndefined(modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i]) &&
              !_.isUndefined(modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i])
            ) {
              self.addGeoJson(modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i], i + 1);
            }
          }

          for (let i = 0; i < self.numberOfChoroplethLayers; i++) {
            if (
              !_.isUndefined(modelsHiddenParams[idInstance].choropleth.choroplethLayers[i]) &&
              !_.isUndefined(modelsHiddenParams[idInstance].choropleth.choroplethLayers[i])
            ) {
              self.addChoropleth(modelsHiddenParams[idInstance].choropleth.choroplethLayers[i], i + 1);
            }
          }

          for (let i = 0; i < self.numberOfLineHeatMapLayers; i++) {
            if (
              !_.isUndefined(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i]) &&
              !_.isUndefined(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i])
            ) {
              self.addLineHeatMap(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i], i + 1);
            }
          }

          for (let i = 0; i < self.numberOfHeatMapLayers; i++) {
            modelsHiddenParams[idInstance].heatMap.heatMapBuffer[i] = []; // clear heatmap buffer
            if (
              !_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapData[i]) &&
              !_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapData[i])
            ) {
              self.drawHeatMap(modelsHiddenParams[idInstance].heatMap.heatMapData[i], i + 1);
            }
          }

          for (let i = 0; i < self.numberOfImageLayers; i++) {
            if (
              !_.isUndefined(modelsHiddenParams[idInstance].imageOverlay.imageData[i]) &&
              !_.isUndefined(modelsHiddenParams[idInstance].imageOverlay.imageData[i])
            ) {
              self.addImageOverlay(modelsHiddenParams[idInstance].imageOverlay.imageData[i], i + 1);
            }
          }

          for (let i = 0; i < self.numberOfSvgLayers; i++) {
            if (
              !_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgData[i]) &&
              !_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgData[i])
            ) {
              self.addSvgOverlay(modelsHiddenParams[idInstance].svgOverlay.svgData[i], i + 1, false);
            }
          }
        } catch (ex) {
          console.error(ex);
        }
      }, 200);

      self.map.on('baselayerchange', function (eventLayer) {
        self.showLegend(eventLayer.name);
        self.currentBaseLayer = eventLayer.name;
      }); // MBG : for new heatmap
    };

    this.showLegend = function (layerName) {
      var legendKeys = _.keys(modelsHiddenParams[idInstance].legends);
      if (_.has(modelsHiddenParams[idInstance].legends, layerName)) {
        var otherKeys = _.without(legendKeys, layerName);
        _.each(otherKeys, function (ctrlName) {
          self.map.removeControl(modelsHiddenParams[idInstance].legends[ctrlName]);
        });
        modelsHiddenParams[idInstance].legends[layerName].addTo(self.map);
        // Put legend always on top
        if (drawingFeatures) {
          self.map.pm.removeControls();
          self.map.pm.addControls(drawControlConfig);
        }
      }
    };

    this.rescale = function () {
      try {
        self.map.invalidateSize();
      } catch (e) {
        console.log(e.message);
      }
    };

    this.addGeoJson = function (geoJsonStruct, layerIndex) {
      // securities
      modelsHiddenParams[idInstance].geoJson.geoJsonBounds[layerIndex - 1] = null;
      if (_.isUndefined(geoJsonStruct)) return;

      if (!_.isEmpty(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1]);
      }

      // MBG moved here on 26/11/2020 : empty geoJson means easing layer
      if (_.isEmpty(geoJsonStruct)) return;
      if (geoJsonStruct == {}) return;
      //

      if (_.isUndefined(geoJsonStruct.features)) return;
      if (_.isEmpty(geoJsonStruct.features)) return;

      var featureTitle = 'Trace' + layerIndex; // default
      if (!_.isUndefined(geoJsonStruct.properties)) {
        if (!_.isUndefined(geoJsonStruct.properties.description)) {
          featureTitle = geoJsonStruct.properties.description;
        }
      }
      var defaultStyle = {
        color: modelsHiddenParams[idInstance].colors[layerIndex - 1],
        weight: 4,
        opacity: 1,
      };

      var geoJsonLayer = L.geoJSON(geoJsonStruct, {
        style: function (feature) {
          if (!_.isUndefined(feature.properties)) {
            if (!_.isUndefined(feature.properties.description)) {
              featureTitle = feature.properties.description; // from datanode
            }
            if (!_.isUndefined(feature.properties.style)) {
              return feature.properties.style; // from datanode
            } else {
              return defaultStyle;
            }
          } else {
            return defaultStyle;
          }
        },
        onEachFeature: function onEachFeature(feature, layer) {
          if (feature.geometry.type == 'Point' && feature.properties) {
            if (feature.properties.comment) {
              if (feature.properties.openPopup) {
                let mk = layer.bindPopup(feature.properties.comment, { autoClose: false, autoPan: false });
                mk.on('add', function (event) {
                  event.target.openPopup();
                });
              } else {
                layer.bindPopup(feature.properties.comment);
              }
            } else {
              if (feature.properties.html) {
                if (feature.properties.openPopup) {
                  const mk = layer.bindPopup(feature.properties.html, { autoClose: false, autoPan: false });
                  mk.on('add', function (event) {
                    event.target.openPopup();
                  });
                } else {
                  layer.bindPopup(feature.properties.html);
                }
              } else {
                const jsonDisplay = jQuery.extend(true, {}, feature.properties);
                if (jsonDisplay.awesomeMarker) delete jsonDisplay.awesomeMarker;
                if (feature.properties.openPopup) {
                  const mk = layer.bindPopup(syntaxHighlight(JSON.stringify(jsonDisplay)), {
                    autoClose: false,
                    autoPan: false,
                  });
                  mk.on('add', function (event) {
                    event.target.openPopup();
                  });
                } else {
                  layer.bindPopup(syntaxHighlight(JSON.stringify(jsonDisplay)));
                }
              }
            }
          }
        },
        pointToLayer: function (feature, latlng) {
          if (feature.geometry.type == 'Point') {
            if (feature.properties) {
              if (feature.properties.awesomeMarker) {
                var awMarker = L.AwesomeMarkers.icon(feature.properties.awesomeMarker);
                return L.marker(latlng, { icon: awMarker });
              }
            }
            return L.marker(latlng);
          }
        },
      });

      if (userMarkerCluster) {
        var markers = L.markerClusterGroup();
        markers.addLayer(geoJsonLayer);
        self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1] = markers;
      } else {
        self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1] = geoJsonLayer;
      }

      self.map.addLayer(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1]);

      self.ctrl.addOverlay(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1], featureTitle);

      try {
        // Calculate a bounding box in west, south, east, north order.
        var rawBounds = bbox(geoJsonStruct);
        var corner1 = L.latLng(rawBounds[1], rawBounds[0]);
        var corner2 = L.latLng(rawBounds[3], rawBounds[2]);
        var bounds = L.latLngBounds(corner1, corner2);

        modelsHiddenParams[idInstance].geoJson.geoJsonBounds[layerIndex - 1] = bounds;

        // MBG for Christophe
        var disableAutoscale = false;

        if (!_.isUndefined(geoJsonStruct.properties)) {
          if (!_.isUndefined(geoJsonStruct.properties.disableAutoscale)) {
            disableAutoscale = geoJsonStruct.properties.disableAutoscale;
          }
        }

        if (!disableAutoscale && bounds.isValid()) {
          // Display for the bounding box
          self.map.fitBounds(self.globalLayersBounds());
        }
      } catch (e) {
        console.log(e);
      }
    };

    this.addChoropleth = function (choroplethData, layerIndex) {
      // securities
      if (_.isUndefined(choroplethData)) return;
      if (_.isEmpty(choroplethData)) return;
      if (choroplethData == {}) return;

      var choroplethStruct = self.convertToChoroplethObject(choroplethData);

      modelsHiddenParams[idInstance].choropleth.choroplethBounds[layerIndex - 1] = null;

      if (!_.isEmpty(self.mapLayers.choropleth.choroplethLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.choropleth.choroplethLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.choropleth.choroplethLayers[layerIndex - 1]);
      }

      if (_.isUndefined(choroplethStruct.features)) return;
      if (_.isEmpty(choroplethStruct.features)) return;

      var featureTitle = _.without(_.keys(choroplethData['data'][0]), 'geometry')[0];
      if (!_.isUndefined(choroplethStruct.properties)) {
        if (!_.isUndefined(choroplethStruct.properties.description)) {
          featureTitle = choroplethStruct.properties.description;
        }
      }

      var maxValue = _.max(_.map(choroplethData.data, featureTitle));
      var minValue = _.min(_.map(choroplethData.data, featureTitle));
      var weight = 4;
      var opacity = 0.7;
      let colorScale;

      try {
        if (!_.isUndefined(choroplethData.config.max)) maxValue = choroplethData.config.max;
        if (!_.isUndefined(choroplethData.config.min)) minValue = choroplethData.config.min;
        if (!_.isUndefined(choroplethData.config.weight)) weight = choroplethData.config.weight;
        if (!_.isUndefined(choroplethData.config.opacity)) opacity = choroplethData.config.opacity;

        colorScale = self.getColorScale(
          choroplethData.config.colorScale,
          choroplethData.config.reverseColorScale,
          0,
          1
        );
      } catch (e) {}

      self.createChoroplethLegend(minValue, maxValue, featureTitle, colorScale);
      self.showLegend(featureTitle);

      self.mapLayers.choropleth.choroplethLayers[layerIndex - 1] = L.geoJSON(choroplethStruct, {
        style: function (feature) {
          return {
            weight: weight,
            opacity: opacity,
            color: 'white',
            dashArray: '3',
            fillOpacity: opacity,
            fillColor: getColor(minValue, maxValue, feature.properties.density, colorScale),
          };
        },
      }).addTo(self.map);

      self.ctrl.addBaseLayer(self.mapLayers.choropleth.choroplethLayers[layerIndex - 1], featureTitle);

      var disableAutoscale = false;
      try {
        disableAutoscale = choroplethData.config.disableAutoscale;
      } catch (e) {}

      try {
        if (!disableAutoscale) {
          // Calculate a bounding box in west, south, east, north order.
          var rawBounds = bbox(choroplethStruct);
          var corner1 = L.latLng(rawBounds[1], rawBounds[0]);
          var corner2 = L.latLng(rawBounds[3], rawBounds[2]);
          var bounds = L.latLngBounds(corner1, corner2);

          modelsHiddenParams[idInstance].choropleth.choroplethBounds[layerIndex - 1] = bounds;
          self.map.fitBounds(bounds);
        }
      } catch (e) {
        console.log(e);
      }
    };

    this.convertToChoroplethObject = function (choroplethObject) {
      let fts = [];

      const data = choroplethObject['data'];
      if (data.length) {
        const tgKey = _.without(_.keys(data[0]), 'geometry')[0];
        fts = data.map((d, k) => ({
          type: 'Feature',
          id: k,
          geometry: d['geometry'],
          properties: {
            density: d[tgKey],
          },
        }));
      }

      const gj = {
        type: 'FeatureCollection',
        features: fts,
      };

      return gj;
    };

    function getColor(min, max, d, colorScale) {
      var step = (max - min) / 8.0;

      var stepDraw = Math.floor((d - min) / step);
      return colorScale(stepDraw * (1.0 / 8.0));
    }

    this.createChoroplethLegend = function (min, max, featureTitle, colorScale) {
      if (!_.isUndefined(modelsHiddenParams[idInstance].legends[featureTitle])) {
        self.map.removeControl(modelsHiddenParams[idInstance].legends[featureTitle]); // MBG 18/09/2018
      }
      modelsHiddenParams[idInstance].legends[featureTitle] = L.control({ position: 'topright' });
      modelsHiddenParams[idInstance].legends[featureTitle].onAdd = function (map) {
        var step = (max - min) / 8;
        var div = L.DomUtil.create('div', 'info legend'),
          grades = [
            min,
            min + step,
            min + step * 2,
            min + step * 3,
            min + step * 4,
            min + step * 5,
            min + step * 6,
            max,
          ],
          labels = [],
          from,
          to;

        //   div.innerHTML += '<h6>              </h6>';
        for (var i = 0; i < grades.length; i++) {
          from = grades[i];
          to = grades[i + 1];
          labels.push(
            '<i style="background:' +
              getColor(min, max, from + 1, colorScale) +
              '"></i> ' +
              '<span>' +
              d3.format('~s')(from) +
              (to ? '&ndash;' + d3.format('~s')(to) : '+') +
              '</span>'
          ) + '<br>';
        }

        div.innerHTML = labels.join('<br>');
        return div;
      };
    };

    this.convertToGeoJSONObject = function (LineHeatMapObject) {
      function normalize(value) {
        var minNox = LineHeatMapObject['config']['min'];
        var maxNox = LineHeatMapObject['config']['max'];
        var normNox = (100 * (value - minNox)) / (maxNox - minNox);
        if (normNox > 100) normNox = 100;
        if (normNox < 0) normNox = 0;
        return normNox;
      }

      var features = [];
      var property = '';
      // from geoJson to lineHeatMap format
      _.each(LineHeatMapObject['data'], function (data) {
        var keys = Object.keys(data);
        _.each(keys, function (key) {
          if (key != 'coordinates') {
            property = key;
          }
        });
        var feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: data['coordinates'],
          },
          properties: {
            style: {
              color: self.getColorScale(
                LineHeatMapObject['config']['colorScale'],
                LineHeatMapObject['config']['reverseColorScale'],
                0,
                100
              )(normalize(data[property])),
              weight: LineHeatMapObject['config']['weight'],
              opacity: LineHeatMapObject['config']['opacity'],
            },
          },
        };
        features.push(feature);
      });

      var res = {
        type: 'FeatureCollection',
        features: features,
        properties: {
          description: property,
        },
      };

      return res;
    };

    this.addLineHeatMap = function (lineHeatMap, layerIndex) {
      // securities
      if (_.isUndefined(lineHeatMap)) return;
      if (_.isEmpty(lineHeatMap)) return;
      if (lineHeatMap == {}) return;

      var lineHeatMapStruct = self.convertToGeoJSONObject(lineHeatMap);

      modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds[layerIndex - 1] = null;

      if (!_.isEmpty(self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1]);
      }

      if (_.isUndefined(lineHeatMapStruct.features)) return;
      if (_.isEmpty(lineHeatMapStruct.features)) return;

      var featureTitle = 'Trace' + layerIndex; // default
      if (!_.isUndefined(lineHeatMapStruct.properties)) {
        if (!_.isUndefined(lineHeatMapStruct.properties.description)) {
          featureTitle = lineHeatMapStruct.properties.description;
        }
      }
      var defaultStyle = {
        color: modelsHiddenParams[idInstance].colors[layerIndex - 1],
        weight: 4,
        opacity: 1,
      };

      var maxValue = _.max(_.map(lineHeatMap.data, featureTitle));
      var minValue = _.min(_.map(lineHeatMap.data, featureTitle));

      try {
        if (!_.isUndefined(lineHeatMap.config.max)) maxValue = lineHeatMap.config.max;
        if (!_.isUndefined(lineHeatMap.config.min)) minValue = lineHeatMap.config.min;
      } catch (e) {}

      var colorScaleInLegend = self.getColorScale(
        lineHeatMap.config.colorScale,
        lineHeatMap.config.reverseColorScale,
        0,
        100
      );

      self.createLegend(colorScaleInLegend, length, colorStops, minValue, maxValue, featureTitle);

      self.showLegend(featureTitle);

      self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1] = L.geoJSON(lineHeatMapStruct, {
        style: function (feature) {
          if (!_.isUndefined(feature.properties)) {
            if (!_.isUndefined(feature.properties.description)) {
              featureTitle = feature.properties.description; // from datanode
            }
            if (!_.isUndefined(feature.properties.style)) {
              return feature.properties.style; // from datanode
            } else {
              return defaultStyle;
            }
          } else {
            return defaultStyle;
          }
        },
        onEachFeature: function onEachFeature(feature, layer) {
          if (feature.geometry.type == 'Point' && feature.properties) {
            layer.bindPopup(syntaxHighlight(JSON.stringify(feature.properties)));
          }
        },
      }).addTo(self.map);

      self.ctrl.addBaseLayer(self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1], featureTitle);

      var disableAutoscale = false;
      try {
        disableAutoscale = lineHeatMap.config.disableAutoscale;
      } catch (e) {}

      if (!disableAutoscale) {
        try {
          // Calculate a bounding box in west, south, east, north order.
          var rawBounds = bbox(lineHeatMapStruct);
          var corner1 = L.latLng(rawBounds[1], rawBounds[0]);
          var corner2 = L.latLng(rawBounds[3], rawBounds[2]);
          var bounds = L.latLngBounds(corner1, corner2);

          modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds[layerIndex - 1] = bounds;

          // Display for the bounding box
          self.map.fitBounds(self.globalLayersLineHeatBounds());
        } catch (e) {
          console.log(e);
        }
      }
    };

    this.addImageOverlay = function (imgStruct, layerIndex) {
      //securities
      if (_.isUndefined(imgStruct)) return;
      if (_.isEmpty(imgStruct)) return;
      if (imgStruct == {}) return;

      const imageUrl = imgStruct.imageUrl;
      const imageBounds = imgStruct.imageBounds;
      const featureTitle = imgStruct.title;
      const addAs = imgStruct.addAs;

      //add options :
      const options = imgStruct.options;

      if (!_.isEmpty(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1]);
      }

      self.mapLayers.imageOverlay.imageLayers[layerIndex - 1] = L.imageOverlay(imageUrl, imageBounds, options).addTo(
        self.map
      );

      if (addAs == 'overlay')
        self.ctrl.addOverlay(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1], featureTitle);
      else self.ctrl.addBaseLayer(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1], featureTitle);
    };

    this.globalLayersBounds = function () {
      var globalBounds = L.latLngBounds(self.map.getCenter());
      for (var i = 0; i < self.numberOfGeoJsonLayers; i++) {
        if (modelsHiddenParams[idInstance].geoJson.geoJsonBounds[i] != null) {
          globalBounds.extend(modelsHiddenParams[idInstance].geoJson.geoJsonBounds[i]);
        }
      }
      return globalBounds;
    };

    this.globalLayersLineHeatBounds = function () {
      var globalBounds = L.latLngBounds(self.map.getCenter());
      for (var i = 0; i < self.numberOfLineHeatMapLayers; i++) {
        if (modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds[i] != null) {
          globalBounds.extend(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds[i]);
        }
      }
      return globalBounds;
    };

    this.createSvgOverlay = function (svgStruct, layerIndex) {
      var pointDrawingFct = self.createOneCircle;
      var type = svgStruct.config.marker;

      switch (type) {
        case 'arrow':
          pointDrawingFct = self.createOneArrow;
          break;
        case 'triangle':
          pointDrawingFct = self.createOneTriangle;
          break;
        case 'emptyTriangle':
          pointDrawingFct = self.createOneTriangle;
          break;
        case 'fullTriangle':
          pointDrawingFct = self.createOneTriangle;
          break;
        default:
          type = 'circle';
          pointDrawingFct = self.createOneCircle;
      }

      return self.createObjectsOverlay(svgStruct, layerIndex, type, pointDrawingFct);
    };

    this.appendSvgOverlay = function (svgStruct, layerIndex) {
      switch (svgStruct.config.marker) {
        case 'arrow':
          return self.appendArrowsOverlay(svgStruct, layerIndex);
      }
    };

    this.appendArrowsOverlay = function (svgStruct, i) {
      var point = svgStruct.data[0];
      var center = L.latLng([point.lat, point.lng]);
      var x = self.map.latLngToLayerPoint(center).x;
      var y = self.map.latLngToLayerPoint(center).y;
      var direction = 0;
      var strokeColor = 'black';
      if (!_.isUndefined(point.direction)) {
        direction = point.direction;
      }
      if (!_.isUndefined(point.rotation)) {
        direction = point.rotation;
      }
      if (!_.isUndefined(point.color)) {
        strokeColor = point.color;
      }
      var arrow = self.createOneArrow(
        x,
        y,
        direction,
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].reductionFactor,
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].lengthInPx,
        strokeColor
      );
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG.innerHTML =
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG.innerHTML + arrow;
    };

    this.createObjectsOverlay = function (svgStruct, i, type, fct) {
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1] = {};
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].currentZoom = self.map.getZoom();
      [
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].reductionFactor,
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].lengthInPx,
      ] = self.computeDimensions(svgStruct);
      var objs = '';
      var color = svgStruct.config.color || '#000';
      svgStruct.data.forEach(function (point) {
        var center = L.latLng([point.lat, point.lng]);
        var direction = 0;
        if (!_.isUndefined(point.direction)) {
          direction = point.direction;
        }
        if (!_.isUndefined(point.rotation)) {
          direction = point.rotation;
        }
        var x = self.map.latLngToContainerPoint(center).x;
        var y = self.map.latLngToContainerPoint(center).y;
        objs =
          objs +
          fct(
            x,
            y,
            direction,
            modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].reductionFactor,
            modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].lengthInPx,
            type,
            color
          );
      });
      var svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      var viewBoxDef = 0 + ' ' + 0 + ' ' + self.map.getSize().x + ' ' + self.map.getSize().y;
      svgElement.setAttribute('viewBox', viewBoxDef);
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG = svgElement;
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG.innerHTML = objs;
      return L.svgOverlay(modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG, self.map.getBounds());
    };

    this.computeDimensions = function (svgStruct) {
      const arrowLengthInMeters = svgStruct.config.length;

      const bounds = self.map.getBounds();
      const corner1 = bounds.getSouthWest();
      const corner2 = bounds.getNorthEast();

      const ySouthPixels = self.map.latLngToContainerPoint(corner1).y;
      const yNorthPixels = self.map.latLngToContainerPoint(corner2).y;

      const heightPixels = ySouthPixels - yNorthPixels;
      const corner3 = L.latLng(corner2.lat, corner1.lng);
      const northSouthDistance = self.map.distance(corner1, corner3);
      const reductionFactor = arrowLengthInMeters / northSouthDistance;
      const lengthInPx = heightPixels * reductionFactor;
      return [reductionFactor, lengthInPx];
    };

    this.autoscaleSvg = function (svgStruct) {
      var lats = [];
      var lngs = [];

      if (_.isEmpty(svgStruct.data)) return; // security

      svgStruct.data.forEach(function (point) {
        lats.push(point.lat);
        lngs.push(point.lng);
      });

      var corner1, corner2, bounds;

      if (lats.length > 1) {
        corner1 = L.latLng(_.max(lats), _.max(lngs));
        corner2 = L.latLng(_.min(lats), _.min(lngs));
        bounds = L.latLngBounds(corner1, corner2);
        self.map.fitBounds(bounds);
      } else {
        self.map.setView(L.latLng(lats[0], lngs[0]), self.map.getZoom());
      }
    };

    this.createOneArrow = function (xCenterPixels, yCenterPixels, direction, reductionFactor, lengthInPx, strokeColor) {
      var yEdegePixels = yCenterPixels - lengthInPx;

      // TODO improve stroke-width computation (now 50*reductionFactor)
      var lineStr =
        '<line x1="' +
        xCenterPixels +
        '" y1="' +
        yCenterPixels +
        '" x2="' +
        xCenterPixels +
        '" y2="' +
        yEdegePixels +
        '" stroke="#000" stroke-width="' +
        50 * reductionFactor +
        '" marker-end="url(#styledArrow)" ';
      lineStr = lineStr + 'transform="rotate(' + direction + ' ' + xCenterPixels + ' ' + yCenterPixels + ')"  />';
      return lineStr;
    };

    this.createOneCircle = function (xCenterPixels, yCenterPixels, direction, reductionFactor, lengthInPx) {
      var lineStr =
        '<circle cx="' + xCenterPixels + '" cy="' + yCenterPixels + '" stroke="#000" r="' + 50 * reductionFactor + '"';
      lineStr = lineStr + '/>';
      return lineStr;
    };

    this.rotationPoint = function rotate(cx, cy, x, y, direction) {
      var radians = (Math.PI / 180) * direction,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = cos * (x - cx) + sin * (y - cy) + cx,
        ny = cos * (y - cy) - sin * (x - cx) + cy;
      return [nx, ny];
    };

    this.getTrianglePoints = function (depart, lenght, direction) {
      var center_y = depart.y;
      var center_x = depart.x - 0;
      var firstPoint_y = depart.y;
      var firstPoint_x = depart.x - lenght;
      var secondPoint_y = depart.y - lenght / 2;
      var secondPoint_x = depart.x;
      var thirdPoint_y = depart.y + lenght / 2;
      var thirdPoint_x = depart.x;
      var firstPoint = self.rotationPoint(center_x, center_y, firstPoint_x, firstPoint_y, direction);
      var secondPoint = self.rotationPoint(center_x, center_y, secondPoint_x, secondPoint_y, direction);
      var thirdPoint = self.rotationPoint(center_x, center_y, thirdPoint_x, thirdPoint_y, direction);
      return (
        firstPoint[1] +
        ' ' +
        firstPoint[0] +
        ' ' +
        secondPoint[1] +
        ' ' +
        secondPoint[0] +
        ' ' +
        thirdPoint[1] +
        ' ' +
        thirdPoint[0]
      );
    };

    this.createOneTriangle = function (
      yCenterPixels,
      xCenterPixels,
      direction,
      reductionFactor,
      lengthInPx,
      type,
      color
    ) {
      // emptyTriangle et fullTriangle
      // var testPoint0=self.getTrianglePoints({x:50,y:30},30,0);  ==> should return (30 20 45 50 15 50)
      // var testPoint1=self.getTrianglePoints({x:50,y:30},30,90); ==> should return (45 35 15 50 15 20)

      var point = self.getTrianglePoints({ x: xCenterPixels, y: yCenterPixels }, lengthInPx, direction);
      var trigl =
        '<polygon points="' +
        point +
        '"  style="fill:' +
        color +
        ';stroke:' +
        color +
        ';stroke-width:' +
        50 * reductionFactor +
        '"   />';
      if (type == 'emptyTriangle') {
        trigl =
          '<polygon points="' +
          point +
          '"  fill="none" style="stroke:' +
          color +
          ';stroke-width:' +
          50 * reductionFactor +
          '"   />';
      }
      return trigl;
    };

    this.addSvgOverlay = function (svgStruct, layerIndex, bAppend) {
      //securities
      if (_.isUndefined(svgStruct)) return;
      if (_.isEmpty(svgStruct)) return;
      if (svgStruct == {}) return;
      if (_.isUndefined(svgStruct.data)) return;

      // TODO add securities here
      var featureTitle = svgStruct.config.title;
      var addAs = svgStruct.config.addAs;

      var disableAutoscale = svgStruct.config.disableAutoscale;

      if (!_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgElements[layerIndex - 1])) {
        if (!_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgElements[layerIndex - 1].currentZoom)) {
          var currentZoom = self.map.getZoom();
          if (modelsHiddenParams[idInstance].svgOverlay.svgElements[layerIndex - 1].currentZoom != currentZoom)
            bAppend = false;
        }
      }

      if (bAppend) {
        self.appendSvgOverlay(svgStruct, layerIndex);
      } else {
        if (!disableAutoscale) {
          self.autoscaleSvg(svgStruct);
        }
        if (!_.isEmpty(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1])) {
          self.ctrl.removeLayer(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1]);
          self.map.removeLayer(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1]);
        }

        self.mapLayers.svgOverlay.svgLayers[layerIndex - 1] = L.layerGroup()
          .addLayer(self.createSvgOverlay(svgStruct, layerIndex))
          .addTo(self.map);

        if (addAs == 'overlay') self.ctrl.addOverlay(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1], featureTitle);
        else self.ctrl.addBaseLayer(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1], featureTitle);
      }
    };

    this.psetSvg = function (svgPoint, layerIndex) {
      // securities
      if (_.isUndefined(svgPoint)) return;
      if (_.isEmpty(svgPoint)) return;
      if (_.isEmpty(svgPoint.data)) return;

      var pointObj = svgPoint.data;

      var toSvg;
      if (_.isUndefined(svgPoint.config)) {
        toSvg = { data: [pointObj] };
      } else {
        toSvg = { data: [pointObj], config: svgPoint.config };
      }

      if (_.isEmpty(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1])) {
        self.addSvgOverlay(toSvg, layerIndex, false);
      } else {
        self.addSvgOverlay(toSvg, layerIndex, true);
      }
    };

    this.createLabelIcon = function (labelClass, labelText) {
      return L.divIcon({
        className: labelClass,
        html: labelText,
      });
    };

    this.drawHeatMap2 = function (heatMapObject, layerIndex) {
      if (!_.isEmpty(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1]);
        self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].remove();
        delete self.mapLayers.heatMap.heatMapLayers[layerIndex - 1];
      }

      // securities
      if (_.isUndefined(heatMapObject)) return;
      if (_.isEmpty(heatMapObject)) return;
      if (_.isUndefined(heatMapObject.data)) return;

      const heatMapData = heatMapObject.data;
      if (_.isEmpty(heatMapData) || heatMapData.length == 0) {
        const circlesLayerGroup = L.layerGroup([]);
        self.mapLayers.heatMap.heatMapLayers[layerIndex - 1] = circlesLayerGroup.addTo(self.map);
        self.ctrl.addBaseLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1], 'none');
        if (!_.isUndefined($("input[name='leaflet-base-layers']")[self.numberOfHeatMapLayers - 1]))
          $("input[name='leaflet-base-layers']")[self.numberOfHeatMapLayers - 1].click();
        return;
      }

      let circleFillOpacity = 0.8;
      let circleRadius = 5;
      let maxValue;
      let minValue;
      let disableAutoscale = false;
      let addTextLabel = false;
      let colorScale;

      const heatMapConfig = heatMapObject.config;
      if (heatMapConfig) {
        circleFillOpacity = heatMapConfig.opacity || circleFillOpacity;
        circleRadius = heatMapConfig.radius || circleRadius;
        maxValue = heatMapConfig.max;
        minValue = heatMapConfig.min;
        disableAutoscale = heatMapConfig.disableAutoscale;
        addTextLabel = heatMapConfig.addTextLabel;

        colorScale = self.getColorScale(heatMapConfig.colorScale, heatMapConfig.reverseColorScale, 0, 100);
      }

      const formattedHeatMap = [];
      let computedMax = -Number.MAX_VALUE; // MBG & KBS on car le 27/09/2019
      let computedMin = Number.MAX_VALUE;
      const lats = [];
      const lngs = [];
      const normVals = [];
      const featureTitle = _.keys(heatMapData[0])[2];
      for (var k = 0; k < heatMapData.length; k++) {
        formattedHeatMap[k] = _.values(heatMapData[k]);
        lats[k] = formattedHeatMap[k][0];
        lngs[k] = formattedHeatMap[k][1];

        if (formattedHeatMap[k][2] !== null) {
          if (formattedHeatMap[k][2] > computedMax) {
            computedMax = formattedHeatMap[k][2]; // computedMax
          }
          if (formattedHeatMap[k][2] < computedMin) {
            computedMin = formattedHeatMap[k][2]; // computedMin
          }
        }
      }

      if (_.isUndefined(maxValue)) {
        if (heatMapData.length == 1) {
          maxValue = 1.0; // for single point
        } else {
          maxValue = computedMax;
          if (maxValue == -Number.MAX_VALUE) maxValue = 1;
        }
      }
      if (_.isUndefined(minValue)) {
        if (heatMapData.length == 1) {
          minValue = 0.0; // for single point
        } else {
          minValue = computedMin;
          if (minValue == Number.MAX_VALUE) minValue = 0;
        }
      }

      // TODO add security for min > max

      for (k = 0; k < heatMapData.length; k++) {
        if (formattedHeatMap[k][2] !== null) {
          if (formattedHeatMap[k][2] > maxValue) {
            normVals[k] = 100;
          } else {
            if (formattedHeatMap[k][2] < minValue) {
              normVals[k] = 0;
            } else {
              normVals[k] = (100 * (formattedHeatMap[k][2] - minValue)) / (maxValue - minValue); // MBG & KBS le 27/09/2019
            }
          }
        }
      }

      var circles = [];
      var currentColor = '#000000';
      for (k = 0; k < formattedHeatMap.length; k++) {
        if (normVals[k] !== null) {
          currentColor = colorScale(normVals[k]);
        } else {
          currentColor = '#000000';
        }
        circles.push(
          L.circle([lats[k], lngs[k]], {
            color: currentColor,
            fillColor: currentColor,
            fillOpacity: circleFillOpacity,
            radius: circleRadius,
            stroke: false, // optim from Benoît Lehman
          })
        );

        if (addTextLabel) {
          circles.push(
            L.marker(new L.LatLng(lats[k], lngs[k]), {
              icon: self.createLabelIcon('boldWhiteHeatMapLabel', nFormatter(formattedHeatMap[k][2])),
            })
          );
        }
      }

      // save config for real-time pset
      self.configStore[layerIndex - 1] = {
        color: colorScale,
        fillOpacity: circleFillOpacity,
        radius: circleRadius,
        minValue: minValue,
        maxValue: maxValue,
        featureTitle: featureTitle,
      };

      const circlesLayerGroup = L.layerGroup(circles);

      self.mapLayers.heatMap.heatMapLayers[layerIndex - 1] = circlesLayerGroup.addTo(self.map);

      self.ctrl.addBaseLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1], featureTitle);

      if (!disableAutoscale) {
        const corner1 = L.latLng(_.max(lats), _.max(lngs));
        const corner2 = L.latLng(_.min(lats), _.min(lngs));
        const bounds = L.latLngBounds(corner1, corner2);
        // Display for the bounding box
        self.map.fitBounds(bounds);
      }

      self.map.invalidateSize();

      self.createLegend(colorScale, length, colorStops, minValue, maxValue, featureTitle);

      self.showLegend(featureTitle);

      if (!_.isUndefined($("input[name*='leaflet-base-layers']")[self.numberOfHeatMapLayers - 1]))
        $("input[name*='leaflet-base-layers']")[self.numberOfHeatMapLayers - 1].click();
    };

    this.createLegend = function (color, length, colorStops, min, max, featureTitle) {
      min = Number(min);
      max = Number(max);
      if (!_.isUndefined(modelsHiddenParams[idInstance].legends[featureTitle])) {
        self.map.removeControl(modelsHiddenParams[idInstance].legends[featureTitle]); // MBG 18/09/2018
      }
      modelsHiddenParams[idInstance].legends[featureTitle] = L.control({ position: 'topleft' });
      modelsHiddenParams[idInstance].legends[featureTitle].onAdd = function (map) {
        var div = L.DomUtil.create('div', 'scaleLegend');
        var rects = '';
        for (var i = 0; i < length; i++) {
          rects = rects + '<rect height="10" x="' + i * 4 + '" width="4" style="fill: ' + color(i) + ';"></rect>';
        }
        var svg = '<svg id="legend" width="450" height="50"><g class="key" transform="translate(25,16)">' + rects;
        var bTicksFormat = true;
        var valTick = min;
        var strTick;
        if (!bTicksFormat) strTick = min.toString();
        else strTick = nFormatter(min, 2);
        var valTranslate = 0;
        for (var i = 0; i < colorStops.length; i++) {
          valTranslate = colorStops[i] * 4;
          svg =
            svg +
            '<g class="tick" transform="translate(' +
            valTranslate +
            ',0)" style="opacity: 1;"><line y2="-1" x2="0"></line><text dy="0em" y="-4" x="0" style="text-anchor: middle;">' +
            strTick +
            '</text></g>';
          valTick = valTick + (max - min) / 4;
          if (!bTicksFormat) {
            strTick = Number.parseFloat(valTick).toPrecision(2);
          } else {
            strTick = nFormatter(valTick, 2);
          }
        }
        svg = svg + '<path class="domain" d="M0,-1V0H400V-1"></path>';
        svg = svg + '<text class="" y="21">' + featureTitle + '</text>';
        svg = svg + '</g></svg>';
        div.innerHTML = svg;

        return div;
      };
    };

    this.drawHeatMap1 = function (heatMapObject, layerIndex) {
      if (!_.isEmpty(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1]);
        self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].remove();
        delete self.mapLayers.heatMap.heatMapLayers[layerIndex - 1];
      }

      // securities
      if (_.isUndefined(heatMapObject)) return;
      if (_.isEmpty(heatMapObject)) return;
      if (_.isUndefined(heatMapObject.data)) return;

      const heatMapData = heatMapObject.data;
      if (_.isUndefined(heatMapData.length)) return;

      var formattedHeatMap = [];
      var maxValue = Number.MIN_VALUE;
      var lats = [];
      var lngs = [];
      var featureTitle = _.keys(heatMapData[0])[2];
      for (var k = 0; k < heatMapData.length; k++) {
        formattedHeatMap[k] = _.values(heatMapData[k]);
        lats[k] = formattedHeatMap[k][0];
        lngs[k] = formattedHeatMap[k][1];
        if (formattedHeatMap[k][2] > maxValue) {
          maxValue = formattedHeatMap[k][2]; // computedMax
        }
      }

      if (heatMapData.length == 1) maxValue = 1.0; // MBG tmp for single point. To improve
      maxValue = 1.0; // MBG assuming user rescaling

      // default values
      var formattedGradient = null;
      var layerMinOpacity;
      var layerMaxZomm;
      var layerRadius;
      var layerBlur;
      var disableAutoscale = false;
      var colorScale;

      // no problem if no config
      const heatMapConfig = heatMapObject.config;
      if (heatMapConfig) {
        layerMinOpacity = heatMapConfig.minOpacity;
        layerMaxZomm = heatMapConfig.maxZoom;
        layerRadius = heatMapConfig.radius;
        layerBlur = heatMapConfig.blur;
        disableAutoscale = heatMapConfig.disableAutoscale;

        formattedGradient = new Object();
        colorScale = self.getColorScale(heatMapConfig.colorScale, heatMapConfig.reverseColorScale, 0, 1);
        d3.range(11).forEach((d) => (formattedGradient[d * 0.1] = colorScale(d * 0.1)));
      }

      self.mapLayers.heatMap.heatMapLayers[layerIndex - 1] = L.meanLayer(formattedHeatMap, {
        minOpacity: layerMinOpacity,
        maxZoom: layerMaxZomm,
        max: maxValue,
        radius: layerRadius,
        blur: layerBlur,
        gradient: formattedGradient,
      }).addTo(self.map);

      self.ctrl.addBaseLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1], featureTitle);
      if (!disableAutoscale) {
        var corner1 = L.latLng(_.max(lats), _.max(lngs));
        var corner2 = L.latLng(_.min(lats), _.min(lngs));
        var bounds = L.latLngBounds(corner1, corner2);
        // Display for the bounding box
        self.map.fitBounds(bounds);
      }
      self.map.invalidateSize();
    };

    // Heatmap choice
    if (_.isUndefined(modelsParameters[idInstance].heatMap.densityHeatMap)) {
      this.drawHeatMap = self.drawHeatMap1;
    } else {
      if (modelsParameters[idInstance].heatMap.densityHeatMap) {
        this.drawHeatMap = self.drawHeatMap1;
      } else {
        this.drawHeatMap = self.drawHeatMap2;
      }
    }

    this.clearHeatMapLayer = function (layerIndex) {
      self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].clearLayers();
    };

    this.psetHeatMap = function (heatMapPoint, layerIndex) {
      // securities
      if (_.isUndefined(heatMapPoint)) return;
      if (_.isEmpty(heatMapPoint)) return;
      if (_.isEmpty(heatMapPoint.data)) return;

      var pointObj = heatMapPoint.data;

      var toHeatMap;
      if (_.isUndefined(heatMapPoint.config)) {
        toHeatMap = { data: [pointObj] };
      } else {
        toHeatMap = { data: [pointObj], config: heatMapPoint.config };
      }

      var hmp = _.values(heatMapPoint.data);
      if (_.isEmpty(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1])) {
        self.drawHeatMap(toHeatMap, layerIndex);
      } else {
        if (_.isUndefined(modelsParameters[idInstance].heatMap.densityHeatMap)) {
          self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].addLatLng(hmp);
        } else {
          if (modelsHiddenParams[idInstance].heatMap.densityHeatMap) {
            self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].addLatLng(hmp);
          } else {
            const toHeatMapConfig = toHeatMap.config || {};
            const configNew = {
              circleFillOpacity: toHeatMapConfig.opacity,
              circleRadius: toHeatMapConfig.radius,
              maxValue: toHeatMapConfig.max,
              minValue: toHeatMapConfig.min,
            };

            const storedConfig = self.configStore[layerIndex - 1];
            const configOld = {
              circleFillOpacity: storedConfig.fillOpacity,
              circleRadius: storedConfig.radius,
              maxValue: storedConfig.maxValue,
              minValue: storedConfig.minValue,
            };
            const sameConfig =
              (configNew.circleFillOpacity === undefined ||
                configNew.circleFillOpacity === configOld.circleFillOpacity) &&
              (configNew.circleRadius === undefined || configNew.circleRadius === configOld.circleRadius) &&
              (configNew.maxValue === undefined || configNew.maxValue === configOld.maxValue) &&
              (configNew.minValue === undefined || configNew.minValue === configOld.minValue);

            const featureTitle = _.keys(pointObj)[2];
            // if data name changes, clear the buffter and fix legend
            if (featureTitle != storedConfig.featureTitle) {
              self.configStore[layerIndex - 1].minValue = toHeatMap.config.min;
              self.configStore[layerIndex - 1].maxValue = toHeatMap.config.max;
              self.configStore[layerIndex - 1].radius = toHeatMap.config.radius;
              self.configStore[layerIndex - 1].fillOpacity = toHeatMap.config.opacity;
              self.configStore[layerIndex - 1].featureTitle = featureTitle;
              self.clearHeatMapLayer(layerIndex);

              modelsHiddenParams[idInstance].heatMap.heatMapBuffer[layerIndex - 1] = [pointObj];

              const heatMapToRedraw = {
                data: modelsHiddenParams[idInstance].heatMap.heatMapBuffer[layerIndex - 1],
                config: heatMapPoint.config,
              };
              self.drawHeatMap(heatMapToRedraw, layerIndex);
            } else {
              if (sameConfig) {
                let normVal =
                  (100 * (hmp[2] - self.configStore[layerIndex - 1].minValue)) /
                  (self.configStore[layerIndex - 1].maxValue - self.configStore[layerIndex - 1].minValue);
                // MBG add saturation 25/09/2019
                if (normVal < 0) normVal = 0;
                if (normVal > 100) normVal = 100;

                modelsHiddenParams[idInstance].heatMap.heatMapBuffer[layerIndex - 1].push(pointObj);

                const circle = L.circle([pointObj.lat, pointObj.lng], {
                  color: self.configStore[layerIndex - 1].color(normVal),
                  fillColor: self.configStore[layerIndex - 1].color(normVal),
                  fillOpacity: self.configStore[layerIndex - 1].fillOpacity,
                  radius: self.configStore[layerIndex - 1].radius,
                  stroke: false, // optim from Benoît Lehman
                });
                self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].addLayer(circle);
              } else {
                self.configStore[layerIndex - 1].minValue = toHeatMap.config.min;
                self.configStore[layerIndex - 1].maxValue = toHeatMap.config.max;
                self.configStore[layerIndex - 1].radius = toHeatMap.config.radius;
                self.configStore[layerIndex - 1].fillOpacity = toHeatMap.config.opacity;
                self.clearHeatMapLayer(layerIndex);

                modelsHiddenParams[idInstance].heatMap.heatMapBuffer[layerIndex - 1].push(pointObj); // MBG 10/09/2020

                const heatMapToRedraw = {
                  data: modelsHiddenParams[idInstance].heatMap.heatMapBuffer[layerIndex - 1],
                  config: heatMapPoint.config,
                };
                self.drawHeatMap(heatMapToRedraw, layerIndex);
              }
            }
          }
        }
        if (!_.isUndefined(heatMapPoint.config)) {
          if (!_.isUndefined(heatMapPoint.config.disableAutoscale)) {
            if (heatMapPoint.config.disableAutoscale) {
              // do nothing
            } else {
              self.map.setView(pointObj);
            }
          } else {
            self.map.setView(pointObj);
          }
        } else {
          self.map.setView(pointObj);
        }
      }
    };

    if (modelsParameters[idInstance].geoJson.numberOfLayers > 0) {
      for (let i = 1; i <= self.numberOfGeoJsonLayers; i++) {
        if (_.isUndefined(modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i - 1])) {
          modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i - 1] = {};
        }
        if (_.isUndefined(self.mapLayers.geoJson.geoJsonLayers[i - 1])) {
          self.mapLayers.geoJson.geoJsonLayers[i - 1] = {};
        }
        const layerName = 'geoJson' + i;
        this[layerName] = {
          layerIndex: i,
          updateCallback: function () {},
          setValue: function (val) {
            modelsHiddenParams[idInstance].geoJson.geoJsonLayers[this.layerIndex - 1] = val;
            self.addGeoJson(val, this.layerIndex);
          },
          getValue: function () {
            return modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i - 1];
          },
          addValueChangedHandler: function (updateDataFromWidget) {
            this.updateCallback = updateDataFromWidget;
          },
          removeValueChangedHandler: function (updateDataFromWidget) {},
        };
      }
    }

    if (modelsParameters[idInstance].choropleth) {
      if (modelsParameters[idInstance].choropleth.numberOfLayers > 0) {
        for (let i = 1; i <= self.numberOfChoroplethLayers; i++) {
          if (_.isUndefined(modelsHiddenParams[idInstance].choropleth.choroplethLayers[i - 1])) {
            modelsHiddenParams[idInstance].choropleth.choroplethLayers[i - 1] = {};
          }
          if (_.isUndefined(self.mapLayers.choropleth.choroplethLayers[i - 1])) {
            self.mapLayers.choropleth.choroplethLayers[i - 1] = {};
          }
          const layerName = 'choropleth' + i;
          this[layerName] = {
            layerIndex: i,

            updateCallback: function () {},
            setValue: function (val) {
              modelsHiddenParams[idInstance].choropleth.choroplethLayers[this.layerIndex - 1] = val;
              self.addChoropleth(val, this.layerIndex);
            },
            getValue: function () {
              return modelsHiddenParams[idInstance].choropleth.choroplethLayers[i - 1];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        }
      }
    }

    if (modelsParameters[idInstance].lineHeatMap) {
      if (modelsParameters[idInstance].lineHeatMap.numberOfLayers > 0) {
        for (let i = 1; i <= self.numberOfLineHeatMapLayers; i++) {
          if (_.isUndefined(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i - 1])) {
            modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i - 1] = {};
          }
          if (_.isUndefined(self.mapLayers.lineHeatMap.lineHeatMapLayers[i - 1])) {
            self.mapLayers.lineHeatMap.lineHeatMapLayers[i - 1] = {};
          }
          const layerName = 'lineHeatMap' + i;
          this[layerName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[this.layerIndex - 1] = val;
              self.addLineHeatMap(val, this.layerIndex);
            },
            getValue: function () {
              return modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i - 1];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        }
      }
    }

    if (modelsParameters[idInstance].heatMap.numberOfLayers > 0) {
      for (let i = 1; i <= self.numberOfHeatMapLayers; i++) {
        const layerName = 'heatMapData' + i;
        const pointName = 'heatMapPoint' + i;
        if (_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapData[i - 1])) {
          modelsHiddenParams[idInstance].heatMap.heatMapData[i - 1] = {};
        }
        if (_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapBuffer[i - 1])) {
          modelsHiddenParams[idInstance].heatMap.heatMapBuffer[i - 1] = [];
        }
        if (_.isUndefined(self.mapLayers.heatMap.heatMapLayers[i - 1])) {
          self.mapLayers.heatMap.heatMapLayers[i - 1] = {};
        }
        if (modelsParameters[idInstance].heatMap.sampledDisplay) {
          this[pointName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              if (self.bIsInteractive) {
                self.psetHeatMap(val, this.layerIndex);
              }
            },
            getValue: function () {},
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        } else {
          this[layerName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              if (val == modelsHiddenParams[idInstance].heatMap.heatMapData[this.layerIndex - 1]) return; // MBG optimization
              modelsHiddenParams[idInstance].heatMap.heatMapData[this.layerIndex - 1] = val;
              self.drawHeatMap(val, this.layerIndex);
            },
            getValue: function () {
              return modelsHiddenParams[idInstance].heatMap.heatMapData[this.layerIndex - 1];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        }
      }
    }

    if (self.numberOfImageLayers > 0) {
      for (let i = 1; i <= self.numberOfImageLayers; i++) {
        const layerName = 'imageOverlay' + i;
        if (_.isUndefined(modelsHiddenParams[idInstance].imageOverlay.imageData[i - 1])) {
          modelsHiddenParams[idInstance].imageOverlay.imageData[i - 1] = {};
        }
        if (_.isUndefined(self.mapLayers.imageOverlay.imageLayers[i - 1])) {
          self.mapLayers.imageOverlay.imageLayers[i - 1] = {};
        }

        this[layerName] = {
          layerIndex: i,

          updateCallback: function () {},
          setValue: function (val) {
            if (val == modelsHiddenParams[idInstance].imageOverlay.imageData[this.layerIndex - 1]) return; // MBG optimization
            modelsHiddenParams[idInstance].imageOverlay.imageData[this.layerIndex - 1] = val;
            self.addImageOverlay(val, this.layerIndex);
          },
          getValue: function () {
            return modelsHiddenParams[idInstance].imageOverlay.imageData[this.layerIndex - 1];
          },
          addValueChangedHandler: function (updateDataFromWidget) {
            this.updateCallback = updateDataFromWidget;
          },
          removeValueChangedHandler: function (updateDataFromWidget) {},
        };
      }
    }

    if (self.numberOfSvgLayers > 0) {
      for (let i = 1; i <= self.numberOfSvgLayers; i++) {
        const layerName = 'svgOverlay' + i;
        const pointName = 'svgPoint' + i;
        if (_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgData[i - 1])) {
          modelsHiddenParams[idInstance].svgOverlay.svgData[i - 1] = {};
        }
        if (_.isUndefined(self.mapLayers.svgOverlay.svgLayers[i - 1])) {
          self.mapLayers.svgOverlay.svgLayers[i - 1] = {};
        }
        if (modelsParameters[idInstance].svgOverlay.sampledDisplay) {
          this[pointName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              if (self.bIsInteractive) {
                self.psetSvg(val, this.layerIndex);
              }
            },
            getValue: function () {},
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        } else {
          this[layerName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              modelsHiddenParams[idInstance].svgOverlay.svgData[this.layerIndex - 1] = val;
              self.addSvgOverlay(val, this.layerIndex, false);
            },
            getValue: function () {
              return modelsHiddenParams[idInstance].svgOverlay.svgData[this.layerIndex - 1];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        }
      }
    }

    const _SELECTED_POINT_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedPoint',
      'Selected coordinates',
      WidgetActuatorDescription.WRITE,
      _SCHEMA_SELECTED_POINT
    );
    const _SELECTED_GEOJSON_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedGeoJson',
      'Drawn GeoJSON figure',
      WidgetActuatorDescription.WRITE,
      _SCHEMA_SELECTED_GEOJSON
    );
    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      const result = [];

      if (data) {
        if (data.captureClickEvent) {
          result.push(_SELECTED_POINT_DESCRIPTOR);
        }
        if (data.drawingFeatures) {
          result.push(_SELECTED_GEOJSON_DESCRIPTOR);
        }

        if (data.geoJson && data.geoJson.numberOfLayers) {
          for (let i = 1; i <= data.geoJson.numberOfLayers; i++) {
            result.push(
              new WidgetActuatorDescription(
                'geoJson' + i,
                'GeoJSON features',
                WidgetActuatorDescription.READ,
                _SCHEMA_GEOJSON
              )
            );
          }
        }

        if (data.lineHeatMap && data.lineHeatMap.numberOfLayers) {
          for (let i = 1; i <= data.lineHeatMap.numberOfLayers; i++) {
            result.push(
              new WidgetActuatorDescription(
                'lineHeatMap' + i,
                'Lines colored by values',
                WidgetActuatorDescription.READ,
                _SCHEMA_LINE_HEATMAP
              )
            );
          }
        }

        if (data.choropleth && data.choropleth.numberOfLayers) {
          for (let i = 1; i <= data.choropleth.numberOfLayers; i++) {
            result.push(
              new WidgetActuatorDescription(
                'choropleth' + i,
                'Choropleth data',
                WidgetActuatorDescription.READ,
                _SCHEMA_CHOROPLETH
              )
            );
          }
        }

        if (data.heatMap && data.heatMap.numberOfLayers) {
          for (let i = 1; i <= data.heatMap.numberOfLayers; i++) {
            if (data.heatMap.sampledDisplay) {
              const name = 'heatMapPoint' + i;
              if (data && !data.densityHeatMap) {
                result.push(
                  new WidgetActuatorDescription(
                    name,
                    'Cumulative heatmap',
                    WidgetActuatorDescription.READ,
                    _SCHEMA_HEATMAP_SAMPLED
                  )
                );
              } else {
                result.push(
                  new WidgetActuatorDescription(
                    name,
                    'Cumulative density heatmap',
                    WidgetActuatorDescription.READ,
                    _SCHEMA_HEATMAP_DENSITY_SAMPLED
                  )
                );
              }
            } else {
              const name = 'heatMapData' + i;
              if (data && !data.densityHeatMap) {
                result.push(
                  new WidgetActuatorDescription(name, 'Heatmap', WidgetActuatorDescription.READ, _SCHEMA_HEATMAP)
                );
              } else {
                result.push(
                  new WidgetActuatorDescription(
                    name,
                    'Density heatmap',
                    WidgetActuatorDescription.READ,
                    _SCHEMA_HEATMAP_DENSITY
                  )
                );
              }
            }
          }
        }

        if (data.imageOverlay && data.imageOverlay.numberOfLayers) {
          for (let i = 1; i <= data.imageOverlay.numberOfLayers; i++) {
            result.push(
              new WidgetActuatorDescription(
                'imageOverlay' + i,
                'Image to place on the map',
                WidgetActuatorDescription.READ,
                _SCHEMA_IMAGE_OVERLAY
              )
            );
          }
        }

        if (data.svgOverlay && data.svgOverlay.numberOfLayers) {
          for (let i = 1; i <= data.svgOverlay.numberOfLayers; i++) {
            if (data.svgOverlay.sampledDisplay) {
              result.push(
                new WidgetActuatorDescription(
                  'svgPoint' + i,
                  'Place a symbol on the map',
                  WidgetActuatorDescription.READ,
                  _SCHEMA_SVG_POINT_OVERLAY
                )
              );
            } else {
              result.push(
                new WidgetActuatorDescription(
                  'svgOverlay' + i,
                  'Place symbols on the map',
                  WidgetActuatorDescription.READ,
                  _SCHEMA_SVG_OVERLAY
                )
              );
            }
          }
        }
      }

      return result;
    };

    // TODO : handle only GeoJson?
    self.render();
  };

  // Inherit from baseWidget class
  this.openStreetMapsWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'Maps',
    widgetsDefinitionList: {
      openStreetMaps: {
        factory: 'openStreetMapsWidget',
        title: 'Leaflet JSON maps',
        icn: 'map',
        help: 'wdg/wdg-geo-time/#leaflet-maps',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
mapWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
export const mapWidgetsPlugin = new mapWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(mapWidgetsPlugin);
