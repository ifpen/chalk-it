this.mouseoverHandler = (self, geoJSON, leafletIndex) => {
  return function (e) {
    if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiPolygon) {
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
    }
  };
};
this.mouseoutHandler = (self, geoJSON, leafletIndex) => {
  return function (e) {
    if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiPolygon) {
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
      e.target.setStyle(eventStyle);
      //close popup
      self.map.closePopup();
    }
  };
};

this.clickHandler = (self, geoJSON,leafletLayer,leafletIndex) => {
    return function (e) {
      if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiPolygon) { 
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
        if ( 
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
      }
    };
  };
this.configureEvents = function (self, geoJSON, leafletLayer, leafletIndex) {
  if (geoJsonTools.findFeatureType(geoJSON) == geoJsonTools.equivalenceTypes.MultiPolygon) {
    //add events :
    // mouseover
    if (!_.isUndefined(leafletIndex)) {
      self.mouseoverHandler = mouseoverHandler(self, geoJSON, leafletIndex);
      //handle mouse event for each layer
      leafletLayer.eachLayer(function (layer) {
        layer.on('mouseover', self.mouseoverHandler);
      });
    }
    //mouseout
    if (!_.isUndefined(leafletIndex)) {
      self.mouseoutHandler = mouseoutHandler(self, geoJSON, leafletIndex);
      //add event handler to each layer
      leafletLayer.eachLayer(function (layer) {
        layer.on('mouseout', self.mouseoutHandler);
      });
    }
    //click event
    if (!_.isUndefined(leafletIndex)) {
      self.clickHandler = clickHandler(self, geoJSON,leafletLayer,leafletIndex);
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
      //handle mouse event for each layer
      leafletLayer.eachLayer(function (layer) {
        layer.on('mouseover', self.mouseoverHandler);
      });
    }
    //mouseout
    if (!_.isUndefined(leafletIndex)) {
      self.mouseoutHandler = (e) => {
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
      //handle mouse event for each layer
      leafletLayer.eachLayer(function (layer) {
        layer.on('mouseover', self.mouseoverHandler);
      });
    }
    //mouseout
    if (!_.isUndefined(leafletIndex)) {
      self.mouseoutHandler = (e) => {
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
};

var eventsManager = (function eventsManager() {
  return {
    configureEvents,
  };
})();
