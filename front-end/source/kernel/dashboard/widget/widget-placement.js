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
import { widgetDefaultLayout } from 'kernel/dashboard/widget/widget-default-layout';
import { unitW, unitH } from 'kernel/dashboard/scaling/scaling-utils';
import { minLeftCst, minTopCst } from 'kernel/dashboard/scaling/layout-mgr';
import { modelsLayout } from 'kernel/base/widgets-states';

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
  var c_t = containerLayoutPx.top + minTopCst,
    c_l = containerLayoutPx.left + minLeftCst,
    c_h = containerLayoutPx.height - 2 * minTopCst,
    c_w = containerLayoutPx.width - 2 * minLeftCst;

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
 * @description Computes max widget width in is container in px
 * @param {any} widgetLayoutPx
 * @param {any} containerLayoutPx
 */
export function computeMaxWidthPx(widgetLayoutPx, containerLayoutPx) {
  var w_l = widgetLayoutPx.left,
    c_w = containerLayoutPx.width - 2 * minLeftCst,
    c_l = containerLayoutPx.left + minLeftCst,
    c_r = c_l + c_w;

  var max_w_w = c_r - w_l + minLeftCst;
  return max_w_w;
}

/**
 * @description Computes max widget height in is container in px
 * @param {any} widgetLayoutPx
 * @param {any} containerLayoutPx
 */
export function computeMaxHeightPx(widgetLayoutPx, containerLayoutPx) {
  var w_t = widgetLayoutPx.top,
    c_h = containerLayoutPx.height - 2 * minTopCst,
    c_t = containerLayoutPx.top + minTopCst,
    c_b = c_h + c_t;

  var max_w_h = c_b - w_t + minTopCst;
  return max_w_h;
}

/**
 * @description Computes normalized container layout in px
 * @param {any} containerLayoutPx
 */
export function computeContainerRelativeLayout(containerLayoutPx, bIncludeMargin) {
  // Simplified notation
  var c_h = containerLayoutPx.height,
    c_w = containerLayoutPx.width;

  if (bIncludeMargin) {
    return {
      top: minTopCst,
      left: minLeftCst,
      width: c_w - 2 * minLeftCst,
      height: c_h - 2 * minTopCst,
    };
  } else {
    return {
      top: 0,
      left: 0,
      width: c_w,
      height: c_h,
    };
  }
}

/**
 * @description Computes relative widget layout in px inside a container
 * @param {any} widgetLayoutPx
 * @param {any} containerLayoutPx
 */
function computeRelativePxLayout(widgetLayoutPx, containerLayoutPx) {
  // Simplified notation
  var w_t = widgetLayoutPx.top,
    w_l = widgetLayoutPx.left,
    w_h = widgetLayoutPx.height,
    w_w = widgetLayoutPx.width;
  var c_t = containerLayoutPx.top,
    c_l = containerLayoutPx.left;

  return {
    top: w_t - c_t,
    left: w_l - c_l,
    width: w_w,
    height: w_h,
  };
}

/**
 * @description Converts a layout in px to a layout in viewport coordinates
 * @param {any} widgetLayoutPx
 */
export function pxToViewPort(widgetLayoutPx) {
  var widgetLayoutViewPort = {};
  widgetLayoutViewPort.topVh = unitH(widgetLayoutPx.top);
  widgetLayoutViewPort.leftVw = unitW(widgetLayoutPx.left);
  widgetLayoutViewPort.heightVh = unitH(widgetLayoutPx.height);
  widgetLayoutViewPort.widthVw = unitW(widgetLayoutPx.width);

  return widgetLayoutViewPort;
}

/**
 * @description Given a DOM element, gets its layout in px
 * @param {any} element
 */
export function getElementLayoutPx(element) {
  var elementLayoutPx = {
    top: element.offsetTop,
    left: element.offsetLeft,
    height: element.offsetHeight,
    width: element.offsetWidth,
  };
  return elementLayoutPx;
}

/**
 * @description getElementLayoutWithMarginPx
 * @param {any} elementLayoutPx
 */
function getElementLayoutWithMarginPx(elementLayoutPx) {
  var marginElementLayoutPx = {
    top: elementLayoutPx.top + minTopCst,
    left: elementLayoutPx.left + minLeftCst,
    height: elementLayoutPx.height,
    width: elementLayoutPx.width,
  };
  return marginElementLayoutPx;
}

/**
 * @description Given a DOM element of, gets its layout in px taking into account border from containers
 * TODO : handle relative and absolute
 * @param {any} element
 */
export function getWidgetLayoutPx(element) {
  var elementLayoutPx = {
    top: element.offsetTop - minTopCst,
    left: element.offsetLeft - minLeftCst,
    height: element.offsetHeight,
    width: element.offsetWidth,
  };
  return elementLayoutPx;
}

/**
 * @description Applies a specified layout in px to a DOM element
 * @param {any} element
 * @param {any} widgetLayoutPx
 */
function applyLayoutStyleFromPx(element, widgetLayoutPx) {
  var widgetLayoutViewPort = pxToViewPort(widgetLayoutPx);

  element.style.left = widgetLayoutViewPort.leftVw;
  element.style.top = widgetLayoutViewPort.topVh;
  element.style.width = widgetLayoutViewPort.widthVw;
  element.style.height = widgetLayoutViewPort.heightVh;
}

/**
 * @description Computes mainDiv layout. Priority rules :
 * provided wLayout, modelsLayout then widgetDefaultLayout global default
 * @param {any} wLayout
 * @param {any} modelJsonId
 */
export function computeMainDivLayout(wLayout, modelJsonId) {
  var layout = widgetDefaultLayout.get(); // default global layout

  if (_.isUndefined(wLayout) || _.isUndefined(wLayout.left) || _.isUndefined(wLayout.top)) {
    //AEF: fix bug 13/10/2020
    layout.left = unitH(minLeftCst);
    layout.top = unitW(minTopCst);
  } else {
    layout.left = wLayout.left;
    layout.top = wLayout.top;
  }

  var modelId = modelJsonId.toString();

  // Case : width and height specified in wLayout
  if (!_.isUndefined(wLayout)) {
    if (!_.isUndefined(wLayout.width) && !_.isUndefined(wLayout.height)) {
      // apply requested layout
      layout.width = wLayout.width;
      layout.height = wLayout.height;
      if (!_.isUndefined(wLayout.minWidth)) {
        layout.minWidth = wLayout.minWidth;
        layout.width =
          Math.max(
            parseFloat(layout.minWidth) * (100 / document.documentElement.clientWidth),
            parseFloat(layout.width)
          ) + 'vw';
      } else if (!_.isUndefined(modelsLayout[modelId])) {
        if (!_.isUndefined(modelsLayout[modelId].minWidth)) {
          layout.minWidth = modelsLayout[modelId].minWidth;
          layout.width =
            Math.max(
              parseFloat(layout.minWidth) * (100 / document.documentElement.clientWidth),
              parseFloat(layout.width)
            ) + 'vw';
        }
      }
      if (!_.isUndefined(wLayout.minHeight)) {
        layout.minHeight = wLayout.minHeight;
        layout.height =
          Math.max(
            parseFloat(layout.minHeight) * (100 / document.documentElement.clientHeight),
            parseFloat(layout.height)
          ) + 'vh';
      } else if (!_.isUndefined(modelsLayout[modelId])) {
        if (!_.isUndefined(modelsLayout[modelId].minHeight)) {
          layout.minHeight = modelsLayout[modelId].minHeight;
          layout.height =
            Math.max(
              parseFloat(layout.minHeight) * (100 / document.documentElement.clientHeight),
              parseFloat(layout.height)
            ) + 'vh';
        }
      }
      return layout;
    }
  }

  // Case : width and height NOT specified in wLayout
  if (!_.isUndefined(modelsLayout[modelId])) {
    if (!_.isUndefined(modelsLayout[modelId].width) && !_.isUndefined(modelsLayout[modelId].height)) {
      // apply model default layout
      layout.width = modelsLayout[modelId].width;
      layout.height = modelsLayout[modelId].height;
      if (!_.isUndefined(modelsLayout[modelId].minWidth)) {
        layout.minWidth = modelsLayout[modelId].minWidth;
        layout.width =
          Math.max(
            parseFloat(layout.minWidth) * (100 / document.documentElement.clientWidth),
            parseFloat(layout.width)
          ) + 'vw';
      }
      if (!_.isUndefined(modelsLayout[modelId].minHeight)) {
        layout.minHeight = modelsLayout[modelId].minHeight;
        layout.height =
          Math.max(
            parseFloat(layout.minHeight) * (100 / document.documentElement.clientHeight),
            parseFloat(layout.height)
          ) + 'vh';
      }
    }
  }

  return layout;
}

/**
 * @description Applies layout on element style
 * @param {any} element
 * @param {any} layout
 */
export function applyLayout(element, layout) {
  element.style.left = layout.leftVw;
  element.style.top = layout.topVh;
  element.style.width = layout.widthVw;
  element.style.height = layout.heightVh;
  if (!_.isUndefined(layout.minWidth)) {
    element.style.minWidth = layout.minWidth;
  }
  if (!_.isUndefined(layout.minHeight)) {
    element.style.minHeight = layout.minHeight;
  }
}

/**
 * @description Ensures minWidth and minHeight are consistent (less or equal) with width and heigth
 * @param {any} layoutPx
 */
export function enforceMinConsistency(layoutPx) {
  if (layoutPx.minWidth > layoutPx.width) {
    layoutPx.minWidth = layoutPx.width;
  }
  if (layoutPx.minHeight > layoutPx.height) {
    layoutPx.minHeight = layoutPx.height;
  }
  return layoutPx;
}
