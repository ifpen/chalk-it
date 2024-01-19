// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboardGraphDep.controller                                                     │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.dashboard').controller('DashboardGraphDepController', [
  '$scope',
  '$rootScope',
  '$state',
  'DepGraphService',
  function ($scope, $rootScope, $state, DepGraphService) {
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
  },
]);
