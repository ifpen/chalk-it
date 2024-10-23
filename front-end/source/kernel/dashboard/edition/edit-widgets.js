// ┌────────────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ widgetEditor                                                                               │ \\
// ├────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                                │ \\
// | Licensed under the Apache License, Version 2.0                                             │ \\
// ├────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT, Abir EL FEKI, Mounir MECHERGHUI, Mongi BEN GAID,   │ \\
// │                      Ameur HAMDOUNI                                                        │ \\
// └────────────────────────────────────────────────────────────────────────────────────────────┘ \\
import interact from 'interactjs';
import _ from 'lodash';

import { panelDash } from './panel-dashboard';
import { rescaleHelper } from 'kernel/dashboard/scaling/rescale-helper';
import { editorSingletons } from 'kernel/editor-singletons';
import {
  EVENTS_EDITOR_SELECTION_CHANGED,
  EVENTS_EDITOR_ADD_REMOVE_WIDGET,
  EVENTS_EDITOR_WIDGET_MOVED,
  EVENTS_EDITOR_WIDGET_TOGGLE_MENU,
} from 'angular/modules/editor/editor.events';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';
import { getGeometryChanges } from 'kernel/dashboard/widget/widget-placement';
import { modelsHiddenParams, modelsParameters } from 'kernel/base/widgets-states';
import { gridMgr } from 'kernel/dashboard/edition/grid-mgr';
import { WidgetContainer } from 'kernel/dashboard/widget/widget-container';
import { createUniqueInstanceId } from 'kernel/dashboard/widget/widget-factory';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { scalingManager } from 'kernel/dashboard/scaling/scaling-manager';
import { flatUiWidgetsPlugin } from 'kernel/dashboard/plugins/basic/plugin-flat-ui-widgets';
import { plotlyWidgetsPlugin } from 'kernel/dashboard/plugins/plots/plugin-plotly-widgets';
import { mapWidgetsPlugin } from 'kernel/dashboard/plugins/geo-time/plugin-map-widgets';
import { bFirstExec } from 'kernel/base/main-common';

export function initEditWidget() {
  const drprD = $('#DropperDroite')[0]; // short alias
  drprD.innerHTML = '';

  const widgetContainer = new WidgetContainer();

  // scaling stuff
  const bNoteBookMode = false; // save or not widgets cache (to be read from the project)
  var editorScalingMethod = 'scaleTwh';
  var editorDimensionsSnapshot;
  var scalingHelper = new rescaleHelper(editorDimensionsSnapshot, editorScalingMethod, 'edit');

  editorSingletons.layoutMgr.setScalingHelper(scalingHelper);

  var widgetSelectionContext = new Set(); // selection context (Instance Ids of selected widgets)

  const RESIZE_MARGIN = 7;

  const CAN_GRAB_CURSOR = 'grab';
  const GRABBING_CURSOR = 'grabbing';

  const MAIN_CONTAINER_ID = 'DropperDroite';

  const DROP_POSSIBLE_CLASS = 'drop-possible'; // Available drop zones
  const DROP_OVER_CLASS = 'drop-over'; // Drop zone under the pointer

  const SELECTED_CLASS = 'widget-selected';
  const LAST_SELECTED_CLASS = 'widget-selected-last';

  // TODO coords remove ?
  function _toLocal(containerId, position) {
    if (containerId === MAIN_CONTAINER_ID) {
      return position;
    } else {
      const offset = $('#' + containerId).offset();
      return {
        ...position,
        top: position.top - offset.top,
        left: position.left - offset.left,
      };
    }
  }

  function _alignOnGrid(xy, offsets, grid) {
    let [x, y] = xy;
    let [x0, y0] = offsets;

    return [Math.round((x - x0) / grid.sizeX) * grid.sizeX + x0, Math.round((y - y0) / grid.sizeY) * grid.sizeY + y0];
  }

  // Creation
  /**
   * Widget abstract factory
   * @param {any} modelJsonId (mandatory) model template ID
   * @param {String=} instanceId (optional) used if provided, will be created otherwise
   * @param {any=} wLayout (optional) used if provided, defaults used otherwise
   * @param {number=} wzIndex (optional) used if provided, last widget has highest zIndex otherwise
   * @param {number=} page (optional)
   * @returns {string} widgetId
   */
  function _build(modelJsonId, instanceId, wLayout, wzIndex, page) {
    if (!instanceId) {
      // create unique key for the instance
      instanceId = createUniqueInstanceId(modelJsonId, (id) => widgetContainer.widgetsInfo.has(id));
    }

    // create mainDiv and containerDiv
    const cln = _createNewDiv(instanceId);

    widgetContainer.createWidget(modelJsonId, instanceId, cln, wLayout, wzIndex, page);

    return instanceId;
  }

  /**
   * @description Creates "MainDiv"(cln) and his child "ContainerDiv"(div)
   * @param {String} instanceId  used if provided, will be created otherwise
   * @param {{top: number, ledt: number, width: number, height: number, zIndex: number, page?: number}} wLayout  widget layout
   * Default modelJsonId layout used if undefined
   */
  function _createNewDiv(instanceId) {
    const cln = document.createElement('div');
    cln.id = instanceId;
    // TODO clean
    // add editable widget css classes
    cln.classList.add('drsElement');
    cln.classList.add('drag-drop-move');
    cln.classList.add('widget');
    cln.classList.add('widget__layout--item');

    const overlay = document.createElement('div');
    overlay.classList.add('widget-overlay');
    cln.appendChild(overlay);

    //
    const menu = document.createElement('ul');
    menu.classList.add('actions__list');
    cln.appendChild(menu);

    const liElement = document.createElement('li');
    const menuA = document.createElement('a');
    menuA.title = 'edit widget';
    const menuIcon = document.createElement('i');
    menuIcon.classList.add('basic');
    menuIcon.classList.add('icn-edit');
    menuA.appendChild(menuIcon);
    liElement.appendChild(menuA);
    menu.appendChild(liElement);

    liElement.addEventListener('click', (evt) => {
      _notifyWidgMenu(instanceId);
      evt.stopPropagation();
    });

    return cln;
  }

  function duplicateWidgetWithConnection(elementId, newWidgetId = null) {
    const info = widgetContainer.widgetsInfo.get(elementId);

    const widgetLayoutPx = info.layout;
    // translate !
    const requestedLayoutPx = {
      top: widgetLayoutPx.top + 20,
      left: widgetLayoutPx.left + 20,
      width: widgetLayoutPx.width,
      height: widgetLayoutPx.height,
    };

    newWidgetId ??= createUniqueInstanceId(info.modelJsonId, (id) => widgetContainer.widgetsInfo.has(id));

    // MBG : TODO : extend factory to transmit modelsHiddenParams
    // MBG : TODO : rename globally modelsHiddenParams to instanceHiddenParams
    // MBG : TODO : rename globally modelsParameters to instanceParameters
    modelsHiddenParams[newWidgetId] = jQuery.extend(true, {}, modelsHiddenParams[elementId]);
    modelsParameters[newWidgetId] = jQuery.extend(true, {}, modelsParameters[elementId]);
    addWidget(info.modelJsonId, newWidgetId, requestedLayoutPx);

    if (!_.isUndefined(widgetConnector.widgetsConnection[elementId])) {
      widgetConnector.duplicateConnection(newWidgetId, elementId);
    }
    return newWidgetId;
  }

  // Selection
  let _selectionLasso = null;
  let _selectionInitialState = [];
  let lassoX0 = 0;
  let lassoY0 = 0;
  let lassoX = 0;
  let lassoY = 0;
  interact('#DropperDroite')
    .draggable({
      cursorChecker(action, interactable, element, interacting) {
        return interacting ? 'pointer' : 'default';
      },
      listeners: {
        start(event) {
          _selectionInitialState = [...widgetSelectionContext];

          _selectionLasso = document.createElement('div');
          _selectionLasso.classList.add('dragged-editor-selection-lasso');
          document.body.appendChild(_selectionLasso);

          lassoX = lassoX0 = event.clientX0 + window.scrollX;
          lassoY = lassoY0 = event.clientY0 + window.scrollY;

          _selectionLasso.style.left = lassoX0 + 'px';
          _selectionLasso.style.top = lassoY0 + 'px';
          _selectionLasso.style.width = '0px';
          _selectionLasso.style.height = '0px';
        },

        move(event) {
          lassoX += event.dx;
          lassoY += event.dy;

          const xMin = Math.min(lassoX0, lassoX);
          const xMax = Math.max(lassoX0, lassoX);
          const yMin = Math.min(lassoY0, lassoY);
          const yMax = Math.max(lassoY0, lassoY);

          _selectionLasso.style.left = xMin + 'px';
          _selectionLasso.style.width = xMax - xMin + 'px';
          _selectionLasso.style.top = yMin + 'px';
          _selectionLasso.style.height = yMax - yMin + 'px';

          // Update selection
          widgetSelectionContext.clear();
          const ctrlKey = event.ctrlKey;
          if (ctrlKey) {
            _selectionInitialState.forEach((id) => widgetSelectionContext.add(id));
          }
          for (const id of widgetContainer.widgetIds) {
            if (!widgetSelectionContext.has(id)) {
              const element = $('#' + id); // TODO
              if (element) {
                const offset = element.offset();
                const left = offset.left;
                const top = offset.top;
                const right = left + element.width();
                const bottom = top + element.height();
                if (
                  left >= xMin &&
                  left <= xMax &&
                  right >= xMin &&
                  right <= xMax &&
                  top >= yMin &&
                  top <= yMax &&
                  bottom >= yMin &&
                  bottom <= yMax
                ) {
                  widgetSelectionContext.add(id);
                }
              }
            }
          }
          _onSelectionChange();
        },

        end() {
          _selectionInitialState = [];
          if (_selectionLasso) {
            //_selectionLasso.parentNode.removeChild(_selectionLasso);
            _selectionLasso.remove();
            _selectionLasso = null;
          }
        },
      },
    })
    .on('tap', function () {
      unselectAllWidgets();
    });

  // Drop zone highlights
  interact('#DropperDroite').dropzone({
    // When dropping new widgets or moves, but not selection
    accept: '.drag-drop-new, .drag-drop-move',
    ondropactivate(event) {
      event.target.classList.add(DROP_POSSIBLE_CLASS);
    },
    ondragenter(event) {
      event.target.classList.add(DROP_OVER_CLASS);
    },
    ondragleave(event) {
      event.target.classList.remove(DROP_OVER_CLASS);
    },
    ondrop(event) {},
    ondropdeactivate(event) {
      event.target.classList.remove(DROP_POSSIBLE_CLASS);
      event.target.classList.remove(DROP_OVER_CLASS);
    },
  });

  interact('#DropperDroite').dropzone({
    // Only when dropping new widgets, not for moves
    accept: '.drag-drop-new',
    ondropactivate(event) {
      event.target.classList.add(DROP_POSSIBLE_CLASS);
    },
    ondragenter(event) {
      event.target.classList.add(DROP_OVER_CLASS);
    },
    ondragleave(event) {
      event.target.classList.remove(DROP_OVER_CLASS);
    },
    ondrop(event) {},
    ondropdeactivate(event) {
      event.target.classList.remove(DROP_POSSIBLE_CLASS);
      event.target.classList.remove(DROP_OVER_CLASS);
    },
  });

  // New widgets
  let _draggedClone = null;
  let _newId = null;
  let _ddOffsetX = 0;
  let _ddOffsetY = 0;
  interact('.drag-drop-new') // TODO target ?
    .draggable({
      cursorChecker(action, interactable, element, interacting) {
        return interacting ? 'grabbing' : 'grab';
      },
      listeners: {
        start(event) {
          const target = event.target;
          _newId = target.id;
          _draggedClone = target.cloneNode(true);
          _draggedClone.classList.add('dragged-new-widget');

          document.body.appendChild(_draggedClone);

          const rect = target.getBoundingClientRect();
          _ddOffsetX = rect.left - event.client.x;
          _ddOffsetY = rect.top - event.client.y;
          _draggedClone.style.left = rect.left + 'px';
          _draggedClone.style.top = rect.top + 'px';
        },

        move(event) {
          let x = event.client.x + _ddOffsetX;
          let y = event.client.y + _ddOffsetY;

          const grid = gridMgr.getGrid();
          if (grid) {
            const offset = $(drprD).offset();
            // TODO get margin
            [x, y] = _alignOnGrid([x, y], [offset.left + 10, offset.top + 10], grid);
          }

          _draggedClone.style.left = x + 'px';
          _draggedClone.style.top = y + 'px';
        },

        end(event) {
          let x = event.client.x + _ddOffsetX;
          let y = event.client.y + _ddOffsetY;

          _draggedClone.remove();
          _draggedClone = null;

          const dropZone = event.relatedTarget;
          if (dropZone && dropZone.id) {
            const dropId = dropZone.id;
            if (dropId === MAIN_CONTAINER_ID) {
              const rect = dropZone.getBoundingClientRect();

              x -= rect.left;
              y -= rect.top;
              const grid = gridMgr.getGrid();
              if (grid) {
                [x, y] = _alignOnGrid([x, y], [0, 0], grid);
              }

              const layout = {
                top: y,
                left: x,
              };

              angular
                .element(document.body)
                .injector()
                .invoke([
                  'UndoManagerService',
                  'EditorActionFactory',
                  (undoManagerService, editorActionFactory) => {
                    const action = editorActionFactory.createCreateWidgetdAction(_newId, dropId, layout);
                    undoManagerService.execute(action);
                  },
                ]);
            }
          }

          _newId = null;
        },
      },
    })
    .on('tap', function (event) {
      if (event && event.currentTarget && event.currentTarget.id) {
        const targetId = event.currentTarget.id;
        angular
          .element(document.body)
          .injector()
          .invoke([
            'UndoManagerService',
            'EditorActionFactory',
            (undoManagerService, editorActionFactory) => {
              const action = editorActionFactory.createCreateWidgetdAction(targetId);
              undoManagerService.execute(action);
            },
          ]);
      }
    });

  // Widgets interactions
  const resizeParameters = new Map();
  interact('#DropperDroite .drag-drop-move')
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      margin: RESIZE_MARGIN,
      listeners: {
        start(event) {
          resizeParameters.clear();
          const target = event.target;
          const targetId = target.id;

          // When grabbed widget is not selected, it becomes the selection
          if (targetId && widgetContainer.widgetIds.has(targetId) && !widgetSelectionContext.has(targetId)) {
            widgetSelectionContext.clear();
            widgetSelectionContext.add(targetId);
            _onSelectionChange();
          }

          const availableSpace = widgetContainer.availableSpace();

          widgetSelectionContext.forEach((id) => {
            const widgetPosition = widgetContainer.getCurrentWidgetGeometry(id);
            const x = widgetPosition.left;
            const y = widgetPosition.top;
            const height = widgetPosition.height || 1;
            const width = widgetPosition.width || 1;

            const { minWidth, minHeight } = widgetContainer.minimumSize(id);

            const minRatioX = minWidth / width;
            const minRatioY = minHeight / height;

            // TODO infinite ?
            const maxWidth = event.edges.left ? x + width : availableSpace.width - x;
            const maxHeight = event.edges.top ? y + height : availableSpace.height - y; // TODO opt

            resizeParameters.set(id, {
              minRatioX,
              minRatioY,
              maxRatioX: maxWidth / width,
              maxRatioY: maxHeight / height,
            });
          });
        },
        move(event) {
          const target = event.target;

          const targetStartPosition = widgetContainer.getRecordedGeometry(target.id);

          const changeX = event.edges.left || event.edges.right;
          const changeY = event.edges.top || event.edges.bottom;
          const moveX = event.edges.left;
          const moveY = event.edges.top;

          let ratioX = changeX ? event.rect.width / targetStartPosition.width : 1;
          let ratioY = changeY ? event.rect.height / targetStartPosition.height : 1;

          if (event.shiftKey && changeX && changeY) {
            const ratio = Math.max(ratioX, ratioY);
            ratioX = ratioY = ratio;
          }

          const grid = gridMgr.getGrid();
          for (const [id, params] of resizeParameters.entries()) {
            const { minRatioX, minRatioY, maxRatioX, maxRatioY } = params;

            const startPosition = widgetContainer.getRecordedGeometry(id);
            const position = { ...startPosition };

            let widgetRatioX = ratioX;
            let widgetRatioY = ratioY;

            if (event.shiftKey && changeX && changeY) {
              const ratio = Math.max(widgetRatioX, widgetRatioY);
              widgetRatioX = widgetRatioY = ratio;
            }

            if (grid) {
              const width = position.width * widgetRatioX;
              const height = position.height * widgetRatioY;
              const px0 = position.left + (moveX ? startPosition.width - width : width);
              const py0 = position.top + (moveY ? startPosition.height - height : height);

              const [px, py] = _alignOnGrid([px0, py0], [0, 0], grid);
              if (changeX) {
                widgetRatioX = (width + (px - px0) * (moveX ? -1 : 1)) / position.width;
              }
              if (changeY) {
                widgetRatioY = (height + (py - py0) * (moveY ? -1 : 1)) / position.height;
              }
            }

            widgetRatioX = Math.min(widgetRatioX, maxRatioX);
            widgetRatioY = Math.min(widgetRatioY, maxRatioY);

            widgetRatioX = Math.max(widgetRatioX, minRatioX);
            widgetRatioY = Math.max(widgetRatioY, minRatioY);

            if (changeX) {
              position.width = Math.round(position.width * widgetRatioX);
              if (moveX) {
                position.left -= position.width - startPosition.width;
              }
            }

            if (changeY) {
              position.height = Math.round(position.height * widgetRatioY);
              if (moveY) {
                position.top -= position.height - startPosition.height;
              }
            }

            widgetContainer.changeWidgetGeometry(id, position);
          }
          _notifyMove();
        },
        end(event) {
          const resizes = new Map();

          widgetSelectionContext.forEach((id) => {
            const toPosition = widgetContainer.getCurrentWidgetGeometry(id);
            const startPosition = widgetContainer.getRecordedGeometry(id);

            if (!angular.equals(startPosition, toPosition)) {
              // Sketchy, but only immediate alternative would be providing the action with the original position...
              // TODO coords rm
              // widgetContainer.moveResizeWidget(id, startPosition, true);
              resizes.set(id, toPosition);
            }

            // Should not do anything, but make doubly sure we have no discrepency
            widgetContainer.resetWidgetGeometry(id);
          });

          if (resizes.size > 0) {
            angular
              .element(document.body)
              .injector()
              .invoke([
                'UndoManagerService',
                'EditorActionFactory',
                (undoManagerService, editorActionFactory) => {
                  const action = editorActionFactory.createSetGeometryAction(
                    resizes,
                    'Resize widget' + (resizes.size > 1 ? 's' : '')
                  );
                  undoManagerService.execute(action);
                },
              ]);
          }
        },
      },
    })
    .draggable({
      cursorChecker(action, interactable, element, interacting) {
        return interacting ? GRABBING_CURSOR : CAN_GRAB_CURSOR;
      },
      listeners: {
        start(event) {
          const target = event.target;
          const targetId = target.id;

          // When grabbed widget is not selected, it becomes the selection
          if (targetId && widgetContainer.widgetIds.has(targetId) && !widgetSelectionContext.has(targetId)) {
            widgetSelectionContext.clear();
            widgetSelectionContext.add(targetId);
            _onSelectionChange();
          }
        },

        move(event) {
          const grid = gridMgr.getGrid();

          const varX = event.client.x - event.clientX0;
          const varY = event.client.y - event.clientY0;

          widgetSelectionContext.forEach((id) => {
            let position = { ...widgetContainer.getRecordedGeometry(id) };
            position.left += varX;
            position.top += varY;

            if (grid) {
              [position.left, position.top] = _alignOnGrid([position.left, position.top], [0, 0], grid);
            }
            position = widgetContainer.enforceConstraints(position);

            widgetContainer.changeWidgetGeometry(id, position);
          });

          _notifyMove();
        },

        end(event) {
          const varX = event.client.x - event.clientX0;
          const varY = event.client.y - event.clientY0;

          const moves = new Map();
          const grid = gridMgr.getGrid();

          widgetSelectionContext.forEach((id) => {
            const startPosition = widgetContainer.getRecordedGeometry(id);

            let position = { ...startPosition };
            position.left += varX;
            position.top += varY;

            if (grid) {
              [position.left, position.top] = _alignOnGrid([position.left, position.top], [0, 0], grid);
            }
            position = widgetContainer.enforceConstraints(position);

            const changes = getGeometryChanges(startPosition, position);
            if (Object.keys(changes).length) {
              moves.set(id, changes);
            }

            // Should not do anything, but make doubly sure we have no discrepency
            widgetContainer.resetWidgetGeometry(id);
          });

          if (moves.size > 0) {
            angular
              .element(document.body)
              .injector()
              .invoke([
                'UndoManagerService',
                'EditorActionFactory',
                (undoManagerService, editorActionFactory) => {
                  const action = editorActionFactory.createSetGeometryAction(
                    moves,
                    'Move widget' + (moves.size > 1 ? 's' : '')
                  );
                  undoManagerService.execute(action);
                },
              ]);
          }
        },
      },
    })
    .on('tap', function (event) {
      const ctrlKey = event.ctrlKey;
      const target = event.currentTarget;
      const targetId = target.id;
      if (targetId && widgetContainer.widgetIds.has(targetId)) {
        if (ctrlKey) {
          if (widgetSelectionContext.has(targetId)) {
            widgetSelectionContext.delete(targetId);
          } else {
            widgetSelectionContext.add(targetId);
          }
        } else {
          widgetSelectionContext.clear();
          widgetSelectionContext.add(targetId);
        }

        _onSelectionChange();

        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });

  function _applySelectionClasses() {
    for (const info of widgetContainer.widgetsInfo.values()) {
      const div = info.containerDiv;
      div.classList.remove(SELECTED_CLASS);
      div.classList.remove(LAST_SELECTED_CLASS);
    }

    let widget = null;
    widgetSelectionContext.forEach((id) => {
      widget = widgetContainer.getWidgetContainerDiv(id);
      widget.classList.add(SELECTED_CLASS);
    });
    if (widget) {
      widget.classList.add(LAST_SELECTED_CLASS);
    }
  }

  /*--------computeDropperMaxWidth--------*/
  function computeDropperMaxWidth() {
    // TODO rm
    panelDash.fullScreenWidth = Math.ceil(((drprD.offsetWidth + 25) / 0.75) * 0.975 - 25); //first computation of fullScreenWidth: approximation
  }

  /*--------Widget add function--------*/
  function addWidget(modelJsonId, instanceId, wLayout, wzIndex) {
    // TODO coords page
    instanceId = _build(modelJsonId, instanceId, wLayout, wzIndex);

    _onAddRmWidget();

    widgetSelectionContext.clear();
    widgetSelectionContext.add(instanceId);
    _onSelectionChange();

    return instanceId;
  }

  function deleteWidget(instanceId) {
    unselectWidget(instanceId);

    delete widgetConnector.widgetsConnection[instanceId]; // delete connection
    widgetContainer.delete(instanceId);

    _onAddRmWidget();
  }

  function _onAddRmWidget() {
    angular
      .element(document.body)
      .injector()
      .invoke([
        'EventCenterService',
        (eventCenterService) => {
          eventCenterService.sendEvent(EVENTS_EDITOR_ADD_REMOVE_WIDGET);
        },
      ]);
  }

  /*--------serialize--------*/
  function serialize() {
    const dashJson = {};
    for (const [key, val] of widgetContainers) {
      const wcLayout = {
        // TODO
        top: $('#' + val.id)[0].style.top,
        left: $('#' + val.id)[0].style.left,
        height: $('#' + val.id)[0].style.height,
        width: $('#' + val.id)[0].style.width,
        minHeight: $('#' + val.id)[0].style.minHeight,
        minWidth: $('#' + val.id)[0].style.minWidth,
        'z-index': $('#' + val.id)[0].style['z-index'],
      };
      const container = {
        instanceId: val.instanceId,
        modelJsonId: val.modelJsonId,
      };
      // TODO : gérer de façon abstraite
      if (bNoteBookMode || val.modelJsonId == 'annotationLabel' || val.modelJsonId == 'annotationImage') {
        dashJson[key] = {
          layout: wcLayout,
          container: container,
          modelParameters: modelsParameters[key],
          modelHiddenParams: modelsHiddenParams[key],
        };
      } else {
        const emptyModelsHiddenParams = jQuery.extend(true, {}, modelsHiddenParams[val.modelJsonId]);
        dashJson[key] = {
          layout: wcLayout,
          container: container,
          modelParameters: modelsParameters[key],
          modelHiddenParams: emptyModelsHiddenParams,
        };
      }
    }
    return dashJson;
  }

  /*--------deserialize--------*/
  function deserialize(dashObj, scalingObj, deviceObj) {
    clear();
    editorDimensionsSnapshot = getCurrentDashZoneDims();

    var i = 0;
    var wLayout, w1Layout, w2Layout;
    var left, top, width, height;

    if (!_.isUndefined(scalingObj)) {
      if (!_.isUndefined(scalingObj.scalingMethod)) {
        editorScalingMethod = scalingObj.scalingMethod;
      }
    }

    // update needed information by scalingHelper
    scalingHelper.setDimensions(editorDimensionsSnapshot);
    scalingHelper.setScalingMethod(editorScalingMethod);

    // columns rescale
    editorSingletons.layoutMgr.deserialize(deviceObj, scalingObj);
    scalingHelper.deserialize(scalingObj);
    editorSingletons.layoutMgr.updateColHeight(scalingObj);
    scalingHelper.resizeDashboardCols();

    var projectedScalingObj = scalingObj;
    var projectedEditorDimensions = editorDimensionsSnapshot;

    if (_.isUndefined(scalingObj)) {
      // old backward compatibility
      projectedScalingObj = editorDimensionsSnapshot;
    } else {
      if (_.isUndefined(scalingObj.media)) scalingObj.media = 'large';

      /*------------------------------------------------------------------------*/
      var mediaChangeProj = scalingHelper.mediaChangeProjection(
        scalingObj,
        editorDimensionsSnapshot,
        editorSingletons.layoutMgr.getRows()
      );
      /*------------------------------------------------------------------------*/

      projectedScalingObj = mediaChangeProj.referenceFrame;
      projectedEditorDimensions = mediaChangeProj.targetFrame;
    }

    var edScalingMgr = new scalingManager(projectedScalingObj, projectedEditorDimensions, editorScalingMethod);

    var wdgDrprMap = editorSingletons.layoutMgr.deserializeCols(dashObj, deviceObj);

    for (const key in dashObj) {
      modelsParameters[key] = dashObj[key].modelParameters;

      if (
        bNoteBookMode ||
        dashObj[key].container.modelJsonId == 'annotationLabel' ||
        dashObj[key].container.modelJsonId == 'annotationImage'
      ) {
        if (!_.isEmpty(dashObj[key].modelHiddenParams)) {
          modelsHiddenParams[key] = dashObj[key].modelHiddenParams;
        }
      }

      top = rmUnit(dashObj[key].layout.top);
      left = rmUnit(dashObj[key].layout.left);
      width = rmUnit(dashObj[key].layout.width);
      height = rmUnit(dashObj[key].layout.height);

      w1Layout = {
        topVh: top,
        leftVw: left,
        widthVw: width,
        heightVh: height,
      };
      w2Layout = edScalingMgr.scale(w1Layout);
      wLayout = {
        top: w2Layout.topVh + 'vh',
        left: w2Layout.leftVw + 'vw',
        width: w2Layout.widthVw + 'vw',
        height: w2Layout.heightVh + 'vh',
      };

      var targetDiv = document.getElementById(wdgDrprMap[key]);

      editorSingletons.widgetEditor.addWidget(
        dashObj[key].container.modelJsonId,
        dashObj[key].container.instanceId,
        wLayout,
        dashObj[key].layout['z-index']
      );
      i = i + 1;
    }

    editorDimensionsSnapshot = getCurrentDashZoneDims(); // update editor dimensions

    // update needed information by scalingHelper
    scalingHelper.setDimensions(editorDimensionsSnapshot);
  }

  /*--------rescale--------*/
  function rescale() {
    // TODO
    editorSingletons.layoutMgr.updateMaxTopAndLeft();

    const divsDropZone = $('#drop-zone')[0].getElementsByTagName('div');

    editorDimensionsSnapshot = getCurrentDashZoneDims();
    scalingHelper.setDimensions(editorDimensionsSnapshot);
    scalingHelper.setScalingMethod(editorScalingMethod);
  }

  /*--------resizeDashboard--------*/
  function resizeDashboard() {
    editorDimensionsSnapshot = getCurrentDashZoneDims();
    scalingHelper.setDimensions(editorDimensionsSnapshot);
    scalingHelper.setScalingMethod(editorScalingMethod);
    scalingHelper.resizeDashboard();

    rescale();
  }

  /*--------reset--------*/
  function reset() {
    flatUiWidgetsPlugin.clear(); // FIXME
    plotlyWidgetsPlugin.clear(); // FIXME
    mapWidgetsPlugin.clear(); // FIXME

    widgetContainer.clear();

    bFirstExec.value = true; //in main-common

    unselectAllWidgets();
    _onAddRmWidget();
  }

  /*--------clear--------*/
  function clear() {
    editorSingletons.layoutMgr.clear();
    editorScalingMethod = 'scaleTwh'; // MBG 14/02/2022

    reset();

    widgetConnector.clear();
    widgetPreview.clear();
  }

  /*--------getCurrentDashZoneDims--------*/
  function getCurrentDashZoneDims() {
    //console.log("getCurrentDashZoneDims at editor");
    var curDashZone = {
      widthPx: $('#drop-zone').width(),
      heightPx: $('#drop-zone').height(),
      scrollWidthPx: $('#drop-zone')[0].scrollWidth,
      scrollHeightPx: $('#drop-zone')[0].scrollHeight,
      widthVw: (100 * $('#drop-zone').width()) / document.documentElement.clientWidth,
      heightVh: (100 * $('#drop-zone').height()) / document.documentElement.clientHeight,
      scrollWidthVw: (100 * $('#drop-zone')[0].scrollWidth) / document.documentElement.clientWidth,
      scrollHeightVh: (100 * $('#drop-zone')[0].scrollHeight) / document.documentElement.clientHeight,
      scalingMethod: editorScalingMethod,
      colDims: scalingHelper.getCurrentDropperDims(),
    };
    return curDashZone;
  }

  /*--------getSnapshotDashZoneDims--------*/
  function getSnapshotDashZoneDims() {
    return editorDimensionsSnapshot;
  }

  /*--------updateSnapshotDashZoneDims--------*/
  function updateSnapshotDashZoneDims() {
    editorDimensionsSnapshot = getCurrentDashZoneDims();
  }

  /*--------setScalingMethod--------*/
  function setScalingMethod(scalingArg) {
    editorScalingMethod = scalingArg;
    scalingHelper.setScalingMethod(editorScalingMethod);
  }

  /*--------unselectWidget--------*/
  function selectWidget(elementId) {
    widgetSelectionContext.add(elementId);
    _onSelectionChange();
  }

  function selectAllWidgets() {
    widgetSelectionContext.clear();
    widgetContainer.widgetIds.forEach((id) => widgetSelectionContext.add(id));
    _onSelectionChange();
  }

  /*--------unselectWidget--------*/
  function unselectWidget(elementId) {
    widgetSelectionContext.delete(elementId);
    _onSelectionChange();
  }

  /*--------unselectAllWidgets--------*/
  function unselectAllWidgets() {
    widgetSelectionContext.clear();
    _onSelectionChange();
  }

  /**
   * @return {?string} the id of the last selected widget if any
   */
  function getSelectedActive() {
    let value = null;
    for (value of widgetSelectionContext);
    return value;
  }

  /**
   * @return {Array.<string>} the ids of the selected widgets
   */
  function getSelection() {
    return [...widgetSelectionContext];
  }

  function _onSelectionChange() {
    _applySelectionClasses();
    angular
      .element(document.body)
      .injector()
      .invoke([
        'EventCenterService',
        (eventCenterService) => {
          eventCenterService.sendEvent(EVENTS_EDITOR_SELECTION_CHANGED);
        },
      ]);
  }

  function _notifyMove() {
    angular
      .element(document.body)
      .injector()
      .invoke([
        'EventCenterService',
        (eventCenterService) => {
          eventCenterService.sendEvent(EVENTS_EDITOR_WIDGET_MOVED);
        },
      ]);
  }

  function _notifyWidgMenu(instanceId) {
    angular
      .element(document.body)
      .injector()
      .invoke([
        'EventCenterService',
        (eventCenterService) => {
          eventCenterService.sendEvent(EVENTS_EDITOR_WIDGET_TOGGLE_MENU, instanceId);
        },
      ]);
  }

  // Public functions
  return {
    addWidget,
    duplicateWidgetWithConnection,
    deleteWidget,
    serialize,
    deserialize,
    rescale,
    resizeDashboard,
    clear,
    reset,
    getCurrentDashZoneDims,
    getSnapshotDashZoneDims,
    updateSnapshotDashZoneDims,
    computeDropperMaxWidth,
    setScalingMethod,
    selectWidget,
    selectAllWidgets,
    unselectWidget,
    unselectAllWidgets,
    getSelectedActive,
    getSelection,
    widgetContainer,
  };
}
