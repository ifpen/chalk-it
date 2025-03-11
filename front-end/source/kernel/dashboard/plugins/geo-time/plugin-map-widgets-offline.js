
import 'leaflet';
import 'leaflet.offline';

export function setOfflineSupport(self, tileConf, modelsParameters, idInstance, idWidget, tileServers, ts) {
  tileConf.attribution =
    'Progress: <span id="leafletProgress' +
    idWidget +
    '"></span> / ' +
    '<span id="leafletTotal' +
    idWidget +
    '"></span>. ' +
    'Current storage: <span id="leafletStorage' +
    idWidget +
    '"></span> files.' +
    'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    tileServers[ts].attribution;
  self.baseLayer = L.tileLayer.offline(tileServers[ts].url, tileConf);
  self.baseLayer.addTo(self.map);

  //add buttons to save tiles in area viewed
  var zoomLevelsToSave = [];
  if (modelsParameters[idInstance].defaultCenter.zoom <= tileServers[ts].maxZoom) {
    for (var i = 0; i < tileServers[ts].maxZoom - modelsParameters[idInstance].defaultCenter.zoom; i++) {
      zoomLevelsToSave[i] = modelsParameters[idInstance].defaultCenter.zoom + i;
    }
  } else {
    zoomLevelsToSave = modelsParameters[idInstance].defaultCenter.zoom;
  }
  var control = L.control.savetiles(self.baseLayer, {
    zoomlevels: zoomLevelsToSave, //optional zoomlevels to save, default current zoomlevel
    confirm: function (layer, succescallback) {
      if (window.confirm('Save ' + layer._tilesforSave.length)) {
        succescallback();
      }
    },
    confirmRemoval: function (layer, successCallback) {
      if (window.confirm('Remove all the tiles?')) {
        successCallback();
      }
    },
    saveText: '<i class="icon-download-alt icon" aria-hidden="true"></i>',
    rmText: '<i class="icon-trash icon" aria-hidden="true"></i>',
  });
  control.addTo(self.map);
  self.baseLayer.on('storagesize', function (e) {
    document.getElementById('leafletStorage' + idWidget).innerHTML = e.storagesize;
  });

  control.setPosition('topright'); // MBG 24/09/2019 : avoid disturbing legend view

  //events while saving a tile layer
  var progress;
  self.baseLayer.on('savestart', function (e) {
    progress = 0;
    document.getElementById('leafletTotal' + idWidget).innerHTML = e._tilesforSave.length;
  });
  self.baseLayer.on('savetileend', function (e) {
    progress++;
    document.getElementById('leafletProgress' + +idWidget).innerHTML = progress;
  });
  self.baseLayer.on('loadend', function (e) {
    swal('', 'Saved all tiles', 'info');
  });
  self.baseLayer.on('tilesremoved', function (e) {
    document.getElementById('leafletProgress' + +idWidget).innerHTML = '';
    document.getElementById('leafletTotal' + idWidget).innerHTML = '';
    swal('', 'Removed all tiles', 'info');
  });
}
