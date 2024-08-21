// ┌───────────────────────────────────────────────────────────────────────────────────┐ \\
// │ editor.controller                                                                 │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2023 IFPEN                                                       │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                            │ \\
// └───────────────────────────────────────────────────────────────────────────────────┘ \\

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

    const vm = this;

    const selection_event = EVENTS_EDITOR_SELECTION_CHANGED;
    const add_remove_widget_event = EVENTS_EDITOR_ADD_REMOVE_WIDGET;
    const connnection_update_event = EVENTS_EDITOR_CONNECTIONS_CHANGED;

    var copiedWidget;

    var copiedWidget;

    vm.selection = [];
    vm.widgetExists = false;
    vm.connectionsExists = false;
    vm.menuWidgetVisible = false;

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

    const _addRmCallback = () => $timeout((vm.widgetExists = !!widgetEditorGetter().widgetContainers.size));
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
    // Panels
    vm.POSITION_ID = 'position';
    vm.RESIZE_ID = 'resize';
    vm.ALIGN_ID = 'align';
    vm.GRID_ID = 'grid';
    vm.DEVICE_ID = 'device';
    vm.SCALING_ID = 'scaling';
    vm.HISTORY_ID = 'history';

    // Buttons
    vm.DUPLICATE_ID = 'duplicateWidg';
    vm.FOREGROUND_ID = 'foregroundWidg';
    vm.BACKGROUND_ID = 'backgroundWidg';
    vm.CLEAR_DASH_ID = 'clearDashboard';
    vm.TRASH_ID = 'iconTrashId';
    vm.BORDERS_ID = 'borderWidg';
    vm.UNDO_ID = 'undoBtn';
    vm.REDO_ID = 'redoBtn';
    vm.TOUR_ID = 'tourBtn';

    vm.toolboxHover = null;
    vm.toolboxPanel = null;
    vm.borderInWidgets = true;
    vm.showGrid = false;

    vm.updateBorderInWidgets = function () {
      if (vm.borderInWidgets) $('#DropperDroite').addClass('show-widget-borders');
      else $('#DropperDroite').removeClass('show-widget-borders');
    };

    vm.updateShowGrid = function () {
      if (vm.showGrid) $('#DropperDroite').addClass('show-grid');
      else $('#DropperDroite').removeClass('show-grid');
    };

    vm.getStyleClass = function (cat) {
      return "'show-grid': cat.showGrid";
    };

    vm.toolboxMessage = function _toolboxMessage() {
      switch (vm.toolboxHover) {
        case null:
        case undefined:
          return 'Select option';

        case vm.POSITION_ID:
          return 'Widget position';
        case vm.RESIZE_ID:
          return 'Resize widget';
        case vm.ALIGN_ID:
          return 'Align widgets';
        case vm.GRID_ID:
          return 'Dashboard grid';
        case vm.DEVICE_ID:
          return 'Responsive layout';
        case vm.SCALING_ID:
          return 'Widget scaling options';
        case vm.HISTORY_ID:
          return 'Display editor history';

        case vm.DUPLICATE_ID:
          return 'Duplicate widget (Alt+D)';
        case vm.FOREGROUND_ID:
          return 'Put widget at foreground';
        case vm.BACKGROUND_ID:
          return 'Put widget at background';
        case vm.CLEAR_DASH_ID:
          return 'Clear dashboard';
        case vm.TRASH_ID:
          return 'Clear all dataNode connections';
        case vm.BORDERS_ID:
          return "Add/Remove widgets' border";
        case vm.UNDO_ID:
          return 'Undo';
        case vm.REDO_ID:
          return 'Redo';
        case vm.TOUR_ID:
          return 'Guided tour';

        default:
          console.error('Unknown hovered component: ' + vm.toolboxHover);
          return '';
      }
    };

    vm.togglePanel = function _togglePanel(panel) {
      if (vm.toolboxPanel === panel) {
        vm.toolboxPanel = null;
      } else {
        vm.toolboxPanel = panel;
      }
    };

    vm.buttonToggleClass = function _buttonToggleClass(button) {
      if (vm.toolboxPanel === button) {
        return ['btn-success'];
      } else if (vm.toolboxHover === button) {
        return ['btn-info'];
      } else {
        return [];
      }
    };

    vm.buttonClass = function _buttonClass(button) {
      if (vm.toolboxHover === button) {
        return ['btn-info'];
      } else {
        return [];
      }
    };

    vm.panelStyle = function _panelClass(panel) {
      return {
        display: panel === vm.toolboxPanel ? 'block' : 'none',
      };
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
      for (connections of Object.values(widgetConnector.widgetsConnection)) {
        if (connections.sliders) {
          for (slider of Object.values(connections.sliders)) {
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
      if (widgetEditor.widgetContainers.size) {
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
        navigator.clipboard
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
      if (elementIds && elementIds.length > 1) {
        const target = elementIds[elementIds.length - 1];
        const action = editorActionFactory.createAlignementTopAction(
          target,
          elementIds.filter((it) => it !== target)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignBottom = function _alignBottom() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length > 1) {
        const target = elementIds[elementIds.length - 1];
        const action = editorActionFactory.createAlignementBottomAction(
          target,
          elementIds.filter((it) => it !== target)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignHorizontal = function _alignHorizontal() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length > 1) {
        const target = elementIds[elementIds.length - 1];
        const action = editorActionFactory.createAlignementHorizontalAction(
          target,
          elementIds.filter((it) => it !== target)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignLeft = function _alignLeft() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length > 1) {
        const target = elementIds[elementIds.length - 1];
        const action = editorActionFactory.createAlignementLeftAction(
          target,
          elementIds.filter((it) => it !== target)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignVertical = function _alignVertical() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length > 1) {
        const target = elementIds[elementIds.length - 1];
        const action = editorActionFactory.createAlignementVerticalAction(
          target,
          elementIds.filter((it) => it !== target)
        );
        undoManagerService.execute(action);
      }
    };

    vm.alignRight = function _alignRight() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length > 1) {
        const target = elementIds[elementIds.length - 1];
        const action = editorActionFactory.createAlignementRightAction(
          target,
          elementIds.filter((it) => it !== target)
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
      if (elementIds && elementIds.length > 1) {
        const targetId = elementIds[0];
        const target = widgetEditor.widgetContainers.get(targetId).divModel;
        const targetPos = getElementLayoutPx(target);
        if (param == 'HeightWidth') {
          const action1 = editorActionFactory.createSetWidgetWidthAction(elementIds, targetPos.width, false);
          const action2 = editorActionFactory.createSetWidgetHeightAction(elementIds, targetPos.height, false);
          undoManagerService.execute(action1);
          undoManagerService.execute(action2);
        } else if (param == 'Height') {
          const action = editorActionFactory.createSetWidgetHeightAction(elementIds, targetPos.height, false);
          undoManagerService.execute(action);
        } else if (param == 'Width') {
          const action = editorActionFactory.createSetWidgetWidthAction(elementIds, targetPos.width, false);
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
        copiedWidget = elementIds;
      }
    };

    vm.pasteWidg = function _pasteWidg() {
      const action = editorActionFactory.createDuplicateWidgetsWithConnectionAction(copiedWidget);
      undoManagerService.execute(action);
    };

    vm.copyWidg = function _copyWidg() {
      const elementIds = _getSelection();
      if (elementIds && elementIds.length) {
        copiedWidget = elementIds;
      }
    };

    vm.pasteWidg = function _pasteWidg() {
      const action = editorActionFactory.createDuplicateWidgetsWithConnectionAction(copiedWidget);
      undoManagerService.execute(action);
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
    function _hideWidgMenu() {
      const elementIds = _getSelection();
      const idElm = elementIds[0];
      const idList = 'menuWidget';

      if ($('#' + idList)[0].getAttribute('name') !== idElm) {
        $('#' + idList).attr('name', idElm);
        console.log('target changed');
      }
      vm.menuWidgetVisible = false;
    }

    function _reselectWidg(event) {
      //modif to have zndex of menu high
      //put list at dropperD level (for zindex issues). However selection is lost, so we need to put it back
      const id = 'menuWidget';
      const name = $('#' + id)[0].getAttribute('name');
      widgetEditor.selectWidget($('#' + name)[0]);
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
      _reselectWidg();
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
        const widget = widgetEditor.widgetContainers.get(activeId);
        if (widget && widget.divModel) {
          const oldValues = vm.widgetGeometry;
          const divModel = widget.divModel;
          vm.widgetGeometry = getWidgetLayoutPx(divModel);
          vm._originalWidgetGeometry = { ...vm.widgetGeometry };

          // Accurate local position for dragged elements. Their position is not usable directly while dragged.
          const dispX = divModel.getAttribute(widgetEditor.DATA_ATTR_DISPLAY_X);
          if (dispX) {
            vm.widgetGeometry.left = parseInt(dispX, 10) - minLeftCst;
          }
          const dispY = divModel.getAttribute(widgetEditor.DATA_ATTR_DISPLAY_Y);
          if (dispY) {
            vm.widgetGeometry.top = parseInt(dispY, 10) - minTopCst;
          }

          // Do not change a value the user is currently typing! (typing the first digit only to have it
          // replaced with the minimum value is infuriating)
          if (vm.posXFocused) vm.widgetGeometry.left = oldValues.left;
          if (vm.posYFocused) vm.widgetGeometry.top = oldValues.top;
          if (vm.heigthFocused) vm.widgetGeometry.height = oldValues.height;
          if (vm.widthFocused) vm.widgetGeometry.width = oldValues.width;

          vm.widgetGeometryConstraints.width.min = parseInt(divModel.style['min-width'] || minWidthCst + 'px', 10);
          vm.widgetGeometryConstraints.height.min = parseInt(divModel.style['min-height'] || minHeightCst + 'px', 10);

          const container = widgetEditor.getContainer(divModel);
          if (container && container.id !== widgetEditor.MAIN_CONTAINER_ID) {
            vm.widgetGeometryConstraints.top.max = container.offsetHeight - 2 * minTopCst - divModel.offsetHeight;
            vm.widgetGeometryConstraints.left.max = container.offsetWidth - 2 * minLeftCst - divModel.offsetWidth;
            vm.widgetGeometryConstraints.height.max = container.offsetHeight - 2 * minTopCst - vm.widgetGeometry.top;
            vm.widgetGeometryConstraints.width.max = container.offsetWidth - 2 * minLeftCst - vm.widgetGeometry.left;
          }

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
        widgetContainerGetter &&
        geom.top !== null &&
        geom.top !== undefined &&
        geom.left !== null &&
        geom.left !== undefined &&
        geom.height !== null &&
        geom.height !== undefined &&
        geom.width !== null &&
        geom.width !== undefined
      ) {
        const widgetContainer = widgetContainerGetter();
        const widgetEditor = widgetEditorGetter();
        if (widgetContainer && widgetEditor) {
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
  },
]);
