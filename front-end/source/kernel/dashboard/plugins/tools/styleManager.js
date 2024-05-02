// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Mohamed ERRAHALI                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

this.createTemplateStyle = function (self, geoJSON, index, typeLayer = undefined) {
  prop = geoJsonTools.findPropertiesWithNumber(geoJSON);
  allProp = geoJsonTools.findAllProperties(geoJSON);
  JSONtype = geoJsonTools.findFeatureType(geoJSON);
  baseStyle = {
    id: geoJSON.id,
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
      return {
        ...baseStyle,
        type: 'Multi Point',
        markerCluster: false,
        pointAreMarker: true,
        //marker
        clickPopup: true,
        popupProperty: 'none',
        awesomeMarker: {
          enabled: false,
          icon: {
            icon: ' fa-asterisk',
            prefix: 'fa',
            markerColor: 'red',
          },
        },
        //pour les circles
        radius: 300,
        showLegend: false,
        stroke: false,
        property: Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'none',
        propertyMin: 'Auto',
        propertyMax: 'Auto',
        possibleProperties: prop,
        allProperties: allProp,
        //TODO : mettre dans baseStyle
        tooltip: {
          properties: [...allProp],
        },
      };
      break;
    default:
      return {};
      break;
  }
};
updateLayerStyle = function (self, layer, styleForObject, geoJSONinLayer) {
  let style = { ...styleForObject };
  if (
    geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiPoint &&
    style.pointAreMarker
  ) {
  } else {
    //calcul fill Color according to value
    var color = !_.isUndefined(styleForObject.fillColor) ? styleForObject.fillColor : styleForObject.color;
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
    //for line use color propery instead of fillColor
    if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiLineString) {
      if (!_.isUndefined(fillColor)) {
        style.color = fillColor;
      } else {
        style.color = styleForObject.color;
      }
    } else {
      if (!_.isUndefined(fillColor)) {
        style.fillColor = fillColor;
      } else {
        style.fillColor = styleForObject.fillColor;
      }
    }
    //for the selected item not change the fillColor
    if (layer == self.state.selectedElement) {
      layer.setStyle({
        fillOpacity: styleForObject.fillOpacity,
        weight: styleForObject.weight,
      });
    } else {
      layer.setStyle(style);
    }
    //if the radius property exist
    if (!_.isUndefined(styleForObject.radius) && !_.isUndefined(layer.setRadius)) {
      layer.setRadius(styleForObject.radius); // LafLet bug  setRadius must be called (Radius in Style is not check by Leaflet)
    }
  }
};
this.setStyle = function (self, layerIndex, style) {
  // Get GeoJSON
  var geoJSONinLayer = modelsHiddenParams[self.idInstance].GeoJSON[layerIndex];
  var leafLetLayer = self.layers[layerIndex];
  if (_.isUndefined(leafLetLayer)) {
    return;
  }
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

  // Important
  let styleForObject = { ...style };
  if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiPoint) {
    //if the pointsAreMarker
    if (styleForObject.pointAreMarker) {
      LMarkers = leafLetLayer.getLayers().map(function (layer) {
        const marker = L.marker(layer.getLatLng());
        marker.feature = layer.feature;
        return marker;
      });
      leafLetLayer.clearLayers();
      self.ctrl.removeLayer(leafLetLayer);
      self.map.removeLayer(leafLetLayer);
      if (styleForObject.markerCluster) {
        leafLetLayer = L.markerClusterGroup();
        LMarkers.forEach(function (layerMarker) {
          leafLetLayer.addLayer(layerMarker);
        });
      } else {
        leafLetLayer = L.geoJSON(geoJSONinLayer);
      }
      self.map.addLayer(leafLetLayer);
      self.layers[layerIndex] = leafLetLayer;
      self.ctrl.addOverlay(leafLetLayer, name);

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
        if (style.awesomeMarker && style.awesomeMarker.enabled) {
          if (style.awesomeMarker.icon) {
            var awMarker = L.AwesomeMarkers.icon(style.awesomeMarker.icon);
            layer.setIcon(awMarker);
          }
        }
        //opacity
        layer.setOpacity(style.opacity);
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
          popupText = '<div>';
          let properties = style.tooltip.properties;
          for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            popupText = popupText + '<p> <strong>' + prop + '</strong> : ' + layer.feature.properties[prop] + '</p>';
            if (i == properties.length - 1) {
              popupText = popupText + '</div>';
            }
          }
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
      LCircles = leafLetLayer.getLayers().map(function (layer) {
        const { lat, lng } = layer.getLatLng();
        const circle = L.circle([lat, lng]);
        circle.feature = layer.feature;
        return circle;
      });

      self.ctrl.removeLayer(leafLetLayer);
      self.map.removeLayer(leafLetLayer);
      leafLetLayer = L.geoJSON(geoJSONinLayer);
      leafLetLayer.clearLayers();
      self.map.addLayer(leafLetLayer);
      self.layers[layerIndex] = leafLetLayer;
      self.ctrl.addOverlay(leafLetLayer, name);
      LCircles.forEach(function (layerCircle) {
        leafLetLayer.addLayer(layerCircle);
      });

      //events
      eventsManager.configureEvents(self, geoJSONinLayer, leafLetLayer, layerIndex);
    }
  }
  //calcul color scale
  let colorScale = undefined;
  var color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
  if (!_.isUndefined(color)) {
    colorScale = self.getColorScale(color, 0, 100);
  }
  //using specified property
  //

  //get Min Max
  let minMax = geoJsonTools.getMinMaxProperty(style, geoJSONinLayer);
  let min = minMax[0],
    max = minMax[1];
  leafLetLayer.eachLayer(function (layer) {
    updateLayerStyle(self, layer, styleForObject, geoJSONinLayer);
  });

  //legends
  var length = 100;
  var colorStops = [0, 25, 50, 75, 100];
  self.map.on('layeradd layerremove', (e) => {
    if (self.map.hasLayer(self.layers[layerIndex])) {
      if (!_.isUndefined(styleForObject.showLegend)) {
        if (!!styleForObject.showLegend) {
          if (!_.isUndefined(self.legends[layerIndex])) {
            self.legends[layerIndex].remove();
          }
          if (!_.isUndefined(min) && !_.isUndefined(max) && !_.isUndefined(colorScale)) {
            if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiPolygon) {
              self.legends[layerIndex] = self.createChoroplethLegend(
                layerIndex,
                min,
                max,
                styleForObject.legend.title || '',
                colorScale
              );
            } else {
              self.legends[layerIndex] = self.createLegend(
                layerIndex,
                colorScale,
                length,
                colorStops,
                min,
                max,
                styleForObject.property
              );
            }
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
          if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiPolygon) {
            self.legends[layerIndex] = self.createChoroplethLegend(
              layerIndex,
              min,
              max,
              styleForObject.legend.title || '',
              colorScale
            );
          } else {
            self.legends[layerIndex] = self.createLegend(
              layerIndex,
              colorScale,
              length,
              colorStops,
              min,
              max,
              styleForObject.property
            );
          }
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
};

var styleManager = (function styleManager() {
  return {
    createTemplateStyle,
    setStyle,
  };
})();
