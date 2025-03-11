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
        layer.pm.enable(); // Enable Geoman on each shape only in geoman2.11+
        }
      }); 
      
      
      geoJsonLayer.eachLayer(function(layer) {

        // To be sure to add the item in the good layer
        drawnItems.addLayer(layer);
      });
    
    }

    self.map.on('pm:create', function(e) {
			      self.map.removeLayer(e.layer);
            drawnItems.addLayer(e.layer);
    });

    self.map.on('pm:remove', function (e) {
 
      drawnItems.removeLayer(e.layer._leaflet_id);
    });

    self.map.on('pm:create', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    self.map.on('pm:remove', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    drawnItems.on('pm:rotate', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    drawnItems.on('pm:markerdrag', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    drawnItems.on('pm:drag', (e) => self.updateSelectedGeoJSON(self.drawnItems, modelsHiddenParams, instanceId, self));
    self.map.on('pm:cut', (e) => self.cutLayer(e, self.map, self.drawnItems, modelsHiddenParams, instanceId, self));
}




export function cutLayer(e, map, drawnItems, modelsHiddenParams, idInstance, self) {

  if (e.layer._layers) {
    Object.values(e.layer._layers).forEach((layer) => {
      drawnItems.addLayer(layer);	
    });
    
    drawnItems.removeLayer(e.originalLayer._leaflet_id);
    drawnItems.removeLayer(e.layer._leaflet_id);

  } else {
    const geometry = e.layer.feature.geometry;

    // Remove the original polygon from drawnLayers
    drawnItems.removeLayer(e.layer);
    map.removeLayer(e.layer);
    drawnItems.removeLayer(e.originalLayer._leaflet_id);
    drawnItems.removeLayer(e.layer._leaflet_id);
  
    if (geometry.type === "MultiPolygon") {
      // If it's a MultiPolygon, process each polygon separately
      geometry.coordinates.forEach((polygonCoords) => {
        let geoJsonFeature = {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: polygonCoords, // Each polygon part
          },
          properties: e.layer.feature.properties || {}
        };
  
        let newLayer = L.geoJSON(geoJsonFeature, {
          
        }); 
        
        newLayer.eachLayer(function(layer) {
          drawnItems.addLayer(layer);
        });
      });
  
    } else if (geometry.type === "Polygon") {
      // If it's a Polygon, just add it as a single feature
      let geoJsonFeature = {
        type: "Feature",
        geometry: geometry,
        properties: e.layer.feature.properties || {}
      };
  
      let newLayer = L.geoJSON(geoJsonFeature, {
        
      });
      
      newLayer.eachLayer(function(layer) {
        drawnItems.addLayer(layer);
      });
    } 
  }

  self.updateSelectedGeoJSON(drawnItems, modelsHiddenParams, idInstance, self)
}

export function updateSelectedGeoJSON(layer, modelsHiddenParams, idInstance, self) {
  if (modelsHiddenParams[idInstance].selectedGeoJson) {
    let geojson = layer.toGeoJSON();
    modelsHiddenParams[idInstance].selectedGeoJson = geojson;

    self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
  }
}
