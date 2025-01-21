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
  // Fonction pour créer une échelle de couleurs
  // Vérifier si le scaleType est un interpolateur continu
  let domain = [min, max];
  let reverseColorScale = false;
  if (colorScaleName.endsWith('_r')) {
    reverseColorScale = true;
    colorScaleName = colorScaleName.slice(0, -2);
  }
  if (reverseColorScale) {
    domain.reverse();
  }
  if (getPrivateColorScale(colorScaleName) != null) {
    var privateColorScale = getPrivateColorScale(colorScaleName);
    return privateColorScale
      .scale()
      .interpolate(privateColorScale.interpolator)
      .domain(privateColorScale.domain)
      .range(privateColorScale.colors);
  } else if (getD3colorScale(colorScaleName) != null) {
    var interpolator = getD3colorScale(colorScaleName);
    return d3.scaleSequential().interpolator(interpolator).domain(domain);
  } else if (getD3ColorScaleFromScheme(colorScaleName)) {
    const colorScheme = d3[colorScaleName];
    const colorScale = d3
      .scaleQuantize() // Utilise une échelle quantisée pour mapper aux couleurs
      .domain(domain)
      .range(colorScheme[8]);
    return colorScale;
  } else if (getHomogeneousColorScale(colorScaleName)) {
    let interpolator = getHomogeneousColorScale(colorScaleName);
    return d3.scaleSequential().interpolator(interpolator).domain(domain);
  }
  throw new Error("Paramètres d'entrée non valides : fournissez un interpolateur, un schéma, ou une couleur.");
}
export function getColorScaleFromStyle(style) {
  let color = !_.isUndefined(style.fillColor) ? style.fillColor : style.color;
  let colorScale = undefined;
  if (!_.isUndefined(color)) {
    let minMaxAuto = style.possibleProperties[style.property];
    if (!_.isUndefined(minMaxAuto) && Array.isArray(minMaxAuto) && minMaxAuto.length > 1) {
      let min = minMaxAuto[0];
      let max = minMaxAuto[1];
      colorScale = getColorScale(color, min, max);
    }
  }
  return colorScale;
}
export function getColor(min, max, d, colorScale) {
  let categorySize = (max - min) / 8.0;

  let categoryIndex = Math.floor((d - min) / categorySize);
  return colorScale(min + categoryIndex * categorySize);
}
