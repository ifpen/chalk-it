// ┌───────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard.controller                                                              │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                       │ \\
// | Licensed under the Apache License, Version 2.0                                    │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                                 │ \\
// └───────────────────────────────────────────────────────────────────────────────────┘ \\
import { xDashConfig } from 'config.js';
import { dashboardModule } from 'angular/modules/dashboard/dashboard';
import { showPlayMode, showEditMode } from 'angular/modules/dashboard/services/edit-play-switch';

dashboardModule.controller('DashboardController', [
  '$scope',
  '$rootScope',
  'DepGraphService',
  'ManageDatanodeService',
  function ($scope, $rootScope, DepGraphService, ManageDatanodeService) {

    $scope.info = {
      openProjectInfo: false,
      checkboxModelLater: false,
      showCheckbox: true,
      title: 'New project',
      left: '50%',
      // origin: "create",
      tmp: {},
      pastName: '',
      idForm: 2, // unique
    };

    $scope.sharePrj = {
      left: '50%',
      flag: false,
    };

    $scope.popup = {
      datanodeNotif: false,
      title: '',
      data: null,
    };

    $scope.modalDiagNotif = false;

    $scope.editorView = {
      isPlayMode: false,
      leftSidePanel: {
        size: 3,
        target: 'Widgets',
        view: false,
      },
      rightSidePanel: {
        size: 1,
        screen: 'Enlarge screen view',
        icn: 'icn-full-screen',
        target: 'Data Connection',
        view: false,
      },
      newDatanodePanel: {
        view: false,
        list: false,
        type: false,
      },
      showGraphPanel: false,
      sortValue: 'typeA',
    };

    /***********************************************************************************/
    /**********************************manage editor view*******************************/
    /***********************************************************************************/

    /*---------- setLeftContent ----------------*/
    $scope.setLeftContent = function (name) {
      $scope.resetPanelStateR();
      if ($scope.editorView.leftSidePanel.target == name || !$scope.editorView.leftSidePanel.view) {
        $scope.editorView.leftSidePanel.view = !$scope.editorView.leftSidePanel.view;
      }
      $scope.editorView.leftSidePanel.target = name;

      $scope.editorView.leftSidePanel.size = 3;
      $scope.editorView.leftSidePanel.screen = 'Enlarge screen view';

      $rootScope.filtredList = [];
      $rootScope.filtredNodes = $rootScope.alldatanodes.length;

      const ctrlElement = document.getElementById('dash-datanode-ctrl');
      const scopeDashDn = angular.element(ctrlElement).scope();
      scopeDashDn.searchDatanodeByName = '';
      scopeDashDn.applyDatanodeFilter('');
    };

    /*---------- closeLeftSidePanel ----------------*/
    $scope.closeLeftSidePanel = function () {
      $scope.editorView.newDatanodePanel.view = false;
      $scope.editorView.leftSidePanel.view = false;
    };

    /*---------- dataConnectionPanel ----------------*/
    $scope.dataConnectionPanel = function (vm) {
      $scope.resetPanelStateL();
      $scope.editorView.rightSidePanel.target = 'DataNode Connection';
      $scope.editorView.rightSidePanel.size = 1;

      if (!$scope.editorView.rightSidePanel.view) {
        $scope.editorView.rightSidePanel.view = !$scope.editorView.rightSidePanel.view;
      }
      vm.editSelectedWidget();
    };

    /*---------- setRightContent ----------------*/
    $scope.setRightContent = function (name, vm) {
      $scope.resetPanelStateL();
      let opendedPanel = false;
      if ($scope.editorView.rightSidePanel.target == name || !$scope.editorView.rightSidePanel.view) {
        $scope.editorView.rightSidePanel.view = !$scope.editorView.rightSidePanel.view;
        opendedPanel = true;
      }
      $scope.editorView.rightSidePanel.target = name;

      if ($scope.editorView.rightSidePanel.view) {
        switch (name) {
          case 'DataNode Connection':
            $scope.editorView.rightSidePanel.size = 1;
            break;
          case 'Graphical Properties':
            $scope.editorView.rightSidePanel.size = 2;
            $scope.editorView.rightSidePanel.screen = 'Enlarge screen view';
            $scope.editorView.rightSidePanel.icn = 'icn-full-screen';
            break;
          case 'Aspect':
            $scope.editorView.rightSidePanel.size = 3;
            break;
          default:
            break;
        }
      }

      if (opendedPanel) {
        vm.editSelectedWidget();
      }
    };

    /*---------- enlargeScreenRight ----------------*/
    $scope.enlargeScreenRight = function () {
      let isFullSize = true;
      if ($scope.editorView.rightSidePanel.size == 1) isFullSize = false;
      switch (isFullSize) {
        case true:
          $scope.editorView.rightSidePanel.screen = 'Reduce screen view';
          $scope.editorView.rightSidePanel.icn = 'icn-reduced-screen';
          $scope.editorView.rightSidePanel.size = 1;
          break;
        case false:
          $scope.editorView.rightSidePanel.screen = 'Enlarge screen view';
          $scope.editorView.rightSidePanel.icn = 'icn-full-screen';
          $scope.editorView.rightSidePanel.size = 2;
          break;
      }
    };

    /*---------- enlargeScreenLeft ----------------*/
    $scope.enlargeScreenLeft = function () {
      let isFullSize = true;
      if ($scope.editorView.leftSidePanel.size == 2) isFullSize = false;
      switch (isFullSize) {
        case true:
          $scope.editorView.leftSidePanel.screen = 'Reduce screen view';
          $scope.editorView.rightSidePanel.icn = 'icn-reduced-screen';
          $scope.editorView.leftSidePanel.size = 2;
          break;
        case false:
          $scope.editorView.leftSidePanel.screen = 'Enlarge screen view';
          $scope.editorView.rightSidePanel.icn = 'icn-full-screen';
          $scope.editorView.leftSidePanel.size = 3;
          break;
      }
    };

    /*---------- resetPanelState ----------------*/
    $scope.resetPanelState = function () {
      $scope.resetPanelStateR();
      $scope.resetPanelStateL();
    };

    /*---------- closeRightSidePanel ----------------*/
    $scope.closeRightSidePanel = function () {
      $scope.editorView.rightSidePanel.view = false;
    };

    /*---------- resetPanelStateR ----------------*/
    $scope.resetPanelStateR = function () {
      $scope.editorView.rightSidePanel.view = false;
    };

    /*---------- resetPanelStateL ----------------*/
    $scope.resetPanelStateL = function () {
      $scope.editorView.leftSidePanel.view = false;
      $scope.editorView.showGraphPanel = false;
      $scope.editorView.newDatanodePanel.view = false;
      DepGraphService.closeGraph();
    };

    /*---------- reset ----------------*/
    $scope.reset = function () {
      $scope.resetPanelState();
      $('.datanode__wrap--info p').removeAttr('style');
      if ($scope.editorView.isPlayMode) {
        $scope.editorView.isPlayMode = false;
        $scope.switchEditView();
      }
    };

    // /**************************************************************/
    // /****************** Edit/View switch button *******************/
    // /**************************************************************/

    /*---------- switchEditView ----------------*/
    $scope.switchEditView = function () {
      $scope.resetPanelState();

      if ($scope.editorView.isPlayMode) {
        showPlayMode();
      } else {
        showEditMode();
      }
    };

    // /**************************************************************/
    // /****************** New DataNode side panel *******************/
    // /**************************************************************/

    /*---------- dataNode type button ----------------*/
    $scope.openDataNodeTypePlugin = function (val) {
      ManageDatanodeService.openDataNodeTypePlugin(val, $scope);
    };

    /*---------- save datanode button ----------------*/
    $scope.saveDataNodeSettings = function (isFromJsEditor) {
      ManageDatanodeService.saveDataNodeSettings(isFromJsEditor, $scope);
    };

    /*---------- cancel datanode button ----------------*/
    $scope.getOldDataNodeSettings = function () {
      ManageDatanodeService.getOldDataNodeSettings($scope);
    };

    /*******************************************************/
    /******************* Graph button **********************/
    /*******************************************************/

    /*---------- show graph button ----------------*/
    $scope.showDepGraph = function (name) {
      DepGraphService.showDepGraph(name);
    };

    /*******************************************************/
    /******************* Help button **********************/
    /*******************************************************/

    /*---------- help button ----------------*/
    $scope.initFrame = function () {
      const iframe = document.getElementById('helpFrame');
      iframe.src = xDashConfig.urlDoc;
    };

    /**************************************************************/
    /***********************Dependency graph***********************/
    /**************************************************************/

    /*---------- selectConnectedWithWidget ----------------*/
    $scope.selectConnectedWithWidget = function (tag) {
      DepGraphService.selectConnectedWithWidget(tag);
    };
  },
]);
