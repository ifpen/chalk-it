
var tileServers = (function tileServers () {
    var azureMapboxUrl = 'https://xdashgateway.azure-api.net/mapbox/tiles?z={z}&x={x}&y={y}';
    var azureMapboxUrlGeneral = 'https://xdashgateway.azure-api.net/mapbox/tilesgeneral?z={z}&x={x}&y={y}&id={id}';
    tileServers = {}
    tileServers["MapboxStreets"] = {
        "url": azureMapboxUrl,
        "attribution": 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        "maxZoom": 18,
        "id": 'streets-v11',
        "tileSize": 512,
        "zoomOffset": -1
    };
    tileServers["MapboxDark"] = {
        "url": azureMapboxUrlGeneral,
        "attribution": 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        "maxZoom": 18,
        "id": 'dark-v10',
        "tileSize": 512,
        "zoomOffset": -1
    };
    // "url": 'https://{s}.aerial.maps.api.here.com/maptile/2.1/maptile/newest/hybrid.day/{z}/{x}/{y}/256/png8?app_id=' + here_app_id + '&app_code=' + here_app_code + '&lg=eng',
    tileServers["HereSatelliteDay"] = {
        "url": 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
        "attribution": 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
        "id": ' satellite.day',
        "maxZoom": 20,
        "subdomains": '1234',
    };
    tileServers["HereTerrainDay"] = {
        "url": 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
        "attribution": 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
        "id": 'terrain.day',
        "maxZoom": 20,
        "subdomains": '1234',
    };
    tileServers["HereHybridDay"] = {
        "url": 'https://xdashgateway.azure-api.net/here{s}/maptile?z={z}&x={x}&y={y}' + '&lg=eng',
        "attribution": 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
        "id": ' HERE.hybridDay',
        "maxZoom": 20,
        "subdomains": '1234',
    };
    return tileServers
} )()