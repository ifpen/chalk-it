import { xDashConfig } from 'config.js';

// TODO : better rewrite according to https://leaflet-extras.github.io/leaflet-providers/preview/

export function initTileSevers() {
  let tileServers = {};
  var azureMapboxUrl = 'https://xdashgateway.azure-api.net/mapbox/tiles?z={z}&x={x}&y={y}';
  var azureMapboxUrlGeneral = 'https://xdashgateway.azure-api.net/mapbox/tilesgeneral?z={z}&x={x}&y={y}&id={id}';
  //var mapboxUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}';
  tileServers['MapboxStreets'] = {
    url: azureMapboxUrl,
    attribution: 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'streets-v11',
    tileSize: 512,
    zoomOffset: -1,
  };
  tileServers['MapboxDark'] = {
    url: azureMapboxUrlGeneral,
    attribution: 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'dark-v10',
    tileSize: 512,
    zoomOffset: -1,
  };
  // "url": 'https://{s}.aerial.maps.api.here.com/maptile/2.1/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?app_id=' + here_app_id + '&app_code=' + here_app_code + '&lg=eng',
  tileServers['HereSatelliteDay'] = {
    url: 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    id: ' satellite.day',
    maxZoom: 20,
    subdomains: '1234',
  };
  tileServers['HereTerrainDay'] = {
    url: 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    id: 'terrain.day',
    maxZoom: 20,
    subdomains: '1234',
  };
  tileServers['HereHybridDay'] = {
    url: 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
    attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
    id: ' HERE.hybridDay',
    maxZoom: 20,
    subdomains: '1234',
  };
  if (!(xDashConfig.xDashBasicVersion == 'true')) {
    tileServers['EsriWorldImagery'] = {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      id: 'Esri.WorldImagery',
      maxZoom: 19,
    };
    tileServers['GeoportailFrance.orthos'] = {
      url: 'https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      attribution: '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
      minZoom: 2,
      maxZoom: 19,
      apikey: 'choisirgeoportail',
      format: 'image/jpeg',
      style: 'normal',
    };
  }

  return tileServers;
}
