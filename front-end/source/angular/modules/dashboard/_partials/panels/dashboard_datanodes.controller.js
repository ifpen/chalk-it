// ┌────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_datanodes.controller                                                 │ \\
// ├────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                    │ \\
// | Licensed under the Apache License, Version 2.0                                 │ \\
// ├────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Ameur HAMDOUNI              │ \\
// └────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.dashboard').controller('DashboardDatanodesController', [
  '$scope',
  '$rootScope',
  '$state',
  'DepGraphService',
  'JsonDisplayService',
  'ManageDatanodeService',
  function ($scope, $rootScope, $state, DepGraphService, JsonDisplayService, ManageDatanodeService) {
    $scope.searchDatanodeByName = '';

    /**************************************************************/
    /*******************DataNode left side panel*******************/
    /**************************************************************/

    /*---------- New button ----------------*/
    $scope.newDataNode = function () {
      ManageDatanodeService.newDataNode($scope);
    };

    /*---------- open button /Load datanodes from xdjson ----------------*/
    $scope.openFileData = function (target) {
      ManageDatanodeService.openFileData(target);
    };

    /**********************************************************************/
    /*******************DataNode menu in left side panel*******************/
    /**********************************************************************/

    /*---------- filter By Connection btn----------------*/
    // $scope.filterByConnection = function(singleton, element) {
    //     ManageDatanodeService.filterByConnection(type, element);
    // };

    /*---------- filter By Type btn ----------------*/
    $scope.getUniqTypes = function () {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      DepGraphService.getUniqTypes(scopeDash);
    };

    /*---------- filter By Type btn --> select ----------------*/
    $scope.filterByType = function (type, element) {
      ManageDatanodeService.filterByType(type, element);
    };

    /*---------- filter By Type btn  --> cancel ----------------*/
    $scope.resetNodesFilters = function (e) {
      ManageDatanodeService.resetNodesFilters(e);
    };
    /*---------- sort datanodes ----------------*/
    $scope.sortNodes = function (value) {
      switch (value) {
        case 'typeA':
          $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, (el) => el.type().toLowerCase());
          break;
        case 'typeD':
          $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, (el) => el.type().toLowerCase()).reverse();
          break;
        case 'nameA':
          $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, (el) => el.name().toLowerCase());
          break;
        case 'nameD':
          $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, (el) => el.name().toLowerCase()).reverse();
          break;
        case 'statusA':
          $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, (el) => el.status().toLowerCase());
          break;
        case 'statusD':
          $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, (el) => el.status().toLowerCase()).reverse();
          break;
        case 'lastUpdateA':
          $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, (el) => el.last_updated().toLowerCase());
          break;
        case 'lastUpdateD':
          $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, (el) =>
            el.last_updated().toLowerCase()
          ).reverse();
          break;
      }
      $scope.displayedShowIndex = 0;
    };

    /*---------- Load datanodes button (from xdjson) ----------------*/
    // see  $scope.openFileData fct

    /*---------- Save datanodes button (to xdjson) ----------------*/
    $scope.saveJson = function () {
      xdsjson.saveJson();
    };

    /*---------- stop scheduler button  ----------------*/
    $scope.stopSchedule = function () {
      datanodesManager.stopSchedule();
    };

    /*---------- clear datanodes list button ----------------*/
    $scope.clearAllData = function () {
      xdsjson.clearAllData();
    };

    /*---------- Remove unused datanodes button ----------------*/
    $scope.RemoveUnusedDatanodes = function () {
      $rootScope.selectedButtonDataMove =
        $rootScope.selectedButtonDataMove === 'RemoveUnusedDatanodes' ? '' : 'RemoveUnusedDatanodes';
      datanodesManager.RemoveUnusedDatanodes();
    };

    /*---------- applyDatanodeFilter----------------*/
    $scope.applyDatanodeFilter = function (tmpStr) {
      ManageDatanodeService.applyDatanodeFilter(tmpStr);
    };

    /*******************************************************/
    /*******************DataNode cardTop *******************/
    /*******************************************************/

    //AEF: toggle window of dataNode result
    $scope.toggleDataNodeDisplay = function (index) {
      if (index == $scope.displayedShowIndex) $scope.displayedShowIndex = -1;
      else $scope.displayedShowIndex = index;
    };

    /*---------- json result display ----------------*/
    $scope.beautifulStringFromHtml = function (data) {
      return JsonDisplayService.beautifulStringFromHtml(data);
    };

    /*---------- see json result button ----------------*/
    $scope.getDataNodeDetail = function (data) {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      let scopedataNotifCtrl = angular.element(document.getElementById('datanode-notif-ctrl')).scope();
      scopedataNotifCtrl.showOneDatanodeData = data;
      data._beautifulString = JsonDisplayService.beautifulStringFromHtml(data);
      let contentElement = document.createElement('div');
      contentElement.setAttribute('style', 'height:100%');
      let divContent = '<div class="css-treeview" style="background-color: #f8f8f8;user-select: text;">';
      divContent = divContent + data._beautifulString;
      divContent = divContent + '</div>';
      contentElement.innerHTML = divContent;
      scopeDash.popup.datanodeInfo = true;
      scopeDash.popup.title = data.name();
      scopeDash.popup.text = '';
      $('#popup-text').html('');
      $('#popup-text').append(contentElement);
      scopeDash.copyContentValue = JSON.stringify(
        datanodesManager.getDataNodeByName(data.settings().name).latestData(),
        null,
        2
      );
    };

    /*---------- refresh button ----------------*/
    $scope.refreshDataNode = function (data) {
      data.schedulerStart(undefined, undefined, 'refresh');
    };

    /*---------- edit button ----------------*/
    $scope.openDataNode = function (data) {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

      let instanceType = data.type();
      let val = instanceType;
      let settings = data.settings();
      settings.name = data.name();

      $rootScope.dataNodeViewModel = data;
      let types = datanodesManager.getDataNodePluginTypes();
      scopeDash.editorView.newDatanodePanel.view = true;
      scopeDash.editorView.newDatanodePanel.list = false;
      scopeDash.editorView.newDatanodePanel.type = true;
      scopeDash.editorView.operationDataNode = 'edit';
      $rootScope.safeApply();
      datanodesManager.createPluginEditor(types, instanceType, settings, val);
    };

    /*---------- show graph button ----------------*/
    $scope.showDepGraph = function (name) {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      DepGraphService.showDepGraph(name, scopeDash);
    };

    /**************************************************************/
    /*******************DataNode menu in cardTop*******************/
    /**************************************************************/

    /*---------- duplicate button ----------------*/
    $scope.duplicateDataNode = function (data) {
      ManageDatanodeService.duplicateDataNode(data, $scope);
    };

    /*---------- interrupt button ----------------*/
    $scope.interruptDataNode = function (data) {
      if (data.execInstance() != null) {
        // scheduling is in progress
        data.execInstance().stopOperation(data.name());
      }
    };

    /*---------- Download JSON result button----------------*/
    $scope.showDataNodeInfo = function (dataNode) {
      var result = dataNode.latestData();
      saveAs(
        new Blob([JSON.stringify(result, null, '\t')], { type: 'application/octet-stream' }),
        dataNode.name() + '-result.json'
      );
    };

    /*---------- Delete button ----------------*/
    $scope.deleteDataNode = function (data) {
      datanodesManager.deleteDataNode(data, 'datanode', 'DataNode');
    };

    /*---------- Notification button ----------------*/
    $scope.getDataNodeDetailsAndNotifications = function (data) {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

      scopeDash.popup.datanodeNotif = true;
      scopeDash.popup.title = data.name();
      scopeDash.data = data;
      let scopedataNotifCtrl = angular.element(document.getElementById('datanode-notif-ctrl')).scope();
      scopedataNotifCtrl.showOneDatanodeData = data;
    };
  },
]);
