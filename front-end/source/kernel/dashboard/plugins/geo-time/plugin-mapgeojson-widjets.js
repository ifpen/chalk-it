// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Benoit LEHMAN & Mongi BEN GAID                        │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// Important Style Behavior : Style will be available as out from the map first only in View mode 
// The contact between the widget and out properties is only done at first enable

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Layout (default dimensions)
modelsLayout.mapGeoJson = { 'height': '5vh', 'width': '19vw', 'minWidth': '100px', 'minHeight': '100px' };

modelsHiddenParams.mapGeoJson = { "GeoJSON" : undefined, "GeoJSONStyle" : undefined }

function mapGeoJsonWidgetsPluginClass() {

    this.mapGeoJsonWidgets = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);


        var self = this;

        this.enable = function () {};

        this.disable = function () {};

        this.updateValue = function (e) {

            // Create new TempleStyle if old has not the same size
            // TODO : Check all style compatible with all element of model

            if((!Array.isArray( modelsHiddenParams[idInstance].GeoJSONStyle) && !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) 
            || (modelsHiddenParams[idInstance].GeoJSON.length !== modelsHiddenParams[idInstance].GeoJSONStyle.length) ) {

                modelsHiddenParams[idInstance].GeoJSONStyle = []

                if(!_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) {
                    
                        modelsHiddenParams[idInstance].GeoJSON.forEach((item, index) => {
                            modelsHiddenParams[idInstance].GeoJSONStyle.push(
                                this.createTemplateStyle(item, index));
                        });
                }
            }

            self.GeoJSONStyle.updateCallback(self.GeoJSONStyle, self.GeoJSONStyle.getValue());
        }


        this.rescale = function () {
        };


        this.getColorScale = function (colorScaleName, min, max) {

            return colorScaleManager.getColorScale(colorScaleName, min, max);
        }

        this.render = function () {
            
            var widgetHtml = document.createElement('div');
            widgetHtml.setAttribute('id', 'mapGeoJson' + idWidget);
            widgetHtml.setAttribute('style', 'width: inherit; height: inherit');
            document.addEventListener('play-tab-loaded', self.goToFirstRadioButton);
            $("#" + idDivContainer).html(widgetHtml);

            // Drawing the map
            // TODO : Report all map possibilites from map
            self.map = L.map('mapGeoJson' + idWidget, { preferCanvas: true }).setView([48.866667, 2.333333], 7);
            
            L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
                "attribution": '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
                "minZoom": 2,
                "maxZoom": 19,
                "apikey": 'choisirgeoportail',
                "format": 'image/jpeg',
                "style": 'normal'
            }).addTo(self.map);

           self.ctrl = L.control.layers({}, {}, {
                position: 'topright',
                collapsed: true,
                autoZIndex: true
            }).addTo(self.map);
             
            // internal layer group L.layerGroup
            self.layers = [];

            if(!_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) {            
                    modelsHiddenParams[idInstance].GeoJSON.forEach(item => {
                        self.addGeoJSONlayer(item);
                    });
            }
        }



        // Create a Layer from a GeoJSON
        // Simple function dont take into account the style
        this.addGeoJSONlayer = function(geoJSON) {

            var layer = L.geoJSON(geoJSON).addTo(self.map);
            self.layers.push(layer)

            let name = "layer" + " " + self.layers.length;
            if(!_.isUndefined(geoJSON.name)) {
                name = geoJSON.name
            }
            self.ctrl.addOverlay(layer, name);     
        }


        // Find properties with number compatible
        // Used to be displayed in order that the user can see what he can show in ColorScale
        this.findPropertiesWithNumber = function(geoJSON) {
            const propertiesWithRange = {};
          
            geoJSON.features.forEach(feature => {
              
              for (const property in feature.properties) {
                if (typeof feature.properties[property] === 'number' && !isNaN(feature.properties[property]) && isFinite(feature.properties[property])) {
                  const value = feature.properties[property];
          
                  if (!propertiesWithRange[property]) {
                    propertiesWithRange[property] = [value, value];
                  } else {
                    propertiesWithRange[property][0] = Math.min(propertiesWithRange[property][0], value);
                    propertiesWithRange[property][1] = Math.max(propertiesWithRange[property][1], value);
                  }
                }
              }
            });
          
            return propertiesWithRange;
        }


        // Find All Properties
        // TODO : Try to concatenate code with findPropertiesWithNumber in order to have 1 method
        this.findAllProperties = function(geoJSON) {

            var propertiesReturn = [];

            geoJSON.features.forEach(function (feature) {
                var properties = feature.properties;
                for (var prop_key in properties) {
                    if (!propertiesReturn.includes(prop_key)) {   
                            propertiesReturn.push(prop_key);
                }
              }
            })

            return propertiesReturn;
        }


        // Type possible  - Type GeoJSON to type Chalk It
        this.equivalenceTypes = {
            Point: "MultiPoint",
            MultiPoint: "MultiPoint",
            Polygon: "MultiPolygon",
            MultiPolygon: "MultiPolygon",
            LineString: "MultiLineString",
            MultiLineString: "MultiLineString"
          };

        // Find the feature type of GeoJSON
        this.findFeatureType =  function(geoJSON) {
              
                if (geoJSON.type === "FeatureCollection") {
                  
                  const firstFeatureType = geoJSON.features[0].geometry.type;
                  const firstFeatureEquivalenceType = this.equivalenceTypes[firstFeatureType] || firstFeatureType;
              
                  for (let i = 1; i < geoJSON.features.length; i++) {
                    const currentFeatureType = geoJSON.features[i].geometry.type;
                    const currentFeatureEquivalenceType = this.equivalenceTypes[currentFeatureType] || currentFeatureType;
              
                    if (currentFeatureEquivalenceType !== firstFeatureEquivalenceType) {
                      return "MultiType"; 
                    }
                  }

                  return firstFeatureEquivalenceType; 
                } else if (geoJSON.type === "Feature") {

                  const featureType = geoJSON.geometry.type;
                  const featureEquivalenceType = this.equivalenceTypes[featureType] || featureType;
              
                  return featureEquivalenceType;
                }
              
                return "MultiType"; 
        }

        // Create the style object that will be in out JSON for a geoJSON
        // typeLayer is used for marker or circle 
        this.createTemplateStyle =  function(geoJSON, index, typeLayer = undefined) {
        
            prop = this.findPropertiesWithNumber(geoJSON);
            allProp = this.findAllProperties(geoJSON);
            JSONtype = this.findFeatureType(geoJSON);
            console.log("prop",prop);
            console.log("allProp",allProp);
            console.log("JSONtype",JSONtype);

            switch (JSONtype) {
            case this.equivalenceTypes.MultiLineString:
                return {
                    layer: index +1,
                    type : "Multi Line",
                    stroke: true,
                    dashArray : [],
                    color: "black",
                    weight: 1,
                    opacity: 1,
                    property : Object.keys(prop).length > 0 ? Object.keys(prop)[0] : "none",
                    propertyMin : "Auto",
                    propertyMax : "Auto",   
                    possibleProperties : prop
                }
                break;
              case this.equivalenceTypes.MultiPolygon:
                return {
                    layer: index +1,
                    type : "Multi Polygon",
                    stroke: true,
                    color: "black",
                    dashArray : [],
                    weight: 1,
                    opacity: 1,
                    fillColor: "red",
                    property : Object.keys(prop).length > 0 ? Object.keys(prop)[0] : "none",
                    propertyMin : "Auto",
                    propertyMax : "Auto",         
                    fillOpacity: 1,
                    possibleProperties : prop
                }
                break;
              case this.equivalenceTypes.MultiPoint:
                if(allProp.includes("html") || allProp.includes("awesomeMarker") || typeLayer == L.marker) {

                    return {
                        layer: index +1,
                        type : "Multi Point",
                        pointAreMarker : true,
                        clickPopup : true,
                        popupProperty : "All",
                        PropertiesList : allProp
                    }

                }else {

                    return {
                        layer: index +1,
                        type : "Multi Point",
                        pointAreMarker : false,
                        stroke: false,
                        weight: 0,
                        opacity: 1,
                        color: "black",
                        radius : 5,
                        fillColor: "red",
                        property : Object.keys(prop).length > 0 ? Object.keys(prop)[0] : "none",
                        propertyMin : "Auto",
                        propertyMax : "Auto",         
                        fillOpacity: 1,
                        possibleProperties : prop
                    }

                }
                break;
              default:
                return {
                        
                }
                break;
            }

        }

        // Important tag to know if style has changed during the setStyle
        // Typical when circle are changed to marker
        this.styleChanged = false;

        // Set style on layers called when input style 
        this.style = function() {

            modelsHiddenParams[idInstance].GeoJSONStyle.forEach(function(d, index) {
                self.setStyle(index, d);
            })

            if(self.styleChanged) {
                self.styleChanged = false;
                self.updateValue();
            }
        }

        // Set Style on GeoJSON layer
        this.setStyle = function(layerIndex, style) {


            // Get GeoJSON
            var geoJSONinLayer = (modelsHiddenParams[idInstance].GeoJSON)[layerIndex];
            var leafLetLayer = (self.layers)[layerIndex];

          
            let colorScale = undefined;


            if(!_.isUndefined(style.property) && !_.isUndefined(style.possibleProperties) && (style.property in style.possibleProperties)) {

                var minMaxAuto = style.possibleProperties[style.property];
                   
                if(!_.isUndefined(style.propertyMin) && typeof style.propertyMin === 'number') minMaxAuto[0] = style.propertyMin;
                if(!_.isUndefined(style.propertyMax) && typeof style.propertyMax === 'number') minMaxAuto[1] = style.propertyMax; 

                var color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
                if(!_.isUndefined(color)) {
                    colorScale = self.getColorScale(color, minMaxAuto[0], minMaxAuto[1]);
                }
            }

            // Important
            let styleForObject = {...style};

            if(self.findFeatureType(geoJSONinLayer) == self.equivalenceTypes.MultiPolygon) {
                

                leafLetLayer.eachLayer(function(layer) {

                    if(!_.isUndefined(colorScale)) {
                        styleForObject.fillColor = colorScale((layer.feature.properties)[styleForObject.property]);
                    }

                    layer.setStyle(styleForObject);
                  });
            }

            if(self.findFeatureType(geoJSONinLayer) == self.equivalenceTypes.MultiLineString) {
                

                leafLetLayer.eachLayer(function(layer) {

                    if(!_.isUndefined(colorScale)) {
                        styleForObject.color = colorScale((layer.feature.properties)[styleForObject.property]);
                    }

                    layer.setStyle(styleForObject);
                  });
            }

            if(self.findFeatureType(geoJSONinLayer) == self.equivalenceTypes.MultiPoint) {
                

                if(styleForObject.pointAreMarker) {

                    // Change All Circle in Marker if L.Circle was transformed in L.Marker
                    if(leafLetLayer.getLayers()[0] instanceof L.Circle) {

                        if(!_.isUndefined(style.property)) {
                            newStyle = self.createTemplateStyle(geoJSONinLayer, layerIndex, L.marker);
                            Object.keys(style).forEach((key) => { delete style[key];});
                            Object.assign(style, { ...newStyle });

                            self.styleChanged = true;
                        }
                        

                        LMarkers = leafLetLayer.getLayers().map(function(layer) {
                            const marker = L.marker(layer.getLatLng());
                            marker.feature = layer.feature;
                            return marker;
                        });

                        leafLetLayer.clearLayers();

                        // Add Marker TODO : Create a markerClusterGroup and the option to do so
                        LMarkers.forEach(function(layerMarker) {leafLetLayer.addLayer(layerMarker)});

                    }

                    // TODO : in futur if first item is a markerClusterGroup do the eachLayer on the markerClusterGroup
                    // 
                    leafLetLayer.eachLayer(function(layer) {

                        // Remove Popup if done
                        if(!_.isUndefined(layer.getPopup())) {
                            popup = layer.getPopup();
                            layer.unbindPopup(); 
                         
                            // IMPORTANT
                            popup.remove();
                        }

                        if (layer.feature.properties.awesomeMarker) {
                            var awMarker = L.AwesomeMarkers.icon(layer.feature.properties.awesomeMarker);
                            layer.setIcon(awMarker);
                        }

                        // Put new Popup
                        let popupText = "";
                        if (!_.isUndefined(styleForObject.popupProperty) && !_.isUndefined(layer.feature.properties[styleForObject.popupProperty])) {
                            popupText = styleForObject.popupProperty + " : " + layer.feature.properties[styleForObject.popupProperty];
                        }

                        // legacy comment and html are priotary tag
                        else if (layer.feature.properties.comment) {
                            popupText = layer.feature.properties.comment;
                        } else if(layer.feature.properties.html) {
                            popupText = layer.feature.properties.html;
                        } else {
                            var jsonDisplay = jQuery.extend(true, {}, layer.feature.properties);
                            if (jsonDisplay.awesomeMarker) delete jsonDisplay.awesomeMarker;
                            popupText = syntaxHighlight(JSON.stringify(jsonDisplay))
                        }

                        // Add The popup 
                       if (style.clickPopup) {
                            // Popup on click
                            mk = layer.bindPopup(popupText, { autoClose: false, autoPan: false });
                       } else {
                            // persistent popup
                            mk = layer.bindPopup(popupText, { autoClose: false, autoPan: false });
                            mk.on("add", function (event) {
                                event.target.openPopup();
                            });
                            layer.openPopup();
                       }

                      });

                } else {

                    // Transform each L.Marker in L.Circle
                    if(leafLetLayer.getLayers()[0] instanceof L.Marker) {

                        
                        if(_.isUndefined(style.property)) {
                            newStyle = self.createTemplateStyle(geoJSONinLayer, layerIndex, L.circle);

                            Object.keys(style).forEach((key) => { delete style[key];});
                            Object.assign(style, { ...newStyle });

                            self.styleChanged = true;
                        }
                        
                        LCircles = leafLetLayer.getLayers().map(function(layer) {
                            const { lat, lng } = layer.getLatLng();
                            const circle = L.circle([lat, lng]);
                            circle.feature = layer.feature;
                            return circle;
                        });

                        leafLetLayer.clearLayers();
                        LCircles.forEach(function(layerCircle) {leafLetLayer.addLayer(layerCircle)});
                        styleForObject = {...style};
                    }

                    leafLetLayer.eachLayer(function(layer) {

                        if(!_.isUndefined(colorScale)) {
                            styleForObject.fillColor = colorScale((layer.feature.properties)[styleForObject.property]);
                        }
    
                        layer.setStyle(styleForObject);
                        if(!_.isUndefined(styleForObject.radius)) {
                            layer.setRadius(styleForObject.radius); // LafLet bug  setRadius must be called (Radius in Style is not check by Leaflet)
                        }

                      });
                }


            }

        }



        // GeoJSON Schema V0.7 

        const _SCHEMA_GEOJSON_INPUT = {
            $schema: WidgetPrototypesManager.SCHEMA_VERSION,
            $id : WidgetPrototypesManager.ID_URI_SCHEME + "xdash:GOEJSON_input",
            "type": "object",
            "properties": {
              "type": { "type": "string", "enum": ["FeatureCollection"] },
              "features": {
                "type": "array",
                "items": { "$ref": "#/definitions/feature" }
              }
            },
            "required": ["type", "features"],
            "additionalProperties": true,
            "patternProperties": {
              "^.*$": {}
            },
            "definitions": {
              "feature": {
                "type": "object",
                "properties": {
                  "type": { "type": "string", "enum": ["Feature"] },
                  "geometry": { "$ref": "#/definitions/geometry" },
                  "properties": { "type": "object" },
                  "id": { "anyOf": [{ "type": "string" }, { "type": "number" }] }
                },
                "required": ["type", "geometry"],
                "additionalProperties": false
              },
              "geometry": {
                "type": "object",
                "properties": {
                  "type": { "type": "string" },
                  "coordinates": {}
                },
                "required": ["type", "coordinates"],
                "additionalProperties": false
              }
            }
          }
          
          const _SCHEMA_GEOJSON_ARRAY = {
            $schema: WidgetPrototypesManager.SCHEMA_VERSION,
            $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:GOEJSON_input_array",

                type: "array",
                items: { $ref: _SCHEMA_GEOJSON_INPUT.$id },           
          };

          const _SCHEMA_GEOJSON_ONE_OF = {
            $schema: WidgetPrototypesManager.SCHEMA_VERSION,
            $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:GOEJSON_input_oneof",

            oneOf: [_SCHEMA_GEOJSON_INPUT, _SCHEMA_GEOJSON_ARRAY]           
          };

        const _GEOJSON_DESCRIPTOR = new WidgetActuatorDescription(
            "GeoJSON",
            "Geometry and Properties in GEOJSON Format",
            WidgetActuatorDescription.READ,
            _SCHEMA_GEOJSON_ONE_OF,
        );


        this.GeoJSON = {
            updateCallback: function () { },
            setValue: function (val) {

                if(!Array.isArray(val)) {
                    modelsHiddenParams[idInstance].GeoJSON = [];
                    modelsHiddenParams[idInstance].GeoJSON.push(val);
                } else {
                    modelsHiddenParams[idInstance].GeoJSON = val;
                }
                self.render();
                self.updateValue();
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].GeoJSON;
            },           
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            }
        };


        const _GEOJSON_STYLE_DESCRIPTOR = new WidgetActuatorDescription(
            "GeoJSONStyle",
            "Properties for GEOJSON",
            WidgetActuatorDescription.READ_WRITE,
            WidgetPrototypesManager.SCHEMA_ANYTHING,
        );


        this.GeoJSONStyle = {
            updateCallback: function () { },
            setValue: function (val) {
               modelsHiddenParams[idInstance].GeoJSONStyle = val;
               self.style();
            },
            getValue: function () {
             return modelsHiddenParams[idInstance].GeoJSONStyle;
            },           
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                self.updateValue();
            },
            removeValueChangedHandler: function (updateDataFromWidget) { }
        };

        this.getActuatorDescriptions = function () {
            return [_GEOJSON_DESCRIPTOR, _GEOJSON_STYLE_DESCRIPTOR];
        };


        // Main Render
        self.render();
    }


        // Inherit from baseWidget class
        this.mapGeoJsonWidgets.prototype = baseWidget.prototype;

        // Plugin definition
        this.pluginDefinition = {
            'name': 'mapGeoJson',
            'widgetsDefinitionList': {
                mapGeoJson: { factory: "mapGeoJsonWidgets", title: "Map GeoJSON", icn: "map", help: "wdg/wdg-geo-time/#leaflet-maps" }
            },
        };

    
        this.constructor();
}

// Inherit from basePlugin class
mapGeoJsonWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var mapGeoJsonWidgetsPlugin = new mapGeoJsonWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(mapGeoJsonWidgetsPlugin);