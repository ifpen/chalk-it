// ┌────────────────────────────────────────────────────────────────────────┐ \\
// │   widgetEditorViewer : handles the div containing widget, and its      │ \\
// │                        interactions with containing divs               │ \\
// ├────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2021 IFPEN                                            │ \\
// | Licensed under the Apache License, Version 2.0                         │ \\
// ├────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Tristan BARTEMENT, Mongi BEN GAID   │ \\
// └────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';

import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';
import { getElementLayoutPx, applyGeometry, enforceConstraints } from 'kernel/dashboard/widget/widget-placement';
import { convertVhtoPx, convertVwtoPx } from 'kernel/dashboard/scaling/scaling-utils';
import {
  modelsHiddenParams,
  modelsParameters,
  modelsTempParams,
  modelsLayout,
  models,
} from 'kernel/base/widgets-states';
import { widgetInstance } from 'kernel/dashboard/widget/widget-instance';
import { widgetViewer } from 'kernel/dashboard/rendering/widget-viewer';

const minWidgetWidthCst = 32;
const minWidgetHeightCst = 32;

const DEFAULT_MARGIN = 10;
const DEFAULT_HEIGHT = 743 - 2 * DEFAULT_MARGIN;
const DEFAULT_WIDTH = 1679 - 2 * DEFAULT_MARGIN;

export const MAIN_CONTAINER_ID = 'DropperDroite';

/**
 * Display the dashboard and its widgets for the editor. Keeps track of their instances, geometries, etc.
 */
export class WidgetEditorViewer {
  constructor() {
    this.drpd = document.getElementById(MAIN_CONTAINER_ID);

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
    this.pageNames = [];

    this.width = DEFAULT_WIDTH;
    this.height = DEFAULT_HEIGHT;

    this.enforceHeightLimit = false; // keep old fashion

    this.setMargins(DEFAULT_MARGIN, DEFAULT_MARGIN);
  }

  /**
   * @returns {{ width: number, height: number }} the size necessary to accomodate maximal canvas as old way in Chalk'it
   */
  getMaximalFitCanvasSize() {
    let width = 0;
    let height = 0;

    width  = document.getElementById("dashboard-editor-div").clientWidth  -  this.marginX * 2 - 2;
    height = document.getElementById("dashboard-editor-div").clientHeight -  this.marginY * 2 - 4;

    return { width, height };
  }

  /**
   * @returns {{ width: number, height: number }} the size necessary to accomodate all contained widgets
   */
  getContentSize() {
    let width = 0;
    let height = 0;

    this.widgetsInfo.values().forEach((info) => {
      const layout = info.layout;
      width = Math.max(width, layout.left + layout.width);
      height = Math.max(height, layout.top + layout.height);
    });

    return { width, height };
  }

  /**
   * @param {boolean} includeOverflow if true, return the total size of the dashboard, independently of any scrolling (for when enforceHeightLimit is not set)
   * @returns {{ width: number, height: number }} the total size of the dashboard, including margins.
   */
  getDisplaySize(includeOverflow = false) {
    let width = this.width;
    let height = this.height;
    if (includeOverflow) {
      const content = this.getContentSize();
      width = Math.max(width, content.width);
      height = Math.max(height, content.height);
    }
    return { width: width + this.marginX * 2, height: height + this.marginY * 2 };
  }

  /**
   * Update the dashboard's size (meaning the size available for widgets).
   * @param {number} width
   * @param {number} height
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Update the dashboard's margins.
   * Changes the dashboard's exterior size, but not the space available for widgets.
   * @param {number} valueX
   * @param {number} valueY
   */
  setMargins(valueX, valueY) {
    this.marginX = valueX;
    this.marginY = valueY;
    this.drpd.style.padding = `${this.marginY}px ${this.marginX}px`;

    widgetViewer.setMargins(valueX, valueY);
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
    if (this.pageNames.length) {
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

    return {
      ...wLayout,
      ...this.constrainLayout(wLayout),
    };
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

  /**
   * @param {string} instanceId
   * @returns {minWidth: number, minHeight: number} the minimum allowed size for a widget
   */
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

  /**
   * @returns {{width: number, height: number}} the total available space for widgets. May be infinite.
   */
  availableSpace() {
    return {
      width: this.width,
      height: this.enforceHeightLimit ? this.height : Infinity,
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

  /**
   * Changes a widget's geometry without recording the changes. Meant for transient UI changes like the drag&drop.
   * Should always result in a call to "resetWidgetGeometry" when done.
   * @param {string} instanceId
   * @param {{ top: number, left: number, width: number, height: number }} geometry in pixels
   */
  changeWidgetGeometry(instanceId, geometry) {
    const containerDiv = this.getWidgetContainerDiv(instanceId);
    this.#changeDivGeometry(containerDiv, geometry);
  }

  /**
   * (Re)apply a widget's expected geometry to its DOM element. Only needed when the elements were (temporarily)
   * manipulated directly.
   * @param {string} instanceId
   */
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

  #applyCurrentPage() {
    this.widgetsInfo.values().forEach((info) => {
      const show = this.currentPage === undefined || this.currentPage === info.layout.page;
      info.containerDiv.style.display = show ? 'block' : 'none';
    });

    widgetViewer.setCurrentPage(this.currentPage);
  }

  changePage(pageNb) {
    if (this.pageNames.length) {
      if (pageNb < 0 || pageNb >= this.pageNames.length) {
        throw new Error(`Invalid page: ${pageNb}`);
      }

      this.currentPage = pageNb;
      this.#applyCurrentPage();
    } else throw new Error('There are no pages');
  }

  updatePages(newPages) {
    this.pageNames = [...newPages];
    if (this.pageNames.length) {
      this.currentPage ??= 0;
      this.currentPage = Math.min(this.currentPage, this.pageNames.length - 1);

      this.widgetsInfo.values().forEach((info) => {
        info.layout.page =
          info.layout.page === undefined ? this.currentPage : Math.min(info.layout.page, this.pageNames.length - 1);
      });
    } else {
      this.currentPage = undefined;
      this.widgetsInfo.values().forEach((info) => {
        info.layout.page = undefined;
      });
    }

    this.#applyCurrentPage();
  }

  collectWidgetPages() {
    const pages = new Map();
    for (const [key, info] of this.widgetsInfo) {
      if (info.layout.page !== undefined) {
        pages.set(key, info.layout.page);
      }
    }
    return pages;
  }

  setWidgetPages(widgetPages) {
    for (const [key, page] of widgetPages) {
      const info = this.widgetsInfo.get(key);
      info.layout.page = page;
    }
    this.#applyCurrentPage();
  }

  isVisible(widgetId) {
    const info = this.widgetsInfo.get(widgetId);
    return this.currentPage === undefined || this.currentPage === info.layout.page;
  }

  /**
   * @description Replace current widget by a new one when edition, resizing, changing json parameter,...
   * @param {any} element
   */
  /*--------Replace current Widget--------*/
  replaceWidget(elementId) {
    const widgetInfo = this.widgetsInfo.get(elementId);

    const div = document.createElement('div');
    div.id = widgetInfo.widgetDivId;
    widgetInfo.widgetDiv.replaceWith(div);
    widgetInfo.widgetDiv = div;

    try {
      widgetInfo.instance = widgetsPluginsHandler.copyWidget(
        widgetInfo.widgetDivId,
        widgetInfo.modelJsonId,
        widgetInfo.instance,
        elementId,
        false
      );
    } catch (ex) {
      // Protect against any failure from the widget's implementation
      console.error(`Failed to recreate an instance of ${elementId}`, ex);
    }
  }

  /**
   * @description Enforces that a widget layout respects container constraints in terms of:
   * - integer coordinates
   * - width and height (always inside container)
   * - left and top
   * @param {{top: number, left: number, width: number, height: number}}
   */
  constrainLayout(widgetLayoutPx) {
    const widgetLayoutInt = {
      top: Math.round(widgetLayoutPx.top),
      left: Math.round(widgetLayoutPx.left),
      height: Math.round(widgetLayoutPx.height),
      width: Math.round(widgetLayoutPx.width),
    };

    const { width, height } = this.availableSpace();
    const containerLayoutPx = {
      top: 0,
      left: 0,
      height,
      width,
    };

    return enforceConstraints(widgetLayoutInt, containerLayoutPx);
  }

  /**
   * @description applies a requested position to a widget enforcing constraints
   * @param {any} element
   * @param {{left: number, top: number, width: number, height: number}} requestedLayoutPx
   */
  moveResizeWidget(elementId, requestedLayoutPx) {
    const info = this.widgetsInfo.get(elementId);

    requestedLayoutPx = { ...info.layout, ...requestedLayoutPx }; // Accept partial updates
    const layout = this.constrainLayout(requestedLayoutPx);
    const isResize = layout.width !== info.layout.width || layout.height !== info.layout.height;

    info.layout = { ...info.layout, ...layout }; // constrainLayout strips the non geometric parts
    this.#applyLayout(this.getWidgetContainerDiv(elementId), info.layout);
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
      const info = this.widgetsInfo.get(id);
      if (info) {
        if (this.currentPage === info.layout.page) {
          $(info.containerDiv).fadeOut(30).fadeIn(140);
        } else {
          $(info.containerDiv).fadeIn(30).fadeOut(140);
        }
      }
    });
  }

  rerenderWidgets() {
    this.widgetsInfo.values().forEach((info) => {
      try {
        info.instance.render();
      } catch (e) {
        console.error('Widget render failed', e);
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
      const info = this.widgetsInfo.get(key);
      if (info) {
        if (info.layout.zIndex !== z) {
          info.layout.zIndex = z;
          const div = info.containerDiv;
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
    const newZs = WidgetEditorViewer.#renumberZ(newOrder);
    this.setZIndices(newZs);
  }

  /**
   * Move widgets to the background, keeping their relative order
   * @param {Array.<string>} elementIds the ids of widgets to move to the background
   */
  putWidgetAtBackground(elementIds) {
    const [sel, rest] = this.#splitWidgets(elementIds);
    const newOrder = [...this.#sortByZ(sel), ...this.#sortByZ(rest)];
    const newZs = WidgetEditorViewer.#renumberZ(newOrder);
    this.setZIndices(newZs);
  }
}
