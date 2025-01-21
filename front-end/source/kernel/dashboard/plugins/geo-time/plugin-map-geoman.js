export function editList(e, modelsHiddenParams, idInstance, self) {
  if (modelsHiddenParams[idInstance].selectedGeoJson) {
    var listEditedLayers = e.map._layers;
    var keysEdited = Object.keys(listEditedLayers);

    for (var r = 0; r < keysEdited.length; r++) {
      for (var rr = 0; rr < modelsHiddenParams[idInstance].selectedGeoJson.features.length; rr++) {
        if (
          modelsHiddenParams[idInstance].selectedGeoJson.features[rr]['properties']['layerId'] ==
          listEditedLayers[keysEdited[r]]._leaflet_id
        ) {
          var GeoArray = self.getGeoJsonPoint(
            modelsHiddenParams[idInstance].selectedGeoJson.features[rr],
            listEditedLayers[keysEdited[r]]
          );
          modelsHiddenParams[idInstance].selectedGeoJson.features[rr].geometry.coordinates = GeoArray;
        }
      }
    }
    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  }
}

export function rotateLayer(e, modelsHiddenParams, idInstance, self) {
  var my_leaflet_id = e.layer._drawnByGeoman ? e.layer._leaflet_id : e.layer.feature.properties.layerId;
  if (modelsHiddenParams[idInstance].selectedGeoJson) {
    for (var rr = 0; rr < modelsHiddenParams[idInstance].selectedGeoJson.features.length; rr++) {
      if (modelsHiddenParams[idInstance].selectedGeoJson.features[rr]['properties']['layerId'] == my_leaflet_id) {
        var GeoArray = self.getGeoJsonPoint(modelsHiddenParams[idInstance].selectedGeoJson.features[rr], e.layer);
        modelsHiddenParams[idInstance].selectedGeoJson.features[rr].geometry.coordinates = GeoArray;
      }
    }
    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  }
}

export function deleteLayer(e, modelsHiddenParams, idInstance, self) {
  var my_leaflet_id = e.layer._drawnByGeoman ? e.layer._leaflet_id : e.layer.feature.properties.layerId;

  if (modelsHiddenParams[idInstance].selectedGeoJson) {
    for (var rr = 0; rr < modelsHiddenParams[idInstance].selectedGeoJson.features.length; rr++) {
      if (modelsHiddenParams[idInstance].selectedGeoJson.features[rr]['properties']['layerId'] == my_leaflet_id) {
        modelsHiddenParams[idInstance].selectedGeoJson.features.splice(rr, 1);
      }
    }
    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  }
}

export function getGeoJsonPoint1(typeLayers, Points, isRectangle) {
  var points = [],
    ListPositions = [];
  if (typeLayers === 'rectangle' || (typeLayers === 'Polygon' && isRectangle)) {
    points = Points[0];
  } else if (typeLayers === 'polygon' || (typeLayers === 'Polygon' && !isRectangle)) {
    points = Points[0];
  } else if (typeLayers === 'LineString') {
    points = Points;
  } else if (typeLayers === 'Point') {
    points = [];
    ListPositions = [Points[1], Points[0]];
  }

  for (var leng = 0; leng < points.length; leng++) {
    ListPositions.push([points[leng][1], points[leng][0]]);
  }
  return ListPositions;
}

export function getLayerInformation(id, modelsHiddenParams, idInstance, self) {
  var infos = {
    title: '',
    description: '',
    timeStamp: '',
  };
  if (modelsHiddenParams[idInstance].selectedGeoJson) {
    for (var lay = 0; lay < modelsHiddenParams[idInstance].selectedGeoJson.features.length; lay++) {
      if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['layerId'] == id) {
        if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['information']) {
          infos.title = modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['information'].title;
          infos.description =
            modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['information'].description;
          infos.timeStamp =
            modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['information'].timeStamp;
        }
      }
    }
    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  }
  return infos;
}

export function updateLayerInformation(id, options, modelsHiddenParams, idInstance, self) {
  if (modelsHiddenParams[idInstance].selectedGeoJson) {
    for (var lay = 0; lay < modelsHiddenParams[idInstance].selectedGeoJson.features.length; lay++) {
      if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['layerId'] == id) {
        modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['information'] = options;
      }
    }
    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  }
}

export function cutLayer(e, modelsHiddenParams, idInstance, self) {
  var my_leaflet_id = e.originalLayer._drawnByGeoman
    ? e.originalLayer._leaflet_id
    : e.originalLayer.feature.properties.layerId;
  for (var rr = 0; rr < modelsHiddenParams[idInstance].selectedGeoJson.features.length; rr++) {
    if (modelsHiddenParams[idInstance].selectedGeoJson.features[rr]['properties']['layerId'] == my_leaflet_id) {
      modelsHiddenParams[idInstance].selectedGeoJson.features[rr].properties.layerId = e.layer._leaflet_id;
      modelsHiddenParams[idInstance].selectedGeoJson.features[rr].geometry.coordinates =
        e.layer.feature.geometry.coordinates;
      modelsHiddenParams[idInstance].selectedGeoJson.features[rr].geometry.isCut = true;
    }
  }
  self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
}

export function updateValue(object, modelsHiddenParams, idInstance, self) {
  if (modelsHiddenParams[idInstance].selectedGeoJson) {
    if (modelsHiddenParams[idInstance].selectedGeoJson.features) {
      modelsHiddenParams[idInstance].selectedGeoJson.features.push(object);
    } else {
      modelsHiddenParams[idInstance].selectedGeoJson = { type: 'FeatureCollection', features: [object] };
    }
    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  }
}
