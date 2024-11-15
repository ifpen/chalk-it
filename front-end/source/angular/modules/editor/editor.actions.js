// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ editor.actions                                                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2024 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                           │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { UndoableAction } from './editor.undo-manager';
import { EVENTS_EDITOR_WIDGET_MOVED } from './editor.events';
import { modelsHiddenParams, modelsParameters } from 'kernel/base/widgets-states';
import { scale, constrain } from 'kernel/dashboard/widget/widget-placement';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { editorSingletons } from 'kernel/editor-singletons';
import {
  EVENTS_EDITOR_CONNECTIONS_CHANGED,
  EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED,
} from 'angular/modules/editor/editor.events';

const UNDO_MOVE_MERGE_WINDO_MS = 1_000;

/**
 * Spread elements, defined by a position and a size in a 1D space, so that they occupy the same range in the
 * same order, but are evenly spread using a constant margin.
 * @param {Array.<{elementId: string, position:number, size:number}>} elements array of elements to re-arrange
 * @returns {Array.<{elementId: string, position:number}>} the re-arranged positions
 */
function _computeSpread(elements) {
  const sortedElements = elements.sort((a, b) => a.position - b.position);
  const nb = elements.length;
  const start = sortedElements[0].position;
  const lastElement = sortedElements[nb - 1];
  const end = lastElement.position + lastElement.size;
  const availableSpace = end - start;
  if (availableSpace <= 0) {
    return elements;
  }

  let totalSize = 0;
  for (const e of sortedElements) totalSize += e.size;

  const availableMargin = availableSpace - totalSize; // yes, this may be negative
  const margin = availableMargin / (nb - 1);

  let position = start;
  const result = [];
  for (const { elementId, size } of sortedElements) {
    result.push({ elementId, position });
    position += size + margin;
  }
  return result;
}

/**
 * @param {Array.<string>} neededDs array of datanodes names
 * @returns {boolean} true if all input datanodes exists
 */
function _datanodesExists(neededDs) {
  const availableDs = datanodesManager.getAllDataNodes().map((ds) => ds.name());
  const missingDs = neededDs.filter((ds) => !availableDs.includes(ds));
  return missingDs.length === 0;
}

/**
 * @returns {Array.<string>} the names off all connected datanodes
 */
function _collectUsedDatasources(widgetConnections) {
  const result = [];
  if (widgetConnections.sliders) {
    for (const c in widgetConnections.sliders) {
      const slider = widgetConnections.sliders[c];
      if (slider && slider.dataNode && slider.dataNode !== 'None') {
        result.push(slider.dataNode);
      }
    }
  }

  return result;
}

class ToForegroundAction extends UndoableAction {
  constructor(widgetContainer, elementIds) {
    super();
    this._widgetContainer = widgetContainer;
    this._elementIds = elementIds;
    this._initialZs = undefined;
  }

  label() {
    return this._elementIds.length > 1 ? 'Move widgets to foreground' : 'Move widget to foreground';
  }

  run() {
    this._initialZs = this._widgetContainer.getZIndices();
    this._widgetContainer.putWidgetAtForeground(this._elementIds);
  }

  canRedo() {
    // TODO check Ids
    return true;
  }

  canUndo() {
    // TODO check Ids
    return this._initialZs !== undefined;
  }

  undo() {
    this._widgetContainer.setZIndices(this._initialZs);
    this._initialZs = undefined;
  }
}

class ToBackgroundAction extends UndoableAction {
  constructor(widgetContainer, elementIds) {
    super();
    this._widgetContainer = widgetContainer;
    this._elementIds = elementIds;
    this._initialZs = undefined;
  }

  label() {
    return this._elementIds.length > 1 ? 'Move widgets to background' : 'Move widget to background';
  }

  run() {
    this._initialZs = this._widgetContainer.getZIndices();
    this._widgetContainer.putWidgetAtBackground(this._elementIds);
  }

  canRedo() {
    // TODO check Ids
    return true;
  }

  canUndo() {
    // TODO check Ids
    return this._initialZs !== undefined;
  }

  undo() {
    this._widgetContainer.setZIndices(this._initialZs);
    this._initialZs = undefined;
  }
}

/**
 * Move widget to an other page
 */
class MoveWidgetsToPageAction extends UndoableAction {
  /**
   *
   * @param {*} widgetEditor
   * @param {EventCenter} eventCenter Used to notify when widgets moved
   * @param {Array.<string>} elementIds ids of the elements to move
   * @param {number} page target page
   */
  constructor(widgetEditor, eventCenter, elementIds, page) {
    super();
    this._widgetEditor = widgetEditor;
    this._eventCenter = eventCenter;
    this._elementIds = elementIds;
    this._page = page;

    this._initialPages = undefined;
  }

  label() {
    return `Move widget${this._elementIds.length > 1 ? 's' : ''} to page ${this._page + 1}`;
  }

  run() {
    const container = this._widgetEditor.widgetContainer;
    this._initialPages = container.collectWidgetPages();

    const pages = new Map();
    for (const elementId of this._elementIds) {
      pages.set(elementId, this._page);
    }

    container.setWidgetPages(pages);
    this._eventCenter.sendEvent(UpdateGeometryAction.WIDGET_MOVED_EVENT);
  }

  canRedo() {
    // TODO check Ids
    return true;
  }

  canUndo() {
    // TODO check Ids
    return this._initialPages !== undefined;
  }

  undo() {
    this._widgetEditor.widgetContainer.setWidgetPages(this._initialPages);
    this._initialPages = undefined;
    this._eventCenter.sendEvent(UpdateGeometryAction.WIDGET_MOVED_EVENT);
  }
}

/**
 * Update parts or all of widgets' geometry
 */
class UpdateGeometryAction extends UndoableAction {
  static WIDGET_MOVED_EVENT = EVENTS_EDITOR_WIDGET_MOVED;

  /**
   * Apply the same transformation to multiple widgets
   *
   * @param {*} widgetEditor
   * @param {EventCenter} eventCenter Used to notify when widgets moved
   * @param {Array.<string>} elementIds ids of the elements to update
   * @param {{left: (number|undefined), top: (number|undefined), width: (number|undefined), height:(number|undefined)}} geometryUpdate the new geometry to apply to widgets. Can be partial.
   * @param {string=} label
   * @param {boolean=} relative
   * @param {number=} mergeTimeoutMs time stamp before which a merge with the next action will be considered
   * @returns {UpdateGeometryAction}
   */
  static CreateSimpleUpdate(
    widgetEditor,
    eventCenter,
    elementIds,
    geometryUpdate,
    label,
    relative = false,
    mergeTimeoutMs
  ) {
    const updates = new Map();
    for (const id of elementIds) {
      updates.set(id, geometryUpdate);
    }
    return new UpdateGeometryAction(widgetEditor, eventCenter, updates, label, relative, mergeTimeoutMs);
  }

  /**
   *
   * @param {*} widgetEditor
   * @param {EventCenter} eventCenter Used to notify when widgets moved
   * @param {Map.<string,{left: number, top: number, width: (number|undefined), height:(number|undefined)}>} geometryUpdates new geometries (not including margins) per widget id. Can be partial.
   * @param {string=} label
   * @param {boolean=} relative
   * @param {number=} mergeTimeoutMs time stamp before which a merge with the next action will be considered
   */
  constructor(widgetEditor, eventCenter, geometryUpdates, label, relative = false, mergeTimeoutMs) {
    super();
    this._widgetEditor = widgetEditor;
    this._eventCenter = eventCenter;
    this._geometryUpdates = geometryUpdates;
    this._label = label ? label : 'Set widget geometry';
    this._relative = relative;
    this._mergeTimeout = mergeTimeoutMs;

    this._initialGeometries = undefined;
  }

  merge(previous) {
    if (
      previous instanceof UpdateGeometryAction &&
      previous._mergeTimeout !== undefined &&
      Date.now() <= previous._mergeTimeout &&
      this._relative === previous._relative &&
      // Need same ids
      this._geometryUpdates.size === previous._geometryUpdates.size
    ) {
      const newUpdates = new Map();
      for (const [key, prevUpdate] of previous._geometryUpdates) {
        const update = this._geometryUpdates.get(key);
        if (!update) {
          // Not the same widgets updated
          return null;
        }

        const myKeys = Object.keys(update);
        const previousKeys = Object.keys(prevUpdate);
        if (myKeys.length !== previousKeys.length || !myKeys.every((id) => previousKeys.includes(id))) {
          // Not the same keys
          return null;
        }

        const newUpdate = { ...update };
        if (this._relative) {
          for (const [key, value] of Object.entries(prevUpdate)) {
            if (value > 0 !== update[key] > 0) {
              // Only merge when going the same way
              return null;
            }
          }
          for (const [key, value] of Object.entries(prevUpdate)) {
            newUpdate[key] += value;
          }
        }
        newUpdates.set(key, newUpdate);
      }
      this._initialGeometries = previous._initialGeometries;
      this._geometryUpdates = newUpdates;
      return this;
    }
    return null;
  }

  label() {
    return this._label;
  }

  run() {
    const widgetContainer = this._widgetEditor.widgetContainer;
    this._initialGeometries = new Map();

    for (const [elementid, update] of this._geometryUpdates) {
      let oldPosition = widgetContainer.getRecordedGeometry(elementid);
      if (oldPosition) {
        let newPosition;
        if (this._relative) {
          newPosition = { ...oldPosition };
          for (const [key, value] of Object.entries(update)) {
            newPosition[key] += value;
          }
        } else {
          newPosition = { ...oldPosition, ...update };
        }

        this._initialGeometries.set(elementid, { ...oldPosition });

        widgetContainer.moveResizeWidget(elementid, newPosition);
      }
    }
    this._eventCenter.sendEvent(UpdateGeometryAction.WIDGET_MOVED_EVENT);
    if (!widgetContainer.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }

  canRedo() {
    // TODO check Ids
    return true;
  }

  canUndo() {
    // TODO check Ids
    return this._initialGeometries !== undefined;
  }

  undo() {
    const widgetContainer = this._widgetEditor.widgetContainer;
    for (const [elementid, oldPosition] of this._initialGeometries) {
      widgetContainer.moveResizeWidget(elementid, oldPosition);
    }
    this._initialGeometries = undefined;
    this._eventCenter.sendEvent(UpdateGeometryAction.WIDGET_MOVED_EVENT);
    if (!widgetContainer.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }
}

/**
 * Creates a new widget
 */
class CreateWidgetAction extends UndoableAction {
  /**
   * @param {*} widgetEditor
   * @param {EventCenter} eventCenter
   * @param {string} modelJsonId id of the widget type to create
   * @param {=string} label action label for the history.
   * @param {undefined|{left: (number|undefined), top: (number|undefined), width: (number|undefined), height:(number|undefined), page: (number|undefined)}} layout Optional. Where to place the widget.
   */
  constructor(widgetEditor, eventCenter, modelJsonId, label, layout) {
    super();
    this._widgetEditor = widgetEditor;
    this._eventCenter = eventCenter;
    this._modelJsonId = modelJsonId;
    this._label = label || 'Add widget';
    this._layout = layout;

    this._widgetId = undefined;
    this._actualLayout = undefined;
  }

  label() {
    return this._label;
  }

  run() {
    const instanceId = this._widgetEditor.addWidget(this._modelJsonId, undefined, this._layout);
    this._widgetId = instanceId;
    this._actualLayout = this._widgetEditor.widgetContainer.getWidgetLayout(this._widgetId);

    if (!this._widgetEditor.widgetContainer.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }

  canRedo() {
    // Check Id
    return !!this._widgetId;
  }

  redo() {
    const instanceId = this._widgetEditor.addWidget(
      this._modelJsonId,
      this._widgetId,
      this._actualLayout,
      undefined,
      this._actualLayout.page
    );
    this._widgetId = instanceId;
  }

  canUndo() {
    // Check Id
    return !!this._widgetId;
  }

  undo() {
    this._widgetEditor.deleteWidget(this._widgetId);
    if (!this._widgetEditor.widgetContainer.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }
}

/**
 * Duplicate existing widgets
 */
class DuplicateWidgetsWithConnectionAction extends UndoableAction {
  /**
   * @param {*} widgetEditor
   * @param {EventCenter} eventCenter
   * @param {Array.<string>} elementIds ids of the widgets to duplicate
   */
  constructor(widgetEditor, eventCenter, elementIds) {
    super();
    this._widgetEditor = widgetEditor;
    this._eventCenter = eventCenter;
    this._elementIds = elementIds;

    this._widgetIds = undefined;
  }

  label() {
    return this._elementIds.length > 1 ? 'Duplicate widgets' : 'Duplicate widget';
  }

  run() {
    this._widgetIds = new Map();
    for (const elementid of this._elementIds) {
      const newWidgetId = this._widgetEditor.duplicateWidgetWithConnection(elementid);
      this._widgetIds.set(elementid, newWidgetId);
    }
    if (!this._widgetEditor.widgetContainer.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }

  canRedo() {
    // Check Id
    return !!this._widgetIds;
  }

  redo() {
    for (const [elementid, newWidgetId] of this._widgetIds) {
      const newwidgetId = this._widgetEditor.duplicateWidgetWithConnection(elementid, newWidgetId);
      this._widgetIds.set(elementid, newwidgetId);
    }
    if (!this._widgetEditor.widgetContainer.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }

  canUndo() {
    // Check Id
    return !!this._widgetIds;
  }

  undo() {
    for (const elementid of this._widgetIds.values()) {
      this._widgetEditor.deleteWidget(elementid);
    }
    if (!this._widgetEditor.widgetContainer.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }
}

/**
 * Delete widgets
 */
class DeleteWidgetsAction extends UndoableAction {
  /**
   * @param {*} widgetEditor
   * @param {EventCenter} eventCenter
   * @param {*} widgetConnector
   * @param {Array.<string>} elementIds ids of the widgets to delete
   */
  constructor(widgetEditor, eventCenter, widgetConnector, elementIds, label = undefined) {
    super();
    this._widgetEditor = widgetEditor;
    this._eventCenter = eventCenter;
    this._widgetConnector = widgetConnector;
    this._elementIds = elementIds;
    this._label = label ? label : this._elementIds.length > 1 ? 'Delete widgets' : 'Delete widget';

    this._widgetsData = undefined;
  }

  label() {
    return this._label;
  }

  run() {
    const container = this._widgetEditor.widgetContainer;

    this._widgetsData = [];
    for (const elementId of this._elementIds) {
      const info = container.widgetsInfo.get(elementId);

      const _modelsHiddenParams = jQuery.extend(true, {}, modelsHiddenParams[elementId]);
      const _modelsParameters = jQuery.extend(true, {}, modelsParameters[elementId]);
      const _widgetsConnection = jQuery.extend(true, {}, this._widgetConnector.widgetsConnection[elementId]);

      const data = {
        id: elementId,
        modelJsonId: info.modelJsonId,
        layout: { ...info.layout },
        modelsHiddenParams: _modelsHiddenParams,
        modelsParameters: _modelsParameters,
        widgetsConnection: _widgetsConnection,
      };

      this._widgetEditor.deleteWidget(elementId);
      this._widgetsData.push(data);
    }

    if (!container.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }

  canRedo() {
    // TODO Check Id
    return true;
  }

  canUndo() {
    if (!this._widgetsData) {
      return false;
    }

    const connections = new Set();
    for (const data of this._widgetsData) {
      if (data.widgetsConnection) {
        _collectUsedDatasources(data.widgetsConnection).forEach((c) => connections.add(c));
      }
    }
    return _datanodesExists([...connections]);
  }

  undo() {
    for (const data of this._widgetsData) {
      modelsHiddenParams[data.id] = jQuery.extend(true, {}, data.modelsHiddenParams);
      modelsParameters[data.id] = jQuery.extend(true, {}, data.modelsParameters);

      editorSingletons.widgetEditor.addWidget(
        data.modelJsonId,
        data.id,
        data.layout,
        data.layout.zIndex,
        data.layout.page
      );
      if (data.widgetsConnection) {
        this._widgetConnector.widgetsConnection[data.id] = jQuery.extend(true, {}, data.widgetsConnection);
      }
    }

    const container = this._widgetEditor.widgetContainer;
    if (!container.enforceHeightLimit) {
      this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
    }
  }
}

function _postChangeUpdates(widgetEditor, eventCenterService, elementIds, highlight = false, bCaptionManuallyChanged) {
  // TODO coords
  for (const elementId of elementIds) {
    widgetPreview.plotConstantData(elementId, bCaptionManuallyChanged); //on tab2
    widgetEditor.widgetContainer.replaceWidget(elementId);
  }

  eventCenterService.sendEvent(EVENTS_EDITOR_CONNECTIONS_CHANGED);

  if (highlight) {
    // TODO should be done in the editor to flash only once on multi-undo
    widgetContainer.highlightWidgets(elementIds);
  }
}

/**
 * Replace the parameters and connections of a widget
 */
class SetWidgetParametersAction extends UndoableAction {
  /**
   *
   * @param {*} widgetEditor
   * @param {*} widgetConnector
   * @param {EventCenter} eventCenterService
   * @param {string} elementId id of the widget to update
   * @param {Object} params new value for modelsParameters
   * @param {Object} connections new value for widgetsConnection
   */
  constructor(widgetEditor, widgetConnector, eventCenterService, elementId, params, connections) {
    super();
    this._widgetEditor = widgetEditor;
    this._widgetConnector = widgetConnector;
    this._eventCenterService = eventCenterService;

    this._elementId = elementId;
    this._params = jQuery.extend(true, {}, params);
    this._connections = jQuery.extend(true, {}, connections);

    this._oldParams = undefined;
    this._oldConnections = undefined;
  }

  label() {
    return 'Edit widget';
  }

  _postChangeUpdates(highlight = false) {
    // MBG 06/10/2021
    let bCaptionManuallyChanged = false;
    if (!_.isUndefined(this._oldParams.label)) {
      if (this._oldParams.label != this._params.label) {
        bCaptionManuallyChanged = true;
      }
    }
    _postChangeUpdates(
      this._widgetEditor,
      this._eventCenterService,
      [this._elementId],
      highlight,
      bCaptionManuallyChanged
    );
  }

  _apply() {
    // TODO access
    this._oldParams = jQuery.extend(true, {}, modelsParameters[this._elementId]);
    this._oldConnections = jQuery.extend(true, {}, this._widgetConnector.widgetsConnection[this._elementId]);

    modelsParameters[this._elementId] = jQuery.extend(true, {}, this._params);
    this._widgetConnector.widgetsConnection[this._elementId] = jQuery.extend(true, {}, this._connections);
  }

  run() {
    this._apply();
    this._postChangeUpdates();
  }

  canRedo() {
    return _datanodesExists(_collectUsedDatasources(this._connections));
  }

  redo() {
    this._apply();
    this._postChangeUpdates(true);
  }

  canUndo() {
    return (
      !!this._oldParams && !!this._oldConnections && _datanodesExists(_collectUsedDatasources(this._oldConnections))
    );
  }

  undo() {
    modelsParameters[this._elementId] = jQuery.extend(true, {}, this._oldParams);
    this._widgetConnector.widgetsConnection[this._elementId] = jQuery.extend(true, {}, this._oldConnections);

    this._postChangeUpdates(true);
  }
}

/**
 * Clear all connections of some widgets
 */
class ClearWidgetConnectionsAction extends UndoableAction {
  /**
   * @param {*} widgetEditor
   * @param {*} widgetConnector
   * @param {EventCenter} eventCenterService
   * @param {Array.<string>} elementIds id of the widgets to clear
   * @param {string|undefined} label action label for the history.
   */
  constructor(widgetEditor, widgetConnector, eventCenterService, elementIds, label = undefined) {
    super();
    this._widgetEditor = widgetEditor;
    this._widgetConnector = widgetConnector;
    this._eventCenterService = eventCenterService;
    this._elementIds = elementIds;

    this._oldConnections = undefined;

    if (label) {
      this._label = label;
    } else if (elementIds.length > 1) {
      this._label = 'Clear widgets connections';
    } else {
      this._label = 'Clear widget connections';
    }
  }

  label() {
    return this._label;
  }

  _postChangeUpdates(highlight = false) {
    _postChangeUpdates(this._widgetEditor, this._eventCenterService, this._elementIds, highlight);
  }

  _apply() {
    this._oldConnections = new Map();
    for (const elementId of this._elementIds) {
      const widgetConnection = this._widgetConnector.widgetsConnection[elementId];
      this._oldConnections.set(elementId, jQuery.extend(true, {}, widgetConnection));

      if (widgetConnection.sliders) {
        for (const key in widgetConnection.sliders) {
          const slider = widgetConnection.sliders[key];
          slider.dataNode = 'None';
          slider.dataFields.length = 0;
        }
      }
    }
  }

  run() {
    this._apply();
    this._postChangeUpdates();
  }

  canRedo() {
    // TODO Check Id
    return true;
  }

  redo() {
    this._apply();
    this._postChangeUpdates(true);
  }

  canUndo() {
    if (!this._oldConnections) {
      return false;
    }

    const connections = new Set();
    for (const [elementid, oldConnection] of this._oldConnections) {
      if (oldConnection) {
        _collectUsedDatasources(oldConnection).forEach((c) => connections.add(c));
      }
    }
    return _datanodesExists([...connections]);
  }

  undo() {
    for (const [elementid, oldConnection] of this._oldConnections) {
      this._widgetConnector.widgetsConnection[elementid] = jQuery.extend(true, {}, oldConnection);
    }
    this._postChangeUpdates(true);
  }
}

/**
 * Changes number of pages or their names
 */
class UpdatePagesAction extends UndoableAction {
  /**
   * @param {*} widgetEditor
   * @param {EventCenter} eventCenter Used to notify when widgets moved
   * @param {Array.<string>} pages heights of the rows. Length should be "rows" (or 1 for the time being).
   */
  constructor(widgetEditor, eventCenter, pages) {
    super();
    this._widgetEditor = widgetEditor;
    this._eventCenter = eventCenter;

    this._oldPages = undefined;
    this._initialWidgetPages = undefined;

    this.pages = [...pages];
  }

  label() {
    return 'Change pages';
  }

  run() {
    this._oldPages = [...this._widgetEditor.widgetContainer.pageNames];
    this._initialWidgetPages = this._widgetEditor.widgetContainer.collectWidgetPages();

    this._widgetEditor.widgetContainer.updatePages(this.pages);

    this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
  }

  canRedo() {
    return true;
  }

  redo() {
    this.run();
  }

  canUndo() {
    return !!this._oldPages;
  }

  undo() {
    this._widgetEditor.widgetContainer.updatePages(this._oldPages);
    this._widgetEditor.widgetContainer.setWidgetPages(this._initialWidgetPages);

    this._oldPages = undefined;
    this._initialWidgetPages = undefined;

    this._eventCenter.sendEvent(UpdatePagesAction.EDITOR_DASHBOARD_ASPECT_CHANGED);
  }
}

/**
 * Changes the size of the dashboard
 */
class ResizeDashboardAction extends UndoableAction {
  /**
   * @param {*} widgetEditor
   * @param {EventCenter} eventCenter Used to notify when widgets moved
   * @param {{width: number, height: number, marginX: number, marginY: number, enforceHeightLimit: boolean}} dashboardSize
   * @param {boolean} scale if true, widgets will be scaled to match the new size
   */
  constructor(widgetEditor, eventCenter, newDashboardSize, scale) {
    super();
    this._widgetEditor = widgetEditor;
    this._eventCenter = eventCenter;

    this._oldDashboardSize = undefined;
    this._initialGeometries = undefined;

    this._newDashboardSize = { ...newDashboardSize };
    this._scale = scale;
  }

  label() {
    return `${this._scale ? 'Rescale' : 'Resize'} dashboard`;
  }

  run() {
    const widgetContainer = this._widgetEditor.widgetContainer;
    this._oldDashboardSize = {
      width: widgetContainer.width,
      height: widgetContainer.height,
      marginX: widgetContainer.marginX,
      marginY: widgetContainer.marginY,
      enforceHeightLimit: widgetContainer.enforceHeightLimit,
    };

    widgetContainer.enforceHeightLimit = this._newDashboardSize.enforceHeightLimit;
    widgetContainer.setMargins(this._newDashboardSize.marginX, this._newDashboardSize.marginY);
    widgetContainer.setSize(this._newDashboardSize.width, this._newDashboardSize.height);

    this._initialGeometries = new Map();
    for (const elementId of widgetContainer.widgetIds) {
      const oldPosition = widgetContainer.getRecordedGeometry(elementId);

      let horizDim = { position: oldPosition.left, size: oldPosition.width };
      let vertDim = { position: oldPosition.top, size: oldPosition.height };
      if (this._scale) {
        horizDim = scale(this._oldDashboardSize.width, this._newDashboardSize.width, horizDim);
        vertDim = scale(this._oldDashboardSize.height, this._newDashboardSize.height, vertDim);

        const { minWidth, minHeight } = widgetContainer.minimumSize(elementId);
        horizDim.size = Math.max(horizDim.size, minWidth);
        vertDim.size = Math.max(vertDim.size, minHeight);
      }

      // Always constrain in case of rounding errors or min size pushed the widget out of bounds
      horizDim = constrain(this._newDashboardSize.width, horizDim);

      if (widgetContainer.enforceHeightLimit) {
        vertDim = constrain(this._newDashboardSize.height, vertDim);
      }

      const newPosition = {
        left: horizDim.position,
        top: vertDim.position,
        width: horizDim.size,
        height: vertDim.size,
      };

      this._initialGeometries.set(elementId, { ...oldPosition });
      widgetContainer.moveResizeWidget(elementId, newPosition);
    }

    this._eventCenter.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
  }

  canRedo() {
    return true;
  }

  redo() {
    this.run();
  }

  canUndo() {
    return !!this._oldDashboardSize;
  }

  undo() {
    const widgetContainer = this._widgetEditor.widgetContainer;

    widgetContainer.enforceHeightLimit = this._oldDashboardSize.enforceHeightLimit;
    widgetContainer.setMargins(this._oldDashboardSize.marginX, this._oldDashboardSize.marginY);
    widgetContainer.setSize(this._oldDashboardSize.width, this._oldDashboardSize.height);

    for (const [elementid, oldPosition] of this._initialGeometries) {
      widgetContainer.moveResizeWidget(elementid, oldPosition);
    }

    this._oldDashboardSize = undefined;
    this._initialGeometries = undefined;

    this._eventCenter.sendEvent(UpdatePagesAction.EDITOR_DASHBOARD_ASPECT_CHANGED);
  }
}

angular.module('modules.editor').service('EditorActionFactory', [
  'WidgetsPluginsHandlerGetter',
  'WidgetEditorGetter',
  'WidgetConnectorGetter',
  'EventCenterService',
  function (widgetsPluginsHandlerGetter, widgetEditorGetter, widgetConnectorGetter, eventCenterService) {
    // --------------------
    // -- Widgets placement
    // --------------------
    // -- stacking
    /**
     * @param {Array.<string>} elementIds
     * @returns {ToForegroundAction} the action
     */
    this.createToForegroundAction = function _createToForegroundAction(elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;
      return new ToForegroundAction(widgetContainer, elementIds);
    };

    /**
     * @param {Array.<string>} elementIds
     * @returns {ToBackgroundAction} the action
     */
    this.createToBackgroundAction = function _createToBackgroundAction(elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;
      return new ToBackgroundAction(widgetContainer, elementIds);
    };

    // -- place & resize widget
    /**
     * @param {Map.<string,{left: number, top: number, width: (number|undefined), height:(number|undefined)}>} geometries new geometries (not including margins) per widget id
     * @param {string=} label
     * @returns {UpdateGeometryAction} the action
     */
    this.createSetGeometryAction = function _createSetGeometryAction(geometries, label) {
      const plural = geometries.size > 1 ? 's' : '';
      return new UpdateGeometryAction(
        widgetEditorGetter(),
        eventCenterService,
        geometries,
        label || `Set widget${plural} position/size`,
        false
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @param {number} left user left position (not inclusing margins)
     * @param {boolean=} canMerge if true, allows the action to be merged with future ones
     * @returns {UpdateGeometryAction} the action
     */
    this.createSetWidgetLeftAction = function _createSetWidgetLeftAction(elementIds, left, canMerge = false) {
      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditorGetter(),
        eventCenterService,
        elementIds,
        { left },
        `Set widget${plural} X to ${left}`,
        false,
        canMerge ? Date.now() + UNDO_MOVE_MERGE_WINDO_MS : undefined
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @param {number} top user top position (not inclusing margins)
     * @param {boolean=} canMerge if true, allows the action to be merged with future ones
     * @returns {UpdateGeometryAction} the action
     */
    this.createSetWidgetTopAction = function _createSetWidgetTopAction(elementIds, top, canMerge = false) {
      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditorGetter(),
        eventCenterService,
        elementIds,
        { top },
        `Set widget${plural} Y to ${top}`,
        false,
        canMerge ? Date.now() + UNDO_MOVE_MERGE_WINDO_MS : undefined
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @param {number} height
     * @param {boolean=} canMerge if true, allows the action to be merged with future ones
     * @returns {UpdateGeometryAction} the action
     */
    this.createSetWidgetHeightAction = function _createSetWidgetHeightAction(elementIds, height, canMerge = false) {
      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditorGetter(),
        eventCenterService,
        elementIds,
        { height },
        `Set widget${plural} height to ${height}`,
        false,
        canMerge ? Date.now() + UNDO_MOVE_MERGE_WINDO_MS : undefined
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @param {number} width
     * @param {boolean=} canMerge if true, allows the action to be merged with future ones
     * @returns {UpdateGeometryAction} the action
     */
    this.createSetWidgetWidthAction = function _createSetWidgetWidthAction(elementIds, width, canMerge = false) {
      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditorGetter(),
        eventCenterService,
        elementIds,
        { width },
        `Set widget${plural} width to ${width}`,
        false,
        canMerge ? Date.now() + UNDO_MOVE_MERGE_WINDO_MS : undefined
      );
    };

    // -- relative movement
    /**
     * @param {Array.<string>} elementIds
     * @param {number} distance
     * @returns {UpdateGeometryAction} the action
     */
    this.createMoveDownAction = function _createMoveDownAction(elementIds, distance) {
      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditorGetter(),
        eventCenterService,
        elementIds,
        { top: distance },
        `Move widget${plural} down`,
        true,
        Date.now() + UNDO_MOVE_MERGE_WINDO_MS
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @param {number} distance
     * @returns {UpdateGeometryAction} the action
     */
    this.createMoveUpAction = function _createMoveUpAction(elementIds, distance) {
      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditorGetter(),
        eventCenterService,
        elementIds,
        { top: -distance },
        `Move widget${plural} up`,
        true,
        Date.now() + UNDO_MOVE_MERGE_WINDO_MS
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @param {number} distance
     * @returns {UpdateGeometryAction} the action
     */
    this.createMoveLeftAction = function _createMoveLeftAction(elementIds, distance) {
      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditorGetter(),
        eventCenterService,
        elementIds,
        { left: -distance },
        `Move widget${plural} left`,
        true,
        Date.now() + UNDO_MOVE_MERGE_WINDO_MS
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @param {number} distance
     * @returns {UpdateGeometryAction} the action
     */
    this.createMoveRightAction = function _createMoveRightAction(elementIds, distance) {
      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditorGetter(),
        eventCenterService,
        elementIds,
        { left: distance },
        `Move widget${plural} right`,
        true,
        Date.now() + UNDO_MOVE_MERGE_WINDO_MS
      );
    };

    // -- aligned movement
    function _collectOtherWidgetsPotision(widgetContainer, elementIds) {
      const result = [];
      for (const key of widgetContainer.widgetIds) {
        if (widgetContainer.currentPage === widgetContainer.getWidgetLayout(key).page) {
          if (!elementIds.includes(key)) {
            result.push(widgetContainer.getRecordedGeometry(key));
          }
        }
      }
      return result;
    }

    /**
     * @param {Array.<string>} elementIds
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignedMoveDownAction = function _createAlignedMoveDownAction(elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const positions = _collectOtherWidgetsPotision(widgetContainer, elementIds)
        .map((g) => g.top)
        .sort();
      const current = widgetContainer.getRecordedGeometry(elementIds[elementIds.length - 1]).top;
      const target = Math.min(...positions.filter((p) => p > current));
      const top = isFinite(target) ? target : current;

      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditor,
        eventCenterService,
        elementIds,
        { top },
        `Aligned move widget${plural} down`
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignedMoveUpAction = function _createAlignedMoveUpAction(elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const positions = _collectOtherWidgetsPotision(widgetContainer, elementIds)
        .map((g) => g.top)
        .sort();
      const current = widgetContainer.getRecordedGeometry(elementIds[elementIds.length - 1]).top;
      const top = Math.max(0, Math.max(...positions.filter((p) => p < current)));

      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditor,
        eventCenterService,
        elementIds,
        { top },
        `Aligned move widget${plural} up`
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignedMoveLeftAction = function _createAlignedMoveLeftAction(elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const positions = _collectOtherWidgetsPotision(widgetContainer, elementIds)
        .map((g) => g.left)
        .sort();
      const current = widgetContainer.getRecordedGeometry(elementIds[elementIds.length - 1]).left;
      const left = Math.max(0, Math.max(...positions.filter((p) => p < current)));

      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditor,
        eventCenterService,
        elementIds,
        { left },
        `Aligned move widget${plural} left`
      );
    };

    /**
     * @param {Array.<string>} elementIds
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignedMoveRightAction = function _createAlignedMoveRightAction(elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const positions = _collectOtherWidgetsPotision(widgetContainer, elementIds)
        .map((g) => g.left)
        .sort();
      const current = widgetContainer.getRecordedGeometry(elementIds[elementIds.length - 1]).left;
      const target = Math.min(...positions.filter((p) => p > current));
      const left = isFinite(target) ? target : current;

      const plural = elementIds.length > 1 ? 's' : '';
      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditor,
        eventCenterService,
        elementIds,
        { left },
        `Aligned move widget${plural} right`
      );
    };

    // -- alignement operations
    /**
     * @param {*} targetId the element on which to align
     * @param {*} elementIds the elements to align
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignementTopAction = function _createAlignementTopAction(targetId, elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const top = widgetContainer.getRecordedGeometry(targetId).top;

      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditor,
        eventCenterService,
        elementIds,
        { top },
        `Align widgets top`
      );
    };

    /**
     * @param {*} targetId the element on which to align
     * @param {*} elementIds the elements to align
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignementHorizontalAction = function _createAlignementHorizontalAction(targetId, elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const targetPos = widgetContainer.getRecordedGeometry(targetId);
      const targetVert = targetPos.left + targetPos.width / 2;

      const geometries = new Map();
      for (const elementId of elementIds) {
        const elementPos = widgetContainer.getRecordedGeometry(elementId);
        const left = targetVert - elementPos.width / 2;
        geometries.set(elementId, { left });
      }

      return new UpdateGeometryAction(widgetEditor, eventCenterService, geometries, 'Align widgets vertical', false);
    };

    /**
     * @param {*} targetId the element on which to align
     * @param {*} elementIds the elements to align
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignementBottomAction = function _createAlignementBottomAction(targetId, elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const targetPos = widgetContainer.getRecordedGeometry(targetId);
      const targetBottom = targetPos.top + targetPos.height;

      const geometries = new Map();
      for (const elementId of elementIds) {
        const elementPos = widgetContainer.getRecordedGeometry(elementId);
        const top = targetBottom - elementPos.height;
        geometries.set(elementId, { top });
      }

      return new UpdateGeometryAction(widgetEditor, eventCenterService, geometries, 'Align widgets bottom', false);
    };

    /**
     * @param {*} targetId the element on which to align
     * @param {*} elementIds the elements to align
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignementLeftAction = function _createAlignementLeftAction(targetId, elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const left = widgetContainer.getRecordedGeometry(targetId).left;

      return UpdateGeometryAction.CreateSimpleUpdate(
        widgetEditor,
        eventCenterService,
        elementIds,
        { left },
        `Align widgets left`
      );
    };

    /**
     * @param {*} targetId the element on which to align
     * @param {*} elementIds the elements to align
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignementVerticalAction = function _createAlignementVerticalAction(targetId, elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const targetPos = widgetContainer.getRecordedGeometry(targetId);
      const targetHoriz = targetPos.top + targetPos.height / 2;

      const geometries = new Map();
      for (const elementId of elementIds) {
        const elementPos = widgetContainer.getRecordedGeometry(elementId);
        const top = targetHoriz - elementPos.height / 2;
        geometries.set(elementId, { top });
      }

      return new UpdateGeometryAction(widgetEditor, eventCenterService, geometries, 'Align widgets horizontal', false);
    };

    /**
     * @param {*} targetId the element on which to align
     * @param {*} elementIds the elements to align
     * @returns {UpdateGeometryAction} the action
     */
    this.createAlignementRightAction = function _createAlignementRightAction(targetId, elementIds) {
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const targetPos = widgetContainer.getRecordedGeometry(targetId);
      const targetRight = targetPos.left + targetPos.width;

      const geometries = new Map();
      for (const elementId of elementIds) {
        const elementPos = widgetContainer.getRecordedGeometry(elementId);
        const left = targetRight - elementPos.width;
        geometries.set(elementId, { left });
      }

      return new UpdateGeometryAction(widgetEditor, eventCenterService, geometries, 'Align widgets right', false);
    };

    /**
     * @param {*} elementIds the elements to spread
     * @returns {UpdateGeometryAction} the action
     */
    this.createHorizontalSpreadAction = function _createHorizontalSpreadAction(elementIds) {
      if (elementIds.length < 2) {
        throw new Error('At least 2 elements are needed');
      }
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const positions = elementIds.map((elementId) => {
        const elementPos = widgetContainer.getRecordedGeometry(elementId);
        return {
          elementId,
          position: elementPos.left,
          size: elementPos.width,
        };
      });

      const spreadPositions = _computeSpread(positions);
      const geometries = new Map();
      for (const { elementId, position } of spreadPositions) {
        geometries.set(elementId, { left: position });
      }

      return new UpdateGeometryAction(
        widgetEditor,
        eventCenterService,
        geometries,
        'Spread widgets horizontally',
        false
      );
    };

    /**
     * @param {*} elementIds the elements to spread
     * @returns {UpdateGeometryAction} the action
     */
    this.createVerticalSpreadAction = function _createVerticalSpreadAction(elementIds) {
      if (elementIds.length < 2) {
        throw new Error('At least 2 elements are needed');
      }
      const widgetEditor = widgetEditorGetter();
      const widgetContainer = widgetEditor.widgetContainer;

      const positions = elementIds.map((elementId) => {
        const elementPos = widgetContainer.getRecordedGeometry(elementId);
        return {
          elementId,
          position: elementPos.top,
          size: elementPos.height,
        };
      });

      const spreadPositions = _computeSpread(positions);
      const geometries = new Map();
      for (const { elementId, position } of spreadPositions) {
        geometries.set(elementId, { top: position });
      }

      return new UpdateGeometryAction(widgetEditor, eventCenterService, geometries, 'Spread widgets vertically', false);
    };

    // -----------------------------
    // -- Create/delete/edit widgets
    // -----------------------------
    /**
     * @param {string} modelJsonId id of the widget type to create
     * @param {undefined|{left: (number|undefined), top: (number|undefined), width: (number|undefined), height:(number|undefined), page: (number|undefined)}} layout Optional. Where to place the widget.
     */
    this.createCreateWidgetAction = function _createCreateWidgetAction(modelJsonId, layout) {
      const widgetsPluginsHandler = widgetsPluginsHandlerGetter();
      if (widgetsPluginsHandler && widgetsPluginsHandler.widgetToolbarDefinitions) {
        const def = widgetsPluginsHandler.widgetToolbarDefinitions[modelJsonId];
        if (def && def.title) {
          return new CreateWidgetAction(
            widgetEditorGetter(),
            eventCenterService,
            modelJsonId,
            `Add "${def.title}"`,
            layout
          );
        }
      }

      return new CreateWidgetAction(widgetEditorGetter(), eventCenterService, modelJsonId, undefined, layout);
    };

    /**
     * @param {Array.<string>} elementIds ids of the widgets to duplicate
     */
    this.createDuplicateWidgetsWithConnectionAction = function _createDuplicateWidgetsWithConnectionAction(elementIds) {
      return new DuplicateWidgetsWithConnectionAction(widgetEditorGetter(), eventCenterService, elementIds);
    };

    /**
     * @param {Array.<string>} elementIds ids of the widgets to delete
     */
    this.createDeleteWidgetsAction = function _createDeleteWidgetsAction(elementIds) {
      return new DeleteWidgetsAction(widgetEditorGetter(), eventCenterService, widgetConnectorGetter(), elementIds);
    };

    /**
     * @returns
     */
    this.createDeleteAllWidgetsAction = function _createDeleteWidgetsAction() {
      const widgetEditor = widgetEditorGetter();
      return new DeleteWidgetsAction(
        widgetEditor,
        eventCenterService,
        [...widgetEditor.widgetContainer.widgetIds],
        'Delete all widgets'
      );
    };

    /**
     * @returns an action that clears the connections of all widgets
     */
    this.createClearAllWidgetConnectionsAction = function _createClearAllWidgetConnectionsAction() {
      const widgetEditor = widgetEditorGetter();
      return new ClearWidgetConnectionsAction(
        widgetEditor,
        widgetConnectorGetter(),
        eventCenterService,
        [...widgetEditor.widgetContainer.widgetIds],
        'Clear all connections'
      );
    };

    /**
     * @param {string} elementId id of the widget to update
     * @param {Object} newData new value for modelsParameters
     * @param {Object} widgetConnection new value for widgetsConnection
     */
    this.createSetWidgetParametersAction = function _createSetWidgetParametersAction(
      elementId,
      newData,
      widgetConnection
    ) {
      return new SetWidgetParametersAction(
        widgetEditorGetter(),
        widgetConnectorGetter(),
        eventCenterService,
        elementId,
        newData,
        widgetConnection
      );
    };

    /**
     *
     * @param {Array.<string>} newPages
     * @returns
     */
    this.createUpdatePagesAction = function _createUpdatePagesAction(newPages) {
      return new UpdatePagesAction(widgetEditorGetter(), eventCenterService, newPages);
    };

    /**
     *
     * @param {Array.<string>} elementIds ids of the elements to move
     * @param {number} page target page
     * @returns
     */
    this.createMoveWidgetsToPageAction = function _createMoveWidgetsToPageAction(elementIds, page) {
      return new MoveWidgetsToPageAction(widgetEditorGetter(), eventCenterService, elementIds, page);
    };

    /**
     *
     * @param {{width: number, height: number, marginX: number, marginY: number, enforceHeightLimit: boolean}} dashboardSize
     * @param {boolean} scale if true, widgets will be scaled to match the new size
     * @returns an action that changes the size of the dashboard
     */
    this.createResizeDashboardAction = function _createResizeDashboardAction(dashboardSize, scale) {
      return new ResizeDashboardAction(widgetEditorGetter(), eventCenterService, dashboardSize, scale);
    };

    return this;
  },
]);
