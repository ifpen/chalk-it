// ┌────────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                                │ \\
// ├────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                                    │ \\
// ├────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) :  Mohamed ERRAHALI & Abir EL FEKI                                   │ \\
// └────────────────────────────────────────────────────────────────────────────────┘ \\

import 'leaflet';
import _ from 'lodash';
import 'leaflet';

// !! Order matters, a lot !!
import 'simpleheat';
import 'leaflet-modal';
import 'idb';
import 'leaflet.offline';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet.markercluster';
import 'leaflet.awesome-markers';
import { modelsHiddenParams } from 'kernel/base/widgets-states';
import { findFeatureType,equivalenceTypes,formatProperty  } from 'kernel/dashboard/plugins/tools/geoJsonTools';

export  function mouseoverHandler(self, geoJSON, leafletIndex) {
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
    if (findFeatureType(geoJSON) == equivalenceTypes.MultiLineString) {
      eventStyle.color = eventStyle.fillColor;
    }
    e.target.setStyle(eventStyle);
    e.target.bringToFront();
    //create popup
    let popupContent = '<div>';
    let properties = style.tooltip.properties;
    _.each(properties, (property) => {
      popupContent =
        popupContent +
        '<p> <strong>' +
        property +
        '</strong> : ' +
        formatProperty(e.target.feature.properties[property]) +
        '</p>';
    });
    popupContent = popupContent + '</div>';
    e.target.bindPopup(popupContent);
    e.target.openPopup();
  };
}

export  function mouseoutHandler(self, geoJSON, leafletIndex) {
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
        if (findFeatureType(geoJSON) == equivalenceTypes.MultiLineString) {
          eventStyle.color = eventStyle.fillColor;
        }
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
    let fillColor;
    let colorScale = self.getColorScaleFromStyle(style);
    if (!_.isUndefined(e.target.feature.properties) && style.property in e.target.feature.properties) {
      fillColor = self.getFillColor(geoJSON, style, e.target.feature.properties[style.property], colorScale);
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
    if (findFeatureType(geoJSON) == equivalenceTypes.MultiLineString) {
      delete eventStyle.fillColor;
      eventStyle.color = fillColor;
    }
    e.target.setStyle(eventStyle);
    //close popup
    self.map.closePopup();
  };
}

export  function clickHandler(self, geoJSON, leafletLayer, leafletIndex) {
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
        if (findFeatureType(geoJSON) == equivalenceTypes.MultiLineString) {
          delete layerStyle.fillColor;
          layerStyle.color = fillColor;
        }
        layer.setStyle(layerStyle);
      } else {
        //case : unselect event (double click)
        if (self.state.selectedElement == e.target) {
          if (!_.isUndefined(e.target.feature.properties) && style.property in e.target.feature.properties) {
            fillColor = self.getFillColor(
              geoJSON,
              { ...style },
              e.target.feature.properties[style.property],
              colorScale
            );
          }
          if (!_.isUndefined(fillColor)) {
            layerStyle.fillColor = fillColor;
          }
          if (findFeatureType(geoJSON) == equivalenceTypes.MultiLineString) {
            delete layerStyle.fillColor;
            layerStyle.color = fillColor;
          }
          layer.setStyle(layerStyle);
        } else {
          //select event
          eventStyle.color = eventStyle.fillColor;
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
}

export  function configureEvents(self, geoJSON, leafletLayer, leafletIndex) {
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
}
