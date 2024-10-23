﻿// ┌───────────────────────────────────────────────────────────────────────────────────┐ \\
// │ editor.controller                                                                 │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2024 IFPEN                                                       │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                            │ \\
// └───────────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import PNotify from 'pnotify';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { UndoableAction, UndoManager } from './editor.undo-manager';
import {
  EVENTS_EDITOR_SELECTION_CHANGED,
  EVENTS_EDITOR_ADD_REMOVE_WIDGET,
  EVENTS_EDITOR_CONNECTIONS_CHANGED,
  EVENTS_EDITOR_WIDGET_TOGGLE_MENU,
} from './editor.events';
import { keyShift } from 'kernel/dashboard/scaling/layout-mgr';

angular.module('modules.editor').controller('EditorController', [
  '$scope',
  '$rootScope',
  '$state',
  '$timeout',
  'UndoManagerService',
  'EditorActionFactory',
  'WidgetContainerGetter',
  'WidgetEditorGetter',
  'EventCenterService',
  'DashboardActiveTabGetter',
  'DashboardActiveModeGetter',
  function (
    $scope,
    $rootScope,
    $state,
    $timeout,
    undoManagerService,
    editorActionFactory,
    widgetContainerGetter,
    widgetEditorGetter,
    eventCenterService,
    dashboardActiveTabGetter,
    dashboardActiveModeGetter
  ) {
    $rootScope.moduleOpened = true; //AEF

    // TODO have initEditWidget here in a $postLink()

    const vm = this;

    const selection_event = EVENTS_EDITOR_SELECTION_CHANGED;
    const add_remove_widget_event = EVENTS_EDITOR_ADD_REMOVE_WIDGET;
    const connnection_update_event = EVENTS_EDITOR_CONNECTIONS_CHANGED;
    const widget_menu_event = EVENTS_EDITOR_WIDGET_TOGGLE_MENU;

    let copiedWidgets;

    vm.selection = [];
    vm.widgetExists = false;
    vm.connectionsExists = false;

    vm.menuWidgetVisible = false;
    vm.menuWidgetTargetId = null;
    eventCenterService.addListener(widget_menu_event, _toggleWidgMenu);

    function _getSelection() {
      const widgetEditor = widgetEditorGetter();
      if (widgetEditor) {
        return widgetEditor.getSelection();
      }
      return [];
    }

    function _getSelectedActive() {
      const widgetEditor = widgetEditorGetter();
      if (widgetEditor) {
        return widgetEditor.getSelectedActive();
      }
      return null;
    }

    const _selectionCallback = () =>
      $timeout(() => {
        // Protects us from being called from ouside of angular
        vm.selection = _getSelection();
        vm.updateGeometryFromSelection();
        _clickOnDataConnection(true);
      });

    eventCenterService.addListener(selection_event, _selectionCallback);

    const _addRmCallback = () => $timeout((vm.widgetExists = !!widgetEditorGetter().widgetContainer.widgetIds.size));
    eventCenterService.addListener(add_remove_widget_event, _addRmCallback);

    const _connectionsChangedCallback = () => $timeout((vm.connectionsExists = _hasConnection()));
    eventCenterService.addListener(connnection_update_event, _connectionsChangedCallback);

    vm.hasSelection = function _hasSelection() {
      return vm.selection.length > 0;
    };

    vm.hasSingleSelection = function _hasSingleSelection() {
      return vm.selection.length === 1;
    };

    vm.hasMultiSelection = function _hasMultiSelection() {
      return vm.selection.length > 1;
    };

    // --- <Toolbox> ---
    vm.borderInWidgets = true;
    vm.showGrid = false;

    vm.updateBorderInWidgets = function () {
      // TODO bind
      if (vm.borderInWidgets) $('#DropperDroite').addClass('show-widget-borders');
      else $('#DropperDroite').removeClass('show-widget-borders');
    };

    vm.updateShowGrid = function () {
      // TODO bind
      if (vm.showGrid) $('#DropperDroite').addClass('show-grid');
      else $('#DropperDroite').removeClass('show-grid');
    };

    // --- </Toolbox> ---

    // Keybindings
    function _onkeydown(e) {
      if ($rootScope.moduleOpened) {
        // Only handle keys when the editor is active
        // TODO should probably be handled using a different $state and controler's lifecycle
        return;
      }

      if (
        e &&
        e.target &&
        (e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLSelectElement ||
          e.target instanceof HTMLTextAreaElement)
      ) {
        // Do not capture keys when the active element is a form element
        return;
      }
      if (e.target.className.indexOf('jsoneditor-value') >= 0) {
        // Do not capture keys when the active element is jsoneditor
        return;
      }

      if (dashboardActiveTabGetter() !== 'widgets' || dashboardActiveModeGetter() !== 'edit-dashboard') {
        return;
      }

      let handled = false;

      if (e.ctrlKey) {
        if (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z'))) {
          if (vm.canRedo()) {
            vm.redo();
            handled = true;
          }
        } else if (e.key === 'z' || e.key === 'Z') {
          if (vm.canUndo()) {
            vm.undo();
            handled = true;
          }
        } else if (e.key === 'a' || e.key === 'A') {
          widgetEditorGetter().selectAllWidgets();
          handled = true;
        } else if (e.key === 'c') {
          vm.copyWidg();
          handled = true;
        } else if (e.key === 'v') {
          vm.pasteWidg();
          handled = true;
        }
        // Arrows + Ctrl
        else if (e.keyCode == 40) {
          //ArrowDown
          vm.moveDownAligned();
          handled = true;
        } else if (e.keyCode == 38) {
          //ArrowUp
          vm.moveUpAligned();
          handled = true;
        } else if (e.keyCode == 39) {
          //ArrowRight
          vm.moveRightAligned();
          handled = true;
        } else if (e.keyCode == 37) {
          //ArrowLeft
          vm.moveLeftAligned();
          handled = true;
        }
      } else if (e.altKey) {
        if (e.key === 'd' || e.key === 'D') {
          vm.duplicateWidg();
          handled = true;
        }
      } else {
        // Arrows
        if (e.keyCode == 40) {
          //ArrowDown
          handled = vm.moveDown();
          // handled = true;
        } else if (e.keyCode == 38) {
          //ArrowUp
          handled = vm.moveUp();
          // handled = true;
        } else if (e.keyCode == 39) {
          //ArrowRight
          handled = vm.moveRight();
          //handled = true;
        } else if (e.keyCode == 37) {
          //ArrowLeft
          handled = vm.moveLeft();
          //handled = true;
        }
        //Suppr
        else if (e.keyCode == 46) {
          vm.deleteWidg();
          handled = true;
          // } else if (e.keyCode == 13) { // key enter
          //     const widgetId = _getSelectedActive();
          //     if (widgetId) {
          //         $timeout(() => vm.openJsonEditor(widgetId));
          //         handled = true;
          //     }
        }
      }

      if (handled) {
        e.stopPropagation();
        e.preventDefault();
      }
    }

    if (document) {
      // Possibliy not the best place for that, but at least relevant
      document.addEventListener('keydown', _onkeydown);
    }

    // Undo/Redo
    vm.canUndo = function _canUndo() {
      return undoManagerService.canUndo();
    };

    vm.undo = function _undo() {
      undoManagerService.undo();
    };

    vm.canRedo = function _canRedo() {
      return undoManagerService.canRedo();
    };

    vm.redo = function _redo() {
      undoManagerService.redo();
    };

    // Undo/Redo history
    vm.history = [];
    vm.lastAction = [];

    function _updateHistory() {
      vm.history = [];
      vm.lastAction = [];

      const redoStack = undoManagerService.redoStackLabels();
      for (let i = 0; i < redoStack.length; i++) {
        vm.history.push({ label: redoStack[i], value: (redoStack.length - i).toString() });
        $rootScope.updateFlagDirty(true);
      }

      const undoStack = undoManagerService.undoStackLabels();
      for (let i = undoStack.length - 1; i >= 0; i--) {
        const value = i - undoStack.length;
        const entry = { label: undoStack[i], value: value.toString() };
        vm.history.push(entry);
        $rootScope.updateFlagDirty(true);
        if (value === -1) {
          vm.lastAction = [entry.value];
        }
      }

      if (vm.history.length === 0) {
        vm.history.push({ label: 'history...', value: '0' });
      }
    }

    const _historyCallback = () => $timeout(_updateHistory); // Protects us from being called from ouside of angular
    eventCenterService.addListener(UndoManager.UNDO_STACK_CHANGE_EVENT, _historyCallback);
    _updateHistory();

    vm.historySelect = function _historySelect() {
      if (vm.lastAction && vm.lastAction.length === 1) {
        let value = parseInt(vm.lastAction);
        if (value && value !== -1) {
          if (value > 0) {
            // Redo
            while (value-- > 0 && vm.canRedo()) {
              vm.redo();
            }
          } else {
            // Undo
            // -1 is the current state
            while (value++ < -1 && vm.canUndo()) {
              vm.undo();
            }
          }
        }
      }
    };

    function _hasConnection() {
      for (const connections of Object.values(widgetConnector.widgetsConnection)) {
        if (connections.sliders) {
          for (const slider of Object.values(connections.sliders)) {
            if (slider.dataNode !== 'None' || slider.dataFields.length) {
              return true;
            }
          }
        }
      }

      return false;
    }

    // Button actions
    vm.clearAllConnections = function _clearAllConnections() {
      if (_hasConnection()) {
        swal(
          {
            title: 'Are you sure?',
            text: 'All connections with dataNodes will be cleared!',
            type: 'warning',
            showCancelButton: true,
            showConfirmButton: false,
            showConfirmButton1: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Abandon',
            closeOnConfirm1: true,
          },
          function (isConfirm) {
            if (isConfirm) {
              const action = editorActionFactory.createClearAllWidgetConnectionsAction();
              undoManagerService.execute(action);
            }
          }
        );
      }
    };

    vm.clearDashboard = function _clearDashboard() {
      const widgetEditor = widgetEditorGetter();
      if (widgetEditor.widgetContainer.widgetIds.size) {
        swal(
          {
            title: 'Are you sure?',
            text: 'All widgets and connections with dataNodes will be deleted!',
            type: 'warning',
            showCancelButton: true,
            showConfirmButton: false,
            showConfirmButton1: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Abandon',
            closeOnConfirm1: true,
          },
          function (isConfirm) {
            if (isConfirm) {
              const action = editorActionFactory.createDeleteAllWidgetsAction();
              undoManagerService.execute(action);
            }
          }
        );
      }
    };

    vm.foregroundWidg = function _foregroundWidg() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createToForegroundAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    function _getWidgName() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const textToCopy = elementIds[0];
        navigator.clipboard // TODO clipboard undef iof not HTTPS
          .writeText(textToCopy)
          .then(() => {
            const notice = new PNotify({
              title: 'Copy widget name',
              text: 'Widget name ' + textToCopy + ' copied to clipboard!',
              type: 'success',
              styling: 'bootstrap3',
            });
            $('.ui-pnotify-container').on('click', function () {
              notice.remove();
            });
          })
          .catch((err) => {
            console.error('Failed to copy widget name: ', err);
          });
      }
    }
    vm.backgroundWidg = function _backgroundWidg() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createToBackgroundAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    // <Alignement>
    vm.alignTop = function _alignTop() {
      const elementIds = _getSelection();
      const targetId = _getSelectedActive();
      if (targetId && elementIds && elementIds.length > 1) {
        const target = elementIds[elementIds.length - 1];
        const action = editorActionFactory.createAlignementTopAction(
          targetId,
          elementIds.filter((it) => it !== target)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignBottom = function _alignBottom() {
      const elementIds = _getSelection();
      const targetId = _getSelectedActive();
      if (targetId && elementIds && elementIds.length > 1) {
        const action = editorActionFactory.createAlignementBottomAction(
          targetId,
          elementIds.filter((it) => it !== targetId)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignHorizontal = function _alignHorizontal() {
      const elementIds = _getSelection();
      const targetId = _getSelectedActive();
      if (targetId && elementIds && elementIds.length > 1) {
        const action = editorActionFactory.createAlignementHorizontalAction(
          targetId,
          elementIds.filter((it) => it !== targetId)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignLeft = function _alignLeft() {
      const elementIds = _getSelection();
      const targetId = _getSelectedActive();
      if (targetId && elementIds && elementIds.length > 1) {
        const action = editorActionFactory.createAlignementLeftAction(
          targetId,
          elementIds.filter((it) => it !== targetId)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignVertical = function _alignVertical() {
      const elementIds = _getSelection();
      const targetId = _getSelectedActive();
      if (targetId && elementIds && elementIds.length > 1) {
        const action = editorActionFactory.createAlignementVerticalAction(
          targetId,
          elementIds.filter((it) => it !== targetId)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignRight = function _alignRight() {
      const elementIds = _getSelection();
      const targetId = _getSelectedActive();
      if (targetId && elementIds && elementIds.length > 1) {
        const action = editorActionFactory.createAlignementRightAction(
          targetId,
          elementIds.filter((it) => it !== targetId)
        );
        undoManagerService.execute(action);
      }
    };

    vm.spreadVertical = function _spreadVertical() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length > 1) {
        const action = editorActionFactory.createVerticalSpreadAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    vm.spreadHorizontal = function _spreadRight() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length > 1) {
        const action = editorActionFactory.createHorizontalSpreadAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    vm.resizeSame = function _resizeSame(param) {
      const elementIds = _getSelection();
      const targetId = _getSelectedActive();
      if (targetId && elementIds && elementIds.length > 1) {
        const targetPos = widgetEditor.widgetContainer.getRecordedGeometry(targetId);
        if (param == 'HeightWidth') {
          const action1 = editorActionFactory.createSetWidgetWidthAction(elementIds, targetPos.width);
          const action2 = editorActionFactory.createSetWidgetHeightAction(elementIds, targetPos.height);
          undoManagerService.execute(action1);
          undoManagerService.execute(action2);
        } else if (param == 'Height') {
          const action = editorActionFactory.createSetWidgetHeightAction(elementIds, targetPos.height);
          undoManagerService.execute(action);
        } else if (param == 'Width') {
          const action = editorActionFactory.createSetWidgetWidthAction(elementIds, targetPos.width);
          undoManagerService.execute(action);
        }
      }
    };
    // </Alignement>

    vm.duplicateWidg = function _duplicateWidg() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createDuplicateWidgetsWithConnectionAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    vm.copyWidg = function _copyWidg() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        copiedWidgets = elementIds;
      }
    };

    vm.copyWidg = function _copyWidg() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        copiedWidgets = elementIds;
      }
    };

    vm.pasteWidg = function _pasteWidg() {
      if (copiedWidgets?.length) {
        const action = editorActionFactory.createDuplicateWidgetsWithConnectionAction(copiedWidgets);
        undoManagerService.execute(action);
      }
    };

    vm.deleteWidg = function _deleteWidg() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createDeleteWidgetsAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    vm.startIntroWidget = function _startIntroWidget() {
      startIntroWidget();
    };

    ////////////////////

    vm.editorClick = function _editorClick(evt) {
      _hideWidgMenu();
    };

    function _toggleWidgMenu(id) {
      if (vm.menuWidgetTargetId === id && vm.menuWidgetVisible) {
        _hideWidgMenu();
        return;
      } else {
        vm.menuWidgetTargetId = id;
        vm.menuWidgetVisible = true;
      }

      // TODO coords rm
      let connectedDataNodes = [];
      let cnxs = widgetConnector.widgetsConnection;

      if (!_.isUndefined(cnxs[id])) {
        _.each(_.keys(cnxs[id].sliders), (slider) => {
          let dsName = cnxs[id].sliders[slider].dataNode;
          if (connectedDataNodes.indexOf(dsName) === -1) {
            //fix issue#23
            connectedDataNodes.push(dsName);
          }
        });
      }

      // FIXME dubious
      const openGraphFromWidget = document.getElementById('openGraphFromWidget');
      openGraphFromWidget?.setAttribute('name', JSON.stringify(connectedDataNodes));

      const idList = 'menuWidget';
      const menuElm = document.getElementById(idList);

      // TODO parent ?
      const mainContainerOffsetHeight = document.getElementById('DropperDroite').offsetHeight;

      // TOODO scale
      const elm = document.getElementById(id);

      const elementWidth = elm.clientWidth;
      const elementHeight = elm.clientHeight;
      const elementOffsetTop = elm.offsetTop;
      const elementOffsetLeft = elm.offsetLeft;

      const menuWidgetWidth = 247.047; // px
      const menuWidgetHeight = 443; // px
      const menuWidgetMarginTop = 30;
      const menuWidgetMarginBottom = elementHeight - 10;

      const mainContainerHeight = mainContainerOffsetHeight;
      const elementOffsetBottom = mainContainerOffsetHeight - (elementOffsetTop + elementHeight);

      // TODO fix
      if (
        elementOffsetTop + menuWidgetMarginTop + menuWidgetHeight >= mainContainerOffsetHeight &&
        elementOffsetBottom + menuWidgetMarginBottom + menuWidgetHeight >= mainContainerOffsetHeight
      ) {
        menuElm.style.bottom = '10px';
        menuElm.style.top = 'auto';
        document.styleSheets[0].addRule('#menuWidget::after', 'top: -5px; transform: rotate(0deg)'); // TODO rules
      } else if (elementOffsetTop + menuWidgetMarginTop + menuWidgetHeight >= mainContainerHeight) {
        menuElm.style.bottom = (menuWidgetMarginBottom + elementOffsetBottom).toString() + 'px';
        menuElm.style.top = 'auto';
        document.styleSheets[0].addRule(
          '#menuWidget::after',
          'top: ' + menuWidgetHeight + 'px; transform: rotate(180deg)'
        );
      } else {
        menuElm.style.top = (elementOffsetTop + menuWidgetMarginTop).toString() + 'px';
        menuElm.style.bottom = 'auto';
        document.styleSheets[0].addRule('#menuWidget::after', 'top: -5px; transform: rotate(0deg)');
      }

      if ((elementWidth + elementOffsetLeft).toString() <= menuWidgetWidth) {
        menuElm.style.left = '7px';
        document.styleSheets[0].addRule(
          '#menuWidget::after',
          'left: ' + (elementOffsetLeft + elementWidth - 30) + 'px'
        );
      } else {
        menuElm.style.left = (elementWidth + elementOffsetLeft - menuWidgetWidth).toString() + 'px';
        document.styleSheets[0].addRule('#menuWidget::after', 'left: auto; right: 20px');
      }
      menuElm.style.right = 'auto';
    }

    function _hideWidgMenu() {
      vm.menuWidgetVisible = false;
      vm.menuWidgetTargetId = null;
    }

    function _reselectWidg(event) {
      // TODO coords rm
      //modif to have zndex of menu high
      //put list at dropperD level (for zindex issues). However selection is lost, so we need to put it back
      // const id = 'menuWidget';
      // const name = $('#' + id)[0].getAttribute('name');
      // editorSingletons.widgetEditor.selectWidget($('#' + name)[0]);
    }

    function _clickOnDataConnection(check) {
      let scope = angular.element(document.getElementById('panel--right')).scope();
      let modalCtrl = scope.vmd;
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      if (check) {
        if (
          /*scopeDash.editorView.rightSidePanel.target == "DataNode Connection" &&*/ scopeDash.editorView.rightSidePanel
            .view
        ) {
          modalCtrl
            .ensureSavedOrDiscarded()
            // Always follow selection. If user choose not to save, changes are lost.
            .then((/* savedOrClean */) => modalCtrl.editSelectedWidget());
        }
      } else {
        scopeDash.dataConnectionPanel(modalCtrl);
      }
    }

    vm.connectWidget = function _connectWidget() {
      _reselectWidg();
      _hideWidgMenu();
      _clickOnDataConnection();
    };

    vm.seeInDepGraph = function _seeInDepGraph(event) {
      _reselectWidg();
      _hideWidgMenu();
      let scopeDepGraph = angular.element(document.getElementById('dependency__graph--container')).scope();
      scopeDepGraph.seeInDepGraph(event);
    };

    vm.editDatanodeCode = function _editDatanodeCode() {
      _reselectWidg();
      _hideWidgMenu();

      const elementIds = _getSelection();
      let connectedDataNodeS = [];
      let cnxs = widgetConnector.widgetsConnection;

      if (!_.isUndefined(cnxs[elementIds[0]])) {
        _.each(_.keys(cnxs[elementIds[0]].sliders), (slider) => {
          let dsName = cnxs[elementIds[0]].sliders[slider].dataNode;
          if (connectedDataNodeS.indexOf(dsName) === -1) {
            //fix issue#23
            connectedDataNodeS.push(dsName);
          }
        });
      }

      if (connectedDataNodeS.length) {
        var data = datanodesManager.getDataNodeByName(connectedDataNodeS[0]);
        let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
        $scope.resetPanelStateR();
        scopeDashDn.openDataNode(data);
      }
    };

    vm.graphicalProperties = function _graphicalProperties() {
      _reselectWidg();
      _hideWidgMenu();
      let scope = angular.element(document.getElementById('panel--right')).scope();
      $scope.setRightContent('Graphical Properties', scope.vmd);
    };

    vm.getWidgetName = function _getWidgetName() {
      // _reselectWidg();
      _hideWidgMenu();
      _getWidgName();
    };

    vm.foregroundWidget = function _foregroundWidget() {
      _reselectWidg();
      _hideWidgMenu();
      vm.foregroundWidg();
    };

    vm.backgroundWidget = function _backgroundWidget() {
      _reselectWidg();
      _hideWidgMenu();
      vm.backgroundWidg();
    };

    vm.duplicateWidget = function _duplicateWidget() {
      _reselectWidg();
      _hideWidgMenu();
      vm.duplicateWidg();
    };

    vm.deleteWidget = function _deleteWidget() {
      _reselectWidg();
      _hideWidgMenu();
      vm.deleteWidg();
    };
    ///////////////

    // Position/size
    vm.widgetGeometry = {
      top: 0,
      left: 0,
      height: 0,
      width: 0,
    };

    vm._originalWidgetGeometry = {
      top: 0,
      left: 0,
      height: 0,
      width: 0,
    };

    vm.widgetGeometryConstraints = {
      top: { min: 0, max: Infinity },
      left: { min: 0, max: Infinity },
      height: { min: 0, max: Infinity },
      width: { min: 0, max: Infinity },
    };

    // Focused control.
    vm.posXFocused = false;
    vm.posYFocused = false;
    vm.heigthFocused = false;
    vm.widthFocused = false;

    /**
     * Updates widgetGeometry using the last widget of the selection
     */
    vm.updateGeometryFromSelection = function _updateGeometryFromSelection() {
      vm.widgetGeometryConstraints = {
        top: { min: 0, max: Infinity },
        left: { min: 0, max: Infinity },
        height: { min: 0, max: Infinity },
        width: { min: 0, max: Infinity },
      };

      const activeId = _getSelectedActive();
      if (activeId) {
        const widgetEditor = widgetEditorGetter();
        const widgetContainer = widgetEditor.widgetContainer;
        const currentGeometry = widgetContainer.getCurrentWidgetGeometry(activeId);
        if (currentGeometry) {
          const oldValues = vm.widgetGeometry;
          vm.widgetGeometry = currentGeometry;
          vm._originalWidgetGeometry = { ...vm.widgetGeometry };

          // Do not change a value the user is currently typing! (typing the first digit only to have it
          // replaced with the minimum value is infuriating)
          if (vm.posXFocused) vm.widgetGeometry.left = oldValues.left;
          if (vm.posYFocused) vm.widgetGeometry.top = oldValues.top;
          if (vm.heigthFocused) vm.widgetGeometry.height = oldValues.height;
          if (vm.widthFocused) vm.widgetGeometry.width = oldValues.width;

          const minSize = widgetContainer.minimumSize(activeId);
          const available = widgetContainer.availableSpace();

          vm.widgetGeometryConstraints.width.min = minSize.width;
          vm.widgetGeometryConstraints.height.min = minSize.height;

          vm.widgetGeometryConstraints.top.max = available.height - currentGeometry.height;
          vm.widgetGeometryConstraints.left.max = available.width - currentGeometry.width;
          vm.widgetGeometryConstraints.height.max = available.height - currentGeometry.top;
          vm.widgetGeometryConstraints.width.max = available.width - currentGeometry.left;

          return;
        }
      }
      vm.widgetGeometry = {
        top: 0,
        left: 0,
        height: 0,
        width: 0,
      };
      vm._originalWidgetGeometry = { ...vm.widgetGeometry };
    };

    const _updateGeometryFromSelectionCallback = () => $timeout(() => vm.updateGeometryFromSelection());
    eventCenterService.addListener(editorActionFactory.WIDGET_MOVED_EVENT, _updateGeometryFromSelectionCallback);

    // On blur, if the input's value is an actual number, we always update the widget's
    // position. In all cases, widgetGeometry is updated afterward using the widget's position
    // so that the displayed value reflects its actual position.
    vm.positionLeftBlur = function _positionLeftBlur() {
      if (vm.widgetGeometry.left !== vm._originalWidgetGeometry.left && !vm.positionLeftChange(false)) {
        vm.updateGeometryFromSelection();
      }
    };

    vm.positionTopBlur = function _positionTopBlur() {
      if (vm.widgetGeometry.top !== vm._originalWidgetGeometry.top && !vm.positionTopChange(false)) {
        vm.updateGeometryFromSelection();
      }
    };

    vm.sizeWidthBlur = function _sizeWidthBlur() {
      if (vm.widgetGeometry.width !== vm._originalWidgetGeometry.width && !vm.sizeWidthChange(false)) {
        vm.updateGeometryFromSelection();
      }
    };

    vm.sizeHeightBlur = function _sizeHeightChange() {
      if (vm.widgetGeometry.height !== vm._originalWidgetGeometry.height && !vm.sizeHeightChange(false)) {
        vm.updateGeometryFromSelection();
      }
    };

    /**
     * Runs a function if the current geometry input is valid and there is a widget selection.
     * @param {(geom:{left: number, top: number, width: number, height: number}, elementIds:Array.<string>)=>void} fct will be provided with the geometry and the selection
     * @returns true if the function was called
     */
    function _withGeometryAndElementIds(fct) {
      const geom = vm.widgetGeometry;
      if (
        widgetEditorGetter &&
        geom.top !== null &&
        geom.top !== undefined &&
        geom.left !== null &&
        geom.left !== undefined &&
        geom.height !== null &&
        geom.height !== undefined &&
        geom.width !== null &&
        geom.width !== undefined
      ) {
        const widgetEditor = widgetEditorGetter();
        if (widgetEditor) {
          const elementIds = _getSelection();
          if (elementIds && elementIds.length) {
            fct(geom, elementIds);
            return true;
          }
        }
      }
      return false;
    }

    /**
     * If the current geometry input is valid and there are selected widgets, obtains an UndoableAction from a factory function and runs it.
     * @param {(geom:{left: number, top: number, width: number, height: number}, elementIds:Array.<string>)=>?UndoableAction} actionFactory will be provided with the geometry and the selection
     */
    function _doWithGeometryAndElementIds(actionFactory) {
      _withGeometryAndElementIds((geom, elementIds) => {
        const action = actionFactory(geom, elementIds);
        if (action) {
          undoManagerService.execute(action);
        }
      });
    }

    /**
     * @param {boolean=} canMerge if true, successive changes can be merged in the history (ie, when typing a number, keep only the final position, not one per digit, etc.)
     * @returns {boolean} true if the widget(s) was moved
     */
    vm.positionLeftChange = function _positionLeft(canMerge = true) {
      return _doWithGeometryAndElementIds((geom, elementIds) =>
        editorActionFactory.createSetWidgetLeftAction(elementIds, geom.left, canMerge)
      );
    };

    vm.positionTopChange = function _positionTop(canMerge = true) {
      return _doWithGeometryAndElementIds((geom, elementIds) =>
        editorActionFactory.createSetWidgetTopAction(elementIds, geom.top, canMerge)
      );
    };

    vm.sizeWidthChange = function _sizeWidth(canMerge = true) {
      return _doWithGeometryAndElementIds((geom, elementIds) =>
        editorActionFactory.createSetWidgetWidthAction(elementIds, geom.width, canMerge)
      );
    };

    vm.sizeHeightChange = function _sizeHeight(canMerge = true) {
      return _doWithGeometryAndElementIds((geom, elementIds) =>
        editorActionFactory.createSetWidgetHeightAction(elementIds, geom.height, canMerge)
      );
    };

    // Relative movement
    vm.moveUp = function _moveUp() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createMoveUpAction(elementIds, keyShift);
        undoManagerService.execute(action);
        return true;
      } else {
        return false;
      }
    };

    vm.moveDown = function _moveDown() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createMoveDownAction(elementIds, keyShift);
        undoManagerService.execute(action);
        return true;
      } else {
        return false;
      }
    };

    vm.moveLeft = function _moveLeft() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createMoveLeftAction(elementIds, keyShift);
        undoManagerService.execute(action);
        return true;
      } else {
        return false;
      }
    };

    vm.moveRight = function _moveRight() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createMoveRightAction(elementIds, keyShift);
        undoManagerService.execute(action);
        return true;
      } else {
        return false;
      }
    };

    // Aligned movement
    vm.moveUpAligned = function _moveUpAligned() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createAlignedMoveUpAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    vm.moveDownAligned = function _moveDownAligned() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createAlignedMoveDownAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    vm.moveLeftAligned = function _moveLeftAligned() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createAlignedMoveLeftAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    vm.moveRightAligned = function _moveRightAligned() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        const action = editorActionFactory.createAlignedMoveRightAction(elementIds);
        undoManagerService.execute(action);
      }
    };

    // Cleanup
    $scope.$on('$destroy', function _cleanup() {
      eventCenterService.removeListener(selection_event, _selectionCallback);
      eventCenterService.removeListener(add_remove_widget_event, _addRmCallback);
      eventCenterService.removeListener(connnection_update_event, _connectionsChangedCallback);
      eventCenterService.removeListener(UndoManager.UNDO_STACK_CHANGE_EVENT, _historyCallback);

      eventCenterService.removeListener(editorActionFactory.WIDGET_MOVED_EVENT, _updateGeometryFromSelectionCallback);
      if (document) {
        document.removeEventListener('keydown', _onkeydown);
      }
    });

    $rootScope.loadedTemplate();
  },
]);
