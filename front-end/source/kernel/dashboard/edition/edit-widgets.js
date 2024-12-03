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

import { editorSingletons } from 'kernel/editor-singletons';
import {
  EVENTS_EDITOR_SELECTION_CHANGED,
  EVENTS_EDITOR_ADD_REMOVE_WIDGET,
  EVENTS_EDITOR_WIDGET_MOVED,
  EVENTS_EDITOR_WIDGET_TOGGLE_MENU,
  EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED,
} from 'angular/modules/editor/editor.events';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { getGeometryChanges } from 'kernel/dashboard/widget/widget-placement';
import { modelsHiddenParams, modelsParameters } from 'kernel/base/widgets-states';
import { WidgetEditorViewer, MAIN_CONTAINER_ID } from 'kernel/dashboard/rendering/widget-editor-viewer';
import { createUniqueInstanceId } from 'kernel/dashboard/widget/widget-factory';
import { widgetViewer } from 'kernel/dashboard/rendering/widget-viewer';
import { flatUiWidgetsPlugin } from 'kernel/dashboard/plugins/basic/plugin-flat-ui-widgets';
import { plotlyWidgetsPlugin } from 'kernel/dashboard/plugins/plots/plugin-plotly-widgets';
import { mapWidgetsPlugin } from 'kernel/dashboard/plugins/geo-time/plugin-map-widgets';
import { customNavigationRuntime } from 'kernel/runtime/custom-navigation-runtime';

export function initEditWidget() {
  const drprD = document.getElementById(MAIN_CONTAINER_ID);
  drprD.innerHTML = '';

  const widgetEditorViewer = new WidgetEditorViewer();

  // scaling stuff
  const bNoteBookMode = false; // save or not widgets cache (to be read from the project)

  var widgetSelectionContext = new Set(); // selection context (Instance Ids of selected widgets)

  const RESIZE_MARGIN = 7;

  const CAN_GRAB_CURSOR = 'grab';
  const GRABBING_CURSOR = 'grabbing';

  const DROP_POSSIBLE_CLASS = 'drop-possible'; // Available drop zones
  const DROP_OVER_CLASS = 'drop-over'; // Drop zone under the pointer

  const SELECTED_CLASS = 'widget-selected';
  const LAST_SELECTED_CLASS = 'widget-selected-last';

  const DEFAULT_GRID_PX = 20;
  let grid = { sizeX: DEFAULT_GRID_PX, sizeY: DEFAULT_GRID_PX };
  let useGrid = false;

  let zoomRatio = 1;

  setAllowPageChangeFromScript(false);

  function getGrid() {
    return { ...grid };
  }

  function setAllowPageChangeFromScript(allow) {
    if (allow) {
      customNavigationRuntime.goToPage = (page) => changePage(page);
    } else {
      customNavigationRuntime.goToPage = () => {};
    }
  }

  /**
   * @description updates the size of the grid
   */
  function setGrid(sizeX, sizeY) {
    sizeX = Math.max(1, Math.round(sizeX));
    sizeY = Math.max(1, Math.round(sizeY));
    grid = { sizeX, sizeY };
    drprD.style['background-size'] = `${grid.sizeX}px ${grid.sizeY}px`;
  }

  function setUseGrid(_useGrid) {
    return (useGrid = _useGrid);
  }

  function _alignOnLocalGrid(xy) {
    let [x, y] = xy;
    return [Math.round(x / grid.sizeX) * grid.sizeX, Math.round(y / grid.sizeY) * grid.sizeY];
  }

  function _alignOnGlobalGrid(xy, offsets) {
    let [x, y] = xy;
    let [x0, y0] = offsets;

    const gridX = grid.sizeX * zoomRatio;
    const gridY = grid.sizeY * zoomRatio;

    return [Math.round((x - x0) / gridX) * gridX + x0, Math.round((y - y0) / gridY) * gridY + y0];
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
      instanceId = createUniqueInstanceId(modelJsonId, (id) => widgetEditorViewer.widgetsInfo.has(id));
    }

    // create mainDiv and containerDiv
    const cln = _createNewDiv(instanceId);

    widgetEditorViewer.createWidget(modelJsonId, instanceId, cln, wLayout, wzIndex, page);

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
    const info = widgetEditorViewer.widgetsInfo.get(elementId);

    const widgetLayoutPx = info.layout;
    // translate !
    const requestedLayoutPx = {
      top: widgetLayoutPx.top + 20,
      left: widgetLayoutPx.left + 20,
      width: widgetLayoutPx.width,
      height: widgetLayoutPx.height,
    };

    newWidgetId ??= createUniqueInstanceId(info.modelJsonId, (id) => widgetEditorViewer.widgetsInfo.has(id));

    // MBG : TODO : extend factory to transmit modelsHiddenParams
    // MBG : TODO : rename globally modelsHiddenParams to instanceHiddenParams
    // MBG : TODO : rename globally modelsParameters to instanceParameters
    modelsHiddenParams[newWidgetId] = jQuery.extend(true, {}, modelsHiddenParams[elementId]);
    modelsParameters[newWidgetId] = jQuery.extend(true, {}, modelsParameters[elementId]);
    addWidget(info.modelJsonId, newWidgetId, requestedLayoutPx, undefined, info.layout.page);

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
  interact(drprD)
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
          const container = drprD.getBoundingClientRect();

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
          for (const id of widgetEditorViewer.widgetIds) {
            if (!widgetSelectionContext.has(id)) {
              const geom = widgetEditorViewer.getRecordedGeometry(id);
              const left = container.left + geom.left + widgetEditorViewer.marginX;
              const top = container.top + geom.top + widgetEditorViewer.marginY;
              container;
              const right = left + geom.width;
              const bottom = top + geom.height;
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
          _onSelectionChange();
        },

        end() {
          _selectionInitialState = [];
          if (_selectionLasso) {
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
  interact(drprD).dropzone({
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

  interact(drprD).dropzone({
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
  interact('.drag-drop-new')
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

          if (useGrid) {
            const offset = drprD.getBoundingClientRect();
            [x, y] = _alignOnGlobalGrid(
              [x, y],
              [
                offset.left + widgetEditorViewer.marginX * zoomRatio,
                offset.top + widgetEditorViewer.marginY * zoomRatio,
              ]
            );
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
          if (dropZone) {
            const rect = dropZone.getBoundingClientRect();
            x -= rect.left + widgetEditorViewer.marginX * zoomRatio;
            y -= rect.top + widgetEditorViewer.marginY * zoomRatio;
            x /= zoomRatio;
            y /= zoomRatio;

            if (useGrid) {
              [x, y] = _alignOnLocalGrid([x, y]);
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
                  const action = editorActionFactory.createCreateWidgetAction(_newId, layout);
                  undoManagerService.execute(action);
                },
              ]);
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
              const action = editorActionFactory.createCreateWidgetAction(targetId);
              undoManagerService.execute(action);
            },
          ]);
      }
    });

  // Widgets interactions
  const resizeParameters = new Map();
  interact(`#${MAIN_CONTAINER_ID} .drag-drop-move`)
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      margin: RESIZE_MARGIN,
      listeners: {
        start(event) {
          resizeParameters.clear();
          const target = event.target;
          const targetId = target.id;

          // When grabbed widget is not selected, it becomes the selection
          if (targetId && widgetEditorViewer.widgetIds.has(targetId) && !widgetSelectionContext.has(targetId)) {
            widgetSelectionContext.clear();
            widgetSelectionContext.add(targetId);
            _onSelectionChange();
          }

          const availableSpace = widgetEditorViewer.availableSpace();

          widgetSelectionContext.forEach((id) => {
            const widgetPosition = widgetEditorViewer.getCurrentWidgetGeometry(id);
            const x = widgetPosition.left;
            const y = widgetPosition.top;
            const height = widgetPosition.height || 1;
            const width = widgetPosition.width || 1;

            const { minWidth, minHeight } = widgetEditorViewer.minimumSize(id);

            const minRatioX = minWidth / width;
            const minRatioY = minHeight / height;

            // availableSpace can be infinite
            const maxWidth = event.edges.left ? x + width : availableSpace.width - x;
            const maxHeight = event.edges.top ? y + height : availableSpace.height - y;

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

          const targetStartPosition = widgetEditorViewer.getRecordedGeometry(target.id);

          const changeX = event.edges.left || event.edges.right;
          const changeY = event.edges.top || event.edges.bottom;
          const moveX = event.edges.left / zoomRatio;
          const moveY = event.edges.top / zoomRatio;

          let ratioX = changeX ? event.rect.width / zoomRatio / targetStartPosition.width : 1;
          let ratioY = changeY ? event.rect.height / zoomRatio / targetStartPosition.height : 1;

          if (event.shiftKey && changeX && changeY) {
            const ratio = Math.max(ratioX, ratioY);
            ratioX = ratioY = ratio;
          }

          for (const [id, params] of resizeParameters.entries()) {
            const { minRatioX, minRatioY, maxRatioX, maxRatioY } = params;

            const startPosition = widgetEditorViewer.getRecordedGeometry(id);
            const position = { ...startPosition };

            let widgetRatioX = ratioX;
            let widgetRatioY = ratioY;

            if (event.shiftKey && changeX && changeY) {
              const ratio = Math.max(widgetRatioX, widgetRatioY);
              widgetRatioX = widgetRatioY = ratio;
            }

            if (useGrid) {
              const width = position.width * widgetRatioX;
              const height = position.height * widgetRatioY;
              const px0 = position.left + (moveX ? startPosition.width - width : width);
              const py0 = position.top + (moveY ? startPosition.height - height : height);

              const [px, py] = _alignOnLocalGrid([px0, py0]);
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

            widgetEditorViewer.changeWidgetGeometry(id, position);
          }
          _notifyMove();
        },
        end(event) {
          const resizes = new Map();

          widgetSelectionContext.forEach((id) => {
            const toPosition = widgetEditorViewer.getCurrentWidgetGeometry(id);
            const startPosition = widgetEditorViewer.getRecordedGeometry(id);

            if (!angular.equals(startPosition, toPosition)) {
              resizes.set(id, toPosition);
            }

            // Should not do anything, but make doubly sure we have no discrepency
            widgetEditorViewer.resetWidgetGeometry(id);
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
          if (targetId && widgetEditorViewer.widgetIds.has(targetId) && !widgetSelectionContext.has(targetId)) {
            widgetSelectionContext.clear();
            widgetSelectionContext.add(targetId);
            _onSelectionChange();
          }
        },

        move(event) {
          const varX = (event.client.x - event.clientX0) / zoomRatio;
          const varY = (event.client.y - event.clientY0) / zoomRatio;

          widgetSelectionContext.forEach((id) => {
            let position = { ...widgetEditorViewer.getRecordedGeometry(id) };
            position.left += varX;
            position.top += varY;

            if (useGrid) {
              [position.left, position.top] = _alignOnLocalGrid([position.left, position.top]);
            }
            position = widgetEditorViewer.constrainLayout(position);

            widgetEditorViewer.changeWidgetGeometry(id, position);
          });

          _notifyMove();
        },

        end(event) {
          const varX = (event.client.x - event.clientX0) / zoomRatio;
          const varY = (event.client.y - event.clientY0) / zoomRatio;

          const moves = new Map();

          widgetSelectionContext.forEach((id) => {
            const startPosition = widgetEditorViewer.getRecordedGeometry(id);

            let position = { ...startPosition };
            position.left += varX;
            position.top += varY;

            if (useGrid) {
              [position.left, position.top] = _alignOnLocalGrid([position.left, position.top]);
            }
            position = widgetEditorViewer.constrainLayout(position);

            const changes = getGeometryChanges(startPosition, position);
            if (Object.keys(changes).length) {
              moves.set(id, changes);
            }

            // Should not do anything, but make doubly sure we have no discrepency
            widgetEditorViewer.resetWidgetGeometry(id);
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
      if (targetId && widgetEditorViewer.widgetIds.has(targetId)) {
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
    for (const info of widgetEditorViewer.widgetsInfo.values()) {
      const div = info.containerDiv;
      div.classList.remove(SELECTED_CLASS);
      div.classList.remove(LAST_SELECTED_CLASS);
    }

    let widget = null;
    widgetSelectionContext.forEach((id) => {
      widget = widgetEditorViewer.getWidgetContainerDiv(id);
      widget.classList.add(SELECTED_CLASS);
    });
    if (widget) {
      widget.classList.add(LAST_SELECTED_CLASS);
    }
  }

  /*--------Widget add function--------*/
  function addWidget(modelJsonId, instanceId, wLayout, wzIndex, page, updateSelection = true) {
    instanceId = _build(modelJsonId, instanceId, wLayout, wzIndex, page);

    _onAddRmWidget();

    if (updateSelection) {
      widgetSelectionContext.clear();
      widgetSelectionContext.add(instanceId);
      _onSelectionChange();
    }

    return instanceId;
  }

  function deleteWidget(instanceId) {
    unselectWidget(instanceId);

    delete widgetConnector.widgetsConnection[instanceId]; // delete connection
    widgetEditorViewer.delete(instanceId);

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
    const dashboard = {};
    for (const [instanceId, info] of widgetEditorViewer.widgetsInfo.entries()) {
      const layout = {
        top: info.layout.top,
        left: info.layout.left,
        height: info.layout.height,
        width: info.layout.width,
        'z-index': info.layout.zIndex,
      };
      if (info.layout.page !== undefined) {
        layout.page = info.layout.page;
      }

      const container = {
        instanceId,
        modelJsonId: info.modelJsonId,
      };
      // TODO : gérer de façon abstraite
      if (bNoteBookMode || info.modelJsonId == 'annotationLabel' || info.modelJsonId == 'annotationImage') {
        dashboard[instanceId] = {
          layout,
          container,
          modelParameters: modelsParameters[instanceId],
          modelHiddenParams: modelsHiddenParams[instanceId],
        };
      } else {
        const emptyModelsHiddenParams = jQuery.extend(true, {}, modelsHiddenParams[info.modelJsonId]);
        dashboard[instanceId] = {
          layout,
          container,
          modelParameters: modelsParameters[instanceId],
          modelHiddenParams: emptyModelsHiddenParams,
        };
      }
    }

    const layoutMgr = editorSingletons.layoutMgr;
    const display = {
      ...layoutMgr.serialize(),
      marginX: widgetEditorViewer.marginX,
      marginY: widgetEditorViewer.marginY,
      width: widgetEditorViewer.width,
      height: widgetEditorViewer.height,
      enforceHeightLimit: widgetEditorViewer.enforceHeightLimit,
    };

    const pageNames = widgetEditorViewer.pageNames;
    const pages = pageNames.length ? { pageNames } : undefined;
    return { dashboard, display, pages };
  }

  /*--------deserialize--------*/
  function deserialize({ dashboard, display, pages }) {
    clear();

    widgetEditorViewer.setMargins(display.marginX, display.marginY);
    widgetEditorViewer.setSize(display.width, display.height);
    widgetEditorViewer.enforceHeightLimit = display.enforceHeightLimit;

    const layoutMgr = editorSingletons.layoutMgr;
    layoutMgr.deserialize(display);

    if (pages) {
      widgetEditorViewer.pageNames = [...pages.pageNames];
      widgetEditorViewer.currentPage = 0;
    } else {
      widgetEditorViewer.pageNames = [];
      widgetEditorViewer.currentPage = undefined;
    }

    for (const widget of Object.values(dashboard)) {
      const { instanceId, modelJsonId } = widget.container;

      modelsParameters[instanceId] = widget.modelParameters;

      if (bNoteBookMode || modelJsonId == 'annotationLabel' || modelJsonId == 'annotationImage') {
        if (!_.isEmpty(widget.modelHiddenParams)) {
          modelsHiddenParams[instanceId] = widget.modelHiddenParams;
        }
      }

      addWidget(modelJsonId, instanceId, widget.layout, widget.layout['z-index'], widget.layout.page, false);
    }

    angular
      .element(document.body)
      .injector()
      .invoke([
        'EventCenterService',
        (eventCenterService) => {
          eventCenterService.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
        },
      ]);
  }

  /*--------reset--------*/
  function reset() {
    flatUiWidgetsPlugin.clear(); // FIXME
    plotlyWidgetsPlugin.clear(); // FIXME
    mapWidgetsPlugin.clear(); // FIXME

    widgetEditorViewer.clear();

    unselectAllWidgets();
    _onAddRmWidget();
  }

  /*--------clear--------*/
  function clear() {
    reset();

    widgetConnector.clear();
    widgetViewer.reset();
  }

  /*--------unselectWidget--------*/
  function selectWidget(elementId) {
    widgetSelectionContext.add(elementId);
    _onSelectionChange();
  }

  function selectAllWidgets() {
    widgetSelectionContext.clear();
    [...widgetEditorViewer.widgetIds]
      .filter((id) => widgetEditorViewer.isVisible(id))
      .forEach((id) => widgetSelectionContext.add(id));
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

  function changePage(pageNb) {
    widgetEditorViewer.changePage(pageNb);
    validateSelectionVisibility();
  }

  function validateSelectionVisibility() {
    getSelection()
      .filter((elementId) => !widgetEditorViewer.isVisible(elementId))
      .forEach((elementId) => widgetSelectionContext.delete(elementId));

    _onSelectionChange();
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
    clear,
    reset,
    selectWidget,
    selectAllWidgets,
    unselectWidget,
    unselectAllWidgets,
    getSelectedActive,
    getSelection,
    validateSelectionVisibility,
    changePage,
    widgetEditorViewer,
    getGrid,
    setGrid,
    setUseGrid,
    setAllowPageChangeFromScript,
    setZoomRatio: (newValue) => (zoomRatio = newValue),
  };
}
