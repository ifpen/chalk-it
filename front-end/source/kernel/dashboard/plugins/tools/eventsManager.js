this.mouseoverHandler = (self, geoJSON, leafletIndex) => {
  return function (e) {
    let style = modelsHiddenParams[self.idInstance].GeoJSONStyle.style[leafletIndex];
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
    if (!_.isUndefined(style.events.mouseover.style)) {
      eventStyle = { ...style.events.mouseover.style };
    } else {
      //TODO:  use default style
      return;
    }
    e.target.setStyle(eventStyle);
    e.target.bringToFront();
    //create popup
    let popup = new L.Popup();
    var bounds = e.target.getBounds();
    let popupContent = '<div>';
    let properties = style.tooltip.properties;
    _.each(properties, (property) => {
      popupContent =
        popupContent + '<p> <strong>' + property + '</strong> : ' + e.target.feature.properties[property] + '</p>';
    });
    popupContent = popupContent + '</div>';
    popup.setLatLng(bounds.getCenter());
    popup.setContent(popupContent);
    //open popup
    if (!_.isUndefined(properties) && properties.length > 0) {
      self.map.openPopup(popup);
    }
  };
};
this.mouseoutHandler = (self, geoJSON, leafletIndex) => {
  return function (e) {
    let style = modelsHiddenParams[self.idInstance].GeoJSONStyle.style[leafletIndex];
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
      if (!_.isUndefined(style.events.click.style)) {
        eventStyle = { ...style.events.click.style };
      } else {
        return;
      }
      e.target.setStyle(eventStyle);
      return;
    }
    //if mouseover disabled do nothing
    if (
      _.isUndefined(style) ||
      _.isUndefined(style.events) ||
      _.isUndefined(style.events.mouseover) ||
      _.isUndefined(style.events.mouseover.enabled) ||
      !style.events.mouseover.enabled
    ) {
      return;
    }
    //apply initial style and cloase popup
    let eventStyle = {};
    let colorScale = self.getColorScaleFromStyle(style);
    if (!_.isUndefined(e.target.feature.properties) && style.property in e.target.feature.properties) {
      var fillColor = self.getFillColor(geoJSON, style, e.target.feature.properties[style.property], colorScale);
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
    if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiLineString) {
      delete eventStyle.fillColor;
      eventStyle.color = fillColor;
    }
    e.target.setStyle(eventStyle);
    //close popup
    self.map.closePopup();
  };
};

this.clickHandler = (self, geoJSON, leafletLayer, leafletIndex) => {
  return function (e) {
    let style = modelsHiddenParams[self.idInstance].GeoJSONStyle.style[leafletIndex];
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
    if (!_.isUndefined(style.events.click.style)) {
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
        if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiLineString) {
          delete layerStyle.fillColor;
          layerStyle.color = fillColor;
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
          if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiLineString) {
            delete layerStyle.fillColor;
            layerStyle.color = fillColor;
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
};
this.configureEvents = function (self, geoJSON, leafletLayer, leafletIndex) {
  //add events :
  // mouseover
  if (!_.isUndefined(leafletIndex)) {
    self.mouseoverHandler = mouseoverHandler(self, geoJSON, leafletIndex);
    //handle mouse event for each layer
    leafletLayer.eachLayer(function (layer) {
      layer.on('mouseover', self.mouseoverHandler);
    });
    //mouseout
    self.mouseoutHandler = mouseoutHandler(self, geoJSON, leafletIndex);
    //add event handler to each layer
    leafletLayer.eachLayer(function (layer) {
      layer.on('mouseout', self.mouseoutHandler);
    });
    //click event
    self.clickHandler = clickHandler(self, geoJSON, leafletLayer, leafletIndex);
    //add event handler to each layer
    leafletLayer.eachLayer(function (layer) {
      layer.on('click', self.clickHandler);
    });
  }
};

var eventsManager = (function eventsManager() {
  return {
    configureEvents,
  };
})();