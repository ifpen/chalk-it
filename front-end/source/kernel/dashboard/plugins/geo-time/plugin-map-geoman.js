import 'leaflet';

export function createLayer(event, modelsHiddenParams, instanceId, self) {
  self.drawnItems.addLayer(event.layer);

  let positionList = [];
  const selectedGeoJson = modelsHiddenParams[instanceId].selectedGeoJson;

  if (selectedGeoJson) {
    if (event.shape === 'Polygon' || event.shape === 'Rectangle') {
      for (const latLng of event.layer._latlngs[0]) {
        positionList.push([latLng.lng, latLng.lat]);
      }

      self.updateValue(
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [positionList],
            isRectangle: event.shape === 'Rectangle',
            isCut: false,
          },
          properties: { layerId: event.layer._leaflet_id },
        },
        modelsHiddenParams,
        instanceId,
        self
      );
    } else if (event.shape === 'Line') {
      for (const latLng of event.layer._latlngs) {
        positionList.push([latLng.lng, latLng.lat]);
      }

      self.updateValue(
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: positionList,
          },
          properties: { layerId: event.layer._leaflet_id },
        },
        modelsHiddenParams,
        instanceId,
        self
      );
    } else if (event.shape === 'Marker') {
      positionList = [event.layer._latlng.lng, event.layer._latlng.lat];

      self.updateValue(
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: positionList,
          },
          properties: { layerId: event.layer._leaflet_id },
        },
        modelsHiddenParams,
        instanceId,
        self
      );
    }
  }
}

export function editList(event, modelsHiddenParams, instanceId, self) {
  const selectedGeoJson = modelsHiddenParams[instanceId].selectedGeoJson;
  if (!selectedGeoJson) return;

  const editedLayers = event.map._layers;

  for (const feature of selectedGeoJson.features) {
    const layer = editedLayers[feature.properties.layerId];
    if (layer) {
      feature.geometry.coordinates = self.getGeoJsonPoint(feature, layer);
    }
  }

  self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
}

export function rotateLayer(event, modelsHiddenParams, instanceId, self) {
  const selectedGeoJson = modelsHiddenParams[instanceId].selectedGeoJson;
  if (!selectedGeoJson) return;

  for (const feature of selectedGeoJson.features) {
    if (feature.properties.layerId === event.layer._leaflet_id) {
      feature.geometry.coordinates = self.getGeoJsonPoint(feature, event.layer);
    }
  }

  self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
}

export function deleteLayer(event, modelsHiddenParams, instanceId, self) {
  const selectedGeoJson = modelsHiddenParams[instanceId].selectedGeoJson;
  if (!selectedGeoJson) return;

  selectedGeoJson.features = selectedGeoJson.features.filter(
    (feature) => feature.properties.layerId !== event.layer._leaflet_id
  );

  self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
}

export function getLayerInformation(layerId, modelsHiddenParams, instanceId, self) {
  const selectedGeoJson = modelsHiddenParams[instanceId].selectedGeoJson;
  if (!selectedGeoJson) return {};

  let info = { title: '', description: '', timeStamp: '' };
  for (const feature of selectedGeoJson.features) {
    if (feature.properties.layerId === layerId && feature.properties.information) {
      info = { ...feature.properties.information };
    }
  }

  self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  return info;
}

export function updateLayerInformation(layerId, info, modelsHiddenParams, instanceId, self) {
  const selectedGeoJson = modelsHiddenParams[instanceId].selectedGeoJson;
  if (!selectedGeoJson) return;

  for (const feature of selectedGeoJson.features) {
    if (feature.properties.layerId === layerId) {
      feature.properties.information = info;
    }
  }

  self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
}

export function addDrawingFeatures(self, modelsHiddenParams, instanceId) {
  const drawnItems = new L.FeatureGroup();
  self.drawnItems = drawnItems;
  self.map.addLayer(drawnItems);

  if (self.bIsInteractive) {
    const selectedGeoJson = modelsHiddenParams[instanceId].selectedGeoJson || {
      type: 'FeatureCollection',
      features: [],
    };
    modelsHiddenParams[instanceId].selectedGeoJson = selectedGeoJson;

    for (const feature of selectedGeoJson.features) {
      const coordinates = self.getGeoJsonPoint1(
        feature.geometry.type,
        feature.geometry.coordinates,
        feature.geometry.isRectangle
      );
      let layer = null;

      if (feature.geometry.type === 'LineString') {
        layer = L.polyline(coordinates);
      } else if (feature.geometry.type === 'Point') {
        layer = L.marker(coordinates);
      } else if (feature.geometry.type === 'Polygon') {
        layer = L.geoJSON(feature);
      }

      if (layer) {
        layer.on('click', (e) => self.modal({ leafletId: e.target._leaflet_id }));
        self.drawnItems.addLayer(layer);
        feature.properties.layerId = layer._leaflet_id;
      }
    }

    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
    self.map.on('pm:create', (e) => self.createLayer(e, modelsHiddenParams, instanceId, self));
    self.map.on('pm:remove', (e) => self.deleteLayer(e, modelsHiddenParams, instanceId, self));
    self.map.on('pm:rotateend', (e) => self.rotateLayer(e, modelsHiddenParams, instanceId, self));
    self.map.on('pm:globaleditmodetoggled', (e) => self.editList(e, modelsHiddenParams, instanceId, self));
    self.map.on('pm:globaldragmodetoggled', (e) => self.editList(e, modelsHiddenParams, instanceId, self));
    self.map.on('pm:cut', (e) => self.cutLayer(e, modelsHiddenParams, instanceId, self));
  }
}

export function getGeoJsonPoint(typeLayers, points) {
  let positionList = [];

  if ((typeLayers.geometry.type === 'polygon' || typeLayers.geometry.type === 'Polygon') && typeLayers.geometry.isCut) {
    const latLngs = points._latlngs ? points._latlngs : points.pm._layers[0]._latlngs;

    latLngs.forEach((point) => {
      const val = point.map((coord) => [coord.lng, coord.lat]);
      positionList.push(val);
    });
    return positionList;
  } else if (typeLayers.geometry.type === 'LineString' || typeLayers.geometry.type === 'lineString') {
    positionList = points._latlngs.map((coord) => [coord.lng, coord.lat]);
    return positionList;
  } else if (
    (typeLayers.geometry.type === 'polygon' || typeLayers.geometry.type === 'Polygon') &&
    !typeLayers.geometry.isCut
  ) {
    const latLngs = points._latlngs ? points._latlngs[0] : points.pm._layers[0]._latlngs[0];
    positionList = latLngs.map((coord) => [coord.lng, coord.lat]);
    return [positionList];
  } else if (typeLayers.geometry.type === 'Point' || typeLayers.geometry.type === 'point') {
    return [points._latlng.lng, points._latlng.lat];
  }
  return [];
}

export function getGeoJsonPoint1(typeLayers, points, isRectangle) {
  let pointList = [],
    coordinates = [];

  if (typeLayers === 'rectangle' || (typeLayers === 'Polygon' && isRectangle)) {
    pointList = points[0];
  } else if (typeLayers === 'polygon' || (typeLayers === 'Polygon' && !isRectangle)) {
    pointList = points[0];
  } else if (typeLayers === 'LineString') {
    pointList = points;
  } else if (typeLayers === 'Point') {
    coordinates = [points[1], points[0]];
  }

  for (const point of pointList) {
    coordinates.push([point[1], point[0]]);
  }

  return coordinates;
}

export function cutLayer(event, modelsHiddenParams, idInstance, self) {
  const selectedGeoJson = modelsHiddenParams[idInstance].selectedGeoJson;
  if (!selectedGeoJson) return;

  const layerId = event.layer._leaflet_id;

  for (const feature of selectedGeoJson.features) {
    if (feature.properties.layerId === layerId) {
      feature.properties.layerId = layerId;
      feature.geometry.coordinates = event.layer.feature.geometry.coordinates;
      feature.geometry.isCut = true;
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
