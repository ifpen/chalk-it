
  // ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Mohamed ERRAHALI                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

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
  
  var styleManager = (function styleManager () {
    return { 
        createTemplateStyle
    };
  })();
  