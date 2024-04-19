
  // ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Mohamed ERRAHALI                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

this.createTemplateStyle = function (self,geoJSON, index, typeLayer = undefined) {
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
        if (index == modelsHiddenParams[self.idInstance].GeoJSON.length - 1) {
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
this.setStyle = function (self,layerIndex, style) {
    // Get GeoJSON
    var geoJSONinLayer = modelsHiddenParams[self.idInstance].GeoJSON[layerIndex];
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
        newStyle = self.createTemplateStyle(self,geoJSONinLayer, layerIndex, L.marker);
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
          newStyle = self.createTemplateStyle(self,geoJSONinLayer, layerIndex, L.circle);
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

  
  var styleManager = (function styleManager () {
    return { 
        createTemplateStyle,
        setStyle
    };
  })();
  