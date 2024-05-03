// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Benoit LEHMAN & Mongi BEN GAID & Mohamed ERRAHALI      │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// Important Style Behavior : Style will be available as out from the map first only in View mode
// The contact between the widget and out properties is only done at first enable

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
      if (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle)) {
        if (
          !Array.isArray(modelsHiddenParams[idInstance].GeoJSONStyle.style) ||
          modelsHiddenParams[idInstance].GeoJSON.length < modelsHiddenParams[idInstance].GeoJSONStyle.style.length
        ) {
          modelsHiddenParams[idInstance].GeoJSONStyle.style = []; // reset when geojson has less item
        }

        if (modelsHiddenParams[idInstance].GeoJSONStyle.style.length) {
          modelsHiddenParams[idInstance].GeoJSON.forEach((item, index) => {
            if (index < modelsHiddenParams[idInstance].GeoJSONStyle.style.length) {
              if (geoJsonTools.findFeatureType(item) !== modelsHiddenParams[idInstance].GeoJSONStyle.style[index].type)
                modelsHiddenParams[idInstance].GeoJSONStyle.style = []; // reset when old/previous geojson changed type
            }
          });
        }

        //  if (!_.isEmpty(modelsHiddenParams[idInstance].GeoJSON)) {
        modelsHiddenParams[idInstance].GeoJSON.forEach((item, index) => {
          if (index >= modelsHiddenParams[idInstance].GeoJSONStyle.style.length)
            modelsHiddenParams[idInstance].GeoJSONStyle.style.push(self.createTemplateStyle(self, item, index)); //add new geojson style
        });
        //  }
      }
      self.GeoJSONStyle.updateCallback(self.GeoJSONStyle, self.GeoJSONStyle.getValue());
    };

    this.rescale = function () {};

    this.getColorScale = colorScaleManager.getColorScale;
    this.getColorScaleFromStyle = colorScaleManager.getColorScaleFromStyle;
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

      config = self.defaultConfig;
      if (
        !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
        !_.isEmpty(modelsHiddenParams[idInstance].GeoJSONStyle) &&
        !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config) &&
        !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter)
      ) {
        config = modelsHiddenParams[idInstance].GeoJSONStyle.config;
      }
      self.map = L.map('mapGeoJson' + idWidget, { preferCanvas: true });
      if (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSON) && modelsHiddenParams[idInstance].GeoJSON.length > 0) {
        let bbox = turf.bbox(modelsHiddenParams[idInstance].GeoJSON[0]);
        let bounds = [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ];
        self.map.fitBounds(bounds);
      } else {
        if (
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
          !_.isEmpty(modelsHiddenParams[idInstance].GeoJSONStyle) &&
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config) &&
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.image) &&
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.image.imageBounds)
        ) {
          config = modelsHiddenParams[idInstance].GeoJSONStyle.config;
          let bbox = config.image.imageBounds;
          self.map.fitBounds(bbox);
        }
      }

      //self.map.zoomControl.setPosition('topright');

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

      //if image overlay exist
      if (
        !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
        !_.isEmpty(modelsHiddenParams[idInstance].GeoJSONStyle) &&
        !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config)
      ) {
        let image = modelsHiddenParams[idInstance].GeoJSONStyle.config.image;
        self.addImageOverlay(image);
      }

      // internal layer group L.layerGroup
      self.layers = [];
      self.legends = [];

      if (
        !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON) &&
        !_.isEmpty(modelsHiddenParams[idInstance].GeoJSON)
      ) {
        modelsHiddenParams[idInstance].GeoJSON.forEach((item, index) => {
          let name = 'layer ' + index;
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
            !_.isEmpty(modelsHiddenParams[idInstance].GeoJSONStyle) &&
            !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.style) &&
            modelsHiddenParams[idInstance].GeoJSONStyle.style.length > 0
          ) {
            if (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.style[index])) {
              if (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.style[index].name)) {
                name = modelsHiddenParams[idInstance].GeoJSONStyle.style[index].name;
              }
            }
          }
          self.addGeoJSONlayer(item, name);
        });
      }
    };

    this.getFillColor = geoJsonTools.getFillColor;

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
      var leafletLayer = L.geoJSON(geoJSON).addTo(self.map);
      self.layers.push(leafletLayer);
      self.legends.push(undefined);
      let leafletIndex = self.getLefletIndex(leafletLayer);
      eventsManager.configureEvents(self, geoJSON, leafletLayer, leafletIndex);
      //add layer
      //TO DO check GeoJSON Type :
      //radio button
      //self.ctrl.addBaseLayer(leafletLayer, name);
      //checkbox
      self.ctrl.addOverlay(leafletLayer, name);
    };

    // Create the style object that will be in out JSON for a geoJSON
    // typeLayer is used for marker or circle
    this.createTemplateStyle = styleManager.createTemplateStyle;
    this.getColor = colorScaleManager.getColor;

    this.createChoroplethLegend = function (min, max, featureTitle, colorScale) {
      legend = legends.createChoroplethLegend(self.getColor, min, max, featureTitle, colorScale);
      if (!_.isUndefined(legend)) {
        legend.addTo(self.map);
      }
      return legend;
    };
    this.createLegend = function (color, length, colorStops, min, max, featureTitle) {
      legend = legends.createLegend(color, length, colorStops, min, max, featureTitle);
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
      config = modelsHiddenParams[idInstance].GeoJSONStyle.config;
      ts = 'MapboxStreets';
      defaultCenter = self.defaultConfig.defaultCenter;
      if (!_.isUndefined(config)) {
        // defaultCenter = config.defaultCenter;
        ts = config.tileServer;
      }
      if (!_.isUndefined(tileServers)) {
        //update tile server
        var tileConf = tileServers.getTileServerConf(ts);
        self.baseLayer = L.tileLayer(tileConf.url, tileConf);
        self.baseLayer.addTo(self.map);
      }

      //update view
      // setZoom
      let zoom = function () {
        //Zoom
        if (
          modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter.defaultZoom ||
          _.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter.defaultZoom)
        ) {
          let bbox = undefined;
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON) &&
            modelsHiddenParams[idInstance].GeoJSON.length > 0
          ) {
            bbox = turf.bbox(modelsHiddenParams[idInstance].GeoJSON[0]);
            bbox = [
              [bbox[1], bbox[0]],
              [bbox[3], bbox[2]],
            ];
          } else {
            if (
              !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
              !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config) &&
              !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.image) &&
              !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.image.imageBounds)
            ) {
              config = modelsHiddenParams[idInstance].GeoJSONStyle.config;
              bbox = config.image.imageBounds;
            }
          }
          // let bounds = [[bbox[1],bbox[0]],[bbox[3],bbox[2]]]
          let height = $('#' + idInstance).height();
          let width = $('#' + idInstance).width();
          self.map.fitBounds(bbox);
          let zoom = self.map.getBoundsZoom(bbox, false, [width, height]);
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
          self.setStyle(self, index, d);
        });

      if (self.styleChanged) {
        self.styleChanged = false;
        //  self.updateValue();
      }
    };

    // Set Style on GeoJSON layer
    this.setStyle = styleManager.setStyle;
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

    this.GeoJSON = {
      updateCallback: function () {},
      setValue: function (val) {
        if (!Array.isArray(val)) {
          modelsHiddenParams[idInstance].GeoJSON = [];
          modelsHiddenParams[idInstance].GeoJSON.push(val);
        } else {
          modelsHiddenParams[idInstance].GeoJSON = val;
        }

        self.render();
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
    name: 'mapGeoJson',
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
var mapGeoJsonWidgetsPlugin = new mapGeoJsonWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(mapGeoJsonWidgetsPlugin);
