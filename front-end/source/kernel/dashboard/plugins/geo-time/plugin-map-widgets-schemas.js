import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

export const _SCHEMA_SELECTED_POINT = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_imageOverlay',
  type: 'object',
  properties: {
    lat: { type: 'number' },
    lag: { type: 'number' },
  },
  required: ['lat', 'lag'],
};

export const _SCHEMA_IMAGE_OVERLAY = {
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

export const _SCHEMA_SVG_POINT_OVERLAY = {
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

export const _SCHEMA_SVG_OVERLAY = {
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

export const __SCHEMA_VALUED_COORD = {
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

export const __SCHEMA_COORD = {
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

export const __SCHEMA_HEATMAP_DENSITY_CONFIG = {
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

export const __SCHEMA_HEATMAP_CONFIG = {
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

export const _SCHEMA_HEATMAP_DENSITY = [
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

export const _SCHEMA_HEATMAP_DENSITY_SAMPLED = [
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

export const _SCHEMA_HEATMAP = [
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

export const _SCHEMA_HEATMAP_SAMPLED = [
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

export const __SCHEMA_GEOJSON_COORD = {
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

export const __SCHEMA_GEOJSON_COORDINATES = {
  $schema: WidgetPrototypesManager.SCHEMA_VERSION,
  $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:leaflet_geojson_coordinates',
  type: 'array',
  items: { $ref: __SCHEMA_GEOJSON_COORD.$id },
};

export const _SCHEMA_LINE_HEATMAP = [
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

export const __SCHEMA_GEOJSON_GEOMETRY_PRIMITIVE = {
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

export const __SCHEMA_GEOJSON_GEOMETRY_ALL = {
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

export const _SCHEMA_CHOROPLETH = [
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

export const _SCHEMA_GEOJSON = [
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

export const _SCHEMA_SELECTED_GEOJSON = [
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
