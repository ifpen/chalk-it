
  // ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Mohamed ERRAHALI                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\


this.createLegend = function (idLegend,color, length, colorStops, min, max, featureTitle) {
  var legend = L.control({ position: 'topleft' });
  var min = Number(min);
  var max = Number(max);
  if(min == max) return;
  if(_.isUndefined(featureTitle) || featureTitle == "none") return;

  featureTitle = featureTitle ? featureTitle.charAt(0).toUpperCase() + featureTitle.toLowerCase().slice(1) : ""

  legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'scaleLegend');
    div.setAttribute('id', idLegend);
    var rects = '';
    for (var i = 0; i < length; i++) {
      rects = rects + '<rect height="10" x="' + i * 4 + '" width="4" style="fill: ' + color(i) + ';"></rect>';
    }
    var svg = '<svg  width="450" height="50"><g class="key" transform="translate(25,16)">' + rects;
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
  return legend; 
};

this.createChoroplethLegend = function (idLegend,getColor, min, max, featureTitle, colorScale) {
  if(min == max) return;
  if(_.isUndefined(featureTitle) || featureTitle == "none") return;

  featureTitle = featureTitle ? featureTitle.charAt(0).toUpperCase() + featureTitle.toLowerCase().slice(1) : ""
  var legend = L.control({ position: 'topleft' });
  var min = Number(min);
  var max = Number(max);

  legend.onAdd = function (map) {
    var step = (max - min) / 8;
    var div = L.DomUtil.create('div', 'info legend');
    div.setAttribute('id', idLegend); 
    grades = [min, min + step, min + step * 2, min + step * 3, min + step * 4, min + step * 5, min + step * 6, max];
    var labels = [],
      from,
      to;
      f = d3.format(".1s")
      labels.push('<div style="display:flex;flex-direction:column;row-gap:2px;">')
      labels.push('<h2 style="margin-bottom: 4px;">'+featureTitle+'</h2>')
    //   div.innerHTML += '<h6>              </h6>';
   
      for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];
        labels.push(
          '<div style="display:flex;flex-direction:row;justify-content:space-between;"><i style="background:' +
            getColor(min, max, from + 1, colorScale) +
            ';margin-left:0px;"></i> ' +
            '<span>' + d3.format("~s")(from) + (to ? '&ndash;' +  d3.format("~s")(to) : '+') + 
            '</span> </div>'
        )  ; 
    }
    
    labels.push('</div>')
    div.innerHTML = labels.join('');
    return div;
  };
  return legend;
};

this.toggleLegend = function(self, layerIndex, styleForObject, geoJSONinLayer){
  //calcul color scale
  let colorScale = undefined;
  var color = !_.isUndefined(styleForObject.fillColor) ? styleForObject.fillColor : styleForObject.color;
  if (!_.isUndefined(color)) {
    colorScale = self.getColorScale(color, 0, 100);
  }
  //get Min Max
  let minMax = geoJsonTools.getMinMaxProperty(styleForObject, geoJSONinLayer);
  let min = minMax[0],
    max = minMax[1];
  var length = 100;
  var colorStops = [0, 25, 50, 75, 100];
  if (self.map.hasLayer(self.layers[layerIndex])) {
    if (!_.isUndefined(styleForObject.legend) && !_.isUndefined(styleForObject.legend.showLegend)) {
      if (!!styleForObject.legend.showLegend && !_.isUndefined(styleForObject.property) && styleForObject.property in styleForObject.possibleProperties) {
        if (!_.isUndefined(self.legends[layerIndex])) {
          self.legends[layerIndex].remove();
        }
        if (!_.isUndefined(min) && !_.isUndefined(max) && !_.isUndefined(colorScale)) {
          if (geoJsonTools.findFeatureType(geoJSONinLayer) == geoJsonTools.equivalenceTypes.MultiPolygon) {
            self.legends[layerIndex] = self.createChoroplethLegend(
              layerIndex,
              min,
              max,
              styleForObject.legend.title || styleForObject.property,
              colorScale
            );
          } else {
            self.legends[layerIndex] = self.createLegend(
              layerIndex,
              colorScale,
              length,
              colorStops,
              min,
              max,
              styleForObject.legend.title || styleForObject.property
            );
          }
        }
      } else {
        if (!_.isUndefined(self.legends[layerIndex])) {
          self.map.removeControl(self.legends[layerIndex]);
        }
      }
    }
  } else {
    if (!_.isUndefined(self.legends[layerIndex])) {
      self.legends[layerIndex].remove();
    }
  }
}

var legends = (function legends () {
  return {
    createLegend: createLegend,
    createChoroplethLegend: createChoroplethLegend,
    toggleLegend
  };
})();
