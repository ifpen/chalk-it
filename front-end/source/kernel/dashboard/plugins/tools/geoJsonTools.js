// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Mohamed ERRAHALI                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\



this.compareSharedKeys= function(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const sharedKeys = keys1.filter(key => keys2.includes(key));

  for (let key of sharedKeys) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
}
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
    if(_.isUndefined(GeoJSON)) return ;
    if(_.isUndefined(property)) return ;
    if(property == "none") return
    if(!Array.isArray(GeoJSON.features)) return
    if(GeoJSON.features.length ==0) return
    if(!("properties" in GeoJSON.features[0])) return 
    if(!(property in GeoJSON.features[0].properties) ) return 
    
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

var geoJsonTools = (function() {


    return {
        findPropertiesWithNumber  ,
        getMinMaxByProperty  ,
        findAllProperties  ,
        findFeatureType,
        equivalenceTypes ,
        compareSharedKeys
    }

})()