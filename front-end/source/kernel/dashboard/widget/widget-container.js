// ┌────────────────────────────────────────────────────────────────────────┐ \\
// │   widgetContainer : handles the div containing widget, and its         │ \\
// │                     interactions with containing divs                  │ \\
// ├────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2021 IFPEN                                            │ \\
// | Licensed under the Apache License, Version 2.0                         │ \\
// ├────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Tristan BARTEMENT, Mongi BEN GAID   │ \\
// └────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';

import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';
import { getElementLayoutPx, applyGeometry } from 'kernel/dashboard/widget/widget-placement';
import { convertVhtoPx, convertVwtoPx } from 'kernel/dashboard/scaling/scaling-utils';
import {
  modelsHiddenParams,
  modelsParameters,
  modelsTempParams,
  modelsLayout,
  models,
} from 'kernel/base/widgets-states';
import { widgetInstance } from 'kernel/dashboard/widget/widget-instance';

const minWidgetWidthCst = 32;
const minWidgetHeightCst = 32;

const DEFAULT_HEIGHT = 743;
const DEFAULT_WIDTH = 1679;

export class WidgetContainer {
  constructor() {
    this.wcNum = 100;

    /*
        widget id => {
          layout: { top: number, left: number, width: number, height: number, zIndex: number, page?: number },
          containerDiv: HTMLElement,
          modelJsonId: string,
          widgetDivId: string,
          widgetDiv: HTMLElement,
          instance : baseWidget,
        }
     */
    this.widgetsInfo = new Map();

    this.currentPage = undefined;
    this.pageNames = undefined;

    this.width = DEFAULT_WIDTH;
    this.height = DEFAULT_HEIGHT; // TODO infinite

    this.drpd = document.getElementById('DropperDroite');

    this.setMargins(10);
  }

  setMargins(value) {
    this.margins = value;
    this.drpd.style.padding = `${value}px`;

    // TODO resize
  }

  delete(instanceId) {
    const widgetInfo = this.widgetsInfo.get(instanceId);

    this.widgetsInfo.delete(instanceId);
    widgetInfo.containerDiv.parentNode.remove();
    this.#deleteData(instanceId);
  }

  clear() {
    for (const instanceId in this.widgetsInfo.keys()) {
      this.#deleteData(instanceId);
    }

    this.widgetsInfo.clear();
    this.drpd.innerHTML = '';
  }

  #deleteData(instanceId) {
    if (!_.isUndefined(modelsParameters[instanceId])) {
      delete modelsParameters[instanceId];
    }
    if (!_.isUndefined(models[instanceId])) {
      delete models[instanceId];
    }
    if (!_.isUndefined(modelsHiddenParams[instanceId])) {
      delete modelsHiddenParams[instanceId];
    }
    if (!_.isUndefined(modelsTempParams[instanceId])) {
      delete modelsTempParams[instanceId];
    }
  }

  /**
   * @description Get an ID for containerDiv (such WidgetContainer1xx)
   */
  #nextWidgetContainerId() {
    this.wcNum = this.wcNum + 1;
    return `WidgetContainer${this.wcNum}`;
  }

  /**
   *
   * @param {String} modelJsonId model template ID
   * @param {object=} wLayout
   * @param {number=} wzIndex (optional) used if provided, last widget has highest zIndex otherwise
   * @param {number=} page (optional)
   * @returns {object} layout
   */
  createLayout(modelJsonId, wLayout, wzIndex, page) {
    wLayout ??= {};
    wLayout.zIndex = wzIndex ?? this.nextZIndex();
    if (this.pageNames) {
      wLayout.page = page ?? this.currentPage ?? 0;
      wLayout.page = Math.min(wLayout.page, this.pageNames.length - 1);
    }

    const defaults = this.defaultLayoutPx(modelJsonId);
    wLayout.top ??= 0;
    wLayout.left ??= 0;
    wLayout.width ??= defaults.width ?? minWidgetWidthCst;
    wLayout.height ??= defaults.height ?? minWidgetHeightCst;

    if (defaults.minWidth) {
      wLayout.width = Math.max(wLayout.width, defaults.minWidth);
    }
    if (defaults.minHeight) {
      wLayout.height = Math.max(wLayout.height, defaults.minHeight);
    }

    // TODO coords constrain

    return wLayout;
  }

  defaultLayoutPx(modelJsonId) {
    const result = {};
    for (let [k, v] of Object.entries(modelsLayout[modelJsonId])) {
      if (typeof v === 'string') {
        if (v.endsWith('vh')) {
          v = convertVhtoPx(v);
        } else if (v.endsWith('vw')) {
          v = convertVwtoPx(v);
        } else {
          v = rmUnit(v);
        }

        result[k] = Math.round(v);
      }
    }
    return result;
  }

  minimumSize(instanceId) {
    const widgetInfo = this.widgetsInfo.get(instanceId);
    if (widgetInfo) {
      const defaults = this.defaultLayoutPx(widgetInfo.modelJsonId);
      return {
        minWidth: defaults.minWidth ?? minWidgetWidthCst,
        minHeight: defaults.minHeight ?? minWidgetHeightCst,
      };
    } else {
      throw new Error(`Instance not found ${instanceId}`);
    }
  }

  availableSpace() {
    return {
      width: this.width - 2 * this.margins,
      height: this.height - 2 * this.margins,
    };
  }

  get widgetIds() {
    return new Set(this.widgetsInfo.keys());
  }

  /**
   * Widget abstract factory
   * @param {any} modelJsonId  model template ID
   * @param {String=} instanceId  used if provided, will be created otherwise
   * @param {HTMLElement} cln
   * @param {any=} wLayout  used if provided, defaults used otherwise
   * @param {number=} wzIndex  used if provided, last widget has highest zIndex otherwise
   * @param {number=} page
   */
  createWidget(modelJsonId, instanceId, cln, wLayout, wzIndex, page) {
    wLayout = this.createLayout(modelJsonId, wLayout, wzIndex, page);

    // add widgetTitle to identify widget type with tooltip
    let widgetTitle = widgetsPluginsHandler.widgetToolbarDefinitions[modelJsonId].title ?? '';
    if (widgetTitle) widgetTitle += ' ';

    const aElement = document.createElement('a');
    aElement.id = `DIV_${instanceId}`;
    aElement.title = `${widgetTitle}(${instanceId})`;
    aElement.appendChild(cln);

    // generate containerDiv id
    const wcId = this.#nextWidgetContainerId();
    const div = document.createElement('div');
    div.id = wcId;
    cln.appendChild(div);

    this.#applyLayout(cln, wLayout);

    this.drpd.appendChild(aElement);

    try {
      const wo = widgetInstance.createWidget(wcId, modelJsonId, instanceId);
      this.widgetsInfo.set(instanceId, {
        layout: wLayout,
        containerDiv: cln,
        modelJsonId,
        widgetDivId: wcId,
        widgetDiv: div,
        instance: wo,
      });
    } catch (ex) {
      aElement.remove();
      throw ex;
    }
  }

  getWidgetContainerDiv(instanceId) {
    const info = this.widgetsInfo.get(instanceId);
    return info?.containerDiv;
  }

  getWidgetLayout(instanceId) {
    const info = this.widgetsInfo.get(instanceId);
    return info ? { ...info.layout } : undefined;
  }

  getCurrentWidgetGeometry(instanceId) {
    const info = this.widgetsInfo.get(instanceId);
    if (info) {
      return getElementLayoutPx(info.containerDiv);
    } else {
      return undefined;
    }
  }

  getRecordedGeometry(instanceId) {
    const { top, left, height, width } = this.getWidgetLayout(instanceId);
    return { top, left, height, width };
  }

  changeWidgetGeometry(instanceId, geometry) {
    const containerDiv = this.getWidgetContainerDiv(instanceId);
    this.#changeDivGeometry(containerDiv, geometry);
  }

  resetWidgetGeometry(instanceId) {
    this.changeWidgetGeometry(instanceId, this.getRecordedGeometry(instanceId));
  }

  #applyLayout(container, layout) {
    this.#changeDivGeometry(container, layout);

    if (layout.zIndex !== undefined) {
      container.style.zIndex = layout.zIndex;
    }

    const show = this.currentPage === undefined || this.currentPage === layout.page;
    container.style.display = show ? 'block' : 'none';
  }

  #changeDivGeometry(containerDiv, geometry) {
    applyGeometry(containerDiv, geometry);

    // Needed for CSS rule on ".widget" displaying the size
    containerDiv.setAttribute('item-width', geometry.width);
    containerDiv.setAttribute('item-height', geometry.height);
  }

  /**
   * @description Replace current widget by a new one when edition, resizing, changing json parameter,...
   * @param {any} element
   */
  /*--------Replace current Widget--------*/
  replaceWidget(elementId) {
    const widgetInfo = this.widgetsInfo.get(elementId);

    widgetInfo.widgetDiv.remove();
    const div = document.createElement('div');
    div.id = widgetInfo.widgetDivId;
    widgetInfo.containerDiv.appendChild(div);
    widgetInfo.widgetDiv = div;

    widgetInfo.instance = widgetsPluginsHandler.copyWidget(
      widgetInfo.widgetDivId,
      widgetInfo.modelJsonId,
      widgetInfo.instance,
      elementId,
      false
    );
  }

  /**
   * @description Enforces that widget layout respects container constraints in terms of:
   * - width and height (always inside container)
   * - left and top
   * @param {any} widgetLayoutPx
   * @param {any} containerLayoutPx (with no margins)
   */
  enforceConstraints(widgetLayoutPx) {
    const available = this.availableSpace();

    // Simplified notation
    let w_t = widgetLayoutPx.top,
      w_l = widgetLayoutPx.left,
      w_h = widgetLayoutPx.height,
      w_w = widgetLayoutPx.width;
    let c_t = 0,
      c_l = 0,
      c_h = available.height,
      c_w = available.width;

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
   * @description applies a requested position to a widget enforcing constraints
   * @param {any} element
   * @param {{left: number, top: number, width: number, height: number}} requestedLayoutPx
   */
  moveResizeWidget(elementId, requestedLayoutPx) {
    const info = this.widgetsInfo.get(elementId);

    requestedLayoutPx = { ...info.layout, ...requestedLayoutPx }; // Accept partial updates
    const layout = this.enforceConstraints(requestedLayoutPx);
    const isResize = layout.width !== info.layout.width || layout.height !== info.layout.height;

    info.layout = { ...info.layout, ...layout }; // enforceConstraints strip the non geometric parts
    this.#applyLayout(this.getWidgetContainerDiv(elementId), layout, this.currentPage);
    if (isResize) {
      this.replaceWidget(elementId);
    }
  }

  /**
   * Flashes a group of widgets
   * @param {Array<string>} elementIds
   */
  highlightWidgets(elementIds) {
    elementIds.forEach((id) => {
      const divContainer = this.getWidgetContainerDiv(id);
      if (divContainer) {
        $(divContainer).fadeOut(30).fadeIn(140);
      }
    });
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                    fore/background functions                       | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  /**
   * Sorts widgets by their zIndex
   * @param {Array.<string>} elements Array of widgets ids to sort
   * @returns {Array.<string>} the sorted array
   */
  #sortByZ(elements) {
    const zIndex = this.getZIndices();
    return elements.sort((a, b) => zIndex.get(a) - zIndex.get(b));
  }

  /**
   * Separates the widgets of the widgetEditor into a selected array and an unselected array
   * @param {Array.<string>} elementIds a selection of widget ids
   * @returns {Array.<Array.<string>>} two arrays containing respectively the selection and the rest
   */
  #splitWidgets(elementIds) {
    const sel = [];
    const rest = [];
    for (const key of this.widgetIds) {
      if (elementIds.includes(key)) {
        sel.push(key);
      } else {
        rest.push(key);
      }
    }
    return [sel, rest];
  }

  /**
   * Reaffect Zs to widgets using the provided order
   * @param {Array.<string>} elements An ordered array of widget ids
   * @returns {Map.<string, number>} A map of widget ids to Z value
   */
  static #renumberZ(elements) {
    let z = 1;
    const indices = new Map();
    elements.forEach((element) => indices.set(element, z++));
    return indices;
  }

  /**
   * Gets the maximum zIndex of all widgets in the widgetEditor
   * @returns {?number} the max zIndex, or 0 when there are no widgets
   */
  #getMaxZIndex() {
    return this.widgetsInfo.size ? Math.max(...this.widgetsInfo.values().map((l) => l.layout.zIndex)) : null;
  }

  /**
   * @returns {number} appropriate zIndex to place a new widget above all previous ones
   */
  nextZIndex() {
    return (this.#getMaxZIndex() ?? 0) + 1;
  }

  /**
   * Sets the zIndex of widgets in the widgetEditor
   * @param {Map.<string, number>} indices the new zIndexes, stored by widget id
   */
  setZIndices(indices) {
    for (const [key, z] of indices) {
      const layout = this.getWidgetLayout(key);
      if (layout) {
        if (layout.zIndex !== z) {
          layout.zIndex = z;
          const div = this.getWidgetContainerDiv(key);
          if (div) {
            div.style.zIndex = z;
          } else {
            throw new Error(`No widgetContainers for ${key}`);
          }
        }
      } else {
        throw new Error(`No widgetLayouts for ${key}`);
      }
    }
  }

  /**
   * Get the current zIndex of widgets in the widgetEditor
   * @returns {Map.<string, number>} A map of widget ids to Z value
   */
  getZIndices() {
    const indices = new Map();
    for (const [key, info] of this.widgetsInfo) {
      indices.set(key, info.layout.zIndex);
    }
    return indices;
  }

  /**
   * Move widgets to the foreground, keeping their relative order
   * @param {Array.<string>} elementIds the ids of widgets to move to the foreground
   */
  putWidgetAtForeground(elementIds) {
    const [sel, rest] = this.#splitWidgets(elementIds);
    const newOrder = [...this.#sortByZ(rest), ...this.#sortByZ(sel)];
    const newZs = WidgetContainer.#renumberZ(newOrder);
    this.setZIndices(newZs);
  }

  /**
   * Move widgets to the background, keeping their relative order
   * @param {Array.<string>} elementIds the ids of widgets to move to the background
   */
  putWidgetAtBackground(elementIds) {
    const [sel, rest] = this.#splitWidgets(elementIds);
    const newOrder = [...this.#sortByZ(sel), ...this.#sortByZ(rest)];
    const newZs = WidgetContainer.#renumberZ(newOrder);
    this.setZIndices(newZs);
  }
}
