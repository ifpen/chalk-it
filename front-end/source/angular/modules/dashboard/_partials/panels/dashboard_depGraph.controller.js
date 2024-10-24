// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboardGraphDep.controller                                                     │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

angular.module('modules.dashboard').controller('DashboardGraphDepController', [
  '$scope',
  '$rootScope',
  '$state',
  'DepGraphService',
  'ProfGraphService',
  function ($scope, $rootScope, $state, DepGraphService, ProfGraphService) {
    const self = this;

    $scope.tabs = [
      { id: 'Tab1', label: 'Dependency Graph' },
      { id: 'Tab2', label: 'Scheduling Graph' },
    ];
    $scope.activeTab = $scope.tabs[0].id; // Default to the first tab;

    $scope.isActiveTab = function (tabId) {
      return $scope.activeTab === tabId;
    };

    $scope.openTab = function (tabId) {
      $scope.activeTab = tabId;
    };

    /**************************************************************/
    /*******************Scheduler profiling graph******************/
    /**************************************************************/

    /*---------- selectConnectedWithWidget ----------------*/
    $scope.startProfiling = function () {
      ProfGraphService.startProfiling();
    };

    /**************************************************************/
    /***********************Dependency graph***********************/
    /**************************************************************/

    /*---------- selectConnectedWithWidget ----------------*/
    $scope.selectConnectedWithWidget = function (tag) {
      DepGraphService.selectConnectedWithWidget(tag);
    };

    /*---------- filter By Type btn ----------------*/
    $scope.getUniqTypes = function () {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      DepGraphService.getUniqTypes(scopeDash);
    };

    /*---------- selectNodeFromTagList ----------------*/
    $scope.selectNodeFromTagList = function (type) {
      DepGraphService.selectNodeFromTagList(type);
    };

    /*---------- closeGraph ----------------*/
    $scope.closeGraph = function () {
      DepGraphService.closeGraph();
    };

    /*---------- editNodeFromGraph ----------------*/
    $scope.editNodeFromGraph = function (dataNode) {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      const scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
      DepGraphService.editNodeFromGraph(dataNode, scopeDash, scopeDashDn);
    };

    $scope.exportGraph = function () {
      datanodesManager.exportGraph();
    };

    $scope.zoomOut = function () {
      datanodesManager.zoomOutGraph();
    };

    $scope.zoomIn = function () {
      datanodesManager.zoomInGraph();
    };

    $scope.openFullScreen = function () {
      datanodesManager.openFullScreenGraph();
    };

    $scope.openFullScreen = function () {
      datanodesManager.openFullScreenGraph();
    };

    self.inputSearchGraphText = '';
    $scope.onInputSearchGraph = function () {
      datanodesManager.searchGraph(self.inputSearchGraphText);
    };
  },
]);
