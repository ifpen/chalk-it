// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Benoit LEHMAN & Mongi BEN GAID & Mohamed ERRAHALI      │ \\
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

        this.defaultConfig = {
            defaultCenter : {
                latitude : 2.295,
                longitude : 48.8738,
                zoom : 16
            },
            tileServer  : "MapboxStreets",
            possibleTileServers : ["MapboxStreets", "MapboxDark", "HereSatelliteDay", "HereTerrainDay", "HereHybridDay"]
        }

        var self = this;
        this.legendHeatMap = undefined
        this.legendChoroplet = undefined
        this.enable = function () {};

        this.disable = function () {};

        this.updateValue = function (e) {

            // Create new TempleStyle if old has not the same size
            // TODO : Check all style compatible with all element of model 
            if((!Array.isArray( modelsHiddenParams[idInstance].GeoJSONStyle.style) && !_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) 
            || (modelsHiddenParams[idInstance].GeoJSON.length !== modelsHiddenParams[idInstance].GeoJSONStyle.style.length) ) {

                modelsHiddenParams[idInstance].GeoJSONStyle.style = []

                if(!_.isUndefined(modelsHiddenParams[idInstance].GeoJSON)) {
                    
                        modelsHiddenParams[idInstance].GeoJSON.forEach((item, index) => {
                            modelsHiddenParams[idInstance].GeoJSONStyle.style.push(
                                this.createTemplateStyle(item, index)
                            )
                        });


                }
            }
            
            self.GeoJSONStyle.updateCallback( self.GeoJSONStyle, self.GeoJSONStyle.getValue());
        }


        this.rescale = function () {
        };


        this.getColorScale = function (colorScaleName, min, max) {
            reverseColorScale = false
           // Default interpolator
           var interpolator = d3["interpolateYlOrRd"];
           // Availlable interpolator : https://github.com/d3/d3-scale-chromatic
           
           if(  !(_.isUndefined(colorScaleName)) && !(_.isUndefined(d3[colorScaleName])) && (colorScaleName.includes("interpolate")) ) {
               interpolator = d3[colorScaleName];
           }
           
           if(!(_.isUndefined(reverseColorScale)) && reverseColorScale) {
               return d3.scaleSequential().interpolator(interpolator).domain([max,min]);
           }else{
               return d3.scaleSequential().interpolator(interpolator).domain([min,max]);
           }   
           // return colorScaleManager.getColorScale(colorScaleName, min, max);
        }

        this.render = function () {
           
            var widgetHtml = document.createElement('div');
            widgetHtml.setAttribute('id', 'mapGeoJson' + idWidget);
            widgetHtml.setAttribute('style', 'width: inherit; height: inherit');
            document.addEventListener('play-tab-loaded', self.goToFirstRadioButton);
            $("#" + idDivContainer).html(widgetHtml);

            // Drawing the map
            // TODO : Report all map possibilites from map  
             
            config =  self.defaultConfig
            if(!_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle) && !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config) && !_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config.defaultCenter) ) {
                config = modelsHiddenParams[idInstance].GeoJSONStyle.config
            }
            self.map = L.map('mapGeoJson' + idWidget, { preferCanvas: true }).setView(  [config.defaultCenter.longitude,config.defaultCenter.latitude], config.defaultCenter.zoom);
            self.map.zoomControl.setPosition('topright');

            console.log("rendering ....",config);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
              }).addTo( self.map);
            

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

        this.getMinMaxByProperty = function(GeoJSON,property) {
            const minMax = [GeoJSON.features[0].properties[property],GeoJSON.features[0].properties[property]]
            GeoJSON.features.forEach(feature => {
              
                if (typeof feature.properties[property] === 'number' && !isNaN(feature.properties[property]) && isFinite(feature.properties[property])) {
                  const value = feature.properties[property];
                  
                    minMax[0]= Math.min(minMax[0], value);
                    minMax[1] = Math.max(minMax[1], value);
                  
                }
              
            });
          
            return minMax;

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
        
            prop = self.findPropertiesWithNumber(geoJSON);
            allProp = self.findAllProperties(geoJSON);
            JSONtype = self.findFeatureType(geoJSON); 

            switch (JSONtype) {
            case self.equivalenceTypes.MultiLineString:
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
              case self.equivalenceTypes.MultiPolygon:
                return {
                    layer: index +1,
                    showLegend : true,
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
              case self.equivalenceTypes.MultiPoint:
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
                        showLegend : true,
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
        this.getColor = function (min, max, d, colorScale) {
            var step = (max - min) / 8.0;

            var stepDraw = Math.floor((d-min)/step);
            return colorScale(stepDraw * (1.0/8.0)*100)
        }

        this.createChoroplethLegend = function (min, max, featureTitle,colorScale) {
            var legend = L.control({ position: 'topleft' });
            var min = Number(min);
            var max = Number(max);
             
            legend.onAdd = function (map) {

                var step = (max - min) / 8;
                var div = L.DomUtil.create('div', 'info legend')
                div.setAttribute("id","legendChoroplet")
                var grades = [min, min + step, min + (step * 2), min + (step * 3), min + (step * 4), min + (step * 5), min + (step * 6), max],
                labels = [],
                from, to;

                 //   div.innerHTML += '<h6>              </h6>';
                for (var i = 0; i < grades.length; i++) {
                    from = grades[i];
                    to = grades[i + 1];
                    labels.push(
                        '<i style="background:' + self.getColor(min, max, from + 1, colorScale) + '"></i> ' +
                        '<span>' + d3.format("~s")(from) + (to ? '&ndash;' +  d3.format("~s")(to) : '+') + '</span>') + '<br>' ;
                }

                div.innerHTML = labels.join('<br>');
                return div;
            };
            legend.addTo(self.map);
            return legend
        }
        this.createLegend = function (color, length, colorStops, min, max, featureTitle) {
            var legend = L.control({ position: 'topleft' });
            var min = Number(min);
            var max = Number(max);
             
            legend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'scaleLegend');
                div.setAttribute("id","legendHeatMap")
                var rects = '';
                for (var i = 0; i < length; i++) { 
                    rects = rects + '<rect height="10" x="' + i * 4 + '" width="4" style="fill: ' + color(i) + ';"></rect>';
                }
                var svg = '<svg id="legend" width="450" height="50"><g class="key" transform="translate(25,16)">' + rects;
                var bTicksFormat = true;
                var valTick = min;
                var strTick;
                if (!bTicksFormat)
                    strTick = min.toString();
                else
                    strTick = nFormatter(min, 2);
                var valTranslate = 0;
                for (var i = 0; i < colorStops.length; i++) {
                    valTranslate = colorStops[i] * 4;
                    svg = svg + '<g class="tick" transform="translate(' + valTranslate + ',0)" style="opacity: 1;"><line y2="-1" x2="0"></line><text dy="0em" y="-4" x="0" style="text-anchor: middle;">' + strTick + '</text></g>';
                    valTick = valTick + ((max - min) / 4);
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
            legend.addTo(self.map);
            return legend
        };
        // Important tag to know if style has changed during the setStyle
        // Typical when circle are changed to marker
        this.styleChanged = false;
        // Set style on layers called when input style 
        this.style = function() {
            config =  modelsHiddenParams[idInstance].GeoJSONStyle.config
            ts= "MapboxStreets"
            defaultCenter = self.defaultConfig.defaultCenter
            if(!_.isUndefined(config)) {
                defaultCenter = config.defaultCenter
                ts = config.tileServer
            }
            if(!_.isUndefined(tileServers)) {
            //update tile server
            tileServersObj = tileServers
            var tileConf = {
                url: tileServersObj[ts].url,
                maxZoom: tileServersObj[ts].maxZoom,
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
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
            self.baseLayer = L.tileLayer(tileServersObj[ts].url, tileConf);
            self.baseLayer.addTo(self.map);
            }
            

            //update view 

            self.map.setView(  [defaultCenter.longitude,defaultCenter.latitude], defaultCenter.zoom);

            //update style
            modelsHiddenParams[idInstance].GeoJSONStyle.style.forEach(function(d, index) {
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

            //calcul color scale
            //using specified property
            //
            if(!_.isUndefined(style.property) && !_.isUndefined(style.possibleProperties) && (style.property in style.possibleProperties)) {

                var minMaxAuto = style.possibleProperties[style.property];
                   
                if(!_.isUndefined(style.propertyMin) && typeof style.propertyMin === 'number') minMaxAuto[0] = style.propertyMin;
                if(!_.isUndefined(style.propertyMax) && typeof style.propertyMax === 'number') minMaxAuto[1] = style.propertyMax; 

                var color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
                if(!_.isUndefined(color)) {
                    colorScale = self.getColorScale(color, 0, 100);
                }
            }

            // Important
            let styleForObject = {...style  };

            if(self.findFeatureType(geoJSONinLayer) == self.equivalenceTypes.MultiPolygon) {
                
                let minMax = self.getMinMaxByProperty(geoJSONinLayer,styleForObject.property)
                let min = minMaxAuto[0]
                let max = minMaxAuto[1]
                if(min < minMax[0]) min = minMax[0]
                if(max > minMax[1]) max = minMax[1]
                leafLetLayer.eachLayer(function(layer) {

                    if(!_.isUndefined(colorScale)) {
                        let value = (layer.feature.properties)[styleForObject.property]
                            
                        styleForObject.fillColor = self.getColor(min,max,value,colorScale);
                    }

                    layer.setStyle(styleForObject);
                  });
                  //legend
                   
                  if(!_.isUndefined(styleForObject.showLegend)) {
                       if(!!styleForObject.showLegend) {
                        if (!_.isUndefined(self.legendChoroplet)) {
                            if (!_.isUndefined(self.legendChoroplet)) {
                                self.legendChoroplet.remove();
                            }
                            
                        }
                       self.legendChoroplet =  self.createChoroplethLegend(min, max,styleForObject.property,colorScale)
                       } else{
                        if (!_.isUndefined(self.legendChoroplet)) {
                            self.map.removeControl(self.legendChoroplet);
                        } 
                        }
                    }
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
                            Object.keys(style.style).forEach((key) => { delete style.style[key];});
                            Object.assign(style.style, { ...newStyle });

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
                    var minMaxAuto = style.possibleProperties[styleForObject.property];
                   
                    if(!_.isUndefined(styleForObject.propertyMin) && typeof styleForObject.propertyMin === 'number') minMaxAuto[0] = styleForObject.propertyMin;
                    if(!_.isUndefined(styleForObject.propertyMax) && typeof styleForObject.propertyMax === 'number') minMaxAuto[1] = styleForObject.propertyMax; 
                    
                    let minMax = self.getMinMaxByProperty(geoJSONinLayer,styleForObject.property)
                    let min = minMaxAuto[0]
                    let max = minMaxAuto[1]
                    if(min < minMax[0]) min = minMax[0]
                    if(max > minMax[1]) max = minMax[1]
                    leafLetLayer.eachLayer(function(layer) {

                        if(!_.isUndefined(colorScale)) {
                            let value = (layer.feature.properties)[styleForObject.property]
                            
                            let pct = ((value - min)/(max-min))*100
                            styleForObject.fillColor = colorScale(pct);
                        }
    
                        layer.setStyle(styleForObject);
                        if(!_.isUndefined(styleForObject.radius)) {
                            layer.setRadius(styleForObject.radius); // LafLet bug  setRadius must be called (Radius in Style is not check by Leaflet)
                        }
                      });

                      //legend
                    var length =100
                    var colorStops = [0, 25, 50, 75, 100];

                    if(!_.isUndefined(styleForObject.showLegend)) {
                        if(!!styleForObject.showLegend) {
                         if (!_.isUndefined(self.legendHeatMap)) {
                             if (!_.isUndefined(self.legendHeatMap)) {
                                 self.legendHeatMap.remove();
                             }
                             
                         }
                         self.legendHeatMap = self.createLegend(colorScale, length, colorStops, minMaxAuto[0], minMaxAuto[1],styleForObject.property );
                        } else{
                         if (!_.isUndefined(self.legendHeatMap)) {
                             self.map.removeControl(self.legendHeatMap);
                         } 
                         }
                     } 
 
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
                if(_.isUndefined(modelsHiddenParams[idInstance].GeoJSONStyle.config)){
                    modelsHiddenParams[idInstance].GeoJSONStyle.config = self.defaultConfig
                }
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