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
    this.legendHeatMap = undefined;
    this.legendChoroplet = undefined;
    this.enable = function () {};

    this.disable = function () {};

    this.updateValue = function (e) {
      // Create new TempleStyle if old has not the same size
      // TODO : Check all style compatible with all element of model
      if (
        (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
          !Array.isArray(modelsHiddenParams[idInstance].GeoJSONStyle.style) &&
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) ||
        (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON) &&
          modelsHiddenParams[idInstance].GeoJSON.length !== modelsHiddenParams[idInstance].GeoJSONStyle.style.length)
      ) {
        modelsHiddenParams[idInstance].GeoJSONStyle.style = [];

        if (
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON) &&
          !_.isEmpty(modelsHiddenParams[idInstance].GeoJSON)
        ) {
          modelsHiddenParams[idInstance].GeoJSON.forEach((item, index) => {
            modelsHiddenParams[idInstance].GeoJSONStyle.style.push(self.createTemplateStyle(item, index));
          });
        }
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
            !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.style.length > 0)
          ) {
            if (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.style[index].name)) {
              name = modelsHiddenParams[idInstance].GeoJSONStyle.style[index].name;
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
      if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiPolygon) {
        //add events :
        // mouseover
        if (!_.isUndefined(leafletIndex)) {
          self.mouseoverHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];

            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.mouseover) ||
              _.isUndefined(style.events.mouseover.enabled) ||
              !style.events.mouseover.enabled
            ) {
              return;
            }
            //  mouseoverHandler(e)
            let eventStyle = {};
            if (
              !_.isUndefined(style) &&
              !_.isUndefined(style.events) &&
              !_.isUndefined(style.events.mouseover) &&
              !_.isUndefined(style.events.mouseover.style)
            ) {
              eventStyle = { ...style.events.mouseover.style };
            } else {
              return;
            }

            if (!_.isUndefined(eventStyle)) {
              e.target.setStyle(eventStyle);
            }
            e.target.bringToFront();
            //create popup
            let popup = new L.Popup();
            var bounds = e.target.getBounds();
            let popupContent = '<div>';
            let properties = style.tooltip.properties;
            _.each(properties, (property) => {
              popupContent =
                popupContent +
                '<p> <strong>' +
                property +
                '</strong> : ' +
                e.target.feature.properties[property] +
                '</p>';
            });
            popupContent = popupContent + '</div>';
            popup.setLatLng(bounds.getCenter());
            popup.setContent(popupContent);
            //open popup
            if (!_.isUndefined(properties) && properties.length > 0) {
              self.map.openPopup(popup);
            }
          };
          //handle mouse event for each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('mouseover', self.mouseoverHandler);
          });
        }
        //mouseout
        if (!_.isUndefined(leafletIndex)) {
          self.mouseoutHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];

            //if the curent layer is the clicked layer, apply click style
            if (e.target == self.state.selectedElement) {
              //apply click style
              if (
                _.isUndefined(style) ||
                _.isUndefined(style.events) ||
                _.isUndefined(style.events.click) ||
                _.isUndefined(style.events.click.enabled) ||
                !style.events.click.enabled
              ) {
                return;
              }
              let eventStyle = {};
              if (
                !_.isUndefined(style) &&
                !_.isUndefined(style.events) &&
                !_.isUndefined(style.events.click) &&
                !_.isUndefined(style.events.click.style)
              ) {
                eventStyle = { ...style.events.click.style };
              } else {
                return;
              }
              if (!_.isUndefined(eventStyle)) {
                e.target.setStyle(eventStyle);
              }
              return;
            }
            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.mouseover) ||
              _.isUndefined(style.events.mouseover.enabled) ||
              !style.events.mouseover.enabled
            ) {
              return;
            }
            let eventStyle = {};
            let colorScale = self.getColorScaleFromStyle(style);
            if (!_.isUndefined(e.target.feature.properties) && style.property in e.target.feature.properties) {
              var fillColor = self.getFillColor(
                geoJSON,
                style,
                e.target.feature.properties[style.property],
                colorScale
              );
            }
            if (!_.isUndefined(fillColor)) {
              eventStyle.fillColor = fillColor;
            } else {
              eventStyle.fillColor = style.fillColor;
            }
            if (_.isUndefined(eventStyle.fillOpacity)) {
              eventStyle.fillOpacity = style.fillOpacity;
            }
            if (_.isUndefined(eventStyle.color)) {
              eventStyle.color = style.color;
            }
            if (_.isUndefined(eventStyle.weight)) {
              eventStyle.weight = style.weight;
            }
            e.target.setStyle(eventStyle);
            //close popup
            self.map.closePopup();
          };
          //add event handler to each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('mouseout', self.mouseoutHandler);
          });
        }
        //click event
        if (!_.isUndefined(leafletIndex)) {
          self.clickHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];

            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.click) ||
              _.isUndefined(style.events.click.enabled) ||
              !style.events.click.enabled
            ) {
              return;
            }
            //save layer selected info
            self.Selected.setValue(e.target.feature.properties);
            self.Selected.updateCallback(self.Selected, self.Selected.getValue());
            //change style

            let eventStyle = {};
            if (
              !_.isUndefined(style) &&
              !_.isUndefined(style.events) &&
              !_.isUndefined(style.events.click) &&
              !_.isUndefined(style.events.click.style)
            ) {
              eventStyle = { ...style.events.click.style };
            } else {
              return;
            }
            let colorScale = self.getColorScaleFromStyle(style);
            //initial style for other layers
            leafletLayer.eachLayer(function (layer) {
              let layerStyle = { ...style };
              if (e.target != layer) {
                if (!_.isUndefined(layer.feature.properties) && style.property in layer.feature.properties) {
                  var fillColor = self.getFillColor(
                    geoJSON,
                    { ...style },
                    layer.feature.properties[style.property],
                    colorScale
                  );
                }
                if (!_.isUndefined(fillColor)) {
                  layerStyle.fillColor = fillColor;
                }
                layer.setStyle(layerStyle);
              } else {
                //case : unselect event (double click)
                if (self.state.selectedElement == e.target) {
                  if (!_.isUndefined(e.target.feature.properties) && style.property in e.target.feature.properties) {
                    var fillColor = self.getFillColor(
                      geoJSON,
                      { ...style },
                      e.target.feature.properties[style.property],
                      colorScale
                    );
                  }
                  if (!_.isUndefined(fillColor)) {
                    layerStyle.fillColor = fillColor;
                  }
                  layer.setStyle(layerStyle);
                } else {
                  //select event
                  e.target.setStyle(eventStyle);
                }
              }
            });

            //self.GeoJSONStyle.updateCallback(self.GeoJSONStyle, self.GeoJSONStyle.getValue());
            if (self.state.selectedElement == e.target) {
              //unselect element
              self.state.selectedElement = '';
              //save layer selected info
              self.Selected.setValue({});
              self.Selected.updateCallback(self.Selected, self.Selected.getValue());
            } else {
              //set selected element
              self.state.selectedElement = e.target;
            }
          };
          //add event handler to each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('click', self.clickHandler);
          });
        }
      } else if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiLineString) {
        //add events :
        // mouseover
        let leafletIndex = self.getLefletIndex(leafletLayer);
        if (!_.isUndefined(leafletIndex)) {
          self.mouseoverHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];

            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.mouseover) ||
              _.isUndefined(style.events.mouseover.enabled) ||
              !style.events.mouseover.enabled
            ) {
              return;
            }
            //  mouseoverHandler(e)
            let eventStyle = {};
            if (
              !_.isUndefined(style) &&
              !_.isUndefined(style.events) &&
              !_.isUndefined(style.events.mouseover) &&
              !_.isUndefined(style.events.mouseover.style)
            ) {
              eventStyle = { ...style.events.mouseover.style };
            } else {
              return;
            }

            if (!_.isUndefined(eventStyle)) {
              e.target.setStyle(eventStyle);
            }
            e.target.bringToFront();
            //create popup
            let popup = new L.Popup();
            var bounds = e.target.getBounds();
            let popupContent = '<div>';
            let properties = style.tooltip.properties;
            _.each(properties, (property) => {
              popupContent =
                popupContent +
                '<p> <strong>' +
                property +
                '</strong> : ' +
                e.target.feature.properties[property] +
                '</p>';
            });
            popupContent = popupContent + '</div>';
            popup.setLatLng(bounds.getCenter());
            popup.setContent(popupContent);
            //open popup
            if (!_.isUndefined(properties) && properties.length > 0) {
              self.map.openPopup(popup);
            }
          };
          //handle mouse event for each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('mouseover', self.mouseoverHandler);
          });
        }
        //mouseout
        if (!_.isUndefined(leafletIndex)) {
          self.mouseoutHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];
            //if the curent layer is the clicked layer, apply click style
            if (e.target == self.state.selectedElement) {
              //apply click style
              if (
                _.isUndefined(style) ||
                _.isUndefined(style.events) ||
                _.isUndefined(style.events.click) ||
                _.isUndefined(style.events.click.enabled) ||
                !style.events.click.enabled
              ) {
                return;
              }
              let eventStyle = {};
              if (
                !_.isUndefined(style) &&
                !_.isUndefined(style.events) &&
                !_.isUndefined(style.events.click) &&
                !_.isUndefined(style.events.click.style)
              ) {
                eventStyle = { ...style.events.click.style };
              } else {
                return;
              }
              if (!_.isUndefined(eventStyle)) {
                e.target.setStyle(eventStyle);
              }
              return;
            }
            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.mouseover) ||
              _.isUndefined(style.events.mouseover.enabled) ||
              !style.events.mouseover.enabled
            ) {
              return;
            }
            let eventStyle = {};
            let styleForObject = { ...style };
            let colorScale = self.getColorScaleFromStyle(style);
            eventStyle.color = self.getFillColor(
              geoJSON,
              { ...styleForObject },
              e.target.feature.properties[styleForObject.property],
              colorScale
            );
            if (_.isUndefined(eventStyle.color)) {
              eventStyle.color = styleForObject.color;
            }
            if (_.isUndefined(eventStyle.fillOpacity)) {
              eventStyle.fillOpacity = style.fillOpacity;
            }
            if (_.isUndefined(eventStyle.weight)) {
              eventStyle.weight = style.weight;
            }
            e.target.setStyle(eventStyle);
            //close popup
            self.map.closePopup();
          };
          //add event handler to each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('mouseout', self.mouseoutHandler);
          });
        }
        //click event
        if (!_.isUndefined(leafletIndex)) {
          self.clickHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];
            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.click) ||
              _.isUndefined(style.events.click.enabled) ||
              !style.events.click.enabled
            ) {
              return;
            }
            //save layer selected info
            self.Selected.setValue(e.target.feature.properties);
            self.Selected.updateCallback(self.Selected, self.Selected.getValue());
            //change style
            let colorScale = self.getColorScaleFromStyle(style);
            let eventStyle = {};
            if (
              !_.isUndefined(style) &&
              !_.isUndefined(style.events) &&
              !_.isUndefined(style.events.click) &&
              !_.isUndefined(style.events.click.style)
            ) {
              eventStyle = { ...style.events.click.style };
            } else {
              return;
            }

            //a layer was selected
            if (!_.isUndefined(self.state.selectedElement)) {
              //reset the style of old selected layer
              let layerStyle = { ...style };
              let lastSelectedLayer = self.state.selectedElement;
              if (
                !_.isUndefined(lastSelectedLayer.feature.properties) &&
                style.property in lastSelectedLayer.feature.properties
              ) {
                layerStyle.color = self.getFillColor(
                  geoJSON,
                  { ...style },
                  lastSelectedLayer.feature.properties[style.property],
                  colorScale
                );
              }
              if (_.isUndefined(layerStyle.color)) {
                layerStyle.color = style.color;
              }
              lastSelectedLayer.setStyle(layerStyle);
              //if the current clicked is not the older : change the style
              if (e.target != lastSelectedLayer) {
                //style the selected layer
                e.target.setStyle(eventStyle);
                self.state.selectedElement = e.target;
                self.Selected.setValue({ ...e.target.feature.properties });
              } else {
                //set layer style
                let layerStyle = { ...style };
                if (!_.isUndefined(e.target.feature.properties) && style.property in e.target.feature.properties) {
                  layerStyle.color = self.getFillColor(
                    geoJSON,
                    { ...style },
                    e.target.feature.properties[style.property],
                    colorScale
                  );
                }
                if (_.isUndefined(layerStyle.color)) {
                  layerStyle.color = style.color;
                }
                e.target.setStyle(layerStyle);
                //unselect element
                self.state.selectedElement = undefined;
                self.Selected.setValue({});
              }
              self.Selected.updateCallback(self.Selected, self.Selected.getValue());
            } else {
              //style the selected layer
              e.target.setStyle(eventStyle);
              self.state.selectedElement = e.target;
              self.Selected.setValue({ ...e.target.feature.properties });
            }
          };
          //add event handler to each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('click', self.clickHandler);
          });
        }
      } else if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiPoint) {
        //add events :
        // mouseover
        if (!_.isUndefined(leafletIndex)) {
          self.mouseoverHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];

            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.mouseover) ||
              _.isUndefined(style.events.mouseover.enabled) ||
              !style.events.mouseover.enabled
            ) {
              return;
            }
            //  mouseoverHandler(e)
            let eventStyle = {};
            if (
              !_.isUndefined(style) &&
              !_.isUndefined(style.events) &&
              !_.isUndefined(style.events.mouseover) &&
              !_.isUndefined(style.events.mouseover.style)
            ) {
              eventStyle = { ...style.events.mouseover.style };
            } else {
              return;
            }

            if (!_.isUndefined(eventStyle)) {
              e.target.setStyle(eventStyle);
            }
            e.target.bringToFront();
            //create popup
            let popup = new L.Popup();
            var bounds = e.target.getBounds();
            let popupContent = '<div>';
            let properties = style.tooltip.properties;
            _.each(properties, (property) => {
              popupContent =
                popupContent +
                '<p> <strong>' +
                property +
                '</strong> : ' +
                e.target.feature.properties[property] +
                '</p>';
            });
            popupContent = popupContent + '</div>';
            popup.setLatLng(bounds.getCenter());
            popup.setContent(popupContent);
            //open popup
            if (!_.isUndefined(properties) && properties.length > 0) {
              self.map.openPopup(popup);
            }
          };
          //handle mouse event for each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('mouseover', self.mouseoverHandler);
          });
        }
        //mouseout
        if (!_.isUndefined(leafletIndex)) {
          self.mouseoutHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];

            //if the curent layer is the clicked layer, apply click style
            if (e.target == self.state.selectedElement) {
              //apply click style
              if (
                _.isUndefined(style) ||
                _.isUndefined(style.events) ||
                _.isUndefined(style.events.click) ||
                _.isUndefined(style.events.click.enabled) ||
                !style.events.click.enabled
              ) {
                return;
              }
              let eventStyle = {};
              if (
                !_.isUndefined(style) &&
                !_.isUndefined(style.events) &&
                !_.isUndefined(style.events.click) &&
                !_.isUndefined(style.events.click.style)
              ) {
                eventStyle = { ...style.events.click.style };
              } else {
                return;
              }
              if (!_.isUndefined(eventStyle)) {
                e.target.setStyle(eventStyle);
              }
              return;
            }
            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.mouseover) ||
              _.isUndefined(style.events.mouseover.enabled) ||
              !style.events.mouseover.enabled
            ) {
              return;
            }
            let eventStyle = {};
            let colorScale = self.getColorScaleFromStyle(style);
            if (!_.isUndefined(e.target.feature.properties) && style.property in e.target.feature.properties) {
              var fillColor = self.getFillColor(
                geoJSON,
                style,
                e.target.feature.properties[style.property],
                colorScale
              );
            }
            if (!_.isUndefined(fillColor)) {
              eventStyle.fillColor = fillColor;
            } else {
              eventStyle.fillColor = style.fillColor;
            }
            if (_.isUndefined(eventStyle.fillOpacity)) {
              eventStyle.fillOpacity = style.fillOpacity;
            }
            if (_.isUndefined(eventStyle.color)) {
              eventStyle.color = style.color;
            }
            if (_.isUndefined(eventStyle.weight)) {
              eventStyle.weight = style.weight;
            }
            e.target.setStyle(eventStyle);
            //close popup
            self.map.closePopup();
          };
          //add event handler to each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('mouseout', self.mouseoutHandler);
          });
        }
        //click event
        if (!_.isUndefined(leafletIndex)) {
          self.clickHandler = (e) => {
            let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];

            if (
              _.isUndefined(style) ||
              _.isUndefined(style.events) ||
              _.isUndefined(style.events.click) ||
              _.isUndefined(style.events.click.enabled) ||
              !style.events.click.enabled
            ) {
              return;
            }
            //save layer selected info
            self.Selected.setValue(e.target.feature.properties);
            self.Selected.updateCallback(self.Selected, self.Selected.getValue());
            //change style

            let eventStyle = {};
            if (
              !_.isUndefined(style) &&
              !_.isUndefined(style.events) &&
              !_.isUndefined(style.events.click) &&
              !_.isUndefined(style.events.click.style)
            ) {
              eventStyle = { ...style.events.click.style };
            } else {
              return;
            }
            let colorScale = self.getColorScaleFromStyle(style);
            //initial style for other layers
            leafletLayer.eachLayer(function (layer) {
              let layerStyle = { ...style };
              if (e.target != layer) {
                if (!_.isUndefined(layer.feature.properties) && style.property in layer.feature.properties) {
                  var fillColor = self.getFillColor(
                    geoJSON,
                    { ...style },
                    layer.feature.properties[style.property],
                    colorScale
                  );
                }
                if (!_.isUndefined(fillColor)) {
                  layerStyle.fillColor = fillColor;
                }
                layer.setStyle(layerStyle);
              } else {
                //case : unselect event (double click)
                if (self.state.selectedElement == e.target) {
                  if (!_.isUndefined(e.target.feature.properties) && style.property in e.target.feature.properties) {
                    var fillColor = self.getFillColor(
                      geoJSON,
                      { ...style },
                      e.target.feature.properties[style.property],
                      colorScale
                    );
                  }
                  if (!_.isUndefined(fillColor)) {
                    layerStyle.fillColor = fillColor;
                  }
                  layer.setStyle(layerStyle);
                } else {
                  //select event
                  e.target.setStyle(eventStyle);
                }
              }
            });

            //self.GeoJSONStyle.updateCallback(self.GeoJSONStyle, self.GeoJSONStyle.getValue());
            if (self.state.selectedElement == e.target) {
              //unselect element
              self.state.selectedElement = '';
              //save layer selected info
              self.Selected.setValue({});
              self.Selected.updateCallback(self.Selected, self.Selected.getValue());
            } else {
              //set selected element
              self.state.selectedElement = e.target;
            }
          };
          //add event handler to each layer
          leafletLayer.eachLayer(function (layer) {
            layer.on('click', self.clickhandler);
          });
        }
      }

      //add layer
      //TO DO check GeoJSON Type :
      //radio button
      //self.ctrl.addBaseLayer(leafletLayer, name);
      //checkbox
      self.ctrl.addOverlay(leafletLayer, name);
    };

    // Create the style object that will be in out JSON for a geoJSON
    // typeLayer is used for marker or circle
    this.createTemplateStyle = function (geoJSON, index, typeLayer = undefined) {
      prop = geoJsonTools.findPropertiesWithNumber(geoJSON);
      allProp = geoJsonTools.findAllProperties(geoJSON);
      JSONtype = geoJsonTools.findFeatureType(geoJSON);
      baseStyle = {
        layer: (Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'layer ') + (index + 1),
        name: 'layer ' + (index + 1),
        stroke: true,
        color: 'black',
        weight: 1,
        opacity: 1,
        fillColor: '#447bdc',
        fillOpacity: 0.7,
        events: {
          mouseover: {
            enabled: false,
            style: {
              color: 'black',
              weight: 3,
              fillColor: '#354a5f',
              fillOpacity: 0.5,
            },
          },
          click: {
            enabled: false,
            style: {
              color: 'black',
              weight: 1,
              fillColor: '#2154ab',
              fillOpacity: 1,
            },
          },
        },
      };

      switch (JSONtype) {
        case geoJsonTools.equivalenceTypes.MultiLineString:
          let result = {
            ...baseStyle,
            showLegend: false,
            type: 'Multi Line',
            dashArray: [],
            property: Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'none',
            propertyMin: 'Auto',
            propertyMax: 'Auto',
            possibleProperties: prop,
            tooltip: {
              properties: [...allProp],
            },
          };
          delete result.fillColor;
          delete result.fillOpacity;
          return result;
          break;
        case geoJsonTools.equivalenceTypes.MultiPolygon:
          let commonStyle = {
            ...baseStyle,
            showLegend: true,
            legend: {
              title: (Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'Legend ') + (index + 1),
            },
            type: 'Multi Polygon',
            dashArray: [],
            property: Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'none',
            propertyMin: 'Auto',
            propertyMax: 'Auto',
            possibleProperties: prop,
            allProperties: allProp,
            tooltip: {
              properties: [...allProp],
            },
          };
          if (index == modelsHiddenParams[idInstance].GeoJSON.length - 1) {
            return commonStyle;
          } else {
            return { ...commonStyle, showLegend: false };
          }

          break;
        case geoJsonTools.equivalenceTypes.MultiPoint:
          if (allProp.includes('html') || allProp.includes('awesomeMarker') || typeLayer == L.marker) {
            let result = {
              ...baseStyle,
              name: 'layer ' + (index + 1),
              type: 'Multi Point',
              pointAreMarker: true,
              clickPopup: true,
              popupProperty: 'All',
              PropertiesList: allProp,
              tooltip: {
                properties: [...allProp],
              },
            };
            delete result.fillColor;
            delete result.fillOpacity;
            return result;
          } else {
            return {
              ...baseStyle,
              layer: index + 1,
              name: 'layer ' + (index + 1),
              type: 'Multi Point',
              showLegend: false,
              pointAreMarker: false,
              stroke: false,
              radius: 300,
              property: Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'none',
              propertyMin: 'Auto',
              propertyMax: 'Auto',
              possibleProperties: prop,
              allProperties: allProp,
              tooltip: {
                properties: [...allProp],
              },
            };
          }
          break;
        default:
          return {};
          break;
      }
    };
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
          self.setStyle(index, d);
        });

      if (self.styleChanged) {
        self.styleChanged = false;
        //  self.updateValue();
      }
    };

    // Set Style on GeoJSON layer
    this.setStyle = function (layerIndex, style) {
      // Get GeoJSON
      var geoJSONinLayer = modelsHiddenParams[idInstance].GeoJSON[layerIndex];
      var leafLetLayer = self.layers[layerIndex];
      let name = undefined;
      if (!_.isUndefined(style)) {
        if (!_.isUndefined(style.name)) {
          name = style.name;
        }
      }
      //rename Layer
      if (!_.isUndefined(name)) {
        self.ctrl.removeLayer(leafLetLayer);
        //radio button
        // self.ctrl.addBaseLayer(leafLetLayer, name);
        //check box
        self.ctrl.addOverlay(leafLetLayer, name);
      }

      let colorScale = undefined;

      //calcul color scale
      //using specified property
      //
      if (
        !_.isUndefined(style.property) &&
        !_.isUndefined(style.possibleProperties) &&
        style.property in style.possibleProperties
      ) {
        var minMaxAuto = style.possibleProperties[style.property];

        if (!_.isUndefined(style.propertyMin) && typeof style.propertyMin === 'number')
          minMaxAuto[0] = style.propertyMin;
        if (!_.isUndefined(style.propertyMax) && typeof style.propertyMax === 'number')
          minMaxAuto[1] = style.propertyMax;

        var color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
        if (!_.isUndefined(color)) {
          colorScale = self.getColorScale(color, 0, 100);
        }
      }

      // Important
      let styleForObject = { ...style };

      if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiPolygon) {
        let minMax = geoJsonTools.getMinMaxByProperty(geoJSONinLayer, styleForObject.property);
        if (Array.isArray(minMaxAuto)) {
          var min = minMaxAuto[0];
          var max = minMaxAuto[1];
        }
        if (Array.isArray(minMax)) {
          if (!_.isUndefined(min) && !_.isUndefined(max)) {
            if (min < minMax[0]) min = minMax[0];
            if (max > minMax[1]) max = minMax[1];
          }
        }
        leafLetLayer.eachLayer(function (layer) {
          var color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
          var colorScale = undefined;
          if (!_.isUndefined(color)) {
            colorScale = self.getColorScale(color, 0, 100);
          }
          if (!_.isUndefined(layer.feature.properties) && styleForObject.property in layer.feature.properties) {
            var fillColor = self.getFillColor(
              geoJSONinLayer,
              styleForObject,
              layer.feature.properties[styleForObject.property],
              colorScale
            );
          }
          if (!_.isUndefined(fillColor)) {
            styleForObject.fillColor = fillColor;
          } else {
            styleForObject.fillColor = style.fillColor;
          }
          if (layer == self.state.selectedElement) {
            layer.setStyle({
              fillOpacity: styleForObject.fillOpacity,
              weight: styleForObject.weight,
            });
          } else {
            layer.setStyle(styleForObject);
          }
        });
        self.map.on('layeradd layerremove', (e) => {
          if (self.map.hasLayer(self.layers[layerIndex])) {
            if (!_.isUndefined(styleForObject.showLegend)) {
              if (!!styleForObject.showLegend) {
                if (!_.isUndefined(self.legends[layerIndex])) {
                  self.legends[layerIndex].remove();
                }
                if (!_.isUndefined(min) && !_.isUndefined(max) && !_.isUndefined(colorScale)) {
                  self.legends[layerIndex] = self.createChoroplethLegend(
                    min,
                    max,
                    styleForObject.legend.title || '',
                    colorScale
                  );
                }
              } else {
                if (!_.isUndefined(self.legends[layerIndex])) {
                  self.map.removeControl(self.legends[layerIndex]);
                }
              }
            }
          } else {
            if (!_.isUndefined(self.legends[layerIndex])) {
              self.legends[layerIndex].remove();
            }
          }
        });
        //toggle legend
        if (self.map.hasLayer(self.layers[layerIndex])) {
          if (!_.isUndefined(styleForObject.showLegend)) {
            if (!!styleForObject.showLegend) {
              if (!_.isUndefined(self.legends[layerIndex])) {
                self.legends[layerIndex].remove();
                self.legends[layerIndex] = undefined;
              }
              if (!_.isUndefined(min) && !_.isUndefined(max) && !_.isUndefined(colorScale)) {
                self.legends[layerIndex] = self.createChoroplethLegend(
                  min,
                  max,
                  styleForObject.legend.title || '',
                  colorScale
                );
              }
            } else {
              if (!_.isUndefined(self.legends[layerIndex])) {
                self.map.removeControl(self.legends[layerIndex]);
                self.legends[layerIndex] = undefined;
              }
            }
          }
        } else {
          if (!_.isUndefined(self.legends[layerIndex])) {
            self.legends[layerIndex].remove();
          }
        }
      }

      if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiLineString) {
        let minMax = geoJsonTools.getMinMaxByProperty(geoJSONinLayer, styleForObject.property);
        if (Array.isArray(minMaxAuto)) {
          var min = minMaxAuto[0];
          var max = minMaxAuto[1];
        }
        if (Array.isArray(minMax)) {
          if (!_.isUndefined(min) && !_.isUndefined(max)) {
            if (min < minMax[0]) min = minMax[0];
            if (max > minMax[1]) max = minMax[1];
          }
        }
        leafLetLayer.eachLayer(function (layer) {
          var color = style.color;
          var colorScale = undefined;
          if (!_.isUndefined(color)) {
            colorScale = self.getColorScale(color, 0, 100);
          }
          if (!_.isUndefined(layer.feature.properties) && styleForObject.property in layer.feature.properties) {
            var fillColor = self.getFillColor(
              geoJSONinLayer,
              styleForObject,
              layer.feature.properties[styleForObject.property],
              colorScale
            );
          }
          if (!_.isUndefined(fillColor)) {
            styleForObject.color = fillColor;
          } else {
            styleForObject.color = style.color;
          }
          if (layer == self.state.selectedElement) {
            layer.setStyle({
              fillOpacity: styleForObject.fillOpacity,
              weight: styleForObject.weight,
            });
          } else {
            layer.setStyle(styleForObject);
          }
        });
        //legend
        var length = 100;
        var colorStops = [0, 25, 50, 75, 100];
        self.map.on('layeradd layerremove', (e) => {
          if (self.map.hasLayer(self.layers[layerIndex])) {
            if (!_.isUndefined(styleForObject.showLegend)) {
              if (!!styleForObject.showLegend) {
                if (!_.isUndefined(self.legendHeatMap)) {
                  self.legendHeatMap.remove();
                }
                self.legendHeatMap = self.createLegend(
                  colorScale,
                  length,
                  colorStops,
                  minMaxAuto[0],
                  minMaxAuto[1],
                  styleForObject.property
                );
              } else {
                if (!_.isUndefined(self.legendHeatMap)) {
                  self.map.removeControl(self.legendHeatMap);
                }
              }
            }
          } else {
            if (!_.isUndefined(self.legendHeatMap)) {
              self.legendHeatMap.remove();
            }
          }
        });
        if (self.map.hasLayer(self.layers[layerIndex])) {
          if (!_.isUndefined(styleForObject.showLegend)) {
            if (!!styleForObject.showLegend) {
              if (!_.isUndefined(self.legendHeatMap)) {
                if (!_.isUndefined(self.legendHeatMap)) {
                  self.legendHeatMap.remove();
                }
              }
              self.legendHeatMap = self.createLegend(
                colorScale,
                length,
                colorStops,
                minMaxAuto[0],
                minMaxAuto[1],
                styleForObject.property
              );
            } else {
              if (!_.isUndefined(self.legendHeatMap)) {
                self.map.removeControl(self.legendHeatMap);
              }
            }
          }
        }
      }

      if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiPoint) {
        if (styleForObject.pointAreMarker) {
          // Change All Circle in Marker if L.Circle was transformed in L.Marker
          // if (leafLetLayer.getLayers()[0] instanceof L.Circle) {
          newStyle = self.createTemplateStyle(geoJSONinLayer, layerIndex, L.marker);
          Object.keys(style).forEach((key) => {
            delete style[key];
          });
          Object.assign(style, { ...newStyle });

          self.styleChanged = true;

          LMarkers = leafLetLayer.getLayers().map(function (layer) {
            const marker = L.marker(layer.getLatLng());
            marker.feature = layer.feature;
            return marker;
          });

          leafLetLayer.clearLayers();

          // Add Marker TODO : Create a markerClusterGroup and the option to do so
          LMarkers.forEach(function (layerMarker) {
            leafLetLayer.addLayer(layerMarker);
          });
          // }

          // TODO : in futur if first item is a markerClusterGroup do the eachLayer on the markerClusterGroup
          //
          leafLetLayer.eachLayer(function (layer) {
            // Remove Popup if done
            if (!_.isUndefined(layer.getPopup())) {
              popup = layer.getPopup();
              layer.unbindPopup();

              // IMPORTANT
              popup.remove();
            }

            if (layer.feature.properties.awesomeMarker) {
              var awMarker = L.AwesomeMarkers.icon(layer.feature.properties.awesomeMarker);
              layer.setIcon(awMarker);
            }

            // Put new Popup
            let popupText = '';
            if (
              !_.isUndefined(styleForObject.popupProperty) &&
              !_.isUndefined(layer.feature.properties[styleForObject.popupProperty])
            ) {
              popupText = styleForObject.popupProperty + ' : ' + layer.feature.properties[styleForObject.popupProperty];
            }

            // legacy comment and html are priotary tag
            else if (layer.feature.properties.comment) {
              popupText = layer.feature.properties.comment;
            } else if (layer.feature.properties.html) {
              popupText = layer.feature.properties.html;
            } else {
              let popupText = '<div>';
              let properties = style.tooltip.properties;
              _.each(properties, (property) => {
                popupText =
                  popupText + '<p> <strong>' + property + '</strong> : ' + layer.feature.properties[property] + '</p>';
              });
              popupText = popupText + '</div>';
            }

            // Add The popup
            if (style.clickPopup) {
              // Popup on click
              mk = layer.bindPopup(popupText, { autoClose: false, autoPan: false });
            } else {
              // persistent popup
              mk = layer.bindPopup(popupText, { autoClose: false, autoPan: false });
              mk.on('add', function (event) {
                event.target.openPopup();
              });
              layer.openPopup();
            }
          });
        } else {
          // Transform each L.Marker in L.Circle
          if (leafLetLayer.getLayers()[0] instanceof L.Marker) {
            newStyle = self.createTemplateStyle(geoJSONinLayer, layerIndex, L.circle);
            Object.keys(style).forEach((key) => {
              if (!(key in newStyle)) {
                delete style[key];
              }
            });
            Object.keys(newStyle).forEach((key) => {
              if (!(key in style)) {
                style[key] = newStyle[key];
              }
            });
            //Object.assign(style, { ...newStyle });
            self.styleChanged = true;
            LCircles = leafLetLayer.getLayers().map(function (layer) {
              const { lat, lng } = layer.getLatLng();
              const circle = L.circle([lat, lng]);
              circle.feature = layer.feature;
              return circle;
            });

            leafLetLayer.clearLayers();
            LCircles.forEach(function (layerCircle) {
              if (!_.isUndefined(self.mouseoverHandler)) {
                layerCircle.on('mouseover', self.mouseoverHandler);
              }
              if (!_.isUndefined(self.mouseoutHandler)) {
                layerCircle.on('mouseout', self.mouseoutHandler);
              }
              if (!_.isUndefined(self.clickHandler)) {
                layerCircle.on('click', self.clickHandler);
              }

              leafLetLayer.addLayer(layerCircle);
            });
            styleForObject = { ...style };
          }
          var minMaxAuto = style.possibleProperties[styleForObject.property];

          if (!_.isUndefined(styleForObject.propertyMin) && typeof styleForObject.propertyMin === 'number')
            minMaxAuto[0] = styleForObject.propertyMin;
          if (!_.isUndefined(styleForObject.propertyMax) && typeof styleForObject.propertyMax === 'number')
            minMaxAuto[1] = styleForObject.propertyMax;

          let minMax = geoJsonTools.getMinMaxByProperty(geoJSONinLayer, styleForObject.property);
          let min = minMaxAuto[0];
          let max = minMaxAuto[1];
          if (min < minMax[0]) min = minMax[0];
          if (max > minMax[1]) max = minMax[1];
          leafLetLayer.eachLayer(function (layer) {
            if (!_.isUndefined(colorScale)) {
              let value = layer.feature.properties[styleForObject.property];

              let pct = ((value - min) / (max - min)) * 100;
              styleForObject.fillColor = colorScale(pct);
            }

            layer.setStyle(styleForObject);
            if (!_.isUndefined(styleForObject.radius)) {
              layer.setRadius(styleForObject.radius); // LafLet bug  setRadius must be called (Radius in Style is not check by Leaflet)
            }
          });

          //legend
          var length = 100;
          var colorStops = [0, 25, 50, 75, 100];

          self.map.on('layeradd layerremove', (e) => {
            if (self.map.hasLayer(self.layers[layerIndex])) {
              if (!_.isUndefined(styleForObject.showLegend)) {
                if (!!styleForObject.showLegend) {
                  if (!_.isUndefined(self.legendHeatMap)) {
                    if (!_.isUndefined(self.legendHeatMap)) {
                      self.legendHeatMap.remove();
                    }
                  }
                  self.legendHeatMap = self.createLegend(
                    colorScale,
                    length,
                    colorStops,
                    minMaxAuto[0],
                    minMaxAuto[1],
                    styleForObject.property
                  );
                } else {
                  if (!_.isUndefined(self.legendHeatMap)) {
                    self.map.removeControl(self.legendHeatMap);
                  }
                }
              }
            } else {
              if (!_.isUndefined(self.legendHeatMap)) {
                self.legendHeatMap.remove();
              }
            }
          });
          if (self.map.hasLayer(self.layers[layerIndex])) {
            if (!_.isUndefined(styleForObject.showLegend)) {
              if (!!styleForObject.showLegend) {
                if (!_.isUndefined(self.legendHeatMap)) {
                  if (!_.isUndefined(self.legendHeatMap)) {
                    self.legendHeatMap.remove();
                  }
                }
                self.legendHeatMap = self.createLegend(
                  colorScale,
                  length,
                  colorStops,
                  minMaxAuto[0],
                  minMaxAuto[1],
                  styleForObject.property
                );
              } else {
                if (!_.isUndefined(self.legendHeatMap)) {
                  self.map.removeControl(self.legendHeatMap);
                }
              }
            }
          }
        }
      }
    };

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
        self.updateValue();
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
