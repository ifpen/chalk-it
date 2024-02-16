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

modelsHiddenParams.mapGeoJson = { GeoJSON: undefined, GeoJSONStyle: undefined };

function mapGeoJsonWidgetsPluginClass() {
  this.mapGeoJsonWidgets = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    this.state = {
      selectedElement: '',
    };
    this.defaultConfig = {
      defaultCenter: {
        latitude: 2.295,
        longitude: 48.8738,
        zoom: 8,
      },
      tileServer: 'MapboxStreets',
      possibleTileServers: ['MapboxStreets', 'MapboxDark', 'HereSatelliteDay', 'HereTerrainDay', 'HereHybridDay'],
    };

    var self = this;
    this.legend = undefined;
    this.legendHeatMap = undefined;
    this.legendChoroplet = undefined;
    this.enable = function () {};

    this.disable = function () {};

    this.updateValue = function (e) {
      // Create new TempleStyle if old has not the same size
      // TODO : Check all style compatible with all element of model
      if (
        (!Array.isArray(modelsHiddenParams[idInstance].GeoJSONStyle.style) &&
          !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) ||
        modelsHiddenParams[idInstance].GeoJSON.length !== modelsHiddenParams[idInstance].GeoJSONStyle.style.length
      ) {
        modelsHiddenParams[idInstance].GeoJSONStyle.style = [];

        if (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) {
          modelsHiddenParams[idInstance].GeoJSON.forEach((item, index) => {
            modelsHiddenParams[idInstance].GeoJSONStyle.style.push(self.createTemplateStyle(item, index));
          });
        }
      }
      self.GeoJSONStyle.updateCallback(self.GeoJSONStyle, self.GeoJSONStyle.getValue());
    };

    this.rescale = function () {};

    this.getColorScale = function (colorScaleName, min, max) {
      reverseColorScale = false;
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
      // return colorScaleManager.getColorScale(colorScaleName, min, max);
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
        !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config) &&
        !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter)
      ) {
        config = modelsHiddenParams[idInstance].GeoJSONStyle.config;
      }
      self.map = L.map('mapGeoJson' + idWidget, { preferCanvas: true }).setView(
        [config.defaultCenter.longitude, config.defaultCenter.latitude],
        config.defaultCenter.zoom
      );
      self.map.zoomControl.setPosition('topright');

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

      // internal layer group L.layerGroup
      self.layers = [];
      if (!_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) {
        modelsHiddenParams[idInstance].GeoJSON.forEach((item, index) => {
          let name = 'layer ' + index;
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) &&
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

      //add events :
      // mouseover
      let leafletIndex = self.getLefletIndex(leafletLayer);
      if (!_.isUndefined(leafletIndex)) {
        self.mouseoverHandler = (e) => {
          //  mouseoverHandler(e)
          let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];
          let eventStyle = { ...style.events.mouseover.style };
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
            let eventStyle = style.events.click.style;
            if (!_.isUndefined(eventStyle)) {
              e.target.setStyle(eventStyle);
            }
            return;
          }
          if (
            !_.isUndefined(style.property) &&
            !_.isUndefined(style.possibleProperties) &&
            style.property in style.possibleProperties
          ) {
            //create old style before mouseover
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
          let minMax = geoJsonTools.getMinMaxByProperty(geoJSON, style.property);
          let min = minMaxAuto[0];
          let max = minMaxAuto[1];
          if (min < minMax[0]) min = minMax[0];
          if (max > minMax[1]) max = minMax[1];
          let eventStyle = {};
          if (!_.isUndefined(colorScale)) {
            let value = e.target.feature.properties[style.property];
            eventStyle.fillColor = self.getColor(min, max, value, colorScale);
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
        self.clickhandler = (e) => {
          //save layer selected info
          self.Selected.setValue(e.target.feature.properties);
          self.Selected.updateCallback(self.Selected, self.Selected.getValue());
          //change style

          let style = { ...modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex] };
          let eventStyle = { ...style.events.click.style };
          //initial style for other layers
          leafletLayer.eachLayer(function (layer) {
            if (e.target != layer) {
              if (
                !_.isUndefined(style.property) &&
                !_.isUndefined(style.possibleProperties) &&
                style.property in style.possibleProperties
              ) {
                //create old style before mouseover
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
              let minMax = geoJsonTools.getMinMaxByProperty(geoJSON, style.property);
              let min = minMaxAuto[0];
              let max = minMaxAuto[1];
              if (min < minMax[0]) min = minMax[0];
              if (max > minMax[1]) max = minMax[1];
              if (!_.isUndefined(colorScale)) {
                let value = layer.feature.properties[style.property];
                style.fillColor = self.getColor(min, max, value, colorScale);
              }
              layer.setStyle(style);
            } else {
              //case : unselect event (double click)
              if (self.state.selectedElement == e.target) {
                if (
                  !_.isUndefined(style.property) &&
                  !_.isUndefined(style.possibleProperties) &&
                  style.property in style.possibleProperties
                ) {
                  //create old style before mouseover
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
                let minMax = geoJsonTools.getMinMaxByProperty(geoJSON, style.property);
                let min = minMaxAuto[0];
                let max = minMaxAuto[1];
                if (min < minMax[0]) min = minMax[0];
                if (max > minMax[1]) max = minMax[1];
                if (!_.isUndefined(colorScale)) {
                  let value = layer.feature.properties[style.property];
                  style.fillColor = self.getColor(min, max, value, colorScale);
                }
                layer.setStyle(style);
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
      //add legend in the first render
      let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];
      var minMaxAuto = style.possibleProperties[style.property];
      if (!_.isUndefined(style.propertyMin) && typeof style.propertyMin === 'number') minMaxAuto[0] = style.propertyMin;
      if (!_.isUndefined(style.propertyMax) && typeof style.propertyMax === 'number') minMaxAuto[1] = style.propertyMax;

      let minMax = geoJsonTools.getMinMaxByProperty(geoJSON, style.property);
      var color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
      if (!_.isUndefined(color)) {
        colorScale = self.getColorScale(color, 0, 100);
      }
      let min = minMaxAuto[0];
      let max = minMaxAuto[1];
      if (min < minMax[0]) min = minMax[0];
      if (max > minMax[1]) max = minMax[1];

      //legend
      if (!_.isUndefined(style.showLegend)) {
        if (!!style.showLegend) {
          if (!_.isUndefined(self.legend)) {
            self.legend.remove();
          }
          self.legend = self.createChoroplethLegend(min, max, style.property + '' + (leafletIndex + 1), colorScale);
        } else {
          if (!_.isUndefined(self.legend)) {
            self.map.removeControl(self.legend);
          }
        }
      }
      //leafletLayer events
      leafletLayer.on('add', (e) => {
        let style = modelsHiddenParams[idInstance].GeoJSONStyle.style[leafletIndex];
        var minMaxAuto = style.possibleProperties[style.property];
        if (!_.isUndefined(style.propertyMin) && typeof style.propertyMin === 'number')
          minMaxAuto[0] = style.propertyMin;
        if (!_.isUndefined(style.propertyMax) && typeof style.propertyMax === 'number')
          minMaxAuto[1] = style.propertyMax;

        let minMax = geoJsonTools.getMinMaxByProperty(geoJSON, style.property);
        var color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
        if (!_.isUndefined(color)) {
          colorScale = self.getColorScale(color, 0, 100);
        }
        let min = minMaxAuto[0];
        let max = minMaxAuto[1];
        if (min < minMax[0]) min = minMax[0];
        if (max > minMax[1]) max = minMax[1];

        //legend
        if (!_.isUndefined(style.showLegend)) {
          if (!!style.showLegend) {
            if (!_.isUndefined(self.legend)) {
              self.legend.remove();
            }
            self.legend = self.createChoroplethLegend(min, max, style.property + '' + (leafletIndex + 1), colorScale);
          } else {
            if (!_.isUndefined(self.legend)) {
              self.map.removeControl(self.legend);
            }
          }
        }
      });
      //leafletLayer events
      leafletLayer.on('remove', (e) => {
        //remove legend
        console.log('remove legend ');
        if (!_.isUndefined(self.legend)) {
          self.legend.remove();
        }
      });

      //add layer
      //TO DO check GeoJSON Type :
      self.ctrl.addBaseLayer(leafletLayer, name);
      //self.ctrl.addOverlay(leafletLayer, name);
    };

    // Create the style object that will be in out JSON for a geoJSON
    // typeLayer is used for marker or circle
    this.createTemplateStyle = function (geoJSON, index, typeLayer = undefined) {
      prop = geoJsonTools.findPropertiesWithNumber(geoJSON);
      allProp = geoJsonTools.findAllProperties(geoJSON);
      JSONtype = geoJsonTools.findFeatureType(geoJSON);

      switch (JSONtype) {
        case geoJsonTools.equivalenceTypes.MultiLineString:
          return {
            layer: index + 1,
            showLegend: true,
            name: 'layer ' + (index + 1),
            type: 'Multi Line',
            stroke: true,
            dashArray: [],
            color: 'black',
            weight: 1,
            opacity: 1,
            property: Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'none',
            propertyMin: 'Auto',
            propertyMax: 'Auto',
            possibleProperties: prop,
            tooltip: {
              properties: [...allProp],
            },
            events: {
              mouseover: {
                style: {
                  color: 'black',
                  weight: 3,
                },
              },
              /*   mouseout: {
                style: {
                  color: 'black',
                  weight: 1,
                },
              },*/
              click: {
                style: {
                  color: 'black',
                  weight: 1,
                },
              },
            },
          };
          break;
        case geoJsonTools.equivalenceTypes.MultiPolygon:
          return {
            layer: index + 1,
            name: 'layer ' + (index + 1),
            showLegend: true,
            type: 'Multi Polygon',
            stroke: true,
            color: 'black',
            dashArray: [],
            weight: 1,
            opacity: 1,
            fillColor: 'red',
            property: Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'none',
            propertyMin: 'Auto',
            propertyMax: 'Auto',
            fillOpacity: 1,
            possibleProperties: prop,
            allProperties: allProp,
            tooltip: {
              properties: [...allProp],
            },
            events: {
              mouseover: {
                style: {
                  color: 'black',
                  weight: 3,
                },
              },
              /*   mouseout: {
                style: {
                  color: 'black',
                  weight: 1,
                },
              },*/
              click: {
                style: {
                  color: 'black',
                  weight: 1,
                },
              },
            },
          };
          break;
        case geoJsonTools.equivalenceTypes.MultiPoint:
          if (allProp.includes('html') || allProp.includes('awesomeMarker') || typeLayer == L.marker) {
            return {
              layer: index + 1,
              name: 'layer ' + (index + 1),
              type: 'Multi Point',
              pointAreMarker: true,
              clickPopup: true,
              popupProperty: 'All',
              PropertiesList: allProp,
              tooltip: {
                properties: [...allProp],
              },
              events: {
                mouseover: {
                  style: {
                    color: 'black',
                    weight: 3,
                  },
                },
                /* mouseout: {
                  style: {
                    color: 'black',
                    weight: 1,
                  },
                },*/
                click: {
                  style: {
                    color: 'black',
                    weight: 1,
                  },
                },
              },
            };
          } else {
            return {
              layer: index + 1,
              name: 'layer ' + (index + 1),
              type: 'Multi Point',
              showLegend: true,
              pointAreMarker: false,
              stroke: false,
              weight: 0,
              opacity: 1,
              color: 'black',
              radius: 5,
              fillColor: 'red',
              property: Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'none',
              propertyMin: 'Auto',
              propertyMax: 'Auto',
              fillOpacity: 1,
              possibleProperties: prop,
              tooltip: {
                properties: [...allProp],
              },
              events: {
                mouseover: {
                  style: {
                    color: 'black',
                    weight: 3,
                  },
                },
                /*  mouseout: {
                  style: {
                    color: 'black',
                    weight: 1,
                  },
                },*/
                click: {
                  style: {
                    color: 'black',
                    weight: 1,
                  },
                },
              },
            };
          }
          break;
        default:
          return {};
          break;
      }
    };
    this.getColor = function (min, max, d, colorScale) {
      var step = (max - min) / 8.0;

      var stepDraw = Math.floor((d - min) / step);
      return colorScale(stepDraw * (1.0 / 8.0) * 100);
    };

    this.createChoroplethLegend = function (min, max, featureTitle, colorScale) {
      legend = legends.createChoroplethLegend(self.getColor, min, max, featureTitle, colorScale);
      legend.addTo(self.map);
      return legend;
    };
    this.createLegend = function (color, length, colorStops, min, max, featureTitle) {
      legend = legends.createLegend(color, length, colorStops, min, max, featureTitle);
      legend.addTo(self.map);
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

      //self.map.setView([defaultCenter.longitude, defaultCenter.latitude], defaultCenter.zoom);

      //update style
      modelsHiddenParams[idInstance].GeoJSONStyle.style.forEach(function (d, index) {
        self.setStyle(index, d);
      });

      if (self.styleChanged) {
        self.styleChanged = false;
        self.updateValue();
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
      if (!_.isUndefined(name)) {
        self.ctrl.removeLayer(leafLetLayer);
        self.ctrl.addBaseLayer(leafLetLayer, name);
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
        let min = minMaxAuto[0];
        let max = minMaxAuto[1];
        if (min < minMax[0]) min = minMax[0];
        if (max > minMax[1]) max = minMax[1];
        leafLetLayer.eachLayer(function (layer) {
          if (!_.isUndefined(colorScale)) {
            let value = layer.feature.properties[styleForObject.property];

            styleForObject.fillColor = self.getColor(min, max, value, colorScale);
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
        //toggle legend
        /* if (!_.isUndefined(styleForObject.showLegend)) {
          if (!!styleForObject.showLegend) {
            if (!_.isUndefined(self.legend)) {
              self.legend.remove();
              self.legend=undefined
            }
            self.legend = self.createChoroplethLegend(min, max, styleForObject.property + '' + ( self.getLefletIndex(leafLetLayer)+1), colorScale);
          } else {
            if (!_.isUndefined(self.legend)) {
              self.map.removeControl(self.legend);
              self.legend=undefined
            }
          }
        }*/
      }

      if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiLineString) {
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
            styleForObject.color = colorScale(pct);
          }
          layer.setStyle(styleForObject);
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
          if (leafLetLayer.getLayers()[0] instanceof L.Circle) {
            if (!_.isUndefined(style.property)) {
              newStyle = self.createTemplateStyle(geoJSONinLayer, layerIndex, L.marker);
              Object.keys(style).forEach((key) => {
                delete style[key];
              });
              Object.assign(style, { ...newStyle });

              self.styleChanged = true;
            }

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
          }

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
              var jsonDisplay = jQuery.extend(true, {}, layer.feature.properties);
              if (jsonDisplay.awesomeMarker) delete jsonDisplay.awesomeMarker;
              popupText = syntaxHighlight(JSON.stringify(jsonDisplay));
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
            if (_.isUndefined(style.property)) {
              newStyle = self.createTemplateStyle(geoJSONinLayer, layerIndex, L.circle);
              Object.keys(style.style).forEach((key) => {
                delete style.style[key];
              });
              Object.assign(style.style, { ...newStyle });

              self.styleChanged = true;
            }
            LCircles = leafLetLayer.getLayers().map(function (layer) {
              const { lat, lng } = layer.getLatLng();
              const circle = L.circle([lat, lng]);
              circle.feature = layer.feature;
              return circle;
            });

            leafLetLayer.clearLayers();
            LCircles.forEach(function (layerCircle) {
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
