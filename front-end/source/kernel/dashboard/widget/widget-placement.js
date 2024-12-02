// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │ widget placement functions                                                  │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mounir MECHERGHUI, Mongi BEN GAID,       │ \\
// │                      Ameur HAMDOUNI                                         │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';

/**
 * @description Enforces that widget layout respects container constraints in terms of:
 * - width and height (always inside container)
 * - left and top
 * @param {any} widgetLayoutPx
 * @param {any} containerLayoutPx (with no margins)
 */
export function enforceConstraints(widgetLayoutPx, containerLayoutPx) {
  // Simplified notation
  var w_t = widgetLayoutPx.top,
    w_l = widgetLayoutPx.left,
    w_h = widgetLayoutPx.height,
    w_w = widgetLayoutPx.width;
  var c_t = containerLayoutPx.top,
    c_l = containerLayoutPx.left,
    c_h = containerLayoutPx.height,
    c_w = containerLayoutPx.width;

  // Deduced variables
  let w_b = w_t + w_h;
  let w_r = w_l + w_w;
  let c_b = c_t + c_h;
  let c_r = c_l + c_w;

  // Dimension rules
  if (w_h > c_h) {
    w_h = c_h;
    w_b = w_t + c_h;
  } // max widget height equals container height
  if (w_w > c_w) {
    w_w = c_w;
    w_r = w_l + c_w;
  } // max widget width equals container width

  // Position rules
  if (w_t < c_t) {
    w_t = c_t;
  } // no top overflow
  if (w_l < c_l) {
    w_l = c_l;
  } // no left overflow
  if (w_b > c_b) {
    w_t = c_b - w_h;
    w_b = c_b;
  } // no bottom overflow
  if (w_r > c_r) {
    w_l = c_r - w_w;
    w_r = c_r;
  } // no right overflow

  return {
    top: w_t,
    left: w_l,
    width: w_w,
    height: w_h,
  };
}

/**
 * @description Computes relative widget layout in px inside a container
 * @param {any} widgetLayoutPx
 * @param {any} containerLayoutPx
 */
function computeRelativePxLayout(widgetLayoutPx, containerLayoutPx) {
  return {
    top: widgetLayoutPx.top - containerLayoutPx.top,
    left: widgetLayoutPx.left - containerLayoutPx.left,
    width: widgetLayoutPx.width,
    height: widgetLayoutPx.height,
  };
}

/**
 * @description Given a DOM element, gets its layout in px
 * @param {HTMLElement} element
 */
export function getElementLayoutPx(element) {
  return {
    top: element.offsetTop,
    left: element.offsetLeft,
    height: element.offsetHeight,
    width: element.offsetWidth,
  };
}

export function getGeometryChanges(oldGeometry, newGeometry) {
  const result = {};
  for (const key of ['left', 'top', 'width', 'height']) {
    if (oldGeometry[key] !== newGeometry[key]) {
      result[key] = newGeometry[key];
    }
  }
  return result;
}

/**
 * @description Applies geometry on element style
 * @param {HTMLElement} element
 * @param {any} layout
 */
export function applyGeometry(element, layout) {
  element.style.left = layout.left + 'px';
  element.style.top = layout.top + 'px';
  element.style.width = layout.width + 'px';
  element.style.height = layout.height + 'px';
}

/**
 * constrain a 1D geometry defined by a position and a size to fit in limited space
 * @param {number} available available space
 * @param {{position: number, size: number}} geometry
 * @returns {{position: number, size: number}}
 */
export function constrain(available, { position, size }) {
  if (size >= available) {
    size = available;
    position = 0;
  } else if (position + size > available) {
    position = available - size;
  }
  return { position, size };
}

/**
 * Scale a 1D geometry defined by a position and a size to match a change in a reference size (like its container)
 * @param {number} oldDim old reference size
 * @param {number} newDim new reference size
 * @param {{position: number, size: number}} geometry
 * @returns {{position: number, size: number}}
 */
export function scale(oldDim, newDim, { position, size }) {
  const ratio = newDim / oldDim;
  return { position: Math.round(position * ratio), size: Math.round(size * ratio) };
}
