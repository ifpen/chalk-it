// ┌────────────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ widgetEditor                                                                               │ \\
// ├────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                                │ \\
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
} from 'angular/modules/editor/editor.events';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { widgetFactory } from 'kernel/dashboard/widget/widget-factory';
import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';
import { enforceConstraints } from 'kernel/dashboard/widget/widget-placement';
import { getMedia, isMediaChanged, unitW, unitH } from 'kernel/dashboard/scaling/scaling-utils';
import { minLeftCst, minTopCst, minHeightCst, minWidthCst } from 'kernel/dashboard/scaling/layout-mgr';
import { widgetInstance } from 'kernel/dashboard/widget/widget-instance';
import { modelsHiddenParams, modelsParameters, models, modelsTempParams } from 'kernel/base/widgets-states';
import { gridMgr } from 'kernel/dashboard/edition/grid-mgr';
import { widgetContainer } from 'kernel/dashboard/widget/widget-container';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { scalingManager } from 'kernel/dashboard/scaling/scaling-manager';
import { flatUiWidgetsPlugin } from 'kernel/dashboard/plugins/basic/plugin-flat-ui-widgets';
import { plotlyWidgetsPlugin } from 'kernel/dashboard/plugins/plots/plugin-plotly-widgets';
import { mapWidgetsPlugin } from 'kernel/dashboard/plugins/geo-time/plugin-map-widgets';
import { bFirstExec, rescaleWidget } from 'kernel/base/main-common';

export function initEditWidget() {
  var drprD = $('#DropperDroite')[0]; // short alias
  // TODO redundent with widgetContainers ?
  var modelsId = []; // save unique "Instance Id"

  // all indexed by widgetObject "Instance Id"
  var widgetObject = []; // widgetObject object from plugin
  // relative widget coordinates. Used for media change rescale
  var widthRatioModels = [];
  var heightRatioModels = [];
  var leftRatioModels = [];
  var topRatioModels = [];

  var widgetContainers = new Map();

  // scaling stuff
  const bNoteBookMode = false; // save or not widgets cache (to be read from the project)
  var lastMediaInEdit = '';
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

  const DATA_ATTR_X = 'data-x';
  const DATA_ATTR_Y = 'data-y';
  const DATA_ATTR_X0 = 'data-x0';
  const DATA_ATTR_Y0 = 'data-y0';

  const DATA_ATTR_HEIGHT = 'data-height';
  const DATA_ATTR_WIDTH = 'data-width';
  const DATA_ATTR_HEIGHT0 = 'data-height0';
  const DATA_ATTR_WIDTH0 = 'data-width0';

  const DATA_ATTR_MIN_RATIO_X = 'data-minRatioX';
  const DATA_ATTR_MIN_RATIO_Y = 'data-minRatioY';
  const DATA_ATTR_MAX_RATIO_X = 'data-maxRatioX';
  const DATA_ATTR_MAX_RATIO_Y = 'data-maxRatioY';

  const DATA_ATTR_DISPLAY_X = 'data-display-x';
  const DATA_ATTR_DISPLAY_Y = 'data-display-y';

  function _removeDragDropDataAttr(element) {
    element.removeAttribute(DATA_ATTR_X);
    element.removeAttribute(DATA_ATTR_Y);
    element.removeAttribute(DATA_ATTR_X0);
    element.removeAttribute(DATA_ATTR_Y0);

    element.removeAttribute(DATA_ATTR_HEIGHT);
    element.removeAttribute(DATA_ATTR_WIDTH);
    element.removeAttribute(DATA_ATTR_HEIGHT0);
    element.removeAttribute(DATA_ATTR_WIDTH0);

    element.removeAttribute(DATA_ATTR_MIN_RATIO_X);
    element.removeAttribute(DATA_ATTR_MIN_RATIO_Y);
    element.removeAttribute(DATA_ATTR_MAX_RATIO_X);
    element.removeAttribute(DATA_ATTR_MAX_RATIO_Y);

    element.removeAttribute(DATA_ATTR_DISPLAY_X);
    element.removeAttribute(DATA_ATTR_DISPLAY_Y);
  }

  function _readStartPosition(element) {
    return {
      left: parseFloat(element.getAttribute(DATA_ATTR_X0)) || 0,
      top: parseFloat(element.getAttribute(DATA_ATTR_Y0)) || 0,
      height: parseFloat(element.getAttribute(DATA_ATTR_HEIGHT0)) || 1,
      width: parseFloat(element.getAttribute(DATA_ATTR_WIDTH0)) || 1,
    };
  }

  // cleanup when dropper is not empty and has a text node
  if ($('#DropperDroite')[0].hasChildNodes()) {
    var div = $('#DropperDroite')[0];
    var L = div.childNodes.length;
    for (var i = L - 1; i >= 0; i--) {
      if (div.childNodes[i].id != 'menuWidget') div.childNodes[i].remove();
    }
  }

  function _getContainerId(element) {
    if (element.parentNode && element.parentNode.parentNode) {
      const id = element.parentNode.parentNode.id;
      if (id && id.startsWith('dpr')) {
        return id;
      }
    }
    return MAIN_CONTAINER_ID;
  }

  function getContainer(element) {
    return document.getElementById(_getContainerId(element));
  }

  function _toGlobal(containerId, position) {
    if (containerId === MAIN_CONTAINER_ID) {
      return position;
    } else {
      const offset = $('#' + containerId).offset();
      return {
        ...position,
        top: position.top + offset.top,
        left: position.left + offset.left,
      };
    }
  }

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

  // Selection
  var _selectionLasso = null;
  var _selectionInitialState = [];
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

          const x = event.clientX0 + window.pageXOffset;
          const y = event.clientY0 + window.pageYOffset;
          _selectionLasso.style.left = x + 'px';
          _selectionLasso.style.top = y + 'px';

          _selectionLasso.style.width = '0px';
          _selectionLasso.style.height = '0px';

          _selectionLasso.setAttribute(DATA_ATTR_X, x);
          _selectionLasso.setAttribute(DATA_ATTR_Y, y);
          _selectionLasso.setAttribute(DATA_ATTR_X0, x);
          _selectionLasso.setAttribute(DATA_ATTR_Y0, y);
        },

        move(event) {
          const x0 = parseFloat(_selectionLasso.getAttribute(DATA_ATTR_X0)) || 0;
          const y0 = parseFloat(_selectionLasso.getAttribute(DATA_ATTR_Y0)) || 0;
          let x = parseFloat(_selectionLasso.getAttribute(DATA_ATTR_X)) || 0;
          let y = parseFloat(_selectionLasso.getAttribute(DATA_ATTR_Y)) || 0;

          x += event.dx;
          y += event.dy;

          _selectionLasso.setAttribute(DATA_ATTR_X, x);
          _selectionLasso.setAttribute(DATA_ATTR_Y, y);

          const xMin = Math.min(x0, x);
          const xMax = Math.max(x0, x);
          const yMin = Math.min(y0, y);
          const yMax = Math.max(y0, y);

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
          for (const id of widgetContainers.keys()) {
            if (!widgetSelectionContext.has(id)) {
              const element = $('#' + id);
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
            _selectionLasso.parentNode.removeChild(_selectionLasso);
            _selectionLasso = null;
          }
        },
      },
    })
    .on('tap', function () {
      unselectAllWidgets();
    });

  // Drop zone highlights
  var _currentDropZone = null; // Ugly but not available on move events, it seems
  interact('#DropperDroite .drop-zone-col').dropzone({
    // When dropping new widgets or moves, but not selection
    accept: '.drag-drop-new, .drag-drop-move',
    ondropactivate(event) {
      event.target.classList.add(DROP_POSSIBLE_CLASS);
    },
    ondragenter(event) {
      event.target.classList.add(DROP_OVER_CLASS);
      _currentDropZone = event.target;
    },
    ondragleave(event) {
      event.target.classList.remove(DROP_OVER_CLASS);
      _currentDropZone = null;
    },
    ondrop(event) {},
    ondropdeactivate(event) {
      event.target.classList.remove(DROP_POSSIBLE_CLASS);
      event.target.classList.remove(DROP_OVER_CLASS);
      _currentDropZone = null;
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
  var _draggedClone = null;
  var _newId = null;
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
          _draggedClone.id = 'dragged-new-widget';
          _draggedClone.classList.add('dragged-new-widget');

          document.body.appendChild(_draggedClone);

          const rect = target.getBoundingClientRect();
          const y = rect.top + window.pageYOffset;
          const x = rect.left + window.pageXOffset;
          _draggedClone.style.left = x + 'px';
          _draggedClone.style.top = y + 'px';

          _draggedClone.setAttribute(DATA_ATTR_X, x);
          _draggedClone.setAttribute(DATA_ATTR_Y, y);
        },

        move(event) {
          let x = parseFloat(_draggedClone.getAttribute(DATA_ATTR_X)) || 0;
          let y = parseFloat(_draggedClone.getAttribute(DATA_ATTR_Y)) || 0;

          x += event.dx;
          y += event.dy;

          _draggedClone.setAttribute(DATA_ATTR_X, x);
          _draggedClone.setAttribute(DATA_ATTR_Y, y);

          const grid = gridMgr.getGrid();
          if (grid) {
            let container = MAIN_CONTAINER_ID;
            if (_currentDropZone && _currentDropZone.id) {
              container = _currentDropZone.id;
            }
            const offset = $('#' + container).offset();
            [x, y] = _alignOnGrid([x, y], [offset.left, offset.top], grid);
          }

          _draggedClone.style.left = x + 'px';
          _draggedClone.style.top = y + 'px';
        },

        end(event) {
          let x = parseFloat(_draggedClone.getAttribute(DATA_ATTR_X)) || 0;
          let y = parseFloat(_draggedClone.getAttribute(DATA_ATTR_Y)) || 0;
          _draggedClone.parentNode.removeChild(_draggedClone);
          _removeDragDropDataAttr(_draggedClone);
          _draggedClone = null;

          const dropZone = event.relatedTarget;
          if (dropZone && dropZone.id) {
            const dropId = dropZone.id;
            if (dropId === MAIN_CONTAINER_ID || dropId.startsWith('dpr')) {
              const rect = dropZone.getBoundingClientRect();

              x -= rect.left - window.pageXOffset;
              y -= rect.top - window.pageYOffset;
              const grid = gridMgr.getGrid();
              if (grid) {
                [x, y] = _alignOnGrid([x, y], [0, 0], grid);
              }

              const layout = {
                top: unitH(y),
                left: unitW(x),
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
  interact('#DropperDroite .drag-drop-move')
    .resizable({
      edges: { left: true, right: true, bottom: true, top: true },
      margin: RESIZE_MARGIN,
      listeners: {
        start(event) {
          const target = event.target;
          const targetId = target.id;

          // When grabbed widget is not selected, it becomes the selection
          if (targetId && widgetContainers.has(targetId) && !widgetSelectionContext.has(targetId)) {
            widgetSelectionContext.clear();
            widgetSelectionContext.add(targetId);
            _onSelectionChange();
          }

          widgetSelectionContext.forEach((id) => {
            const widget = document.getElementById(id);
            const x = widget.offsetLeft;
            const y = widget.offsetTop;
            const height = widget.offsetHeight || 1;
            const width = widget.offsetWidth || 1;

            widget.setAttribute(DATA_ATTR_X0, x);
            widget.setAttribute(DATA_ATTR_Y0, y);
            widget.setAttribute(DATA_ATTR_HEIGHT0, height);
            widget.setAttribute(DATA_ATTR_WIDTH0, width);

            widget.setAttribute(DATA_ATTR_X, x);
            widget.setAttribute(DATA_ATTR_Y, y);
            widget.setAttribute(DATA_ATTR_HEIGHT, height);
            widget.setAttribute(DATA_ATTR_WIDTH, width);

            const minWidth = parseInt(widget.style['min-width'] || minWidthCst + 'px', 10);
            const minHeight = parseInt(widget.style['min-height'] || minHeightCst + 'px', 10);

            widget.setAttribute(DATA_ATTR_MIN_RATIO_X, minWidth / width);
            widget.setAttribute(DATA_ATTR_MIN_RATIO_Y, minHeight / height);

            const containerId = _getContainerId(widget);
            let maxRatioX = Infinity;
            let maxRatioY = Infinity;

            if (containerId !== MAIN_CONTAINER_ID) {
              const container = document.getElementById(containerId);
              if (!event.edges.left) {
                const availableX = container.offsetWidth - x - minLeftCst;
                maxRatioX = Math.min(maxRatioX, availableX / width);
              }
              if (!event.edges.top) {
                const availableY = container.offsetHeight - y - minTopCst;
                maxRatioY = Math.min(maxRatioY, availableY / height);
              }
            }
            if (event.edges.left) {
              const availableX = x + width - minLeftCst;
              maxRatioX = Math.min(maxRatioX, availableX / width);
            }
            if (event.edges.top) {
              const availableY = y + height - minTopCst;
              maxRatioY = Math.min(maxRatioY, availableY / height);
            }
            widget.setAttribute(DATA_ATTR_MAX_RATIO_X, maxRatioX);
            widget.setAttribute(DATA_ATTR_MAX_RATIO_Y, maxRatioY);
          });
        },
        move(event) {
          const target = event.target;

          const targetStartPosition = _readStartPosition(target);

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
          widgetSelectionContext.forEach((id) => {
            const widget = document.getElementById(id);

            const startPosition = _readStartPosition(widget);

            const minRatioX = parseFloat(widget.getAttribute(DATA_ATTR_MIN_RATIO_X)) || 0;
            const minRatioY = parseFloat(widget.getAttribute(DATA_ATTR_MIN_RATIO_Y)) || 0;
            const maxRatioX = parseFloat(widget.getAttribute(DATA_ATTR_MAX_RATIO_X)) || Infinity;
            const maxRatioY = parseFloat(widget.getAttribute(DATA_ATTR_MAX_RATIO_Y)) || Infinity;

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
              position.width *= widgetRatioX;
              if (moveX) {
                position.left -= position.width - startPosition.width;
              }
            }

            if (changeY) {
              position.height *= widgetRatioY;
              if (moveY) {
                position.top -= position.height - startPosition.height;
              }
            }

            // update the element's style
            widget.style.left = position.left + 'px';
            widget.style.top = position.top + 'px';
            widget.style.width = position.width + 'px';
            widget.style.height = position.height + 'px';

            widget.setAttribute(DATA_ATTR_X, position.left);
            widget.setAttribute(DATA_ATTR_Y, position.top);
            widget.setAttribute(DATA_ATTR_HEIGHT, position.height);
            widget.setAttribute(DATA_ATTR_WIDTH, position.width);
          });

          _notifyMove();
        },
        end(event) {
          const resizes = new Map();

          widgetSelectionContext.forEach((id) => {
            const widget = document.getElementById(id);

            let toPosition = {
              left: parseFloat(widget.getAttribute(DATA_ATTR_X)) || 0,
              top: parseFloat(widget.getAttribute(DATA_ATTR_Y)) || 0,
              height: parseFloat(widget.getAttribute(DATA_ATTR_HEIGHT)) || 0,
              width: parseFloat(widget.getAttribute(DATA_ATTR_WIDTH)) || 0,
            };
            const startPosition = _readStartPosition(widget);

            if (!angular.equals(startPosition, toPosition)) {
              // Sketchy, but only immediate alternative would be providing the action with the original position...
              widgetContainer.moveResizeWidget(widget, startPosition, false, true);
              resizes.set(id, toPosition);
            }

            _removeDragDropDataAttr(widget);
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
          if (targetId && widgetContainers.has(targetId) && !widgetSelectionContext.has(targetId)) {
            widgetSelectionContext.clear();
            widgetSelectionContext.add(targetId);
            _onSelectionChange();
          }

          widgetSelectionContext.forEach((id) => {
            const widget = document.getElementById(id);
            const x = widget.offsetLeft;
            const y = widget.offsetTop;
            const height = widget.offsetHeight || 1;
            const width = widget.offsetWidth || 1;

            widget.setAttribute(DATA_ATTR_X0, x);
            widget.setAttribute(DATA_ATTR_Y0, y);
            widget.setAttribute(DATA_ATTR_HEIGHT0, height);
            widget.setAttribute(DATA_ATTR_WIDTH0, width);

            widget.setAttribute(DATA_ATTR_X, x);
            widget.setAttribute(DATA_ATTR_Y, y);
          });
        },

        move(event) {
          let container = MAIN_CONTAINER_ID;
          if (_currentDropZone && _currentDropZone.id) {
            container = _currentDropZone.id;
          }

          const grid = gridMgr.getGrid();

          widgetSelectionContext.forEach((id) => {
            const widget = document.getElementById(id);
            const currentContainerId = _getContainerId(widget);

            const position = {
              left: parseFloat(widget.getAttribute(DATA_ATTR_X)) || 0,
              top: parseFloat(widget.getAttribute(DATA_ATTR_Y)) || 0,
              height: parseFloat(widget.getAttribute(DATA_ATTR_HEIGHT0)) || 0,
              width: parseFloat(widget.getAttribute(DATA_ATTR_WIDTH0)) || 0,
            };

            position.left += event.dx;
            position.top += event.dy;

            widget.setAttribute(DATA_ATTR_X, position.left);
            widget.setAttribute(DATA_ATTR_Y, position.top);

            let toPosition = position;
            if (currentContainerId !== MAIN_CONTAINER_ID) {
              toPosition = _toGlobal(currentContainerId, toPosition);
            }

            if (container === MAIN_CONTAINER_ID) {
              if (grid) {
                [toPosition.left, toPosition.top] = _alignOnGrid([toPosition.left, toPosition.top], [0, 0], grid);
              }

              toPosition.left = Math.max(minLeftCst, toPosition.left);
              toPosition.top = Math.max(minTopCst, toPosition.top);
            } else {
              const c = $('#' + container);
              const offset = c.offset();
              const containerLayout = {
                left: offset.left,
                top: offset.top,
                height: c.height(),
                width: c.width(),
              };

              if (grid) {
                [toPosition.left, toPosition.top] = _alignOnGrid(
                  [toPosition.left, toPosition.top],
                  [containerLayout.left, containerLayout.top],
                  grid
                );
              }

              toPosition = enforceConstraints(toPosition, containerLayout);
            }

            // Store "local" position (relative to the drop zone) for display in the "position" fields. Much easier to compute here than in the angular controler.
            const locPos = _toLocal(container, toPosition);
            widget.setAttribute(DATA_ATTR_DISPLAY_X, locPos.left);
            widget.setAttribute(DATA_ATTR_DISPLAY_Y, locPos.top);

            if (currentContainerId !== MAIN_CONTAINER_ID) {
              toPosition = _toLocal(currentContainerId, toPosition);
            }
            widget.style.left = toPosition.left + 'px';
            widget.style.top = toPosition.top + 'px';
            widget.style.width = toPosition.width + 'px';
            widget.style.height = toPosition.height + 'px';
          });

          _notifyMove();
        },

        end(event) {
          const moves = new Map();

          const dropZone = event.relatedTarget;
          let container = MAIN_CONTAINER_ID;
          if (dropZone && dropZone.id) {
            container = dropZone.id;
          }

          const grid = gridMgr.getGrid();

          if (editorSingletons.layoutMgr.isRowColMode() && container === MAIN_CONTAINER_ID) {
            widgetSelectionContext.forEach((id) => {
              const widget = document.getElementById(id);
              const startPosition = _readStartPosition(widget);

              widgetContainer.moveResizeWidget(widget, startPosition, false, false);

              _removeDragDropDataAttr(widget);
            });
            return;
          }

          widgetSelectionContext.forEach((id) => {
            const widget = document.getElementById(id);

            const currentContainer = _getContainerId(widget);
            let x = parseFloat(widget.getAttribute(DATA_ATTR_X)) || 0;
            let y = parseFloat(widget.getAttribute(DATA_ATTR_Y)) || 0;

            const startPosition = _readStartPosition(widget);

            let toPosition = {
              left: x,
              top: y,
            };
            if (container !== currentContainer) {
              toPosition = _toGlobal(currentContainer, toPosition);
              toPosition = _toLocal(container, toPosition);
            }

            if (grid) {
              [toPosition.left, toPosition.top] = _alignOnGrid([toPosition.left, toPosition.top], [0, 0], grid);
            }

            if (!angular.equals(startPosition, toPosition)) {
              // Sketchy, but only immediate alternative would be providing the action with the original position...
              widgetContainer.moveResizeWidget(widget, startPosition, false, false);
              moves.set(id, toPosition);
            }

            _removeDragDropDataAttr(widget);
          });

          if (moves.size > 0) {
            angular
              .element(document.body)
              .injector()
              .invoke([
                'UndoManagerService',
                'EditorActionFactory',
                (undoManagerService, editorActionFactory) => {
                  const action = editorActionFactory.createDropToCellAction(
                    container,
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
      if (targetId && widgetContainers.has(targetId)) {
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
    for (const id of widgetContainers.keys()) {
      $('#' + id).removeClass(SELECTED_CLASS);
      $('#' + id).removeClass(LAST_SELECTED_CLASS);
    }

    let widget = null;
    widgetSelectionContext.forEach((id) => {
      widget = $('#' + id);
      widget.addClass(SELECTED_CLASS);
    });
    if (widget) {
      widget.addClass(LAST_SELECTED_CLASS);
    }
  }

  /*--------computeDropperMaxWidth--------*/
  function computeDropperMaxWidth() {
    panelDash.fullScreenWidth = Math.ceil(((drprD.offsetWidth + 25) / 0.75) * 0.975 - 25); //first computation of fullScreenWidth: approximation
  }

  /*--------Widget add function--------*/
  function addWidget(modelJsonId, targetDiv, instanceId, wLayout, wzIndex) {
    const builtWidget = widgetFactory.build(modelJsonId, targetDiv, instanceId, wLayout, wzIndex);
    widgetObject[builtWidget.instanceId] = builtWidget.widgetObj;

    widgetContainers.set(builtWidget.instanceId, builtWidget);

    if (widgetObject[builtWidget.instanceId].constructor.name == 'createWidget') {
      // creation failed
      widgetInstance.deleteWidget(builtWidget.divModel);
    } else {
      _onAddRmWidget();

      widgetSelectionContext.clear();
      widgetSelectionContext.add(builtWidget.instanceId);
      _onSelectionChange();

      return builtWidget;
    }
  }

  function deleteWidget(instanceId) {
    const widget = widgetContainers.get(instanceId);
    const element = widget.divModel;
    widgetInstance.deleteWidget(element);
    unselectWidget(element);
    element.remove();

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

      lastMediaInEdit = mediaChangeProj.lastMedia;
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
      modelsId[i] = key;

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
        targetDiv,
        dashObj[key].container.instanceId,
        wLayout,
        dashObj[key].layout['z-index']
      );
      i = i + 1;
    }

    for (const key in dashObj) {
      computeWidgetsRatio(dashObj[key].container.instanceId);
    }

    editorDimensionsSnapshot = getCurrentDashZoneDims(); // update editor dimensions

    // update needed information by scalingHelper
    scalingHelper.setDimensions(editorDimensionsSnapshot);
  }

  /*--------computeWidgetsRatio--------*/
  function computeWidgetsRatio(instanceId) {
    if (!_.isUndefined($('#' + instanceId)[0])) {
      //AEF: fix bug, must be to be tested if creation has been failed
      widthRatioModels[instanceId] =
        $('#' + instanceId).width() / $('#' + $('#' + instanceId)[0].parentNode.parentNode.id).width();
      heightRatioModels[instanceId] =
        $('#' + instanceId).height() / $('#' + $('#' + instanceId)[0].parentNode.parentNode.id).height();
      leftRatioModels[instanceId] =
        $('#' + instanceId).position().left / $('#' + $('#' + instanceId)[0].parentNode.parentNode.id).width();
      topRatioModels[instanceId] =
        $('#' + instanceId).position().top / $('#' + $('#' + instanceId)[0].parentNode.parentNode.id).height();
      lastMediaInEdit = getMedia();
    }
  }

  /*--------resizeOnMediaChange--------*/
  function resizeOnMediaChange() {
    scalingHelper.resizeDashboardCols();

    var divsDropZone = $('#drop-zone')[0].getElementsByTagName('div');

    for (var i = 0; i < divsDropZone.length; i++) {
      // TODO
      if ($('#' + divsDropZone[i].id).hasClass('drsElement') && divsDropZone[i].id.substring(0, 6) != 'Widget') {
        var element = divsDropZone[i];
        var instanceId = element.id;

        /*-------------------------------------------------------------*/
        scalingHelper.resizeWidgetOnMediaChange(instanceId, instanceId);
        /*-------------------------------------------------------------*/

        // To better recode in widgetObject structure
        for (var ch = element.childNodes.length - 1; ch >= 0; ch--) {
          if (element.childNodes[ch].id.match('WidgetContainer')) {
            wcId = element.childNodes[ch].id;
            break;
          }
        }
        widgetContainer.replaceWidget(element);
      }
    }
  }

  /*--------rescale--------*/
  function rescale() {
    editorSingletons.layoutMgr.updateMaxTopAndLeft();

    var divsDropZone = $('#drop-zone')[0].getElementsByTagName('div');

    editorDimensionsSnapshot = getCurrentDashZoneDims();
    scalingHelper.setDimensions(editorDimensionsSnapshot);
    scalingHelper.setScalingMethod(editorScalingMethod);

    var bChanged = false;
    var mediaChangeObj = isMediaChanged(lastMediaInEdit);
    bChanged = mediaChangeObj.bChanged;
    lastMediaInEdit = mediaChangeObj.lastMedia;

    if (bChanged) {
      resizeOnMediaChange();
    } else {
      for (var i = 0; i < divsDropZone.length; i++) {
        if (divsDropZone[i].id) {
          // TODO
          if ($('#' + divsDropZone[i].id).hasClass('drsElement') && divsDropZone[i].id.substring(0, 6) != 'Widget') {
            var element = divsDropZone[i];
            var instanceId = element.id;
            rescaleWidget(widgetObject, instanceId);
            widgetContainers.get(instanceId).widgetObj = widgetObject[instanceId];
          }
        }
      }
    }
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

    for (const [key, val] of widgetContainers) {
      if (!_.isUndefined(models[key])) {
        delete models[key];
      }
      if (!_.isUndefined(modelsParameters[key])) {
        delete modelsParameters[key];
      }
      if (!_.isUndefined(modelsHiddenParams[key])) {
        delete modelsHiddenParams[key];
      }
      if (!_.isUndefined(modelsTempParams[key])) {
        delete modelsTempParams[key];
      }
    }
    widgetContainers.clear();
    for (const property in widgetObject) {
      delete widgetObject[property];
    }
    modelsId.length = 0;

    bFirstExec.value = true; //in main-common

    unselectAllWidgets();
    _onAddRmWidget();

    //$('#DropperDroite').html('');
    if ($('#DropperDroite')[0].hasChildNodes()) {
      var div = $('#DropperDroite')[0];
      var L = div.childNodes.length;
      for (var i = L - 1; i >= 0; i--) {
        if (div.childNodes[i].id != 'menuWidget') div.childNodes[i].remove();
      }
    }
  }

  /*--------clear--------*/
  function clear() {
    editorSingletons.layoutMgr.clear();
    var property;
    for (property in widthRatioModels) {
      delete widthRatioModels[property];
    }
    for (property in heightRatioModels) {
      delete heightRatioModels[property];
    }
    for (property in leftRatioModels) {
      delete leftRatioModels[property];
    }
    for (property in topRatioModels) {
      delete topRatioModels[property];
    }
    lastMediaInEdit = '';
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
      media: getMedia(),
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

  /*--------getWidgetsRelativeDims--------*/
  function getWidgetsRelativeDims() {
    return {
      width: widthRatioModels,
      height: heightRatioModels,
      left: leftRatioModels,
      top: topRatioModels,
    };
  }

  /*--------unselectWidget--------*/
  function selectWidget(element) {
    widgetSelectionContext.add(element.id);
    _onSelectionChange();
  }

  function selectAllWidgets() {
    widgetSelectionContext.clear();
    for (const id of widgetContainers.keys()) {
      widgetSelectionContext.add(id);
    }
    _onSelectionChange();
  }

  /*--------unselectWidget--------*/
  function unselectWidget(element) {
    widgetSelectionContext.delete(element.id);
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

  /*--------setLastMedia--------*/
  function setLastMedia(val) {
    lastMediaInEdit = val;
  }

  /*----------showHideWidgMenu------------*/

  function showHideWidgMenu(event) {
    let sameTarget = true;
    const elm = event.parentElement.parentElement;
    const idElm = elm.id;

    let connectedDataNodes = [];
    let cnxs = widgetConnector.widgetsConnection;

    if (!_.isUndefined(cnxs[idElm])) {
      _.each(_.keys(cnxs[idElm].sliders), (slider) => {
        let dsName = cnxs[idElm].sliders[slider].dataNode;
        if (connectedDataNodes.indexOf(dsName) === -1) {
          //fix issue#23
          connectedDataNodes.push(dsName);
        }
      });
    }

    const openGraphFromWidget = document.getElementById('openGraphFromWidget');
    openGraphFromWidget?.setAttribute('name', JSON.stringify(connectedDataNodes));

    const idList = 'menuWidget';

    if ($('#' + idList)[0].getAttribute('name') !== idElm) {
      $('#' + idList).attr('name', idElm);
      sameTarget = false;
    }

    const vm = angular.element(document.getElementById('dashboard-editor')).scope().vm;
    if (vm.menuWidgetVisible) {
      if (sameTarget) vm.menuWidgetVisible = false;
    } else vm.menuWidgetVisible = true;

    const containerId = _getContainerId(elm);

    const mainContainerOffsetHeight = $('#' + MAIN_CONTAINER_ID)[0].offsetHeight;

    const containerOffsetTop = $('#' + containerId)[0].offsetTop;
    const containerOffsetLeft = $('#' + containerId)[0].offsetLeft;

    const elementWidth = $('#' + idElm)[0].clientWidth;
    const elementHeight = $('#' + idElm)[0].clientHeight;
    const elementOffsetTop = $('#' + idElm)[0].offsetTop;
    const elementOffsetLeft = $('#' + idElm)[0].offsetLeft;

    const menuWidgetWidth = 247.047; // px
    const menuWidgetHeight = 443; // px
    const menuWidgetMarginTop = 30;
    const menuWidgetMarginBottom = elementHeight - 10;

    const nbRows = editorSingletons.layoutMgr.getRows();

    let elementOffsetBottom;
    let mainContainerHeight;

    if (containerId !== MAIN_CONTAINER_ID) {
      mainContainerHeight = mainContainerOffsetHeight * nbRows;
      elementOffsetBottom = mainContainerOffsetHeight - (elementHeight + elementOffsetTop + containerOffsetTop);
    } else {
      mainContainerHeight = mainContainerOffsetHeight;
      elementOffsetBottom = mainContainerOffsetHeight - (elementOffsetTop + elementHeight);
    }

    if (
      nbRows <= 1 &&
      containerOffsetTop + elementOffsetTop + menuWidgetMarginTop + menuWidgetHeight >= mainContainerOffsetHeight &&
      elementOffsetBottom + menuWidgetMarginBottom + menuWidgetHeight >= mainContainerOffsetHeight
    ) {
      $('#' + idList)[0].style.bottom = '10px';
      $('#' + idList)[0].style.top = 'auto';
      document.styleSheets[0].addRule('#menuWidget::after', 'top: -5px; transform: rotate(0deg)');
    } else if (containerOffsetTop + elementOffsetTop + menuWidgetMarginTop + menuWidgetHeight >= mainContainerHeight) {
      $('#' + idList)[0].style.bottom = (menuWidgetMarginBottom + elementOffsetBottom).toString() + 'px';
      $('#' + idList)[0].style.top = 'auto';
      document.styleSheets[0].addRule(
        '#menuWidget::after',
        'top: ' + menuWidgetHeight + 'px; transform: rotate(180deg)'
      );
    } else {
      $('#' + idList)[0].style.top = (containerOffsetTop + elementOffsetTop + menuWidgetMarginTop).toString() + 'px';
      $('#' + idList)[0].style.bottom = 'auto';
      document.styleSheets[0].addRule('#menuWidget::after', 'top: -5px; transform: rotate(0deg)');
    }

    if ((elementWidth + elementOffsetLeft).toString() <= menuWidgetWidth && containerOffsetLeft == 0) {
      $('#' + idList)[0].style.left = '7px';
      document.styleSheets[0].addRule('#menuWidget::after', 'left: ' + (elementOffsetLeft + elementWidth - 30) + 'px');
    } else {
      $('#' + idList)[0].style.left =
        (elementWidth + elementOffsetLeft + containerOffsetLeft - menuWidgetWidth).toString() + 'px';
      document.styleSheets[0].addRule('#menuWidget::after', 'left: auto; right: 20px');
    }
    $('#' + idList)[0].style.right = 'auto';
  }

  /*----------------------------------*/

  // Public functions
  return {
    addWidget,
    deleteWidget,
    widgetObject,
    widgetContainers,
    modelsId,
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
    setLastMedia,
    getWidgetsRelativeDims,
    setScalingMethod,
    widthRatioModels,
    heightRatioModels,
    leftRatioModels,
    topRatioModels,
    selectWidget,
    selectAllWidgets,
    unselectWidget,
    unselectAllWidgets,
    getSelectedActive,
    getSelection,
    getContainer,
    MAIN_CONTAINER_ID,
    DATA_ATTR_DISPLAY_X,
    DATA_ATTR_DISPLAY_Y,
    showHideWidgMenu,
  };
}
