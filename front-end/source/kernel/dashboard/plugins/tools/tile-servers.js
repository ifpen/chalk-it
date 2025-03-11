// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Mohamed ERRAHALI                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import _ from 'lodash';

export function tileServersList() {
  var azureMapboxUrl = 'https://xdashgateway.azure-api.net/mapbox/tiles?z={z}&x={x}&y={y}';
  var azureMapboxUrlGeneral = 'https://xdashgateway.azure-api.net/mapbox/tilesgeneral?z={z}&x={x}&y={y}&id={id}';
  let tileServersOptions = {};
  tileServersOptions['MapboxStreets'] = {
    url: azureMapboxUrl,
    attribution: 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'streets-v11',
    tileSize: 512,
    zoomOffset: -1,
  };
  tileServersOptions['MapboxDark'] = {
    url: azureMapboxUrlGeneral,
    attribution: 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'dark-v10',
    tileSize: 512,
    zoomOffset: -1,
  };
  // "url": 'https://{s}.aerial.maps.api.here.com/maptile/2.1/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?app_id=' + here_app_id + '&app_code=' + here_app_code + '&lg=eng',
  tileServersOptions['HereSatelliteDay'] = {
    url: 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    id: ' satellite.day',
    maxZoom: 20,
    subdomains: '1234',
  };
  tileServersOptions['HereTerrainDay'] = {
    url: 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    id: 'terrain.day',
    maxZoom: 20,
    subdomains: '1234',
  };
  tileServersOptions['HereHybridDay'] = {
    url: 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    id: ' HERE.hybridDay',
    maxZoom: 20,
    subdomains: '1234',
  };
  return tileServersOptions;
}

export function getTileServerConf(ts) {
  var tileServersObj = tileServersList();
  var tileConf = {
    url: tileServersObj[ts].url,
    maxZoom: tileServersObj[ts].maxZoom,
    attribution:
      'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
      '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      tileServersObj[ts].attribution,
  };

  if (!_.isUndefined(tileServersObj[ts].subdomains)) {
    tileConf.subdomains = tileServersObj[ts].subdomains;
  }

  if (!_.isUndefined(tileServersObj[ts].id)) {
    tileConf.id = tileServersObj[ts].id;
  }

  if (!_.isUndefined(tileServersObj[ts].apikey)) {
    tileConf.apikey = tileServersObj[ts].apikey;
  }

  if (!_.isUndefined(tileServersObj[ts].format)) {
    tileConf.format = tileServersObj[ts].format;
  }

  if (!_.isUndefined(tileServersObj[ts].style)) {
    tileConf.style = tileServersObj[ts].style;
  }

  if (!_.isUndefined(tileServersObj[ts].tileSize)) {
    tileConf.tileSize = tileServersObj[ts].tileSize;
  }

  if (!_.isUndefined(tileServersObj[ts].zoomOffset)) {
    tileConf.zoomOffset = tileServersObj[ts].zoomOffset;
  }
  return tileConf;
}
