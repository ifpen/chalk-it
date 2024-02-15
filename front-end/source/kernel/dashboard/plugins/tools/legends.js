
  // ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Mohamed ERRAHALI                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\


this.createLegend = function (color, length, colorStops, min, max, featureTitle) {
  var legend = L.control({ position: 'topleft' });
  var min = Number(min);
  var max = Number(max);

  legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'scaleLegend');
    div.setAttribute('id', 'legendHeatMap');
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
  return legend; 
};

this.createChoroplethLegend = function (getColor, min, max, featureTitle, colorScale) {
  featureTitle = featureTitle ? featureTitle.charAt(0).toUpperCase() + featureTitle.toLowerCase().slice(1) : ""
  var legend = L.control({ position: 'topleft' });
  var min = Number(min);
  var max = Number(max);

  legend.onAdd = function (map) {
    var step = (max - min) / 8;
    var div = L.DomUtil.create('div', 'info legend');
    div.setAttribute('id', 'legendChoroplet');
    var grades = [min, min + step, min + step * 2, min + step * 3, min + step * 4, min + step * 5, min + step * 6, max],
      labels = [],
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
          '<span>' +
          f(from) +
          (to ? '&ndash;' + f(to) : '+') +
          '</span> </div>'
      )  ;
    }
    labels.push('</div>')
    div.innerHTML = labels.join('');
    return div;
  };
  return legend;
};

var legends = (function legends () {
  return {
    createLegend: createLegend,
    createChoroplethLegend: createChoroplethLegend,
  };
})();
