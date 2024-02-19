// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboardGraphDep.controller                                                     │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
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
  function ($scope, $rootScope, $state, DepGraphService) {
    const self = this;
    /**************************************************************/
    /***********************Dependency graph***********************/
    /**************************************************************/

    /*---------- selectConnectedWithWidget ----------------*/
    $scope.selectConnectedWithWidget = function (tag) {
      DepGraphService.selectConnectedWithWidget(tag);
    };

    /*---------- filter By Type btn ----------------*/
    $scope.getUniqTypes = function () {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      DepGraphService.getUniqTypes(scopeDash);
    };

    /*---------- seeInDepGraph ----------------*/
    $scope.seeInDepGraph = function (event) {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      DepGraphService.seeInDepGraph(event, scopeDash);
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
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
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
