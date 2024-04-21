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
        pointAreMarker: true,
        clickPopup: true,
        showLegend: false,
        stroke: false,
        radius: 300,
        property: Object.keys(prop).length > 0 ? Object.keys(prop)[0] : 'none',
        popupProperty: 'none',
        propertyMin: 'Auto',
        propertyMax: 'Auto',
        possibleProperties: prop,
        allProperties: allProp,
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
this.setStyle = function (self, layerIndex, style) {
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

  // Important
  let styleForObject = { ...style };
  //if the pointsAreMarker
  if (styleForObject.pointAreMarker) {
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
        popupText = '<div>';
        let properties = style.tooltip.properties;
        for (let i = 0; i < properties.length; i++) {
          const prop = properties[i];
          popupText =  popupText + '<p> <strong>' + prop + '</strong> : ' + layer.feature.properties[prop] + '</p>';
          if(i==properties.length-1){
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
    if (leafLetLayer.getLayers()[0] instanceof L.Marker) {
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
    //calcul fill Color according to value
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
    //for line use color propery instead of fillColor
    if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiLineString) {
      if (!_.isUndefined(fillColor)) {
        styleForObject.color = fillColor;
      } else {
        styleForObject.color = style.color;
      }
    } else {
      if (!_.isUndefined(fillColor)) {
        styleForObject.fillColor = fillColor;
      } else {
        styleForObject.fillColor = style.fillColor;
      }
    }
    //for the selected item not change the fillColor
    if (layer == self.state.selectedElement) {
      layer.setStyle({
        fillOpacity: styleForObject.fillOpacity,
        weight: styleForObject.weight,
      });
    } else {
      layer.setStyle(styleForObject);
    }
    //if the radius property exist
    if (!_.isUndefined(styleForObject.radius)) {
      layer.setRadius(styleForObject.radius); // LafLet bug  setRadius must be called (Radius in Style is not check by Leaflet)
    }
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
                min,
                max,
                styleForObject.legend.title || '',
                colorScale
              );
            } else if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiLineString) {
              self.legends[layerIndex] = self.createLegend(
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
              min,
              max,
              styleForObject.legend.title || '',
              colorScale
            );
          } else if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiLineString) {
            self.legends[layerIndex] = self.createLegend(
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
