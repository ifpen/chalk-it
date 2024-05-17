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

import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { widgetFactory } from 'kernel/dashboard/widget/widget-factory';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { editorSingletons } from 'kernel/editor-singletons';
import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';
import {
  getElementLayoutPx,
  computeContainerRelativeLayout,
  computeMaxHeightPx,
  computeMaxWidthPx,
  enforceConstraints,
} from 'kernel/dashboard/widget/widget-placement';
import { unitW, unitH } from 'kernel/dashboard/scaling/scaling-utils';
import { modelsHiddenParams, modelsParameters } from 'kernel/base/widgets-states';

function widgetContainerClass() {
  const minWidgetWidthCst = 32;
  const minWidgetHeightCst = 32;

  // "Class" (global) variables (for all widgets)
  var wcNum = 100;

  /**
   * @description Get an ID for containerDiv (such WidgetContainer1xx)
   */
  this.getWidgetContainerId = function () {
    wcNum = wcNum + 1;
    var idName = 'WidgetContainer';
    var wcId = idName + parseInt(wcNum);
    return wcId;
  };

  /**
   * @description Puts cln on targetDiv
   * @param {any} cln (mandatory) mainDiv
   * @param {any} targetDiv (optional) where to put mainDiv
   */
  this.putAndGetTargetDiv = function (cln, targetDiv) {
    if (!targetDiv) {
      targetDiv = editorSingletons.layoutMgr.getDefaultContainer();
    }
    targetDiv.appendChild(cln); // put cln in dashboard
    return targetDiv;
  };

  /**
   * @description Propagates mainDiv layout to containerDiv layout
   * @param {any} cln mainDiv DOM element
   * @param {any} div containerDiv DOM element
   */
  this.computeAndApplyContainerDivLayout = function (cln, div) {
    var w =
      parseFloat(cln.style.width.substring(0, cln.style.width.length - 2)) -
      2 * (100 / document.documentElement.clientWidth);
    var h =
      parseFloat(cln.style.height.substring(0, cln.style.height.length - 2)) -
      2 * (100 / document.documentElement.clientHeight);
    div.style.width = w.toString() + 'vw';
    div.style.height = h.toString() + 'vh';

    if (cln.style.minWidth != '') {
      div.style.minWidth = parseFloat(cln.style.minWidth) - 5 + 'px';
      div.style.width =
        Math.max(
          parseFloat(div.style.minWidth) * (100 / document.documentElement.clientWidth),
          parseFloat(div.style.width)
        ) + 'vw';
    }
    if (cln.style.minHeight != '') {
      div.style.minHeight = parseFloat(cln.style.minHeight) - 5 + 'px';
      div.style.height =
        Math.max(
          parseFloat(div.style.minHeight) * (100 / document.documentElement.clientHeight),
          parseFloat(div.style.height)
        ) + 'vh';
    }
  };

  /**
   * @description Replace current widget by a new one when edition, resizing, changing json parameter,...
   * @param {any} element
   */
  /*--------Replace current Widget--------*/
  this.replaceWidget = function (element) {
    var wcId;
    for (var ch = element.childNodes.length - 1; ch >= 0; ch--) {
      if (element.childNodes[ch].id.match('WidgetContainer')) {
        // MBG temp : to move to widget object
        wcId = element.childNodes[ch].id;
        element.removeChild(element.childNodes[ch]);
        break; // true because only one container exist
      }
    }

    element.style.top = unitH(element.offsetTop);
    element.style.left = unitW(element.offsetLeft);
    element.style.height = unitH(element.offsetHeight);
    element.style.width = unitW(element.offsetWidth);

    element.setAttribute('item-width', element.offsetWidth);
    element.setAttribute('item-height', element.offsetHeight);

    var div = document.createElement('div');
    div.style.height = unitH(element.offsetHeight - 2);
    div.style.width = unitW(element.offsetWidth - 2);
    div.style.minWidth = parseFloat(element.style.minWidth) - 5 + 'px';
    div.style.minHeight = parseFloat(element.style.minHeight) - 5 + 'px';

    element.appendChild(div);
    div.id = wcId;
    var modelJsonIdStr = element.id.substring(0, element.id.length - 1);

    var instanceId = element.id;
    const widgetEditor = editorSingletons.widgetEditor;
    var widgetTitle = widgetEditor.widgetContainers.get(instanceId).widgetTitle; //AEF
    widgetEditor.widgetObject[instanceId] = widgetsPluginsHandler.copyWidget(
      wcId,
      modelJsonIdStr,
      widgetEditor.widgetObject[instanceId],
      instanceId,
      false
    );
    widgetEditor.widgetContainers.set(instanceId, {
      id: instanceId,
      instanceId: instanceId,
      modelJsonId: modelJsonIdStr,
      name: instanceId,
      divContainer: div,
      divModel: element,
      widgetObj: widgetEditor.widgetObject[instanceId],
      widgetTitle: widgetTitle, //AEF
    });
    return div;
  };

  /**
   * @description Gets the minWidth property of the element in px
   * @param {any} element
   */
  this.getMinWidth = function (element) {
    var minWidth = minWidgetWidthCst;
    if (element.style.minWidth != '') {
      minWidth = parseFloat(rmUnit(element.style.minWidth));
    }
    return minWidth;
  };

  /**
   * @description Gets the minHeight property of the element in px
   * @param {any} element
   */
  this.getMinHeight = function (element) {
    var minHeight = minWidgetHeightCst;
    if (element.style.minHeight != '') {
      minHeight = parseFloat(rmUnit(element.style.minHeight));
    }
    return minHeight;
  };

  /**
   * @description Computes the maxWidth property of widget considering its container
   * @param {any} element
   */
  this.getMaxWidth = function (element) {
    const widgetLayoutPx = getElementLayoutPx(element);
    const container = editorSingletons.widgetEditor.getContainer(element);
    const absoluteContainerLayoutPx = getElementLayoutPx(container);
    const maxWidthPx = computeMaxWidthPx(widgetLayoutPx, absoluteContainerLayoutPx);
    return maxWidthPx;
  };

  /**
   * @description Computes the maxHeight property of widget considering its container
   * @param {any} element
   */
  this.getMaxHeight = function (element) {
    const widgetLayoutPx = getElementLayoutPx(element);
    const container = editorSingletons.widgetEditor.getContainer(element);
    const absoluteContainerLayoutPx = getElementLayoutPx(container);
    const maxHeightPx = computeMaxHeightPx(widgetLayoutPx, absoluteContainerLayoutPx);
    return maxHeightPx;
  };

  /**
   * /@description Gets widget floating state
   * @param {any} element
   * @returns FLOATING, FIXED
   */
  this.getFloatingState = function (element) {
    if (editorSingletons.layoutMgr.isRowColMode()) {
      if (element.parentNode.parentNode.id === 'DropperDroite') {
        return 'FLOATING';
      } else {
        return 'FIXED';
      }
    } else {
      return 'FIXED';
    }
  };

  /**
   * @description applies a translation to a widget enforcing constraints
   * @param {any} element
   * @param {any} translationPx
   */
  this.translateWidgetPx = function (element, translationPx) {
    // work on px
    var widgetLayoutPx = getElementLayoutPx(element);
    // translate !
    var requestedLayoutPx = {
      top: widgetLayoutPx.top + translationPx.top,
      left: widgetLayoutPx.left + translationPx.left,
      width: widgetLayoutPx.width,
      height: widgetLayoutPx.height,
    };

    this.moveResizeWidget(element, requestedLayoutPx);
  };

  /**
   * @description applies positioning constraints to a position
   * @param {any} element widget for which the constraining is to be done
   * @param {{left: number, top: number, width: number, height: number}} requestedLayoutPx layout to contrain
   * @returns {{left: number, top: number, width: number, height: number}} a corrected layout containing constrained values
   */
  this.constrainLayout = function _constrainLayout(element, requestedLayoutPx) {
    let containerLayoutPx;

    const layoutMgr = editorSingletons.layoutMgr;
    if (layoutMgr.isRowColMode()) {
      // RowColMode
      const containerDiv = editorSingletons.widgetEditor.getContainer(element);
      if (this.getFloatingState(element) === 'FIXED') {
        // work in relative coordinates
        containerLayoutPx = getElementLayoutPx(containerDiv);

        // Make container relative
        containerLayoutPx = computeContainerRelativeLayout(containerLayoutPx);
      } else {
        // work in absolute coordinates
        if (containerDiv.id === 'DropperDroite') {
          // getElementLayoutPx fails because DropperDroite has an offset we don't care about
          containerLayoutPx = {
            left: 0,
            top: 0,
            width: layoutMgr.maxLeftCst,
            height: layoutMgr.maxTopCst,
          };
        } else {
          containerLayoutPx = getElementLayoutPx(containerDiv);
        }
      }
    } else {
      // NotebookMode
      containerLayoutPx = {
        left: 0,
        top: 0,
        width: layoutMgr.maxLeftCst,
        height: layoutMgr.maxTopCst,
      };
    }

    return enforceConstraints(requestedLayoutPx, containerLayoutPx);
  };

  /**
   * @description applies a requested position to a widget enforcing constraints
   * @param {any} element
   * @param {{left: number, top: number, width: number, height: number}} requestedLayoutPx
   */
  this.moveResizeWidget = function _moveResizeWidget(element, requestedLayoutPx, bDontReact, bIsResize) {
    let consTranslatedWidgetPx = null;

    if (!bDontReact) {
      // safety when called from dragResize
      if (element.parentNode.parentNode == null) return null;

      // enforce constaints ;)
      consTranslatedWidgetPx = this.constrainLayout(element, requestedLayoutPx);

      // apply
      element.style.top = unitH(consTranslatedWidgetPx.top);
      element.style.left = unitW(consTranslatedWidgetPx.left);
      element.style.height = unitH(consTranslatedWidgetPx.height);
      element.style.width = unitW(consTranslatedWidgetPx.width);

      if (bIsResize) {
        widgetContainer.replaceWidget(element);
      }
    }

    // relative coordinates update
    const $element = $(element);
    const $container = $(element.parentNode.parentNode);
    const widgetEditor = editorSingletons.widgetEditor;
    if (bIsResize) {
      widgetEditor.widthRatioModels[element.id] = $element.width() / $container.width();
      widgetEditor.heightRatioModels[element.id] = $element.height() / $container.height();
    }
    widgetEditor.leftRatioModels[element.id] = $element.position().left / $container.width();
    widgetEditor.topRatioModels[element.id] = $element.position().top / $container.height();

    return consTranslatedWidgetPx;
  };

  /**
   * Flashes a group of widgets
   * @param {Array<string>} elementIds
   */
  this.highlightWidgets = function _highlightWidgets(elementIds) {
    elementIds.forEach((id) => {
      const elem = editorSingletons.widgetEditor.widgetContainers.get(id);
      if (elem && elem.divContainer) {
        $(elem.divContainer).fadeOut(30).fadeIn(140);
      }
    });
  };

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                        duplication functions                       | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  /*--------duplicateWidgetWithConnection--------*/
  this.duplicateWidgetWithConnection = function (element, instanceId) {
    instanceId = this.duplicateWidget(element, instanceId);
    if (!_.isUndefined(widgetConnector.widgetsConnection[element.id])) {
      widgetConnector.duplicateConnection(instanceId, element);
    }
    return instanceId;
  };

  /*--------duplicateWidget--------*/
  this.duplicateWidget = function (element, instanceId) {
    // TODO check id not used

    const modelJsonIdStr = element.id.substring(0, element.id.length - 1);
    // work on px
    const widgetLayoutPx = getElementLayoutPx(element);
    // translate !
    const requestedLayoutPx = {
      top: widgetLayoutPx.top + 20,
      left: widgetLayoutPx.left + 20,
      width: widgetLayoutPx.width,
      height: widgetLayoutPx.height,
    };
    const constrainedLayout = this.constrainLayout(element, requestedLayoutPx);
    let wLayout = {};
    wLayout.top = unitH(constrainedLayout.top);
    wLayout.left = unitW(constrainedLayout.left);
    wLayout.height = unitH(constrainedLayout.height);
    wLayout.width = unitW(constrainedLayout.width);

    // MBG : TODO : factory have to automatically create instance ID
    if (!instanceId) {
      instanceId = widgetFactory.createUniqueInstanceId(modelJsonIdStr);
    }
    // MBG : TODO : extend factory to transmit modelsHiddenParams
    // MBG : TODO : rename globally modelsHiddenParams to instanceHiddenParams
    // MBG : TODO : rename globally modelsParameters to instanceParameters
    modelsHiddenParams[instanceId] = jQuery.extend(true, {}, modelsHiddenParams[element.id]);
    modelsParameters[instanceId] = jQuery.extend(true, {}, modelsParameters[element.id]);

    const widgetEditor = editorSingletons.widgetEditor;
    const targetDiv = widgetEditor.getContainer(element);
    widgetEditor.addWidget(modelJsonIdStr, targetDiv, instanceId, wLayout);
    return instanceId;
  };

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                    fore/background functions                       | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  /**
   * Sorts widgets by their zIndex
   * @param {Array.<Object>} elements Array of widgets to sort
   * @returns {Array.<Object>} the sorted array
   */
  function _sortByZ(elements) {
    return elements.sort((a, b) => a.divModel.style.zIndex - b.divModel.style.zIndex);
  }

  /**
   * Separates the widgets of the widgetEditor into a selected array and an unselected array
   * @param {Array.<string>} elementIds a selection of widget ids
   * @returns {Array.<Array.<Object>>} two arrays containing respectively the selection and the rest
   */
  function _splitWidgets(elementIds) {
    const sel = [];
    const rest = [];
    const widgetEditor = editorSingletons.widgetEditor;
    for (const [key, val] of widgetEditor.widgetContainers) {
      if (elementIds.includes(key)) {
        sel.push(val);
      } else {
        rest.push(val);
      }
    }
    return [sel, rest];
  }

  /**
   * Reaffect Zs to widgets using the provided order
   * @param {Array.<Object>} elements An ordered array of widgets
   * @returns {Map.<string, number>} A map of widget ids to Z value
   */
  function _renumberZ(elements) {
    let z = 1;
    const indices = new Map();
    elements.forEach((element) => indices.set(element.instanceId, z++));
    return indices;
  }

  /**
   * Gets the maximum zIndex of all widgets in the widgetEditor
   * @returns {?number} A map of widget ids to Z value
   */
  this.getMaxZIndex = function _getMaxZIndex() {
    let max = null;
    const widgetEditor = editorSingletons.widgetEditor;
    for (const element of widgetEditor.widgetContainers.values()) {
      const z = element.divModel.style.zIndex;
      if (z !== undefined) {
        const zVal = parseInt(z, 10);
        if (!isNaN(zVal) && (max === null || max < zVal)) {
          max = zVal;
        }
      }
    }
    return max;
  };

  /**
   * Sets the zIndex of widgets in the widgetEditor
   * @param {Map.<string, number>} indices the new zIndexes, stored by widget id
   */
  this.setZIndices = function _setZIndices(indices) {
    const containers = editorSingletons.widgetEditor.widgetContainers;
    for (const [key, z] of indices) {
      const widget = containers.get(key);
      if (widget && widget.divModel.style.zIndex !== z) {
        widget.divModel.style.zIndex = z;
      }
    }
  };

  /**
   * Get the current zIndex of widgets in the widgetEditor
   * @returns {Map.<string, number>} A map of widget ids to Z value
   */
  this.getZIndices = function _getZIndices() {
    const indices = new Map();
    const widgetEditor = editorSingletons.widgetEditor;
    for (const [key, widget] of widgetEditor.widgetContainers) {
      indices.set(key, widget.divModel.style.zIndex);
    }
    return indices;
  };

  /**
   * Move widgets to the foreground, keeping their relative order
   * @param {Array.<string>} elementIds the ids of widgets to move to the foreground
   */
  this.putWidgetAtForeground = function _putWidgetAtForeground(elementIds) {
    const [sel, rest] = _splitWidgets(elementIds);
    const newOrder = [..._sortByZ(rest), ..._sortByZ(sel)];
    const newZs = _renumberZ(newOrder);
    this.setZIndices(newZs);
  };

  /**
   * Move widgets to the background, keeping their relative order
   * @param {Array.<string>} elementIds the ids of widgets to move to the background
   */
  this.putWidgetAtBackground = function _putWidgetAtBackground(elementIds) {
    const [sel, rest] = _splitWidgets(elementIds);
    const newOrder = [..._sortByZ(sel), ..._sortByZ(rest)];
    const newZs = _renumberZ(newOrder);
    this.setZIndices(newZs);
  };
}

export const widgetContainer = new widgetContainerClass();
