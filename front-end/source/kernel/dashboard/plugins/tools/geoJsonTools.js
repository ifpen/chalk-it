// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Mohamed ERRAHALI                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

this.compareSharedKeys = function (obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const sharedKeys = keys1.filter((key) => keys2.includes(key));

  for (let key of sharedKeys) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};
this.equivalenceTypes = {
  Point: 'MultiPoint',
  MultiPoint: 'MultiPoint',
  Polygon: 'MultiPolygon',
  MultiPolygon: 'MultiPolygon',
  LineString: 'MultiLineString',
  MultiLineString: 'MultiLineString',
};

this.findPropertiesWithNumber = function (geoJSON) {
  const propertiesWithRange = {};

  geoJSON.features.forEach((feature) => {
    for (const property in feature.properties) {
      if (
        typeof feature.properties[property] === 'number' &&
        !isNaN(feature.properties[property]) &&
        isFinite(feature.properties[property])
      ) {
        const value = feature.properties[property];

        if (!propertiesWithRange[property]) {
          propertiesWithRange[property] = [value, value];
        } else {
          propertiesWithRange[property][0] = Math.min(propertiesWithRange[property][0], value);
          propertiesWithRange[property][1] = Math.max(propertiesWithRange[property][1], value);
        }
      }
    }
  });

  return propertiesWithRange;
};

this.getMinMaxByProperty = function (GeoJSON, property) {
  if (_.isUndefined(GeoJSON)) return;
  if (_.isUndefined(property)) return;
  if (property == 'none') return;
  if (!Array.isArray(GeoJSON.features)) return;
  if (GeoJSON.features.length == 0) return;
  if (!('properties' in GeoJSON.features[0])) return;
  if (!(property in GeoJSON.features[0].properties)) return;

  var minMax = [GeoJSON.features[0].properties[property], GeoJSON.features[0].properties[property]];
  GeoJSON.features.forEach((feature) => {
    if (
      typeof feature.properties[property] === 'number' &&
      !isNaN(feature.properties[property]) &&
      isFinite(feature.properties[property])
    ) {
      const value = feature.properties[property];

      minMax[0] = Math.min(minMax[0], value);
      minMax[1] = Math.max(minMax[1], value);
    }
  });

  return minMax;
};

// Find All Properties
// TODO : Try to concatenate code with findPropertiesWithNumber in order to have 1 method
this.findAllProperties = function (geoJSON) {
  var propertiesReturn = [];

  geoJSON.features.forEach(function (feature) {
    var properties = feature.properties;
    for (var prop_key in properties) {
      if (!propertiesReturn.includes(prop_key)) {
        propertiesReturn.push(prop_key);
      }
    }
  });

  return propertiesReturn;
};
// Find the feature type of GeoJSON
this.findFeatureType = function (geoJSON) {
  if (geoJSON.type === 'FeatureCollection') {
    const firstFeatureType = geoJSON.features[0].geometry.type;
    const firstFeatureEquivalenceType = equivalenceTypes[firstFeatureType] || firstFeatureType;

    for (let i = 1; i < geoJSON.features.length; i++) {
      const currentFeatureType = geoJSON.features[i].geometry.type;
      const currentFeatureEquivalenceType = equivalenceTypes[currentFeatureType] || currentFeatureType;

      if (currentFeatureEquivalenceType !== firstFeatureEquivalenceType) {
        return 'MultiType';
      }
    }

    return firstFeatureEquivalenceType;
  } else if (geoJSON.type === 'Feature') {
    const featureType = geoJSON.geometry.type;
    const featureEquivalenceType = equivalenceTypes[featureType] || featureType;

    return featureEquivalenceType;
  }

  return 'MultiType';
};
function getFillColor(geoJSON, style, value, colorScale) {
  if (_.isUndefined(style) || _.isUndefined(value) || _.isUndefined(geoJSON)) {
    return undefined;
  }
  if (
    !_.isUndefined(style.property) &&
    !_.isUndefined(style.possibleProperties) &&
    style.property in style.possibleProperties
  ) {
    //create old style before mouseover
    var minMaxAuto = style.possibleProperties[style.property];

    if (!_.isUndefined(style.propertyMin) && typeof style.propertyMin === 'number') minMaxAuto[0] = style.propertyMin;
    if (!_.isUndefined(style.propertyMax) && typeof style.propertyMax === 'number') minMaxAuto[1] = style.propertyMax;
  }
  let minMax = getMinMaxByProperty(geoJSON, style.property);
  let min = 0;
  let max = 0;
  if (!_.isUndefined(minMax)) {
    if (!_.isUndefined(minMaxAuto) && Array.isArray(minMaxAuto) && minMaxAuto.length > 1) {
      min = minMaxAuto[0];
      max = minMaxAuto[1];
    }
    if (min < minMax[0]) min = minMax[0];
    if (max > minMax[1]) max = minMax[1];
  } else {
    if (!_.isUndefined(minMaxAuto) && Array.isArray(minMaxAuto) && minMaxAuto.length > 1) {
      min = minMaxAuto[0];
      max = minMaxAuto[1];
    } else {
      return;
    }
  }
  if(min == max) return style.fillColor
  if (findFeatureType(geoJSON) == equivalenceTypes.MultiPolygon) {
    return colorScaleManager.getColor(min, max, value, colorScale);
  } else if (findFeatureType(geoJSON) == equivalenceTypes.MultiLineString) {
    if (!_.isUndefined(colorScale)) {
      let pct = ((value - min) / (max - min)) * 100;
      return colorScale(pct);
    }
  } else {
    return colorScaleManager.getColor(min, max, value, colorScale);
  }
}
function getMinMaxProperty(style, geoJSONinLayer) {
  if (
    !_.isUndefined(style.property) &&
    !_.isUndefined(style.possibleProperties) &&
    style.property in style.possibleProperties
  ) {
    var minMaxAuto = style.possibleProperties[style.property];

    if (!_.isUndefined(style.propertyMin) && typeof style.propertyMin === 'number') minMaxAuto[0] = style.propertyMin;
    if (!_.isUndefined(style.propertyMax) && typeof style.propertyMax === 'number') minMaxAuto[1] = style.propertyMax;
  }
  let minMax = geoJsonTools.getMinMaxByProperty(geoJSONinLayer, style.property);
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
  return [min, max];
}

function geoJsonChanged(geojsonList, geojsonOldList, geojsonStyle) {
  if(_.isUndefined(geojsonList) || _.isUndefined(geojsonOldList) || _.isUndefined(geojsonStyle) || _.isUndefined(geojsonStyle.style)  ) return true
  if(!Array.isArray(geojsonList) || !Array.isArray(geojsonOldList) || !Array.isArray(geojsonStyle.style)) return true
  if (geojsonList.length !=  geojsonOldList.length) return true;
  if (geojsonList.length !=  geojsonStyle.style.length) return true;
  for (let i = 0; i < geojsonList.length; i++) {
    const geojson = geojsonList[i];
    if (!_.isEqual(geojson, geojsonOldList[i])) {
      return true;
    }
  }
  return false;
}
function getNumberFormatter(){
  const DEFAULT_LOCALE = 'en-US';
  const formatter = Intl.NumberFormat(DEFAULT_LOCALE, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
  })
  return formatter;
}
function formatProperty(property) {
  if(typeof property ==="number") {
    const formatter = getNumberFormatter()
    return formatter.format(property)
  }
  return property
}

var geoJsonTools = (function () {
  return {
    findPropertiesWithNumber,
    getMinMaxByProperty,
    findAllProperties,
    findFeatureType,
    equivalenceTypes,
    compareSharedKeys,
    getFillColor,
    getMinMaxProperty,
    geoJsonChanged,
    getNumberFormatter,
    formatProperty
  };
})();
