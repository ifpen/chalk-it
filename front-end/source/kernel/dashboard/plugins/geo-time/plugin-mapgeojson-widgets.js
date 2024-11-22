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

import { getColorScaleFromStyle } from 'kernel/dashboard/plugins/tools/colorScaleManager';
import { getTileServerConf } from 'kernel/dashboard/plugins/tools/tileServers';
import { findAllProperties,findFeatureType,getFillColor,isValidGeoJSON } from 'kernel/dashboard/plugins/tools/geoJsonTools';
import { createLegend,createChoroplethLegend} from 'kernel/dashboard/plugins/tools/legends';
import { createTemplateStyle,setStyle } from 'kernel/dashboard/plugins/tools/styleManager';
import { configureEvents } from 'kernel/dashboard/plugins/tools/eventsManager';

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
    this.legendHeatMap = undefined;
    this.legendChoroplet = undefined;
    this.enable = function () {};

    this.disable = function () {};

    this.updateValue = function (e) {
      // Create new TempleStyle if old has not the same size
      // TODO : Check all style compatible with all element of model
      const geojsons = modelsHiddenParams[idInstance].GeoJSON;
      const geojsonStyle =modelsHiddenParams[idInstance].GeoJSONStyle;
      if (
        !_.isUndefined(geojsons) &&
        !_.isEmpty(geojsons)
      ) {
        if (!_.isUndefined(geojsonStyle)) {
          let styles = geojsonStyle.style;
          //test if styles is an array
          if(!Array.isArray(styles)){
            styles=[];
          }
          //text if the length of geojson less than length of styles
          if(geojsons.length < styles.length){
            let newStyles =[];
            for (let i = 0; i < geojsons.length; i++) {
              newStyles.push(styles[i]);
            }
            styles=newStyles;
          }
          geojsons.forEach((geojson,index)=>{
           
            //test if the style exist
            if(styles.length>=index+1){
              const style = styles[index];
              //test if they have the same type
              if(findFeatureType(geojson) == style.type) {
                //test if properties are not changed
                if(JSON.stringify(findAllProperties(geojson)) !==
                JSON.stringify(style.allProperties)){
                  //create template style
                  styles[index] = createTemplateStyle(
                    self,
                    geojson,
                    index
                  );
                }
              } else {
                //replace with template style
                styles[index] = createTemplateStyle(
                  self,
                  geojson,
                  index
                );
              }
              
            }else{
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

    this.render = function () {
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'mapGeoJson' + idWidget);
      widgetHtml.setAttribute('style', 'width: inherit; height: inherit');
      document.addEventListener('play-tab-loaded', self.goToFirstRadioButton);
      $('#' + idDivContainer).html(widgetHtml);

      // Drawing the map
      // TODO : Report all map possibilites from map
      self.map = L.map('mapGeoJson' + idWidget, { preferCanvas: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(self.map);

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
      //set zoom position
      self.map.zoomControl.setPosition('topright');
      //config
      let config = self.defaultConfig;
      let GeoJSONStyle = modelsHiddenParams[idInstance].GeoJSONStyle;
      if (
        !_.isUndefined(GeoJSONStyle) &&
        !_.isEmpty(GeoJSONStyle) &&
        !_.isUndefined(GeoJSONStyle.config) &&
        !_.isUndefined(GeoJSONStyle.config.defaultCenter)
      ) {
        config = GeoJSONStyle.config;
      }
      //define bouding box
      let GeoJSONS = modelsHiddenParams[idInstance].GeoJSON;
      if (!_.isUndefined(GeoJSONS) && Array.isArray(GeoJSONS) && GeoJSONS.length > 0) {
        let bboxCoords = bbox(GeoJSONS[0]);
        let bounds = [
          [bboxCoords[1], bboxCoords[0]],
          [bboxCoords[3], bboxCoords[2]],
        ];
        self.map.fitBounds(bounds);
      } else {
        if (
          !_.isUndefined(GeoJSONStyle) &&
          !_.isEmpty(GeoJSONStyle) &&
          !_.isUndefined(GeoJSONStyle.config) &&
          !_.isUndefined(config.image) &&
          !_.isUndefined(config.image.imageBounds)
        ) {
          config = GeoJSONStyle.config;
          let bboxCoords = config.image.imageBounds;
          //validate bounds :
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
          }
        }
      } 
      //if image overlay exist
      if (
        !_.isUndefined(GeoJSONStyle) &&
        !_.isEmpty(GeoJSONStyle) &&
        !_.isUndefined(GeoJSONStyle.config)
      ) {
        let image =  GeoJSONStyle.config.image;
        self.addImageOverlay(image);
      }

      // internal layer group L.layerGroup
      self.layers = [];
      self.legends = [];

      if (
        !_.isUndefined(GeoJSONS) &&
        !_.isEmpty(GeoJSONS) && Array.isArray(GeoJSONS)
      ) {
        GeoJSONS.forEach((item, index) => {
          let name = 'layer ' + index;
          if (
            !_.isUndefined(GeoJSONStyle) &&
            !_.isEmpty(GeoJSONStyle) &&
            !_.isUndefined(GeoJSONStyle.style) &&
            Array.isArray(GeoJSONStyle.style) &&
            GeoJSONStyle.style.length > index
          ) {
            if (!_.isUndefined(GeoJSONStyle.style[index])) {
              if (!_.isUndefined(GeoJSONStyle.style[index].name)) {
                name = GeoJSONStyle.style[index].name;
              }
            }
          }
          self.addGeoJSONlayer(item, name);
        });
      }
    };

    this.getFillColor = getFillColor;
    this.createCluster = (LMarkers)=>{
      let leafLetLayer = L.markerClusterGroup();
      LMarkers.forEach(function (layerMarker) {
        leafLetLayer.addLayer(layerMarker);
      });
      return leafLetLayer;
    };
    // Create a Layer from a GeoJSON
    // Simple function dont take into account the style
    this.getLefletIndex = (leafletLayer) => {
      for (let index = 0; index < self.layers.length; index++) {
        const layer = self.layers[index];
        if (layer == leafletLayer) {
          return index;
        }
      }
      return undefined;
    };
    this.addGeoJSONlayer = function (geoJSON, name) {
      var leafletLayer = L.geoJSON(geoJSON,{
        style : createTemplateStyle(self,geoJSON,self.layers.length)
      }).addTo(self.map);
      self.layers.push(leafletLayer);
      self.legends.push(undefined);
      let leafletIndex = self.getLefletIndex(leafletLayer);
      configureEvents(self, geoJSON, leafletLayer, leafletIndex);
      //add layer
      //TO DO check GeoJSON Type :
      //radio button
      //self.ctrl.addBaseLayer(leafletLayer, name);
      //checkbox
      self.ctrl.addOverlay(leafletLayer, name);
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
    // Set style on layers called when input style
    this.style = function () {
      let config = modelsHiddenParams[idInstance].GeoJSONStyle.config;
      let ts = 'MapboxStreets';
      if (!_.isUndefined(config)) {
        // defaultCenter = config.defaultCenter;
        ts = config.tileServer;
      }
      var tileConf = getTileServerConf(ts);
      self.baseLayer = L.tileLayer(tileConf.url, tileConf);
      self.baseLayer.addTo(self.map);

      //update view
      // setZoom
      let zoom = function () {
        //Zoom
        if (
          modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter.defaultZoom ||
          _.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter.defaultZoom)
        ) {
          let bboxCoords = undefined;
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON) &&
            modelsHiddenParams[idInstance].GeoJSON.length > 0
          ) {
            bboxCoords = bbox(modelsHiddenParams[idInstance].GeoJSON[0]);
            bboxCoords = [
              [bboxCoords[1], bboxCoords[0]],
              [bboxCoords[3], bboxCoords[2]],
            ];
          } else {
            if (
              !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
              !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config) &&
              !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.image) &&
              !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.image.imageBounds)
            ) {
              config = modelsHiddenParams[idInstance].GeoJSONStyle.config;
              bboxCoords = config.image.imageBounds;
            }
          }
          // let bounds = [[bbox[1],bbox[0]],[bbox[3],bbox[2]]]
          let height = $('#' + idInstance).height();
          let width = $('#' + idInstance).width();
          self.map.fitBounds(bboxCoords);
          let zoom = self.map.getBoundsZoom(bboxCoords, false, [width, height]);
          modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter.zoom = zoom;
          //self.map.setZoom(zoom);
        } else {
          self.map.setZoom(modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter.zoom);
        }
      };
      zoom();
      //self.map.setView([defaultCenter.longitude, defaultCenter.latitude], defaultCenter.zoom);

      //update style
      if (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.style))
        modelsHiddenParams[idInstance].GeoJSONStyle.style.forEach(function (d, index) {
          setStyle(self, index, d);
        });

      if (self.styleChanged) {
        self.styleChanged = false;
        //  self.updateValue();
      }
    };


    this.GeoJSON = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].GeoJSON = [];
        if(val != null) {
          if (!Array.isArray(val)) {
            if (isValidGeoJSON(val)) {
              modelsHiddenParams[idInstance].GeoJSON.push(val);
            } else {
              throw new Error('Invalid GeoJSON ');
            }
          } else {
            for (let index = 0; index < val.length; index++) {
              const geojson = val[index];
              if (isValidGeoJSON(geojson)) {
                modelsHiddenParams[idInstance].GeoJSON.push(geojson);
              } else {
                throw new Error('Invalid GeoJSON at index = ' + index);
              }
            }
          }
  
          self.render();
          self.updateValue();
        }
       
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
        if(_.isUndefined(val) || val == null){
          return;
        }
        modelsHiddenParams[idInstance].GeoJSONStyle = val;
        if (_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config)) {
          modelsHiddenParams[idInstance].GeoJSONStyle.config = self.defaultConfig;
        }
        /*
        if (
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON) &&
          modelsHiddenParams[idInstance].GeoJSON.length > 0
        ) {
          //calcul layer 0 center
          const center = turf.centerOfMass(modelsHiddenParams[idInstance].GeoJSON[0]);
          modelsHiddenParams[idInstance].GeoJSONStyle.config = {
            ...self.defaultConfig,
            defaultCenter: {
              defaultZoom : true,
              latitude: center.geometry.coordinates[0],
              longitude: center.geometry.coordinates[1],
              zoom: 14,
            },
          };
        }
        else if(!_.isUndefined(val.config) && !_.isUndefined(val.config.image) && !_.isUndefined(val.config.image.imageBounds)){
          let bounds = val.config.image.imageBounds;
          if(Array.isArray(bounds) && bounds.length == 2){
            let p1 = bounds[0]
            let p2 = bounds[1]
            let longMoy = (p1[0]+p2[0])/2
            let latMoy = (p1[1]+p2[1])/2
            modelsHiddenParams[idInstance].GeoJSONStyle.config = {
              ...val.config,
              defaultCenter: {
                defaultZoom : true,
                latitude: latMoy,
                longitude: longMoy,
                zoom: 14,
              },
            };
          }

        }
        else {
          if (_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config)) {
            modelsHiddenParams[idInstance].GeoJSONStyle.config = {
              ...self.defaultConfig,
              defaultCenter: {
                latitude: 2.295,
                longitude: 48.8738,
                zoom: 8,
              },
            };
          }
        }*/

        self.style();
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
