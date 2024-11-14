// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Benoit LEHMAN & Mohamed ERRAHALI & Abir EL FEKI        │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import _ from 'lodash';
import * as d3 from 'd3';

export const privateColorScales = [
  // interpolate used by flair // legacy of the Heat Map
  {
    names: ['interpolateBlCyLiYeRed', 'interpolateFlair', 'interpolateLegacyHeatMap'],
    scale: d3.scaleLinear,
    colors: [d3.rgb('blue'), d3.rgb('cyan'), d3.rgb('lime'), d3.rgb('yellow'), d3.rgb('red')],
    interpolator: d3.interpolateHcl,
    domain: [0, 0.25, 0.5, 0.75, 1],
  },
];

// Search private color Scale
export function getPrivateColorScale(name) {
  let colorScalePrivateObjectDef = null;
  privateColorScales.forEach(function (d) {
    if (d.names.includes(name)) {
      colorScalePrivateObjectDef = d;
    }
  });
  return colorScalePrivateObjectDef;
}

// Search D3 interpolator
export function getD3colorScale(name) {
  if (!_.isUndefined(d3[name]) && name.includes('interpolate')) {
    return d3[name];
  }

  return null;
}
export function getD3ColorScaleFromScheme(name) {
  const color = d3.scaleOrdinal(d3.schemeAccent);
  if (!_.isUndefined(d3[name]) && name.includes('scheme')) {
    return d3[name];
  }
  return null;
}

export function getHomogeneousColorScale(name) {
  if (d3.color(name) !== null) {
    return d3.interpolate('white', name);
  }

  return null;
}

export function getColorScale(colorScaleName, min, max) {
  // First remove the _r which means that the colorScale is reversed
  let reverseColorScale = false;
  let domain = [0, 1];
  var colorScale;
  if (colorScaleName.endsWith('_r')) {
    reverseColorScale = true;
    colorScaleName = colorScaleName.slice(0, -2);
  }

  // check internal private colorScale

  if (getPrivateColorScale(colorScaleName) != null) {
    var privateColorScale = getPrivateColorScale(colorScaleName);
    colorScale = privateColorScale
      .scale()
      .interpolate(privateColorScale.interpolator)
      .range(privateColorScale.colors);
    domain = privateColorScale.domain;
  } else if (getD3colorScale(colorScaleName) != null) {
    var interpolator = getD3colorScale(colorScaleName);
    colorScale = d3.scaleSequential().interpolator(interpolator);
  } else if (getHomogeneousColorScale(colorScaleName)) {
    let interpolator = getHomogeneousColorScale(colorScaleName);
    colorScale = d3.scaleSequential().interpolator(interpolator);
  } else if (getD3ColorScaleFromScheme(colorScaleName)) {
    let interpolator = getD3ColorScaleFromScheme(colorScaleName);
    colorScale = d3.scaleOrdinal(d3.schemeAccent);
  } else {
    return null;
  }

  var delta = max - min;

  var minMaxReal = domain.map(function (d) {
    return min + d * delta;
  });
  if (reverseColorScale) {
    minMaxReal.reverse();
  }

  return colorScale.domain(minMaxReal);
}
export function getColorScaleFromStyle(style) {
  var color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
  var colorScale = undefined;
  if (!_.isUndefined(color)) {
    colorScale = getColorScale(color, 0, 100);
  }
  return colorScale;
}
export function getColor(min, max, d, colorScale) {
  var categorySize  = (max - min) / 8.0;

  var categoryIndex  = Math.floor((d - min) / categorySize);
  return colorScale(min + categoryIndex * categorySize);
}
