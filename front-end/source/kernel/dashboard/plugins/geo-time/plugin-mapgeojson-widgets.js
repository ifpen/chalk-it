// ┌────────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                                │ \\
// ├────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                                    │ \\
// ├────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Benoit LEHMAN & Mongi BEN GAID & Abir EL FEKI & Mohamed ERRAHALI   │ \\
// └────────────────────────────────────────────────────────────────────────────────┘ \\

// Important Style Behavior : Style will be available as out from the map first only in View mode
// The contact between the widget and out properties is only done at first enable
import 'leaflet';

// !! Order matters, a lot !!
import 'simpleheat';
import 'leaflet-modal';
import 'idb';
import 'leaflet.offline';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet.markercluster';
import 'leaflet.awesome-markers';
import { bbox } from '@turf/bbox';
import _ from 'lodash';

import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

import { getColorScaleFromStyle } from 'kernel/dashboard/plugins/tools/color-scale-manager';
import { getTileServerConf } from 'kernel/dashboard/plugins/tools/tile-servers';
import {
  findAllProperties,
  findFeatureType,
  getFillColor,
  isValidGeoJSON,
} from 'kernel/dashboard/plugins/tools/geoJson-tools';
import { createLegend, createChoroplethLegend } from 'kernel/dashboard/plugins/tools/legends';
import { createTemplateStyle, setStyle } from 'kernel/dashboard/plugins/tools/style-manager';
import { configureEvents } from 'kernel/dashboard/plugins/tools/events-manager';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Layout (default dimensions)
modelsLayout.mapGeoJson = { height: '5vh', width: '19vw', minWidth: '100px', minHeight: '100px' };

modelsHiddenParams.mapGeoJson = { GeoJSON: {}, GeoJSONStyle: {} };

function mapGeoJsonWidgetsPluginClass() {
  this.mapGeoJsonWidgets = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    this.state = {
      selectedElement: undefined,
    };
    this.defaultConfig = {
      defaultCenter: {
        latitude: 2.295,
        longitude: 48.8738,
        defaultZoom: true,
        zoom: 8,
      },
      tileServer: 'MapboxStreets',
      possibleTileServers: ['MapboxStreets', 'MapboxDark', 'HereSatelliteDay', 'HereTerrainDay', 'HereHybridDay'],
      image: {
        imageUrl: '',
        imageBounds: [],
        title: '',
        addAs: '',
      },
    };

    var self = this;
    this.idInstance = idInstance;
    this.enable = function () {};

    this.disable = function () {};

    //assurer la compatibilité geojson/style
    this.updateValue = function () {
      // Create new TempleStyle if old has not the same size
      // TODO : Check all style compatible with all element of model
      const geojsons = modelsHiddenParams[idInstance].GeoJSON;
      const geojsonStyle = modelsHiddenParams[idInstance].GeoJSONStyle;
      if (!_.isUndefined(geojsons) && !_.isEmpty(geojsons)) {
        if (!_.isUndefined(geojsonStyle) && !_.isEmpty(geojsonStyle)) {
          let styles = geojsonStyle.style;
          //test if styles is an array
          if (!Array.isArray(styles)) {
            styles = [];
          }
          //test if the length of geojson less than length of styles
          if (geojsons.length < styles.length) {
            let newStyles = [];
            for (let i = 0; i < geojsons.length; i++) {
              newStyles.push(styles[i]);
            }
            styles = newStyles;
          }
          geojsons.forEach((geojson, index) => {
            //test if the style exist
            if (styles.length >= index + 1) {
              const style = styles[index];
              //test if they have the same type
              if (findFeatureType(geojson) == style.type) {
                //test if properties are not changed
                if (JSON.stringify(findAllProperties(geojson)) !== JSON.stringify(style.allProperties)) {
                  //create template style
                  styles[index] = createTemplateStyle(self, geojson, index);
                }
              } else {
                //replace with template style
                styles[index] = createTemplateStyle(self, geojson, index);
              }
            } else {
              //add template style for the element
              styles.push(createTemplateStyle(self, geojson, index));
            }
          });
          modelsHiddenParams[idInstance].GeoJSONStyle.style = styles;
        }
      }
      self.GeoJSONStyle.updateCallback(self.GeoJSONStyle, self.GeoJSONStyle.getValue());
    };

    this.rescale = function () {};

    this.getColorScaleFromStyle = getColorScaleFromStyle;
    this.addImageOverlay = function (imgStruct) {
      //securities
      if (_.isUndefined(imgStruct)) return;
      if (_.isEmpty(imgStruct)) return;
      if (imgStruct == {}) return;

      const imageUrl = imgStruct.imageUrl;
      const imageBounds = imgStruct.imageBounds;
      const featureTitle = imgStruct.title || '';
      const addAs = imgStruct.addAs;
      if (imageUrl == '') return;
      let boundsValid =
        !_.isUndefined(imageBounds) &&
        Array.isArray(imageBounds) &&
        imageBounds.length == 2 &&
        Array.isArray(imageBounds[0]) &&
        Array.isArray(imageBounds[1]) &&
        imageBounds[0].length == 2 &&
        imageBounds[1].length == 2;
      if (!boundsValid) {
        return;
      }
      let imageLayer = L.imageOverlay(imageUrl, imageBounds).addTo(self.map);

      if (addAs == 'overlay') self.ctrl.addOverlay(imageLayer, featureTitle);
      else self.ctrl.addBaseLayer(imageLayer, featureTitle);
    };
    // setZoom
    this.zoom = function (self, config, geojsons) {
      //Zoom
      if (config.defaultCenter.defaultZoom || _.isUndefined(config.defaultCenter.defaultZoom)) {
        let bboxCoords = undefined;
        if (!_.isUndefined(geojsons) && Array.isArray(geojsons) && geojsons.length > 0) {
          bboxCoords = bbox(geojsons[0]);
          bboxCoords = [
            [bboxCoords[1], bboxCoords[0]],
            [bboxCoords[3], bboxCoords[2]],
          ];
        } else {
          if (!_.isUndefined(config) && !_.isUndefined(config.image) && !_.isUndefined(config.image.imageBounds)) {
            bboxCoords = config.image.imageBounds;
          }
        }
        if (
          !_.isUndefined(bboxCoords) &&
          Array.isArray(bboxCoords) &&
          bboxCoords.length == 2 &&
          Array.isArray(bboxCoords[0]) &&
          Array.isArray(bboxCoords[1]) &&
          bboxCoords[0].length == 2 &&
          bboxCoords[1].length == 2
        ) {
          self.map.fitBounds(bboxCoords);
        } else {
          self.map.setZoom(self.defaultConfig.defaultCenter.zoom);
        }
      } else {
        if (
          !_.isUndefined(config) &&
          !_.isUndefined(config.defaultConfig) &&
          !_.isUndefined(config.defaultConfig.defaultCenter) &&
          !_.isUndefined(config.defaultConfig.defaultCenter.zoom)
        ) {
          self.map.setZoom(config.defaultConfig.defaultCenter.zoom);
        }
      }
    };
    this.render = function () {
      // Create and configure the main widget HTML
      const widgetHtml = document.createElement('div');
      widgetHtml.id = `mapGeoJson${idWidget}`;

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
      widgetHtml.setAttribute('style', displayStyle + enableStyle);

      widgetHtml.style.width = 'inherit';
      widgetHtml.style.height = 'inherit';

      document.addEventListener('play-tab-loaded', self.goToFirstRadioButton);
      document.getElementById(idDivContainer).innerHTML = '';
      document.getElementById(idDivContainer).appendChild(widgetHtml);

      // Initialize configuration
      let config = { ...self.defaultConfig };
      const geoJSONParams = modelsHiddenParams[idInstance];
      const geoJSONStyle = geoJSONParams?.GeoJSONStyle || {};

      if (geoJSONStyle.config?.defaultCenter) {
        config = { ...geoJSONStyle.config };
      }

      // Initialize map
      self.map = L.map(`mapGeoJson${idWidget}`, { preferCanvas: true }).setView(
        [config.defaultCenter?.longitude, config.defaultCenter?.latitude],
        config.defaultCenter?.zoom
      );

      // Set up tile layer
      const tileServer = config.tileServer || 'MapboxStreets';
      const tileConf = getTileServerConf(tileServer);
      self.baseLayer = L.tileLayer(tileConf.url, tileConf).addTo(self.map);

      // Add layer control
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

      // Set zoom control position
      self.map.zoomControl.setPosition('topright');

      // Update map view and set bounding box
      const geoJSONData = geoJSONParams?.GeoJSON || [];
      self.zoom(self, config, geoJSONData);

      // Add image overlay if available
      if (geoJSONStyle.config?.image) {
        self.addImageOverlay({ ...geoJSONStyle.config.image });
      }

      // Initialize internal layers and legends
      self.layers = [];
      self.legends = [];

      // Add GeoJSON layers
      if (Array.isArray(geoJSONData)) {
        geoJSONData.forEach((item, index) => {
          const style = geoJSONStyle.style?.[index] || {};
          const layerName = style.name || `layer ${index}`;
          self.addGeoJSONLayer(self, item, style, layerName);
        });
      }

      // solve tile display issues on startup
      setTimeout(() => {
        self.map.invalidateSize();
      }, 300);
    };

    this.getFillColor = getFillColor;
    this.createCluster = (LMarkers) => {
      let leafLetLayer = L.markerClusterGroup();
      LMarkers.forEach(function (layerMarker) {
        leafLetLayer.addLayer(layerMarker);
      });
      return leafLetLayer;
    };
    // Create a Layer from a GeoJSON
    this.getLeafletIndex = (leafletLayer, layers) => {
      return layers.findIndex((layer) => layer === leafletLayer);
    };
    this.addGeoJSONLayer = function (self, geoJSON, style, name) {
      // Create the GeoJSON layer and add it to the map
      const leafletLayer = L.geoJSON(geoJSON).addTo(self.map);

      // Add the layer and initialize its legend
      self.layers.push(leafletLayer);
      self.legends.push(undefined);

      // Get the index of the newly added layer
      const leafletIndex = self.getLeafletIndex(leafletLayer, self.layers);

      // Proceed only if the layer was added successfully
      if (leafletIndex !== -1) {
        // Configure events for the layer
        configureEvents(self, geoJSON, leafletLayer, leafletIndex);

        // Add the layer to the map control (currently as an overlay)
        self.ctrl.addOverlay(leafletLayer, name);

        // Apply the specified style to the layer
        setStyle(self, leafletIndex, { ...style });
      }
    };

    // Create the style object that will be in out JSON for a geoJSON
    // typeLayer is used for marker or circle

    this.createChoroplethLegend = function (legendId, min, max, featureTitle, colorScale) {
      let legend = createChoroplethLegend(legendId, min, max, featureTitle, colorScale);
      if (!_.isUndefined(legend)) {
        legend.addTo(self.map);
      }
      return legend;
    };
    this.createLegend = function (legendId, color, length, colorStops, min, max, featureTitle) {
      let legend = createLegend(legendId, color, length, colorStops, min, max, featureTitle);
      if (!_.isUndefined(legend)) {
        legend.addTo(self.map);
      }
      return legend;
    };
    // Important tag to know if style has changed during the setStyle
    // Typical when circle are changed to marker
    this.styleChanged = false;

    this.GeoJSON = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].GeoJSON = [];
        if (val != null) {
          if (!Array.isArray(val)) {
            if (isValidGeoJSON(val)) {
              modelsHiddenParams[idInstance].GeoJSON.push(val);
            } else {
              modelsHiddenParams[idInstance].GeoJSON = [];
              //TODO: show notifications !
              console.error('Invalid GeoJSON ');
            }
          } else {
            for (let index = 0; index < val.length; index++) {
              const geojson = val[index];
              if (isValidGeoJSON(geojson)) {
                modelsHiddenParams[idInstance].GeoJSON.push(geojson);
              } else {
                console.error('Invalid GeoJSON at index = ' + index);
              }
            }
          }
        }
        self.updateValue();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].GeoJSON;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };
    this.Selected = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].Selected = val;
        // self.render();
        //self.updateValue();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].Selected;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    this.GeoJSONStyle = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].GeoJSONStyle = val;
        const geoJSONStyle = modelsHiddenParams[idInstance].GeoJSONStyle;
        if (!_.isNull(geoJSONStyle) && !_.isUndefined(geoJSONStyle) && _.isUndefined(geoJSONStyle.config)) {
          modelsHiddenParams[idInstance].GeoJSONStyle.config = { ...self.defaultConfig };
        }
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].GeoJSONStyle;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.updateValue();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
    };
    const _GEOJSON_STYLE_DESCRIPTOR = new WidgetActuatorDescription(
      'GeoJSONStyle',
      'Properties for GEOJSON',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_ANYTHING
    );

    //add selected actuator
    const _SELECTED_DESCRIPTOR = new WidgetActuatorDescription(
      'Selected',
      'Selected value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_ANYTHING
    );
    // GeoJSON Schema V0.7

    const _SCHEMA_GEOJSON_INPUT = {
      $schema: WidgetPrototypesManager.SCHEMA_VERSION,
      $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:GOEJSON_input',
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['FeatureCollection'] },
        features: {
          type: 'array',
          items: { $ref: '#/definitions/feature' },
        },
      },
      required: ['type', 'features'],
      additionalProperties: true,
      patternProperties: {
        '^.*$': {},
      },
      definitions: {
        feature: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['Feature'] },
            geometry: { $ref: '#/definitions/geometry' },
            properties: { type: 'object' },
            id: { anyOf: [{ type: 'string' }, { type: 'number' }] },
          },
          required: ['type', 'geometry'],
          additionalProperties: false,
        },
        geometry: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            coordinates: {},
          },
          required: ['type', 'coordinates'],
          additionalProperties: false,
        },
      },
    };

    const _SCHEMA_GEOJSON_ARRAY = {
      $schema: WidgetPrototypesManager.SCHEMA_VERSION,
      $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:GOEJSON_input_array',

      type: 'array',
      items: { $ref: _SCHEMA_GEOJSON_INPUT.$id },
    };

    const _SCHEMA_GEOJSON_ONE_OF = {
      $schema: WidgetPrototypesManager.SCHEMA_VERSION,
      $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:GOEJSON_input_oneof',

      oneOf: [_SCHEMA_GEOJSON_INPUT, _SCHEMA_GEOJSON_ARRAY],
    };

    const _GEOJSON_DESCRIPTOR = new WidgetActuatorDescription(
      'GeoJSON',
      'Geometry and Properties in GEOJSON Format',
      WidgetActuatorDescription.READ,
      _SCHEMA_GEOJSON_ONE_OF
    );
    this.getActuatorDescriptions = function () {
      return [_GEOJSON_DESCRIPTOR, _GEOJSON_STYLE_DESCRIPTOR, _SELECTED_DESCRIPTOR];
    };

    // Main Render
    self.render();
  };

  // Inherit from baseWidget class
  this.mapGeoJsonWidgets.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'MapGeoJson',
    widgetsDefinitionList: {
      mapGeoJson: {
        factory: 'mapGeoJsonWidgets',
        title: 'Map GeoJSON',
        icn: 'map',
        help: 'wdg/wdg-geo-time/#leaflet-maps',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
mapGeoJsonWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
export const mapGeoJsonWidgetsPlugin = new mapGeoJsonWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(mapGeoJsonWidgetsPlugin);
