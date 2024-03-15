﻿// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Ameur HAMDOUNI                │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Hidden params (memory)
modelsHiddenParams.hereMaps = { inputGeoJson: {}, mapMatchingResult: {}, heatMapData: {} };
modelsHiddenParams.openStreetMaps = {
  geoJson: { geoJsonLayers: [], geoJsonBounds: [] },
  choropleth: { choroplethLayers: [], choroplethBounds: [] },
  lineHeatMap: { lineHeatMapLayers: [], lineHeatMapBounds: [] },
  heatMap: { heatMapData: [], heatMapBuffer: [] },
  imageOverlay: { imageData: [] },
  svgOverlay: { svgData: [], svgElements: [] },
  legends: [],
  colors: [
    '#800080',
    '#FF00FF',
    '#000080',
    '#0000FF',
    '#008080',
    '#00FFFF',
    '#FFFF00',
    '#800000',
    '#6666ff',
    '#cc6699',
    '#66ff66',
    '#666699',
    '#996633',
    '#ff0000',
    '#669999',
    '#ffff99',
  ],
};

// Temporary params (not to be serialized)
modelsTempParams.openStreetMaps = {
  geoJson: { geoJsonLayers: [] },
  choropleth: { choroplethLayers: [] },
  lineHeatMap: { lineHeatMapLayers: [] },
  heatMap: { heatMapLayers: [] },
  imageOverlay: { imageLayers: [] },
  svgOverlay: { svgLayers: [] },
  mapObj: null,
};

// Parameters
modelsParameters.openStreetMaps = {
  geoJson: { numberOfLayers: 1 },
  choropleth: { numberOfLayers: 0 },
  heatMap: { numberOfLayers: 0, sampledDisplay: false, densityHeatMap: false },
  lineHeatMap: { numberOfLayers: 0 },
  imageOverlay: { numberOfLayers: 0 },
  svgOverlay: { numberOfLayers: 0 /*, 'sampledDisplay': false*/ },
  defaultCenter: { latitude: 48.872063, longitude: 2.331773, zoom: 16 },
  offlineSupport: false,
  tileServer: 'MapboxStreets',
  drawingFeatures: false,
  drawingFeaturesOptions: {
    point: true,
    line: true,
    polygone: true,
    rectangle: true,
    modal: false,
  },
  captureClickEvent: false,
  markerCluster: true,
};

// Layout (default dimensions)
modelsLayout.openStreetMaps = { height: '35vh', width: '35vw' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

const _SCHEMA_SELECTED_POINT = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_imageOverlay',
  type: 'object',
  properties: {
    lat: { type: 'number' },
    lag: { type: 'number' },
  },
  required: ['lat', 'lag'],
};

const _SCHEMA_IMAGE_OVERLAY = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_imageOverlay',
  type: 'object',
  properties: {
    imageUrl: { type: 'string' },
    imageBounds: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'number' },
        minItems: 2,
        maxItems: 2,
      },
      minItems: 2,
      maxItems: 2,
    },
    title: { type: 'string' },
    addAs: { enum: ['overlay', 'baseLayer'] },
  },
  required: ['imageUrl', 'imageBounds', 'title', 'addAs'],
};

const _SCHEMA_SVG_POINT_OVERLAY = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_svgPointOverlay',
  type: 'object',
  properties: {
    data: {
      anyOf: [
        {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            direction: { type: 'number' },
          },
          required: ['lat', 'lng'],
        },
        {
          type: 'object',
          properties: {
            lat: { type: 'number' },
            lng: { type: 'number' },
            rotation: { type: 'number' },
          },
          required: ['lat', 'lng'],
        },
      ],
    },
    config: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        addAs: { enum: ['overlay', 'baseLayer'] },
        disableAutoscale: { type: 'boolean' },
        marker: { enum: ['arrow', 'triangle', 'emptyTriangle', 'fullTriangle', 'circle'] },
        length: { type: 'number' },
        color: { type: 'string' },
      },
      required: ['title', 'length'],
    },
  },
  required: ['data', 'config'],
};

const _SCHEMA_SVG_OVERLAY = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_svgOverlay',
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        anyOf: [
          {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
              direction: { type: 'number' },
            },
            required: ['lat', 'lng'],
          },
          {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
              rotation: { type: 'number' },
            },
            required: ['lat', 'lng'],
          },
        ],
      },
    },
    config: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        addAs: { enum: ['overlay', 'baseLayer'] },
        disableAutoscale: { type: 'boolean' },
        marker: { enum: ['arrow', 'triangle', 'emptyTriangle', 'fullTriangle', 'circle'] },
        length: { type: 'number' },
        color: { type: 'string' },
      },
      required: ['title', 'length'],
    },
  },
  required: ['data', 'config'],
};

const __SCHEMA_VALUED_COORD = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet__valued_coord',
  anyOf: [
    {
      type: 'object',
      properties: {
        lat: { type: 'number', minimum: -90, maximum: 90 },
        lng: { type: 'number', minimum: -180, maximum: 180 },
      },
      required: ['lat', 'lng'],
      minProperties: 3, // Third property provides value and must be a number. It also has to be in third place, which we can't validate because not standard JSON!
      maxProperties: 3,
      additionalProperties: { type: 'number' },
    },
    {
      type: 'array',
      items: [
        { type: 'number', minimum: -90, maximum: 90 },
        { type: 'number', minimum: -180, maximum: 180 },
        { type: 'number' },
      ],
      minItems: 3,
      maxItems: 3,
    },
  ],
};

const __SCHEMA_COORD = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet__coord',
  anyOf: [
    {
      type: 'object',
      properties: {
        lat: { type: 'number', minimum: -90, maximum: 90 },
        lng: { type: 'number', minimum: -180, maximum: 180 },
      },
      required: ['lat', 'lng'],
    },
    {
      type: 'array',
      items: [
        { type: 'number', minimum: -90, maximum: 90 },
        { type: 'number', minimum: -180, maximum: 180 },
      ],
      minItems: 2,
      maxItems: 2,
    },
  ],
};

const __SCHEMA_HEATMAP_DENSITY_CONFIG = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet__heatmap_density_config',
  type: 'object',

  properties: {
    minOpacity: { type: 'number', minimum: 0, maximum: 1 },
    maxZoom: { type: 'number', minimum: 0 },
    radius: { type: 'number', minimum: 0 },
    blur: { type: 'number', minimum: 0 },
    disableAutoscale: { type: 'boolean' },
    colorScale: { type: 'string' },
    reverseColorScale: { type: 'boolean' },
  },
};

const __SCHEMA_HEATMAP_CONFIG = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet__heatmap_config',
  type: 'object',

  properties: {
    opacity: { type: 'number', minimum: 0, maximum: 1 },
    radius: { type: 'number', minimum: 0 },
    max: { type: 'number' },
    min: { type: 'number' },
    disableAutoscale: { type: 'boolean' },
    addTextLabel: { type: 'boolean' },
    colorScale: { type: 'string' },
    reverseColorScale: { type: 'boolean' },
  },
};

const _SCHEMA_HEATMAP_DENSITY = [
  {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_heatmap_density',
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: __SCHEMA_VALUED_COORD.$id },
      },
      config: { $ref: __SCHEMA_HEATMAP_DENSITY_CONFIG.$id },
    },
    required: ['data'],
  },
  __SCHEMA_VALUED_COORD,
  __SCHEMA_HEATMAP_DENSITY_CONFIG,
];

const _SCHEMA_HEATMAP_DENSITY_SAMPLED = [
  {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_heatmap_density_sampled',
    type: 'object',
    properties: {
      data: { $ref: __SCHEMA_VALUED_COORD.$id },
      config: { $ref: __SCHEMA_HEATMAP_DENSITY_CONFIG.$id },
    },
    required: ['data'],
  },
  __SCHEMA_VALUED_COORD,
  __SCHEMA_HEATMAP_DENSITY_CONFIG,
];

const _SCHEMA_HEATMAP = [
  {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_heatmap',
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { $ref: __SCHEMA_VALUED_COORD.$id },
      },
      config: { $ref: __SCHEMA_HEATMAP_CONFIG.$id },
    },
    required: ['data'],
  },
  __SCHEMA_VALUED_COORD,
  __SCHEMA_HEATMAP_CONFIG,
];

const _SCHEMA_HEATMAP_SAMPLED = [
  {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_heatmap_sampled',
    type: 'object',
    properties: {
      data: { $ref: __SCHEMA_VALUED_COORD.$id },
      config: { $ref: __SCHEMA_HEATMAP_CONFIG.$id },
    },
    required: ['data'],
  },
  __SCHEMA_VALUED_COORD,
  __SCHEMA_HEATMAP_CONFIG,
];

const __SCHEMA_GEOJSON_COORD = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_geojson_coord',
  anyOf: [
    // [longitude, latitude, elevation]
    {
      type: 'array',
      items: [
        { type: 'number', minimum: -180, maximum: 180 },
        { type: 'number', minimum: -90, maximum: 90 },
      ],
      minItems: 2,
      maxItems: 2,
    },
    {
      type: 'array',
      items: [
        { type: 'number', minimum: -180, maximum: 180 },
        { type: 'number', minimum: -90, maximum: 90 },
        { type: 'number' },
      ],
      minItems: 3,
      maxItems: 3,
    },
  ],
};

const __SCHEMA_GEOJSON_COORDINATES = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_geojson_coordinates',
  type: 'array',
  items: { $ref: __SCHEMA_GEOJSON_COORD.$id },
};

const _SCHEMA_LINE_HEATMAP = [
  {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_line_heatmap',
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            coordinates: {
              type: 'array',
              items: { $ref: __SCHEMA_GEOJSON_COORD.$id },
              minItems: 2,
            },
          },
          required: ['coordinates'],
          patternProperties: {
            '^(?!coordinates).*$': { type: 'number' },
          },
          minProperties: 2,
          maxProperties: 2,
        },
      },
      config: {
        type: 'object',
        properties: {
          opacity: { type: 'number', minimum: 0, maximum: 1 },
          weight: { type: 'number', minimum: 0 },
          max: { type: 'number' },
          min: { type: 'number' },
          disableAutoscale: { type: 'boolean' },
          colorScale: { type: 'string' },
          reverseColorScale: { type: 'boolean' },
        },
        required: ['weight'],
      },
    },
    required: ['data', 'config'],
  },
  __SCHEMA_GEOJSON_COORD,
];

const __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_geojson_geometry_primitive',
  anyOf: [
    {
      type: 'object',
      properties: {
        type: { const: 'Point' },
        coordinates: { $ref: __SCHEMA_GEOJSON_COORD.$id },
      },
      required: ['type', 'coordinates'],
    },
    {
      type: 'object',
      properties: {
        type: { const: 'LineString' },
        coordinates: { $ref: __SCHEMA_GEOJSON_COORDINATES.$id },
      },
      required: ['type', 'coordinates'],
    },
    {
      type: 'object',
      properties: {
        type: { const: 'Polygon' },
        coordinates: {
          type: 'array',
          items: { $ref: __SCHEMA_GEOJSON_COORDINATES.$id },
        },
      },
      required: ['type', 'coordinates'],
    },
  ],
};

const __SCHEMA_GEOJSON_GEOMETRY_ALL = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_geojson_geometry_all',
  anyOf: [
    { $ref: __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE.$id },
    {
      type: 'object',
      properties: {
        type: { const: 'MultiPoint' },
        coordinates: { $ref: __SCHEMA_GEOJSON_COORDINATES.$id },
      },
      required: ['type', 'coordinates'],
    },
    {
      type: 'object',
      properties: {
        type: { const: 'MultiLineString' },
        coordinates: {
          type: 'array',
          items: { $ref: __SCHEMA_GEOJSON_COORDINATES.$id },
        },
      },
      required: ['type', 'coordinates'],
    },
    {
      type: 'object',
      properties: {
        type: { const: 'MultiPolygon' },
        coordinates: {
          type: 'array',
          items: {
            type: 'array',
            items: { $ref: __SCHEMA_GEOJSON_COORDINATES.$id },
          },
        },
      },
      required: ['type', 'coordinates'],
    },
    {
      type: 'object',
      properties: {
        type: { const: 'GeometryCollection' },
        geometries: {
          type: 'array',
          items: { $ref: __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE.$id },
        },
      },
      required: ['type', 'geometries'],
    },
  ],
};

const _SCHEMA_CHOROPLETH = [
  {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_choropleth',
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            geometry: { $ref: __SCHEMA_GEOJSON_GEOMETRY_ALL.$id },
          },
          required: ['geometry'],
          patternProperties: {
            '^(?!geometry).*$': { type: 'number' },
          },
          minProperties: 2,
          maxProperties: 2,
        },
      },
      config: {
        type: 'object',
        properties: {
          opacity: { type: 'number', minimum: 0, maximum: 1 },
          weight: { type: 'number', minimum: 0 },
          max: { type: 'number' },
          min: { type: 'number' },
          disableAutoscale: { type: 'boolean' },
          colorScale: { type: 'string' },
          reverseColorScale: { type: 'boolean' },
        },
      },
    },
    required: ['data'],
  },
  __SCHEMA_GEOJSON_COORD,
  __SCHEMA_GEOJSON_COORDINATES,
  __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE,
  __SCHEMA_GEOJSON_GEOMETRY_ALL,
];

const _SCHEMA_GEOJSON = [
  {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_geojson',
    type: 'object',
    properties: {
      type: { const: 'FeatureCollection' },
      features: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { const: 'Feature' },
            id: { type: 'string' },
            geometry: { $ref: __SCHEMA_GEOJSON_GEOMETRY_ALL.$id },
            properties: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                style: {
                  type: 'object',
                  properties: {
                    color: { type: 'string' },
                    weight: { type: 'number' },
                    opacity: { type: 'number' },
                  },
                  additionalProperties: { $ref: WidgetPrototypesManager.SCHEMA_ANY_PRIMITIVE.$id },
                },
              },
            },
          },

          // Point-specific styling
          if: {
            properties: {
              geometry: {
                type: 'object',
                properties: { type: { const: 'Point' } },
                required: ['type'],
              },
            },
          },
          then: {
            properties: {
              properties: {
                type: 'object',
                properties: {
                  awesomeMarker: {
                    type: 'object',
                    properties: {
                      icon: { type: 'string' },
                      prefix: { type: 'string' },
                      markerColor: { type: 'string' },
                      iconColor: { type: 'string' },
                      spin: { type: 'boolean' },
                      extraClasses: { type: 'string' },
                    },
                    required: ['icon'],
                  },
                  comment: { type: 'string' },
                  html: { type: 'string' },
                },
                anyOf: [
                  //  comment and html are exclusive
                  { not: { required: ['comment'] } },
                  { not: { required: ['html'] } },
                ],
              },
            },
          },
          required: ['type', 'geometry', 'properties'],
        },
      },
      properties: {
        type: 'object',
        properties: {
          description: { type: 'string' },
        },
      },
    },
    required: ['type', 'features'],
  },
  __SCHEMA_GEOJSON_COORD,
  __SCHEMA_GEOJSON_COORDINATES,
  __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE,
  __SCHEMA_GEOJSON_GEOMETRY_ALL,
  WidgetPrototypesManager.SCHEMA_ANY_PRIMITIVE,
];

const _SCHEMA_SELECTED_GEOJSON = [
  {
    $schema: WidgetPrototypesManager.SCHEMA_VERSION,
    $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_selected_geojson',
    type: 'object',
    properties: {
      type: { const: 'FeatureCollection' },
      features: {
        type: 'array',
        items: {
          type: 'object',
          required: ['type', 'geometry', 'properties'],
          properties: {
            type: { const: 'Feature' },
            geometry: { $ref: __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE.$id },
            properties: {
              type: 'object',
              properties: { layerId: { type: 'number' } },
              required: ['layerId'],
            },
          },

          // Polygon-specific
          if: {
            properties: {
              geometry: {
                type: 'object',
                properties: { type: { const: 'Polygon' } },
                required: ['type'],
              },
            },
          },
          then: {
            properties: {
              geometry: {
                type: 'object',
                properties: {
                  isRectangle: { type: 'boolean' },
                  isCut: { type: 'boolean' },
                },
                required: ['isRectangle', 'isCut'],
              },
            },
          },
        },
      },
    },
    required: ['type', 'features'],
  },
  __SCHEMA_GEOJSON_COORD,
  __SCHEMA_GEOJSON_COORDINATES,
  __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE,
  WidgetPrototypesManager.SCHEMA_ANY_PRIMITIVE,
];

function mapWidgetsPluginClass() {
  // MBG : TODO refactor and improve : ajoute du vide en bas du document
  var arrowDef = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrowDef.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  arrowDef.setAttribute('width', '0');
  arrowDef.setAttribute('height', '0');
  var arrowDefStr =
    '<defs><marker id="styledArrow" markerUnits="strokeWidth" markerWidth="12" markerHeight="12" viewBox="0 0 12 12" refX="6" refY="6" orient="auto"><path d="M2,2 L10,6 L2,10 L6,6 L2,2" style="fill: black;"></path></marker></defs>';
  arrowDef.innerHTML = arrowDefStr;
  var hiddenDiv = document.createElement('div');
  hiddenDiv.setAttribute('style', 'width:0px; height:0px; margin:0px; padding: 0px');
  hiddenDiv.setAttribute('id', 'hiddenDiv');
  hiddenDiv.appendChild(arrowDef);
  document.body.appendChild(hiddenDiv);

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         Open Street Maps                           | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  this.openStreetMapsWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    var drawingFeature = modelsParameters[idInstance].drawingFeatures;
    var captureClickEvent = modelsParameters[idInstance].captureClickEvent;
    var userMarkerCluster = modelsParameters[idInstance].markerCluster;
    var drawControlConfig = {
      drawCircle: false,
      drawCircleMarker: false,
      drawMarker: true,
      drawPolyline: true,
      drawPolygon: true,
      drawRectangle: true,
    };

    if (drawingFeature) {
      drawControlConfig = {
        drawCircle: false,
        drawCircleMarker: false,
        drawMarker: modelsParameters[idInstance].drawingFeaturesOptions.point,
        drawPolyline: modelsParameters[idInstance].drawingFeaturesOptions.line,
        drawPolygon: modelsParameters[idInstance].drawingFeaturesOptions.polygone,
        drawRectangle: modelsParameters[idInstance].drawingFeaturesOptions.rectangle,
      };
    }

    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;
    var map;
    var idx = 0;

    // For HeatMap legends
    // based on old d3 3.3. to upgrade
    var body = d3.select('body');
    var length = 100;
    var colorStops = [0, 25, 50, 75, 100];

    this.numberOfGeoJsonLayers = modelsParameters[idInstance].geoJson.numberOfLayers;
    if (modelsParameters[idInstance].choropleth) {
      this.numberOfChoroplethLayers = modelsParameters[idInstance].choropleth.numberOfLayers;
    } else {
      this.numberOfChoroplethLayers = 0;
    }
    if (modelsParameters[idInstance].lineHeatMap) {
      this.numberOfLineHeatMapLayers = modelsParameters[idInstance].lineHeatMap.numberOfLayers;
    } else {
      this.numberOfLineHeatMapLayers = 0;
    }
    this.numberOfHeatMapLayers = modelsParameters[idInstance].heatMap.numberOfLayers;

    // handle old projects with no heatMapBuffer
    if (_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapBuffer)) {
      modelsHiddenParams[idInstance].heatMap.heatMapBuffer = [];
    }

    // handle old projects with no imageOverlay
    if (_.isUndefined(modelsParameters[idInstance].imageOverlay)) {
      this.numberOfImageLayers = 0;
      modelsParameters[idInstance].imageOverlay = { numberOfLayers: 0 };
    } else {
      this.numberOfImageLayers = modelsParameters[idInstance].imageOverlay.numberOfLayers;
    }
    if (_.isUndefined(modelsHiddenParams[idInstance].imageOverlay)) {
      modelsHiddenParams[idInstance].imageOverlay = { imageData: [] };
    }

    // handle old projects with no svgOverlay
    if (_.isUndefined(modelsParameters[idInstance].svgOverlay)) {
      this.numberOfSvgLayers = 0;
      modelsParameters[idInstance].svgOverlay = { numberOfLayers: 0 };
    } else {
      this.numberOfSvgLayers = modelsParameters[idInstance].svgOverlay.numberOfLayers;
    }
    if (_.isUndefined(modelsHiddenParams[idInstance].svgOverlay)) {
      modelsHiddenParams[idInstance].svgOverlay = { svgData: [], svgElements: [] };
    }

    // handle old projects with no lineHeatMap
    if (_.isUndefined(modelsParameters[idInstance].lineHeatMap)) {
      this.numberOfLineHeatMapLayers = 0;
      modelsParameters[idInstance].lineHeatMap = { numberOfLayers: 0 };
    } else {
      this.numberOfLineHeatMapLayers = modelsParameters[idInstance].lineHeatMap.numberOfLayers;
    }
    if (_.isUndefined(modelsHiddenParams[idInstance].lineHeatMap)) {
      modelsHiddenParams[idInstance].lineHeatMap = { lineHeatMapLayers: [], lineHeatMapBounds: [] };
    }

    // handle old projects with no choropleth
    if (_.isUndefined(modelsParameters[idInstance].choropleth)) {
      this.numberOfChoroplethLayers = 0;
      modelsParameters[idInstance].choropleth = { numberOfLayers: 0 };
    } else {
      this.numberOfChoroplethLayers = modelsParameters[idInstance].choropleth.numberOfLayers;
    }
    if (_.isUndefined(modelsHiddenParams[idInstance].choropleth)) {
      modelsHiddenParams[idInstance].choropleth = { choroplethLayers: [], choroplethBounds: [] };
    }

    var mapLayers;

    // cloning of tmp params
    if (_.isUndefined(self.mapLayers)) {
      self.mapLayers = jQuery.extend(true, {}, modelsTempParams.openStreetMaps);
    }

    var currentBaseLayer;
    this.configStore = [];

    // cleanup first
    // -- geoJson
    if (modelsHiddenParams[idInstance].geoJson.geoJsonLayers.length > self.numberOfGeoJsonLayers) {
      modelsHiddenParams[idInstance].geoJson.geoJsonLayers.splice(self.numberOfGeoJsonLayers);
    }
    if (modelsHiddenParams[idInstance].geoJson.geoJsonBounds.length > self.numberOfGeoJsonLayers) {
      modelsHiddenParams[idInstance].geoJson.geoJsonBounds.splice(self.numberOfGeoJsonLayers);
    }

    if (self.mapLayers.geoJson.geoJsonLayers.length > self.numberOfGeoJsonLayers) {
      self.mapLayers.geoJson.geoJsonLayers.splice(self.numberOfGeoJsonLayers);
    }

    // -- choropleth
    if (modelsHiddenParams[idInstance].choropleth.choroplethLayers.length > self.numberOfChoroplethLayers) {
      modelsHiddenParams[idInstance].choropleth.choroplethLayers.splice(self.numberOfChoroplethLayers);
    }
    if (modelsHiddenParams[idInstance].choropleth.choroplethBounds.length > self.numberOfChoroplethLayers) {
      modelsHiddenParams[idInstance].choropleth.choroplethBounds.splice(self.numberOfChoroplethLayers);
    }

    if (self.mapLayers.choropleth.choroplethLayers.length > self.numberOfChoroplethLayers) {
      self.mapLayers.choropleth.choroplethLayers.splice(self.numberOfChoroplethLayers);
    }
    // -- lineHeatMap
    if (modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers.length > self.numberOfLineHeatMapLayers) {
      modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers.splice(self.numberOfLineHeatMapLayers);
    }
    if (modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds.length > self.numberOfLineHeatMapLayers) {
      modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds.splice(self.numberOfLineHeatMapLayers);
    }

    if (self.mapLayers.lineHeatMap.lineHeatMapLayers.length > self.numberOfLineHeatMapLayers) {
      self.mapLayers.lineHeatMap.lineHeatMapLayers.splice(self.numberOfLineHeatMapLayers);
    }
    // -- heatMap
    if (modelsHiddenParams[idInstance].heatMap.heatMapData.length > self.numberOfHeatMapLayers) {
      modelsHiddenParams[idInstance].heatMap.heatMapData.splice(self.numberOfHeatMapLayers);
      modelsHiddenParams[idInstance].legends.splice(self.numberOfHeatMapLayers);
    }

    if (modelsHiddenParams[idInstance].heatMap.heatMapBuffer.length > self.numberOfHeatMapLayers) {
      modelsHiddenParams[idInstance].heatMap.heatMapBuffer.splice(self.numberOfHeatMapLayers);
      modelsHiddenParams[idInstance].legends.splice(self.numberOfHeatMapLayers);
    }

    if (self.mapLayers.heatMap.heatMapLayers.length > self.numberOfHeatMapLayers) {
      self.mapLayers.heatMap.heatMapLayers.splice(self.numberOfHeatMapLayers);
    }

    // -- imageOverlay
    if (modelsHiddenParams[idInstance].imageOverlay.imageData.length > self.numberOfImageLayers) {
      modelsHiddenParams[idInstance].imageOverlay.imageData.splice(self.numberOfImageLayers);
    }

    if (self.mapLayers.imageOverlay.imageLayers.length > self.numberOfImageLayers) {
      self.mapLayers.imageOverlay.imageLayers.splice(self.numberOfImageLayers);
    }

    // -- svgOverlay
    if (modelsHiddenParams[idInstance].svgOverlay.svgData.length > self.numberOfSvgLayers) {
      modelsHiddenParams[idInstance].svgOverlay.svgData.splice(self.numberOfSvgLayers);
      modelsHiddenParams[idInstance].svgOverlay.svgElements.splice(self.numberOfSvgLayers);
    }

    if (self.mapLayers.svgOverlay.svgLayers.length > self.numberOfSvgLayers) {
      self.mapLayers.svgOverlay.svgLayers.splice(self.numberOfSvgLayers);
    }

    this.getColorScale = function (colorScaleName, reverseColorScale, min, max) {
      // Default interpolator
      var interpolator = d3['interpolateYlOrRd'];
      // Availlable interpolator : https://github.com/d3/d3-scale-chromatic

      if (
        !_.isUndefined(colorScaleName) &&
        !_.isUndefined(d3[colorScaleName]) &&
        colorScaleName.includes('interpolate')
      ) {
        interpolator = d3[colorScaleName];
      }

      if (!_.isUndefined(reverseColorScale) && reverseColorScale) {
        return d3.scaleSequential().interpolator(interpolator).domain([max, min]);
      } else {
        return d3.scaleSequential().interpolator(interpolator).domain([min, max]);
      }
    };

    this.goToFirstRadioButton = function () {
      if (tabActive == 'play') {
        if (self.numberOfHeatMapLayers > 0) {
          var nbRadioShadow = 0;
          if (!_.isUndefined($("input[name='leaflet-base-layers']"))) {
            nbRadioShadow = $("input[name='leaflet-base-layers']").length;
          }
          // temporary hack, waiting for fix in leaflet
          for (var k = 0; k < nbRadioShadow; k++) {
            if ($.contains(document.getElementById(idInstance + 'c'), $("input[name='leaflet-base-layers']")[k])) {
              if (!_.isUndefined(modelsHiddenParams[idInstance])) {
                if (modelsHiddenParams[idInstance].legends != []) {
                  $("input[name='leaflet-base-layers']")[k].click();
                  var zeroKey = _.keys(modelsHiddenParams[idInstance].legends)[0];
                  self.showLegend(zeroKey);
                  self.currentBaseLayer = zeroKey;
                  document.removeEventListener('play-tab-loaded', self.goToFirstRadioButton);
                  return;
                }
              }
            }
          }
        }
      }
    };

    this.updateValue = function (object) {
      if (modelsHiddenParams[idInstance].selectedGeoJson) {
        if (modelsHiddenParams[idInstance].selectedGeoJson.features) {
          modelsHiddenParams[idInstance].selectedGeoJson.features.push(object);
        } else {
          modelsHiddenParams[idInstance].selectedGeoJson = { type: 'FeatureCollection', features: [object] };
        }
        self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
      }
    };

    this.getGeoJsonPoint = function (typeLayers, Points) {
      var ListPositions = [];
      if (
        (typeLayers.geometry.type === 'polygon' || typeLayers.geometry.type === 'Polygon') &&
        typeLayers.geometry.isCut
      ) {
        var my_latlngs = Points._latlngs ? Points._latlngs : Points.pm._layers[0]._latlngs;

        my_latlngs.forEach(function (point) {
          var _val = [];
          for (var i = 0; i < point.length; i++) {
            _val.push([point[i].lng, point[i].lat]);
          }
          ListPositions.push(_val);
        });
        return ListPositions;
      } else if (typeLayers.geometry.type === 'LineString' || typeLayers.geometry.type === 'lineString') {
        for (var leng = 0; leng < Points._latlngs.length; leng++) {
          var _val = Points._latlngs[leng];
          ListPositions.push([_val.lng, _val.lat]);
        }
        return ListPositions;
      } else if (
        (typeLayers.geometry.type === 'polygon' || typeLayers.geometry.type === 'Polygon') &&
        !typeLayers.geometry.isCut
      ) {
        var my_latlngs = Points._latlngs ? Points._latlngs[0] : Points.pm._layers[0]._latlngs[0];
        for (var leng = 0; leng < my_latlngs.length; leng++) {
          var _val = my_latlngs[leng];
          ListPositions.push([_val.lng, _val.lat]);
        }
        return [ListPositions];
      } else if (typeLayers.geometry.type === 'Point' || typeLayers.geometry.type === 'point') {
        ListPositions = [Points._latlng.lng, Points._latlng.lat];
        return ListPositions;
      } else {
        return [];
      }
    };

    this.getGeoJsonPoint1 = function (typeLayers, Points, isRectangle) {
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
    };
    this.getLayerInformation = function (id) {
      var infos = {
        title: '',
        description: '',
        timeStamp: '',
      };
      if (modelsHiddenParams[idInstance].selectedGeoJson) {
        for (var lay = 0; lay < modelsHiddenParams[idInstance].selectedGeoJson.features.length; lay++) {
          if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['layerId'] == id) {
            if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['information']) {
              infos.title =
                modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['information'].title;
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
    };
    this.updateLayerInformation = function (id, options) {
      if (modelsHiddenParams[idInstance].selectedGeoJson) {
        for (var lay = 0; lay < modelsHiddenParams[idInstance].selectedGeoJson.features.length; lay++) {
          if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['layerId'] == id) {
            modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['information'] = options;
          }
        }
        self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
      }
    };
    this.editList = function (e) {
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
    };

    this.rotateLayer = function (e) {
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
    };

    this.deleteLayer = function (e) {
      var my_leaflet_id = e.layer._drawnByGeoman ? e.layer._leaflet_id : e.layer.feature.properties.layerId;

      if (modelsHiddenParams[idInstance].selectedGeoJson) {
        for (var rr = 0; rr < modelsHiddenParams[idInstance].selectedGeoJson.features.length; rr++) {
          if (modelsHiddenParams[idInstance].selectedGeoJson.features[rr]['properties']['layerId'] == my_leaflet_id) {
            modelsHiddenParams[idInstance].selectedGeoJson.features.splice(rr, 1);
          }
        }
        self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
      }
    };

    if (captureClickEvent) {
      this.selectedPoint = {
        updateCallback: function () {},
        getValue: function () {
          return modelsHiddenParams[idInstance].selectedPoint;
        },
        setValue: function (val) {
          /* not needed : datanode should not update this widget */
        },
        addValueChangedHandler: function (updateDataFromWidget) {
          this.updateCallback = updateDataFromWidget;
        },
        removeValueChangedHandler: function (updateDataFromWidget) {},
        setCaption: function (caption) {},
        clearCaption: function () {},
      };
    }

    if (drawingFeature) {
      this.selectedGeoJson = {
        updateCallback: function () {},
        getValue: function () {
          return modelsHiddenParams[idInstance].selectedGeoJson;
        },
        setValue: function (val) {
          modelsHiddenParams[idInstance].selectedGeoJson = val;
        },
        addValueChangedHandler: function (updateDataFromWidget) {
          if (widgetConnector.widgetsConnection[idInstance].sliders.selectedGeoJson.dataNode !== 'None') {
            this.updateCallback = updateDataFromWidget;
            self.addDrawingFeatures();
          }
        },
        removeValueChangedHandler: function (updateDataFromWidget) {},
        setCaption: function (caption) {},
        clearCaption: function () {},
      };
    }

    this.modal = function (options) {
      if (modelsParameters[idInstance].drawingFeaturesOptions.modal) {
        var _layerInfos = self.getLayerInformation(options.leafletId);
        var _tmp = [
          '<div class="modal-header"><h4>{title} </h4></div>',
          '<h5 class="pull-left" style="padding-left: 10px"><a>Please add a title and a short description</a></h5>',
          '<div class="modal-body">',
          '<div class="row">{content}</div>',
          '</div>',
          '<div class="modal-footer">',
          '<input id="dialog-ok" type="submit" class="bouton {OK_CLS}" value="Ok">',
          '<input id="dialog-ok" type="submit" class="bouton  {CANCEL_CLS}" value="Cancel">',
          '</div>',
        ].join('');
        var _cntt = [
          '<table>',
          '<body>',
          '<tr>',
          '<td style="width: 40%;padding-top: 20px;">Title</td>',
          '<td style="width: 60%;padding-top: 20px;">',
          '<textarea type="text" class="form-control"  style="width:190px;max-width: 200px ;max-height: 40px  ;color: #34495e" rows="1" id="modalInput1"  placeholder="Enter title">',
          _layerInfos.title,
          '</textarea>',
          '</td>',
          '</tr>',
          '<tr>',
          '<td style="width: 30%;padding-top: 20px;">Description</td>',
          '<td style="width: 70%;padding-top: 20px;">',
          '<textarea type="text" class="form-control"  style="width:190px;max-width: 200px ;max-height: 70px  ;color: #34495e" rows="2" id="modalInput2"  placeholder="Enter Description">',
          _layerInfos.description,
          '</textarea>',
          '</td>',
          '</tr>',
          '</body>',
          '</table>',
        ].join('');

        if (options.type === 'editPoint') {
        }
        self.map.openModal({
          leafletId: options.leafletId || 'NA',
          content: _cntt,
          template: _tmp,
          okText: 'Ok',
          title: _layerInfos.title,
          description: _layerInfos.description,
          cancelText: 'Cancel',
          OK_CLS: 'modal-ok',
          CANCEL_CLS: 'modal-cancel',
          MODAL_CONTENT_CLS: 'modal-content modal-content-black',
          width: 350,

          onShow: function (evt) {
            var modal = evt.modal;
            L.DomEvent.on(modal._container.querySelector('.modal-ok'), 'click', function () {
              options.title = document.getElementById('modalInput1').value;
              options.description = document.getElementById('modalInput2').value;
              var d = new Date();
              options.timeStamp = d.toISOString(); // MBG 10/09/2020
              self.updateLayerInformation(options.leafletId, options);
              modal.hide();
            }).on(modal._container.querySelector('.modal-cancel'), 'click', function () {
              modal.hide();
            });
          },
        });
      }
    };

    this.addDrawingFeatures = function () {
      var drawnItems = new L.FeatureGroup();
      self.map.addLayer(drawnItems);

      if (this.bIsInteractive) {
        if (modelsHiddenParams[idInstance].selectedGeoJson) {
          if (modelsHiddenParams[idInstance].selectedGeoJson.features) {
            for (var lay = 0; lay < modelsHiddenParams[idInstance].selectedGeoJson.features.length; lay++) {
              var coordinate = self.getGeoJsonPoint1(
                modelsHiddenParams[idInstance].selectedGeoJson.features[lay].geometry.type,
                modelsHiddenParams[idInstance].selectedGeoJson.features[lay].geometry.coordinates,
                modelsHiddenParams[idInstance].selectedGeoJson.features[lay].geometry.isRectangle
              );
              var pol = null;
              if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay].geometry.type === 'LineString') {
                pol = L.polyline(coordinate);
              } else if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay].geometry.type === 'Point') {
                pol = L.marker(coordinate);
              } else if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay].geometry.type === 'Polygon') {
                if (modelsHiddenParams[idInstance].selectedGeoJson.features[lay].geometry.isRectangle) {
                  pol = L.geoJSON(modelsHiddenParams[idInstance].selectedGeoJson.features[lay], {});
                } else {
                  pol = L.geoJSON(modelsHiddenParams[idInstance].selectedGeoJson.features[lay], {});
                }
              }

              if (pol) {
                pol.on('click', function (ee) {
                  console.log('click pol leaflet_id', ee.target._leaflet_id);
                  self.modal({ leafletId: ee.target._leaflet_id });
                });
                drawnItems.addLayer(pol);
                modelsHiddenParams[idInstance].selectedGeoJson.features[lay]['properties']['layerId'] = pol._leaflet_id;
              }
            }
            self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
          } else {
            modelsHiddenParams[idInstance].selectedGeoJson.type = 'FeatureCollection';
            modelsHiddenParams[idInstance].selectedGeoJson.features = [];
            self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
          }
        } else {
          modelsHiddenParams[idInstance].selectedGeoJson = {
            type: 'FeatureCollection',
            features: [],
          };
          self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
        }
        self.map.on('pm:globaleditmodetoggled', function (e) {
          console.log('pm:globaleditmodetoggled', e);
          self.editList(e);
        });
        self.map.on('pm:globaldragmodetoggled', function (e) {
          console.log('pm:globaldragmodetoggled', e);
          self.editList(e);
        });
        self.map.on('pm:rotateend', function (e) {
          console.log('pm:rotateend', e);
          self.rotateLayer(e);
        });
        self.map.on('pm:remove', function (e) {
          console.log('pm:remove', e);
          self.deleteLayer(e);
        });
        self.map.on('pm:cut', function (e) {
          console.log('pm:cut', e);
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
        });
        self.map.on('pm:create', (e) => {
          console.log('pm:create', e);
          drawnItems.addLayer(e.layer);

          var ListPositions = [];
          if (modelsHiddenParams[idInstance].selectedGeoJson) {
            if (e.shape == 'Polygon') {
              for (var leng = 0; leng < e.layer._latlngs[0].length; leng++) {
                var _val = e.layer._latlngs[0][leng];
                ListPositions.push([_val.lng, _val.lat]);
              }
              self.updateValue({
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [ListPositions],
                  isRectangle: false,
                  isCut: false,
                },
                properties: { layerId: e.layer._leaflet_id },
              });
            } else if (e.shape == 'Line') {
              for (var leng = 0; leng < e.layer._latlngs.length; leng++) {
                var _val = e.layer._latlngs[leng];
                ListPositions.push([_val.lng, _val.lat]);
              }
              self.updateValue({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: ListPositions,
                },
                properties: { layerId: e.layer._leaflet_id },
              });
            } else if (e.shape == 'Rectangle') {
              for (var leng = 0; leng < e.layer._latlngs[0].length; leng++) {
                var _val = e.layer._latlngs[0][leng];
                ListPositions.push([_val.lng, _val.lat]);
              }
              self.updateValue({
                type: 'Feature',
                geometry: {
                  type: 'Polygon', // MBG changed from Rectangle to Polygon
                  coordinates: [ListPositions],
                  isRectangle: true,
                  isCut: false,
                },
                properties: { layerId: e.layer._leaflet_id },
              });
            } else if (e.shape == 'Marker') {
              ListPositions = [e.layer._latlng.lng, e.layer._latlng.lat];
              self.updateValue({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: ListPositions,
                },
                properties: { layerId: e.layer._leaflet_id },
              });
            }
          }
        });
      } else {
        modelsHiddenParams[idInstance].selectedGeoJson = {
          type: 'FeatureCollection',
          features: [],
        };
        self.selectedGeoJson.updateCallback(self.selectedGeoJson, self.selectedGeoJson.getValue());
      }
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'openStreetMap' + idWidget);
      widgetHtml.setAttribute('style', 'width: inherit; height: inherit');
      document.addEventListener('play-tab-loaded', self.goToFirstRadioButton);
      $('#' + idDivContainer).html(widgetHtml);

      self.map = L.map('openStreetMap' + idWidget, { preferCanvas: true }).setView(
        [modelsParameters[idInstance].defaultCenter.latitude, modelsParameters[idInstance].defaultCenter.longitude],
        modelsParameters[idInstance].defaultCenter.zoom
      );

      // MBG for Olivier L.
      modelsTempParams[idInstance].mapObj = self.map;
      if (captureClickEvent) {
        if (this.bIsInteractive) {
          self.map.on('click', function (evt) {
            if (modelsHiddenParams[idInstance].selectedPoint) {
              modelsHiddenParams[idInstance].selectedPoint = {
                lat: evt.latlng.lat,
                lag: evt.latlng.lng,
              };
              self.selectedPoint.updateCallback(self.selectedPoint, self.selectedPoint.getValue());
            } else {
              modelsHiddenParams[idInstance].selectedPoint = {
                lat: evt.latlng.lat,
                lag: evt.latlng.lng,
              };
              self.selectedPoint.updateCallback(self.selectedPoint, self.selectedPoint.getValue());
            }
          });
        }
      }

      if (!this.bIsInteractive) {
        self.map.dragging.disable();
        self.map.touchZoom.disable();
        self.map.doubleClickZoom.disable();
        self.map.scrollWheelZoom.disable();
        self.map.boxZoom.disable();
        self.map.keyboard.disable();
      }

      // list of possible tile servers
      // TODO : better rewrite according to https://leaflet-extras.github.io/leaflet-providers/preview/
      var tileServers = {};
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

      var ts = 'MapboxStreets';
      if (!_.isUndefined(modelsParameters[idInstance].tileServer)) {
        if (_.includes(_.keys(tileServers), modelsParameters[idInstance].tileServer)) {
          ts = modelsParameters[idInstance].tileServer;
        } else {
          /* TODO : good error message at edit mode to send */
        }
      }

      var tileConf = {
        url: tileServers[ts].url,
        maxZoom: tileServers[ts].maxZoom,
        attribution:
          'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          tileServers[ts].attribution,
      };

      if (!_.isUndefined(tileServers[ts].subdomains)) {
        tileConf.subdomains = tileServers[ts].subdomains;
      }

      if (!_.isUndefined(tileServers[ts].id)) {
        tileConf.id = tileServers[ts].id;
      }

      if (!_.isUndefined(tileServers[ts].apikey)) {
        tileConf.apikey = tileServers[ts].apikey;
      }

      if (!_.isUndefined(tileServers[ts].format)) {
        tileConf.format = tileServers[ts].format;
      }

      if (!_.isUndefined(tileServers[ts].style)) {
        tileConf.style = tileServers[ts].style;
      }

      if (!_.isUndefined(tileServers[ts].tileSize)) {
        tileConf.tileSize = tileServers[ts].tileSize;
      }

      if (!_.isUndefined(tileServers[ts].zoomOffset)) {
        tileConf.zoomOffset = tileServers[ts].zoomOffset;
      }

      if (!_.isUndefined(tileServers[ts].accessToken)) {
        tileConf.accessToken = tileServers[ts].accessToken;
      }

      if (modelsParameters[idInstance].offlineSupport) {
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
      } else {
        self.baseLayer = L.tileLayer(tileServers[ts].url, tileConf);
        self.baseLayer.addTo(self.map);
      }

      L.control.scale().addTo(self.map);

      self.map.zoomControl.setPosition('topright'); // MBG 07/02/2019 : avoid disturbing legend view

      self.ctrl = L.control
        .layers(
          {},
          {},
          {
            position: 'topright',
            collapsed: true,
            autoZIndex: true,
          }
        )
        .addTo(self.map);

      if (drawingFeature) {
        self.map.pm.addControls(drawControlConfig);
      }

      try {
        for (var i = 0; i < self.numberOfGeoJsonLayers; i++) {
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i]) &&
            !_.isUndefined(modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i])
          ) {
            self.addGeoJson(modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i], i + 1);
          }
        }

        for (var i = 0; i < self.numberOfChoroplethLayers; i++) {
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].choropleth.choroplethLayers[i]) &&
            !_.isUndefined(modelsHiddenParams[idInstance].choropleth.choroplethLayers[i])
          ) {
            self.addChoropleth(modelsHiddenParams[idInstance].choropleth.choroplethLayers[i], i + 1);
          }
        }

        for (var i = 0; i < self.numberOfLineHeatMapLayers; i++) {
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i]) &&
            !_.isUndefined(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i])
          ) {
            self.addLineHeatMap(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i], i + 1);
          }
        }

        for (var i = 0; i < self.numberOfHeatMapLayers; i++) {
          modelsHiddenParams[idInstance].heatMap.heatMapBuffer[i] = []; // clear heatmap buffer
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapData[i]) &&
            !_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapData[i])
          ) {
            self.drawHeatMap(modelsHiddenParams[idInstance].heatMap.heatMapData[i], i + 1);
          }
        }

        for (var i = 0; i < self.numberOfImageLayers; i++) {
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].imageOverlay.imageData[i]) &&
            !_.isUndefined(modelsHiddenParams[idInstance].imageOverlay.imageData[i])
          ) {
            self.addImageOverlay(modelsHiddenParams[idInstance].imageOverlay.imageData[i], i + 1);
          }
        }

        for (var i = 0; i < self.numberOfSvgLayers; i++) {
          if (
            !_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgData[i]) &&
            !_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgData[i])
          ) {
            self.addSvgOverlay(modelsHiddenParams[idInstance].svgOverlay.svgData[i], i + 1, false);
          }
        }
      } catch (ex) {
        console.error(ex);
      }

      self.map.on('baselayerchange', function (eventLayer) {
        self.showLegend(eventLayer.name);
        self.currentBaseLayer = eventLayer.name;
      }); // MBG : for new heatmap
    };

    this.showLegend = function (layerName) {
      var legendKeys = _.keys(modelsHiddenParams[idInstance].legends);
      if (_.has(modelsHiddenParams[idInstance].legends, layerName)) {
        var otherKeys = _.without(legendKeys, layerName);
        _.each(otherKeys, function (ctrlName) {
          self.map.removeControl(modelsHiddenParams[idInstance].legends[ctrlName]);
        });
        modelsHiddenParams[idInstance].legends[layerName].addTo(self.map);
        // Put legend always on top
        if (drawingFeature) {
          self.map.pm.removeControls();
          self.map.pm.addControls(drawControlConfig);
        }
      }
    };

    this.rescale = function () {
      try {
        self.map.invalidateSize(); // MBG : pb with heatMap of leaflet. (with simpleheat lib) ??
        //self.render(); // MBG : may be too expansive
      } catch (e) {
        console.log(e.message);
      }
    };

    this.addGeoJson = function (geoJsonStruct, layerIndex) {
      // securities
      modelsHiddenParams[idInstance].geoJson.geoJsonBounds[layerIndex - 1] = null;
      if (_.isUndefined(geoJsonStruct)) return;

      if (!_.isEmpty(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1]);
      }

      // MBG moved here on 26/11/2020 : empty geoJson means easing layer
      if (_.isEmpty(geoJsonStruct)) return;
      if (geoJsonStruct == {}) return;
      //

      if (_.isUndefined(geoJsonStruct.features)) return;
      if (_.isEmpty(geoJsonStruct.features)) return;

      var featureTitle = 'Trace' + layerIndex; // default
      if (!_.isUndefined(geoJsonStruct.properties)) {
        if (!_.isUndefined(geoJsonStruct.properties.description)) {
          featureTitle = geoJsonStruct.properties.description;
        }
      }
      var defaultStyle = {
        color: modelsHiddenParams[idInstance].colors[layerIndex - 1],
        weight: 4,
        opacity: 1,
      };

      var geoJsonLayer = L.geoJSON(geoJsonStruct, {
        style: function (feature) {
          if (!_.isUndefined(feature.properties)) {
            if (!_.isUndefined(feature.properties.description)) {
              featureTitle = feature.properties.description; // from datanode
            }
            if (!_.isUndefined(feature.properties.style)) {
              return feature.properties.style; // from datanode
            } else {
              return defaultStyle;
            }
          } else {
            return defaultStyle;
          }
        },
        onEachFeature: function onEachFeature(feature, layer) {
          if (feature.geometry.type == 'Point' && feature.properties) {
            if (feature.properties.comment) {
              if (feature.properties.openPopup) {
                let mk = layer.bindPopup(feature.properties.comment, { autoClose: false, autoPan: false });
                mk.on('add', function (event) {
                  event.target.openPopup();
                });
              } else {
                layer.bindPopup(feature.properties.comment);
              }
            } else {
              if (feature.properties.html) {
                if (feature.properties.openPopup) {
                  mk = layer.bindPopup(feature.properties.html, { autoClose: false, autoPan: false });
                  mk.on('add', function (event) {
                    event.target.openPopup();
                  });
                } else {
                  layer.bindPopup(feature.properties.html);
                }
              } else {
                var jsonDisplay = jQuery.extend(true, {}, feature.properties);
                if (jsonDisplay.awesomeMarker) delete jsonDisplay.awesomeMarker;
                if (feature.properties.openPopup) {
                  mk = layer.bindPopup(syntaxHighlight(JSON.stringify(jsonDisplay)), {
                    autoClose: false,
                    autoPan: false,
                  });
                  mk.on('add', function (event) {
                    event.target.openPopup();
                  });
                } else {
                  layer.bindPopup(syntaxHighlight(JSON.stringify(jsonDisplay)));
                }
              }
            }
          }
        },
        pointToLayer: function (feature, latlng) {
          if (feature.geometry.type == 'Point') {
            if (feature.properties) {
              if (feature.properties.awesomeMarker) {
                var awMarker = L.AwesomeMarkers.icon(feature.properties.awesomeMarker);
                return L.marker(latlng, { icon: awMarker });
              }
            }
            return L.marker(latlng);
          }
        },
      });

      if (userMarkerCluster) {
        var markers = L.markerClusterGroup();
        markers.addLayer(geoJsonLayer);
        self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1] = markers;
      } else {
        self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1] = geoJsonLayer;
      }

      self.map.addLayer(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1]);

      self.ctrl.addOverlay(self.mapLayers.geoJson.geoJsonLayers[layerIndex - 1], featureTitle);

      try {
        // Calculate a bounding box in west, south, east, north order.
        var rawBounds = geojsonExtent(geoJsonStruct);
        var corner1 = L.latLng(rawBounds[1], rawBounds[0]);
        var corner2 = L.latLng(rawBounds[3], rawBounds[2]);
        var bounds = L.latLngBounds(corner1, corner2);

        modelsHiddenParams[idInstance].geoJson.geoJsonBounds[layerIndex - 1] = bounds;

        // MBG for Christophe
        var disableAutoscale = false;

        if (!_.isUndefined(geoJsonStruct.properties)) {
          if (!_.isUndefined(geoJsonStruct.properties.disableAutoscale)) {
            disableAutoscale = geoJsonStruct.properties.disableAutoscale;
          }
        }

        if (!disableAutoscale) {
          // Display for the bounding box
          self.map.fitBounds(self.globalLayersBounds());
        }
      } catch (e) {
        console.log(e);
      }
    };

    this.addChoropleth = function (choroplethData, layerIndex) {
      // securities
      if (_.isUndefined(choroplethData)) return;
      if (_.isEmpty(choroplethData)) return;
      if (choroplethData == {}) return;

      var choroplethStruct = self.convertToChoroplethObject(choroplethData);

      modelsHiddenParams[idInstance].choropleth.choroplethBounds[layerIndex - 1] = null;

      if (!_.isEmpty(self.mapLayers.choropleth.choroplethLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.choropleth.choroplethLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.choropleth.choroplethLayers[layerIndex - 1]);
      }

      if (_.isUndefined(choroplethStruct.features)) return;
      if (_.isEmpty(choroplethStruct.features)) return;

      var featureTitle = _.without(_.keys(choroplethData['data'][0]), 'geometry')[0];
      if (!_.isUndefined(choroplethStruct.properties)) {
        if (!_.isUndefined(choroplethStruct.properties.description)) {
          featureTitle = choroplethStruct.properties.description;
        }
      }

      var maxValue = _.max(_.map(choroplethData.data, featureTitle));
      var minValue = _.min(_.map(choroplethData.data, featureTitle));
      var weight = 4;
      var opacity = 0.7;
      let colorScale;

      try {
        if (!_.isUndefined(choroplethData.config.max)) maxValue = choroplethData.config.max;
        if (!_.isUndefined(choroplethData.config.min)) minValue = choroplethData.config.min;
        if (!_.isUndefined(choroplethData.config.weight)) weight = choroplethData.config.weight;
        if (!_.isUndefined(choroplethData.config.opacity)) opacity = choroplethData.config.opacity;

        colorScale = self.getColorScale(
          choroplethData.config.colorScale,
          choroplethData.config.reverseColorScale,
          0,
          1
        );
      } catch (e) {}

      self.createChoroplethLegend(minValue, maxValue, featureTitle, colorScale);
      self.showLegend(featureTitle);

      self.mapLayers.choropleth.choroplethLayers[layerIndex - 1] = L.geoJSON(choroplethStruct, {
        style: function (feature) {
          return {
            weight: weight,
            opacity: opacity,
            color: 'white',
            dashArray: '3',
            fillOpacity: opacity,
            fillColor: getColor(minValue, maxValue, feature.properties.density, colorScale),
          };
        },
      }).addTo(self.map);

      self.ctrl.addBaseLayer(self.mapLayers.choropleth.choroplethLayers[layerIndex - 1], featureTitle);

      var disableAutoscale = false;
      try {
        disableAutoscale = choroplethData.config.disableAutoscale;
      } catch (e) {}

      try {
        if (!disableAutoscale) {
          // Calculate a bounding box in west, south, east, north order.
          var rawBounds = geojsonExtent(choroplethStruct);
          var corner1 = L.latLng(rawBounds[1], rawBounds[0]);
          var corner2 = L.latLng(rawBounds[3], rawBounds[2]);
          var bounds = L.latLngBounds(corner1, corner2);

          modelsHiddenParams[idInstance].choropleth.choroplethBounds[layerIndex - 1] = bounds;
          self.map.fitBounds(bounds);
        }
      } catch (e) {
        console.log(e);
      }
    };

    this.convertToChoroplethObject = function (choroplethObject) {
      let fts = [];

      const data = choroplethObject['data'];
      if (data.length) {
        const tgKey = _.without(_.keys(data[0]), 'geometry')[0];
        fts = data.map((d, k) => ({
          type: 'Feature',
          id: k,
          properties: {},
          geometry: d['geometry'],
          properties: {
            density: d[tgKey],
          },
        }));
      }

      const gj = {
        type: 'FeatureCollection',
        features: fts,
      };

      return gj;
    };

    function getColor(min, max, d, colorScale) {
      var step = (max - min) / 8.0;

      var stepDraw = Math.floor((d - min) / step);
      return colorScale(stepDraw * (1.0 / 8.0));
    }

    this.createChoroplethLegend = function (min, max, featureTitle, colorScale) {
      if (!_.isUndefined(modelsHiddenParams[idInstance].legends[featureTitle])) {
        self.map.removeControl(modelsHiddenParams[idInstance].legends[featureTitle]); // MBG 18/09/2018
      }
      modelsHiddenParams[idInstance].legends[featureTitle] = L.control({ position: 'topright' });
      modelsHiddenParams[idInstance].legends[featureTitle].onAdd = function (map) {
        var step = (max - min) / 8;
        var div = L.DomUtil.create('div', 'info legend'),
          grades = [
            min,
            min + step,
            min + step * 2,
            min + step * 3,
            min + step * 4,
            min + step * 5,
            min + step * 6,
            max,
          ],
          labels = [],
          from,
          to;

        //   div.innerHTML += '<h6>              </h6>';
        for (var i = 0; i < grades.length; i++) {
          from = grades[i];
          to = grades[i + 1];
          labels.push(
            '<i style="background:' +
              getColor(min, max, from + 1, colorScale) +
              '"></i> ' +
              '<span>' +
              d3.format('~s')(from) +
              (to ? '&ndash;' + d3.format('~s')(to) : '+') +
              '</span>'
          ) + '<br>';
        }

        div.innerHTML = labels.join('<br>');
        return div;
      };
    };

    this.convertToGeoJSONObject = function (LineHeatMapObject) {
      function normalize(value) {
        var minNox = LineHeatMapObject['config']['min'];
        var maxNox = LineHeatMapObject['config']['max'];
        var normNox = (100 * (value - minNox)) / (maxNox - minNox);
        if (normNox > 100) normNox = 100;
        if (normNox < 0) normNox = 0;
        return normNox;
      }

      var features = [];
      var property = '';
      // from geoJson to lineHeatMap format
      _.each(LineHeatMapObject['data'], function (data) {
        var keys = Object.keys(data);
        _.each(keys, function (key) {
          if (key != 'coordinates') {
            property = key;
          }
        });
        var feature = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: data['coordinates'],
          },
          properties: {
            style: {
              color: self.getColorScale(
                LineHeatMapObject['config']['colorScale'],
                LineHeatMapObject['config']['reverseColorScale'],
                0,
                100
              )(normalize(data[property])),
              weight: LineHeatMapObject['config']['weight'],
              opacity: LineHeatMapObject['config']['opacity'],
            },
          },
        };
        features.push(feature);
      });

      var res = {
        type: 'FeatureCollection',
        features: features,
        properties: {
          description: property,
        },
      };

      return res;
    };

    this.addLineHeatMap = function (lineHeatMap, layerIndex) {
      // securities
      if (_.isUndefined(lineHeatMap)) return;
      if (_.isEmpty(lineHeatMap)) return;
      if (lineHeatMap == {}) return;

      var lineHeatMapStruct = self.convertToGeoJSONObject(lineHeatMap);

      modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds[layerIndex - 1] = null;

      if (!_.isEmpty(self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1]);
      }

      if (_.isUndefined(lineHeatMapStruct.features)) return;
      if (_.isEmpty(lineHeatMapStruct.features)) return;

      var featureTitle = 'Trace' + layerIndex; // default
      if (!_.isUndefined(lineHeatMapStruct.properties)) {
        if (!_.isUndefined(lineHeatMapStruct.properties.description)) {
          featureTitle = lineHeatMapStruct.properties.description;
        }
      }
      var defaultStyle = {
        color: modelsHiddenParams[idInstance].colors[layerIndex - 1],
        weight: 4,
        opacity: 1,
      };

      var maxValue = _.max(_.map(lineHeatMap.data, featureTitle));
      var minValue = _.min(_.map(lineHeatMap.data, featureTitle));

      try {
        if (!_.isUndefined(lineHeatMap.config.max)) maxValue = lineHeatMap.config.max;
        if (!_.isUndefined(lineHeatMap.config.min)) minValue = lineHeatMap.config.min;
      } catch (e) {}

      var colorScaleInLegend = self.getColorScale(
        lineHeatMap.config.colorScale,
        lineHeatMap.config.reverseColorScale,
        0,
        100
      );

      self.createLegend(colorScaleInLegend, length, colorStops, minValue, maxValue, featureTitle);

      self.showLegend(featureTitle);

      self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1] = L.geoJSON(lineHeatMapStruct, {
        style: function (feature) {
          if (!_.isUndefined(feature.properties)) {
            if (!_.isUndefined(feature.properties.description)) {
              featureTitle = feature.properties.description; // from datanode
            }
            if (!_.isUndefined(feature.properties.style)) {
              return feature.properties.style; // from datanode
            } else {
              return defaultStyle;
            }
          } else {
            return defaultStyle;
          }
        },
        onEachFeature: function onEachFeature(feature, layer) {
          if (feature.geometry.type == 'Point' && feature.properties) {
            layer.bindPopup(syntaxHighlight(JSON.stringify(feature.properties)));
          }
        },
      }).addTo(self.map);

      self.ctrl.addBaseLayer(self.mapLayers.lineHeatMap.lineHeatMapLayers[layerIndex - 1], featureTitle);

      var disableAutoscale = false;
      try {
        disableAutoscale = lineHeatMap.config.disableAutoscale;
      } catch (e) {}

      if (!disableAutoscale) {
        try {
          // Calculate a bounding box in west, south, east, north order.
          var rawBounds = geojsonExtent(lineHeatMapStruct);
          var corner1 = L.latLng(rawBounds[1], rawBounds[0]);
          var corner2 = L.latLng(rawBounds[3], rawBounds[2]);
          var bounds = L.latLngBounds(corner1, corner2);

          modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds[layerIndex - 1] = bounds;

          // Display for the bounding box
          self.map.fitBounds(self.globalLayersLineHeatBounds());
        } catch (e) {
          console.log(e);
        }
      }
    };

    this.addImageOverlay = function (imgStruct, layerIndex) {
      //securities
      if (_.isUndefined(imgStruct)) return;
      if (_.isEmpty(imgStruct)) return;
      if (imgStruct == {}) return;

      const imageUrl = imgStruct.imageUrl;
      const imageBounds = imgStruct.imageBounds;
      const featureTitle = imgStruct.title;
      const addAs = imgStruct.addAs;

      //add options :
      const options = imgStruct.options;

      if (!_.isEmpty(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1]);
      }

      self.mapLayers.imageOverlay.imageLayers[layerIndex - 1] = L.imageOverlay(imageUrl, imageBounds, options).addTo(
        self.map
      );

      if (addAs == 'overlay')
        self.ctrl.addOverlay(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1], featureTitle);
      else self.ctrl.addBaseLayer(self.mapLayers.imageOverlay.imageLayers[layerIndex - 1], featureTitle);
    };

    this.globalLayersBounds = function () {
      var globalBounds = L.latLngBounds(self.map.getCenter());
      for (var i = 0; i < self.numberOfGeoJsonLayers; i++) {
        if (modelsHiddenParams[idInstance].geoJson.geoJsonBounds[i] != null) {
          globalBounds.extend(modelsHiddenParams[idInstance].geoJson.geoJsonBounds[i]);
        }
      }
      return globalBounds;
    };

    this.globalLayersLineHeatBounds = function () {
      var globalBounds = L.latLngBounds(self.map.getCenter());
      for (var i = 0; i < self.numberOfLineHeatMapLayers; i++) {
        if (modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds[i] != null) {
          globalBounds.extend(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapBounds[i]);
        }
      }
      return globalBounds;
    };

    this.createSvgOverlay = function (svgStruct, layerIndex) {
      var pointDrawingFct = self.createOneCircle;
      var type = svgStruct.config.marker;

      switch (type) {
        case 'arrow':
          pointDrawingFct = self.createOneArrow;
          break;
        case 'triangle':
          pointDrawingFct = self.createOneTriangle;
          break;
        case 'emptyTriangle':
          pointDrawingFct = self.createOneTriangle;
          break;
        case 'fullTriangle':
          pointDrawingFct = self.createOneTriangle;
          break;
        default:
          type = 'circle';
          pointDrawingFct = self.createOneCircle;
      }

      return self.createObjectsOverlay(svgStruct, layerIndex, type, pointDrawingFct);
    };

    this.appendSvgOverlay = function (svgStruct, layerIndex) {
      switch (svgStruct.config.marker) {
        case 'arrow':
          return self.appendArrowsOverlay(svgStruct, layerIndex);
      }
    };

    this.appendArrowsOverlay = function (svgStruct, i) {
      var point = svgStruct.data[0];
      var center = L.latLng([point.lat, point.lng]);
      var x = self.map.latLngToLayerPoint(center).x;
      var y = self.map.latLngToLayerPoint(center).y;
      var direction = 0;
      var strokeColor = 'black';
      if (!_.isUndefined(point.direction)) {
        direction = point.direction;
      }
      if (!_.isUndefined(point.rotation)) {
        direction = point.rotation;
      }
      if (!_.isUndefined(point.color)) {
        strokeColor = point.color;
      }
      var arrow = self.createOneArrow(
        x,
        y,
        direction,
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].reductionFactor,
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].lengthInPx,
        strokeColor
      );
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG.innerHTML =
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG.innerHTML + arrow;
    };

    this.createObjectsOverlay = function (svgStruct, i, type, fct) {
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1] = {};
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].currentZoom = self.map.getZoom();
      [
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].reductionFactor,
        modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].lengthInPx,
      ] = self.computeDimensions(svgStruct);
      var objs = '';
      var color = svgStruct.config.color || '#000';
      svgStruct.data.forEach(function (point) {
        var center = L.latLng([point.lat, point.lng]);
        var direction = 0;
        if (!_.isUndefined(point.direction)) {
          direction = point.direction;
        }
        if (!_.isUndefined(point.rotation)) {
          direction = point.rotation;
        }
        var x = self.map.latLngToContainerPoint(center).x;
        var y = self.map.latLngToContainerPoint(center).y;
        objs =
          objs +
          fct(
            x,
            y,
            direction,
            modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].reductionFactor,
            modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].lengthInPx,
            type,
            color
          );
      });
      var svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      var viewBoxDef = 0 + ' ' + 0 + ' ' + self.map.getSize().x + ' ' + self.map.getSize().y;
      svgElement.setAttribute('viewBox', viewBoxDef);
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG = svgElement;
      modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG.innerHTML = objs;
      return L.svgOverlay(modelsHiddenParams[idInstance].svgOverlay.svgElements[i - 1].SVG, self.map.getBounds());
    };

    this.computeDimensions = function (svgStruct) {
      const arrowLengthInMeters = svgStruct.config.length;

      const bounds = self.map.getBounds();
      const corner1 = bounds.getSouthWest();
      const corner2 = bounds.getNorthEast();

      const ySouthPixels = self.map.latLngToContainerPoint(corner1).y;
      const yNorthPixels = self.map.latLngToContainerPoint(corner2).y;

      const heightPixels = ySouthPixels - yNorthPixels;
      const corner3 = L.latLng(corner2.lat, corner1.lng);
      const northSouthDistance = self.map.distance(corner1, corner3);
      const reductionFactor = arrowLengthInMeters / northSouthDistance;
      const lengthInPx = heightPixels * reductionFactor;
      return [reductionFactor, lengthInPx];
    };

    this.autoscaleSvg = function (svgStruct) {
      var lats = [];
      var lngs = [];

      if (_.isEmpty(svgStruct.data)) return; // security

      svgStruct.data.forEach(function (point) {
        lats.push(point.lat);
        lngs.push(point.lng);
      });

      var corner1, corner2, bounds;

      if (lats.length > 1) {
        corner1 = L.latLng(_.max(lats), _.max(lngs));
        corner2 = L.latLng(_.min(lats), _.min(lngs));
        bounds = L.latLngBounds(corner1, corner2);
        self.map.fitBounds(bounds);
      } else {
        self.map.setView(L.latLng(lats[0], lngs[0]), self.map.getZoom());
      }
    };

    this.createOneArrow = function (xCenterPixels, yCenterPixels, direction, reductionFactor, lengthInPx, strokeColor) {
      var yEdegePixels = yCenterPixels - lengthInPx;

      // TODO improve stroke-width computation (now 50*reductionFactor)
      var lineStr =
        '<line x1="' +
        xCenterPixels +
        '" y1="' +
        yCenterPixels +
        '" x2="' +
        xCenterPixels +
        '" y2="' +
        yEdegePixels +
        '" stroke="#000" stroke-width="' +
        50 * reductionFactor +
        '" marker-end="url(#styledArrow)" ';
      lineStr = lineStr + 'transform="rotate(' + direction + ' ' + xCenterPixels + ' ' + yCenterPixels + ')"  />';
      return lineStr;
    };

    this.createOneCircle = function (xCenterPixels, yCenterPixels, direction, reductionFactor, lengthInPx) {
      var lineStr =
        '<circle cx="' + xCenterPixels + '" cy="' + yCenterPixels + '" stroke="#000" r="' + 50 * reductionFactor + '"';
      lineStr = lineStr + '/>';
      return lineStr;
    };

    this.rotationPoint = function rotate(cx, cy, x, y, direction) {
      var radians = (Math.PI / 180) * direction,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = cos * (x - cx) + sin * (y - cy) + cx,
        ny = cos * (y - cy) - sin * (x - cx) + cy;
      return [nx, ny];
    };

    this.getTrianglePoints = function (depart, lenght, direction) {
      var center_y = depart.y;
      var center_x = depart.x - 0;
      var firstPoint_y = depart.y;
      var firstPoint_x = depart.x - lenght;
      var secondPoint_y = depart.y - lenght / 2;
      var secondPoint_x = depart.x;
      var thirdPoint_y = depart.y + lenght / 2;
      var thirdPoint_x = depart.x;
      var firstPoint = self.rotationPoint(center_x, center_y, firstPoint_x, firstPoint_y, direction);
      var secondPoint = self.rotationPoint(center_x, center_y, secondPoint_x, secondPoint_y, direction);
      var thirdPoint = self.rotationPoint(center_x, center_y, thirdPoint_x, thirdPoint_y, direction);
      return (
        firstPoint[1] +
        ' ' +
        firstPoint[0] +
        ' ' +
        secondPoint[1] +
        ' ' +
        secondPoint[0] +
        ' ' +
        thirdPoint[1] +
        ' ' +
        thirdPoint[0]
      );
    };

    this.createOneTriangle = function (
      yCenterPixels,
      xCenterPixels,
      direction,
      reductionFactor,
      lengthInPx,
      type,
      color
    ) {
      // emptyTriangle et fullTriangle
      // var testPoint0=self.getTrianglePoints({x:50,y:30},30,0);  ==> should return (30 20 45 50 15 50)
      // var testPoint1=self.getTrianglePoints({x:50,y:30},30,90); ==> should return (45 35 15 50 15 20)

      var point = self.getTrianglePoints({ x: xCenterPixels, y: yCenterPixels }, lengthInPx, direction);
      var trigl =
        '<polygon points="' +
        point +
        '"  style="fill:' +
        color +
        ';stroke:' +
        color +
        ';stroke-width:' +
        50 * reductionFactor +
        '"   />';
      if (type == 'emptyTriangle') {
        trigl =
          '<polygon points="' +
          point +
          '"  fill="none" style="stroke:' +
          color +
          ';stroke-width:' +
          50 * reductionFactor +
          '"   />';
      }
      return trigl;
    };

    this.addSvgOverlay = function (svgStruct, layerIndex, bAppend) {
      //securities
      if (_.isUndefined(svgStruct)) return;
      if (_.isEmpty(svgStruct)) return;
      if (svgStruct == {}) return;
      if (_.isUndefined(svgStruct.data)) return;

      // TODO add securities here
      var featureTitle = svgStruct.config.title;
      var addAs = svgStruct.config.addAs;

      var disableAutoscale = svgStruct.config.disableAutoscale;

      if (!_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgElements[layerIndex - 1])) {
        if (!_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgElements[layerIndex - 1].currentZoom)) {
          var currentZoom = self.map.getZoom();
          if (modelsHiddenParams[idInstance].svgOverlay.svgElements[layerIndex - 1].currentZoom != currentZoom)
            bAppend = false;
        }
      }

      if (bAppend) {
        self.appendSvgOverlay(svgStruct, layerIndex);
      } else {
        if (!disableAutoscale) {
          self.autoscaleSvg(svgStruct);
        }
        if (!_.isEmpty(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1])) {
          self.ctrl.removeLayer(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1]);
          self.map.removeLayer(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1]);
        }

        self.mapLayers.svgOverlay.svgLayers[layerIndex - 1] = L.layerGroup()
          .addLayer(self.createSvgOverlay(svgStruct, layerIndex))
          .addTo(self.map);

        if (addAs == 'overlay') self.ctrl.addOverlay(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1], featureTitle);
        else self.ctrl.addBaseLayer(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1], featureTitle);
      }
    };

    this.psetSvg = function (svgPoint, layerIndex) {
      // securities
      if (_.isUndefined(svgPoint)) return;
      if (_.isEmpty(svgPoint)) return;
      if (_.isEmpty(svgPoint.data)) return;

      var pointObj = svgPoint.data;

      var toSvg;
      if (_.isUndefined(svgPoint.config)) {
        toSvg = { data: [pointObj] };
      } else {
        toSvg = { data: [pointObj], config: svgPoint.config };
      }

      if (_.isEmpty(self.mapLayers.svgOverlay.svgLayers[layerIndex - 1])) {
        self.addSvgOverlay(toSvg, layerIndex, false);
      } else {
        self.addSvgOverlay(toSvg, layerIndex, true);
      }
    };

    this.createLabelIcon = function (labelClass, labelText) {
      return L.divIcon({
        className: labelClass,
        html: labelText,
      });
    };

    this.drawHeatMap2 = function (heatMapObject, layerIndex) {
      if (!_.isEmpty(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1]);
        self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].remove();
        delete self.mapLayers.heatMap.heatMapLayers[layerIndex - 1];
      }

      // securities
      if (_.isUndefined(heatMapObject)) return;
      if (_.isEmpty(heatMapObject)) return;
      if (_.isUndefined(heatMapObject.data)) return;

      heatMapData = heatMapObject.data;
      if (_.isEmpty(heatMapData) || heatMapData.length == 0) {
        var circlesLayerGroup = L.layerGroup([]);
        self.mapLayers.heatMap.heatMapLayers[layerIndex - 1] = circlesLayerGroup.addTo(self.map);
        self.ctrl.addBaseLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1], 'none');
        if (!_.isUndefined($("input[name='leaflet-base-layers']")[self.numberOfHeatMapLayers - 1]))
          $("input[name='leaflet-base-layers']")[self.numberOfHeatMapLayers - 1].click();
        return;
      }

      let circleFillOpacity = 0.8;
      let circleRadius = 5;
      let maxValue;
      let minValue;
      let disableAutoscale = false;
      let addTextLabel = false;
      let colorScale;

      try {
        heatMapConfig = heatMapObject.config;
        circleFillOpacity = heatMapConfig.opacity || circleFillOpacity;
        circleRadius = heatMapConfig.radius || circleRadius;
        maxValue = heatMapConfig.max;
        minValue = heatMapConfig.min;
        disableAutoscale = heatMapConfig.disableAutoscale;
        addTextLabel = heatMapConfig.addTextLabel;

        colorScale = self.getColorScale(heatMapConfig.colorScale, heatMapConfig.reverseColorScale, 0, 100);
      } catch (exc) {}

      const formattedHeatMap = [];
      let computedMax = -Number.MAX_VALUE; // MBG & KBS on car le 27/09/2019
      let computedMin = Number.MAX_VALUE;
      const lats = [];
      const lngs = [];
      const normVals = [];
      const featureTitle = _.keys(heatMapData[0])[2];
      for (var k = 0; k < heatMapData.length; k++) {
        formattedHeatMap[k] = _.values(heatMapData[k]);
        lats[k] = formattedHeatMap[k][0];
        lngs[k] = formattedHeatMap[k][1];

        if (formattedHeatMap[k][2] !== null) {
          if (formattedHeatMap[k][2] > computedMax) {
            computedMax = formattedHeatMap[k][2]; // computedMax
          }
          if (formattedHeatMap[k][2] < computedMin) {
            computedMin = formattedHeatMap[k][2]; // computedMin
          }
        }
      }

      if (_.isUndefined(maxValue)) {
        if (heatMapData.length == 1) {
          maxValue = 1.0; // for single point
        } else {
          maxValue = computedMax;
        }
      }
      if (_.isUndefined(minValue)) {
        if (heatMapData.length == 1) {
          minValue = 0.0; // for single point
        } else {
          minValue = computedMin;
        }
      }

      // TODO add security for min > max

      for (k = 0; k < heatMapData.length; k++) {
        if (formattedHeatMap[k][2] !== null) {
          if (formattedHeatMap[k][2] > maxValue) {
            normVals[k] = 100;
          } else {
            if (formattedHeatMap[k][2] < minValue) {
              normVals[k] = 0;
            } else {
              normVals[k] = (100 * (formattedHeatMap[k][2] - minValue)) / (maxValue - minValue); // MBG & KBS le 27/09/2019
            }
          }
        }
      }

      var circles = [];
      var currentColor = '#000000';
      for (k = 0; k < formattedHeatMap.length; k++) {
        if (normVals[k] !== null) {
          currentColor = colorScale(normVals[k]);
        } else {
          currentColor = '#000000';
        }
        circles.push(
          L.circle([lats[k], lngs[k]], {
            stroke: false,
            color: currentColor,
            fillColor: currentColor,
            fillOpacity: circleFillOpacity,
            radius: circleRadius,
            stroke: false, // optim from Benoît Lehman
          })
        );

        if (addTextLabel) {
          circles.push(
            L.marker(new L.LatLng(lats[k], lngs[k]), {
              icon: self.createLabelIcon('boldWhiteHeatMapLabel', nFormatter(formattedHeatMap[k][2])),
            })
          );
        }
      }

      // save config for real-time pset
      self.configStore[layerIndex - 1] = {
        color: colorScale,
        fillOpacity: circleFillOpacity,
        radius: circleRadius,
        minValue: minValue,
        maxValue: maxValue,
      };

      var circlesLayerGroup = L.layerGroup(circles);

      self.mapLayers.heatMap.heatMapLayers[layerIndex - 1] = circlesLayerGroup.addTo(self.map);

      self.ctrl.addBaseLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1], featureTitle);

      if (!disableAutoscale) {
        var corner1 = L.latLng(_.max(lats), _.max(lngs));
        var corner2 = L.latLng(_.min(lats), _.min(lngs));
        var bounds = L.latLngBounds(corner1, corner2);
        // Display for the bounding box
        self.map.fitBounds(bounds);
      }

      self.map.invalidateSize();

      self.createLegend(colorScale, length, colorStops, minValue, maxValue, featureTitle);

      self.showLegend(featureTitle);

      if (!_.isUndefined($("input[name*='leaflet-base-layers']")[self.numberOfHeatMapLayers - 1]))
        $("input[name*='leaflet-base-layers']")[self.numberOfHeatMapLayers - 1].click();
    };

    this.createLegend = function (color, length, colorStops, min, max, featureTitle) {
      var min = Number(min);
      var max = Number(max);
      if (!_.isUndefined(modelsHiddenParams[idInstance].legends[featureTitle])) {
        self.map.removeControl(modelsHiddenParams[idInstance].legends[featureTitle]); // MBG 18/09/2018
      }
      modelsHiddenParams[idInstance].legends[featureTitle] = L.control({ position: 'topleft' });
      modelsHiddenParams[idInstance].legends[featureTitle].onAdd = function (map) {
        var div = L.DomUtil.create('div', 'scaleLegend');
        var rects = '';
        for (var i = 0; i < length; i++) {
          rects = rects + '<rect height="10" x="' + i * 4 + '" width="4" style="fill: ' + color(i) + ';"></rect>';
        }
        var svg = '<svg id="legend" width="450" height="50"><g class="key" transform="translate(25,16)">' + rects;
        var bTicksFormat = true;
        var valTick = min;
        var strTick;
        if (!bTicksFormat) strTick = min.toString();
        else strTick = nFormatter(min, 2);
        var valTranslate = 0;
        for (var i = 0; i < colorStops.length; i++) {
          valTranslate = colorStops[i] * 4;
          svg =
            svg +
            '<g class="tick" transform="translate(' +
            valTranslate +
            ',0)" style="opacity: 1;"><line y2="-1" x2="0"></line><text dy="0em" y="-4" x="0" style="text-anchor: middle;">' +
            strTick +
            '</text></g>';
          valTick = valTick + (max - min) / 4;
          if (!bTicksFormat) {
            strTick = Number.parseFloat(valTick).toPrecision(2);
          } else {
            strTick = nFormatter(valTick, 2);
          }
        }
        svg = svg + '<path class="domain" d="M0,-1V0H400V-1"></path>';
        svg = svg + '<text class="" y="21">' + featureTitle + '</text>';
        svg = svg + '</g></svg>';
        div.innerHTML = svg;

        return div;
      };
    };

    this.drawHeatMap1 = function (heatMapObject, layerIndex) {
      if (!_.isEmpty(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1])) {
        self.ctrl.removeLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1]);
        self.map.removeLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1]);
        self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].remove();
        delete self.mapLayers.heatMap.heatMapLayers[layerIndex - 1];
      }

      // securities
      if (_.isUndefined(heatMapObject)) return;
      if (_.isEmpty(heatMapObject)) return;
      if (_.isUndefined(heatMapObject.data)) return;

      heatMapData = heatMapObject.data;
      if (_.isUndefined(heatMapData.length)) return;

      var formattedHeatMap = [];
      var maxValue = Number.MIN_VALUE;
      var lats = [];
      var lngs = [];
      var featureTitle = _.keys(heatMapData[0])[2];
      for (var k = 0; k < heatMapData.length; k++) {
        formattedHeatMap[k] = _.values(heatMapData[k]);
        lats[k] = formattedHeatMap[k][0];
        lngs[k] = formattedHeatMap[k][1];
        if (formattedHeatMap[k][2] > maxValue) {
          maxValue = formattedHeatMap[k][2]; // computedMax
        }
      }

      if (heatMapData.length == 1) maxValue = 1.0; // MBG tmp for single point. To improve
      maxValue = 1.0; // MBG assuming user rescaling

      // default values
      var formattedGradient = null;
      var layerMinOpacity;
      var layerMaxZomm;
      var layerRadius;
      var layerBlur;
      var disableAutoscale = false;
      var colorScale;

      // no problem if no config

      try {
        heatMapConfig = heatMapObject.config;

        layerMinOpacity = heatMapConfig.minOpacity;
        layerMaxZomm = heatMapConfig.maxZoom;
        layerRadius = heatMapConfig.radius;
        layerBlur = heatMapConfig.blur;
        disableAutoscale = heatMapConfig.disableAutoscale;

        formattedGradient = new Object();
        colorScale = self.getColorScale(heatMapConfig.colorScale, heatMapConfig.reverseColorScale, 0, 1);
        d3.range(11).forEach((d) => (formattedGradient[d * 0.1] = colorScale(d * 0.1)));
      } catch (e) {
        formattedGradient = null;
      }

      self.mapLayers.heatMap.heatMapLayers[layerIndex - 1] = L.meanLayer(formattedHeatMap, {
        minOpacity: layerMinOpacity,
        maxZoom: layerMaxZomm,
        max: maxValue,
        radius: layerRadius,
        blur: layerBlur,
        gradient: formattedGradient,
      }).addTo(self.map);

      self.ctrl.addBaseLayer(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1], featureTitle);
      if (!disableAutoscale) {
        var corner1 = L.latLng(_.max(lats), _.max(lngs));
        var corner2 = L.latLng(_.min(lats), _.min(lngs));
        var bounds = L.latLngBounds(corner1, corner2);
        // Display for the bounding box
        self.map.fitBounds(bounds);
      }
      self.map.invalidateSize();
    };

    // Heatmap choice
    if (_.isUndefined(modelsParameters[idInstance].heatMap.densityHeatMap)) {
      this.drawHeatMap = self.drawHeatMap1;
    } else {
      if (modelsParameters[idInstance].heatMap.densityHeatMap) {
        this.drawHeatMap = self.drawHeatMap1;
      } else {
        this.drawHeatMap = self.drawHeatMap2;
      }
    }

    this.clearHeatMapLayer = function (layerIndex) {
      self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].clearLayers();
    };

    this.psetHeatMap = function (heatMapPoint, layerIndex) {
      // securities
      if (_.isUndefined(heatMapPoint)) return;
      if (_.isEmpty(heatMapPoint)) return;
      if (_.isEmpty(heatMapPoint.data)) return;

      var pointObj = heatMapPoint.data;

      var toHeatMap;
      if (_.isUndefined(heatMapPoint.config)) {
        toHeatMap = { data: [pointObj] };
      } else {
        toHeatMap = { data: [pointObj], config: heatMapPoint.config };
      }

      var hmp = _.values(heatMapPoint.data);
      if (_.isEmpty(self.mapLayers.heatMap.heatMapLayers[layerIndex - 1])) {
        self.drawHeatMap(toHeatMap, layerIndex);
      } else {
        if (_.isUndefined(modelsParameters[idInstance].heatMap.densityHeatMap)) {
          self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].addLatLng(hmp);
        } else {
          if (modelsHiddenParams[idInstance].heatMap.densityHeatMap) {
            self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].addLatLng(hmp);
          } else {
            const toHeatMapConfig = toHeatMap.config || {};
            const configNew = {
              circleFillOpacity: toHeatMapConfig.opacity,
              circleRadius: toHeatMapConfig.radius,
              maxValue: toHeatMapConfig.max,
              minValue: toHeatMapConfig.min,
            };

            const storedConfig = self.configStore[layerIndex - 1];
            const configOld = {
              circleFillOpacity: storedConfig.fillOpacity,
              circleRadius: storedConfig.radius,
              maxValue: storedConfig.maxValue,
              minValue: storedConfig.minValue,
            };
            const sameConfig =
              (configNew.circleFillOpacity === undefined ||
                configNew.circleFillOpacity === configOld.circleFillOpacity) &&
              (configNew.circleRadius === undefined || configNew.circleRadius === configOld.circleRadius) &&
              (configNew.maxValue === undefined || configNew.maxValue === configOld.maxValue) &&
              (configNew.minValue === undefined || configNew.minValue === configOld.minValue);
            if (sameConfig) {
              let normVal =
                (100 * (hmp[2] - self.configStore[layerIndex - 1].minValue)) /
                (self.configStore[layerIndex - 1].maxValue - self.configStore[layerIndex - 1].minValue);
              // MBG add saturation 25/09/2019
              if (normVal < 0) normVal = 0;
              if (normVal > 100) normVal = 100;

              modelsHiddenParams[idInstance].heatMap.heatMapBuffer[layerIndex - 1].push(pointObj);

              const circle = L.circle([pointObj.lat, pointObj.lng], {
                color: self.configStore[layerIndex - 1].color(normVal),
                fillColor: self.configStore[layerIndex - 1].color(normVal),
                fillOpacity: self.configStore[layerIndex - 1].fillOpacity,
                radius: self.configStore[layerIndex - 1].radius,
                stroke: false, // optim from Benoît Lehman
              });
              self.mapLayers.heatMap.heatMapLayers[layerIndex - 1].addLayer(circle);
            } else {
              self.configStore[layerIndex - 1].minValue = toHeatMap.config.min;
              self.configStore[layerIndex - 1].maxValue = toHeatMap.config.max;
              self.configStore[layerIndex - 1].radius = toHeatMap.config.radius;
              self.configStore[layerIndex - 1].fillOpacity = toHeatMap.config.opacity;
              self.clearHeatMapLayer(layerIndex);

              modelsHiddenParams[idInstance].heatMap.heatMapBuffer[layerIndex - 1].push(pointObj); // MBG 10/09/2020

              const heatMapToRedraw = {
                data: modelsHiddenParams[idInstance].heatMap.heatMapBuffer[layerIndex - 1],
                config: heatMapPoint.config,
              };
              self.drawHeatMap(heatMapToRedraw, layerIndex);
            }
          }
        }
        if (!_.isUndefined(heatMapPoint.config)) {
          if (!_.isUndefined(heatMapPoint.config.disableAutoscale)) {
            if (heatMapPoint.config.disableAutoscale) {
              // do nothing
            } else {
              self.map.setView(pointObj); // Virgile: tu peux décommenter cette ligne pour tester le centrage auto
            }
          } else {
            self.map.setView(pointObj); // Virgile: tu peux décommenter cette ligne pour tester le centrage auto
          }
        } else {
          self.map.setView(pointObj); // Virgile: tu peux décommenter cette ligne pour tester le centrage auto
        }
      }
    };

    if (modelsParameters[idInstance].geoJson.numberOfLayers > 0) {
      for (let i = 1; i <= self.numberOfGeoJsonLayers; i++) {
        if (_.isUndefined(modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i - 1])) {
          modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i - 1] = {};
        }
        if (_.isUndefined(self.mapLayers.geoJson.geoJsonLayers[i - 1])) {
          self.mapLayers.geoJson.geoJsonLayers[i - 1] = {};
        }
        const layerName = 'geoJson' + i;
        this[layerName] = {
          layerIndex: i,
          updateCallback: function () {},
          setValue: function (val) {
            //if (modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i - 1] == val) return; // MBG Optimization
            modelsHiddenParams[idInstance].geoJson.geoJsonLayers[this.layerIndex - 1] = val;
            self.addGeoJson(val, this.layerIndex);
          },
          getValue: function () {
            return modelsHiddenParams[idInstance].geoJson.geoJsonLayers[i - 1];
          },
          addValueChangedHandler: function (updateDataFromWidget) {
            this.updateCallback = updateDataFromWidget;
          },
          removeValueChangedHandler: function (updateDataFromWidget) {},
        };
      }
    }

    if (modelsParameters[idInstance].choropleth) {
      if (modelsParameters[idInstance].choropleth.numberOfLayers > 0) {
        for (let i = 1; i <= self.numberOfChoroplethLayers; i++) {
          if (_.isUndefined(modelsHiddenParams[idInstance].choropleth.choroplethLayers[i - 1])) {
            modelsHiddenParams[idInstance].choropleth.choroplethLayers[i - 1] = {};
          }
          if (_.isUndefined(self.mapLayers.choropleth.choroplethLayers[i - 1])) {
            self.mapLayers.choropleth.choroplethLayers[i - 1] = {};
          }
          const layerName = 'choropleth' + i;
          this[layerName] = {
            layerIndex: i,

            updateCallback: function () {},
            setValue: function (val) {
              //if (modelsHiddenParams[idInstance].choropleth.choroplethLayers[i - 1] == val) return; // MBG Optimization
              modelsHiddenParams[idInstance].choropleth.choroplethLayers[this.layerIndex - 1] = val;
              self.addChoropleth(val, this.layerIndex);
            },
            getValue: function () {
              return modelsHiddenParams[idInstance].choropleth.choroplethLayers[i - 1];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        }
      }
    }

    if (modelsParameters[idInstance].lineHeatMap) {
      if (modelsParameters[idInstance].lineHeatMap.numberOfLayers > 0) {
        for (let i = 1; i <= self.numberOfLineHeatMapLayers; i++) {
          if (_.isUndefined(modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i - 1])) {
            modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i - 1] = {};
          }
          if (_.isUndefined(self.mapLayers.lineHeatMap.lineHeatMapLayers[i - 1])) {
            self.mapLayers.lineHeatMap.lineHeatMapLayers[i - 1] = {};
          }
          const layerName = 'lineHeatMap' + i;
          this[layerName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              //if (modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i - 1] == val) return; // MBG Optimization
              modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[this.layerIndex - 1] = val;
              self.addLineHeatMap(val, this.layerIndex);
            },
            getValue: function () {
              return modelsHiddenParams[idInstance].lineHeatMap.lineHeatMapLayers[i - 1];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        }
      }
    }

    if (modelsParameters[idInstance].heatMap.numberOfLayers > 0) {
      for (let i = 1; i <= self.numberOfHeatMapLayers; i++) {
        const layerName = 'heatMapData' + i;
        const pointName = 'heatMapPoint' + i;
        if (_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapData[i - 1])) {
          modelsHiddenParams[idInstance].heatMap.heatMapData[i - 1] = {};
        }
        if (_.isUndefined(modelsHiddenParams[idInstance].heatMap.heatMapBuffer[i - 1])) {
          modelsHiddenParams[idInstance].heatMap.heatMapBuffer[i - 1] = [];
        }
        if (_.isUndefined(self.mapLayers.heatMap.heatMapLayers[i - 1])) {
          self.mapLayers.heatMap.heatMapLayers[i - 1] = {};
        }
        if (modelsParameters[idInstance].heatMap.sampledDisplay) {
          this[pointName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              if (self.bIsInteractive) {
                self.psetHeatMap(val, this.layerIndex);
              }
            },
            getValue: function () {},
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        } else {
          this[layerName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              if (val == modelsHiddenParams[idInstance].heatMap.heatMapData[this.layerIndex - 1]) return; // MBG optimization
              modelsHiddenParams[idInstance].heatMap.heatMapData[this.layerIndex - 1] = val;
              self.drawHeatMap(val, this.layerIndex);
            },
            getValue: function () {
              return modelsHiddenParams[idInstance].heatMap.heatMapData[this.layerIndex - 1];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        }
      }
    }

    if (self.numberOfImageLayers > 0) {
      for (let i = 1; i <= self.numberOfImageLayers; i++) {
        const layerName = 'imageOverlay' + i;
        if (_.isUndefined(modelsHiddenParams[idInstance].imageOverlay.imageData[i - 1])) {
          modelsHiddenParams[idInstance].imageOverlay.imageData[i - 1] = {};
        }
        if (_.isUndefined(self.mapLayers.imageOverlay.imageLayers[i - 1])) {
          self.mapLayers.imageOverlay.imageLayers[i - 1] = {};
        }

        this[layerName] = {
          layerIndex: i,

          updateCallback: function () {},
          setValue: function (val) {
            if (val == modelsHiddenParams[idInstance].imageOverlay.imageData[this.layerIndex - 1]) return; // MBG optimization
            modelsHiddenParams[idInstance].imageOverlay.imageData[this.layerIndex - 1] = val;
            self.addImageOverlay(val, this.layerIndex);
          },
          getValue: function () {
            return modelsHiddenParams[idInstance].imageOverlay.imageData[this.layerIndex - 1];
          },
          addValueChangedHandler: function (updateDataFromWidget) {
            this.updateCallback = updateDataFromWidget;
          },
          removeValueChangedHandler: function (updateDataFromWidget) {},
        };
      }
    }

    if (self.numberOfSvgLayers > 0) {
      for (let i = 1; i <= self.numberOfSvgLayers; i++) {
        const layerName = 'svgOverlay' + i;
        const pointName = 'svgPoint' + i;
        if (_.isUndefined(modelsHiddenParams[idInstance].svgOverlay.svgData[i - 1])) {
          modelsHiddenParams[idInstance].svgOverlay.svgData[i - 1] = {};
        }
        if (_.isUndefined(self.mapLayers.svgOverlay.svgLayers[i - 1])) {
          self.mapLayers.svgOverlay.svgLayers[i - 1] = {};
        }
        if (modelsParameters[idInstance].svgOverlay.sampledDisplay) {
          this[pointName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              if (self.bIsInteractive) {
                self.psetSvg(val, this.layerIndex);
              }
            },
            getValue: function () {},
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        } else {
          this[layerName] = {
            layerIndex: i,
            updateCallback: function () {},
            setValue: function (val) {
              // if (val == modelsHiddenParams[idInstance].svgOverlay.svgData[this.layerIndex - 1]) return; // MBG optimization not needed (?)
              // val and modelsHiddenParams[idInstance].svgOverlay.svgData[this.layerIndex - 1] seem to have the same pointer
              modelsHiddenParams[idInstance].svgOverlay.svgData[this.layerIndex - 1] = val;
              self.addSvgOverlay(val, this.layerIndex, false);
            },
            getValue: function () {
              return modelsHiddenParams[idInstance].svgOverlay.svgData[this.layerIndex - 1];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
              this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
          };
        }
      }
    }

    const _SELECTED_POINT_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedPoint',
      'Selected coordinates',
      WidgetActuatorDescription.WRITE,
      _SCHEMA_SELECTED_POINT
    );
    const _SELECTED_GEOJSON_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedGeoJson',
      'Drawn GeoJSON figure',
      WidgetActuatorDescription.WRITE,
      _SCHEMA_SELECTED_GEOJSON
    );
    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      const result = [];

      if (data) {
        if (data.captureClickEvent) {
          result.push(_SELECTED_POINT_DESCRIPTOR);
        }
        if (data.drawingFeatures) {
          result.push(_SELECTED_GEOJSON_DESCRIPTOR);
        }

        if (data.geoJson && data.geoJson.numberOfLayers) {
          for (let i = 1; i <= data.geoJson.numberOfLayers; i++) {
            result.push(
              new WidgetActuatorDescription(
                'geoJson' + i,
                'GeoJSON features',
                WidgetActuatorDescription.READ,
                _SCHEMA_GEOJSON
              )
            );
          }
        }

        if (data.lineHeatMap && data.lineHeatMap.numberOfLayers) {
          for (let i = 1; i <= data.lineHeatMap.numberOfLayers; i++) {
            result.push(
              new WidgetActuatorDescription(
                'lineHeatMap' + i,
                'Lines colored by values',
                WidgetActuatorDescription.READ,
                _SCHEMA_LINE_HEATMAP
              )
            );
          }
        }

        if (data.choropleth && data.choropleth.numberOfLayers) {
          for (let i = 1; i <= data.choropleth.numberOfLayers; i++) {
            result.push(
              new WidgetActuatorDescription(
                'choropleth' + i,
                'Choropleth data',
                WidgetActuatorDescription.READ,
                _SCHEMA_CHOROPLETH
              )
            );
          }
        }

        if (data.heatMap && data.heatMap.numberOfLayers) {
          for (let i = 1; i <= data.heatMap.numberOfLayers; i++) {
            if (data.heatMap.sampledDisplay) {
              const name = 'heatMapPoint' + i;
              if (data && !data.densityHeatMap) {
                result.push(
                  new WidgetActuatorDescription(
                    name,
                    'Cumulative heatmap',
                    WidgetActuatorDescription.READ,
                    _SCHEMA_HEATMAP_SAMPLED
                  )
                );
              } else {
                result.push(
                  new WidgetActuatorDescription(
                    name,
                    'Cumulative density heatmap',
                    WidgetActuatorDescription.READ,
                    _SCHEMA_HEATMAP_DENSITY_SAMPLED
                  )
                );
              }
            } else {
              const name = 'heatMapData' + i;
              if (data && !data.densityHeatMap) {
                result.push(
                  new WidgetActuatorDescription(name, 'Heatmap', WidgetActuatorDescription.READ, _SCHEMA_HEATMAP)
                );
              } else {
                result.push(
                  new WidgetActuatorDescription(
                    name,
                    'Density heatmap',
                    WidgetActuatorDescription.READ,
                    _SCHEMA_HEATMAP_DENSITY
                  )
                );
              }
            }
          }
        }

        if (data.imageOverlay && data.imageOverlay.numberOfLayers) {
          for (let i = 1; i <= data.imageOverlay.numberOfLayers; i++) {
            result.push(
              new WidgetActuatorDescription(
                'imageOverlay' + i,
                'Image to place on the map',
                WidgetActuatorDescription.READ,
                _SCHEMA_IMAGE_OVERLAY
              )
            );
          }
        }

        if (data.svgOverlay && data.svgOverlay.numberOfLayers) {
          for (let i = 1; i <= data.svgOverlay.numberOfLayers; i++) {
            if (data.svgOverlay.sampledDisplay) {
              result.push(
                new WidgetActuatorDescription(
                  'svgPoint' + i,
                  'Place a symbol on the map',
                  WidgetActuatorDescription.READ,
                  _SCHEMA_SVG_POINT_OVERLAY
                )
              );
            } else {
              result.push(
                new WidgetActuatorDescription(
                  'svgOverlay' + i,
                  'Place symbols on the map',
                  WidgetActuatorDescription.READ,
                  _SCHEMA_SVG_OVERLAY
                )
              );
            }
          }
        }
      }

      return result;
    };

    // TODO : handle only GeoJson?
    self.render();
  };

  // Inherit from baseWidget class
  this.openStreetMapsWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'Maps',
    widgetsDefinitionList: {
      openStreetMaps: {
        factory: 'openStreetMapsWidget',
        title: 'Leaflet JSON maps',
        icn: 'map',
        help: 'wdg/wdg-geo-time/#leaflet-maps',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
mapWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var mapWidgetsPlugin = new mapWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(mapWidgetsPlugin);
