import 'leaflet';


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

      var geoJsonLayer = L.geoJSON(selectedGeoJson, {
        onEachFeature: function (feature, layer) {
     //     layer.pm.enable(); // Enable Geoman on each shape only in geoman2.11+
        }
      }); 
      
      
      geoJsonLayer.eachLayer(function(layer) {
        drawnItems.addLayer(layer);
      });
    
    }

    self.map.on('pm:create', function(e) {
			      self.map.removeLayer(e.layer);
            drawnItems.addLayer(e.layer);
    });

  //  self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
    self.map.on('pm:create', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    self.map.on('pm:remove', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    self.map.on('pm:rotateend', (e) => self.supdateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    self.map.on('pm:globaleditmodetoggled', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    self.map.on('pm:globaldragmodetoggled', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    self.map.on('pm:cut', (e) => self.cutLayer(e, modelsHiddenParams, instanceId, self));
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

export function updateSelectedGeoJSON(layer, modelsHiddenParams, idInstance, self) {
  if (modelsHiddenParams[idInstance].selectedGeoJson) {
    let geojson = layer.toGeoJSON();
    modelsHiddenParams[idInstance].selectedGeoJson = geojson;

    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  }
}
