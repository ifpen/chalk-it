// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ Monitor panel                                                         │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2025 IFPEN                                                │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                   │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\

import 'angular/modules/dashboard/services/filterDatanodeService';
import draggablePanelTemplate from './draggable-panel.html';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

export const draggablePanelModule = angular
  .module('draggablePanelModule', ['datanodes.filter'])
  .directive('draggablePanel', [
    'FilterDatanodeService',
    '$document',
    function (FilterDatanodeService, $document) {
      return {
        restrict: 'E',
        transclude: true,
        scope: {
          startTop: '@',
          startLeft: '@',
          togglePanel: '&', // Parent's togglePanel function passed in via attribute.
        },
        template: draggablePanelTemplate,
        controller: [
          '$scope',
          '$element',
          '$rootScope',
          function ($scope, $element, $rootScope) {
            // Initialize search property for filtering.
            $scope.searchDatanodeByName = '';
            $scope.displayedShowIndex = 0;
            $rootScope.alldatanodes = datanodesManager.getAllDataNodes();
            // Instead of creating a new array, reference the $rootScope.filtredList.
            if (!$rootScope.filtredList) {
              $rootScope.filtredList = [];
            }
            $scope.filtredList = $rootScope.filtredList;

            $rootScope.filtredNodes = $rootScope.alldatanodes.length;
            $scope.filtredNodes = $rootScope.filtredNodes;

            // Expose the filtering function on the isolated scope.
            // Note: The filter service will fetch the search string from the directive's scope.
            $scope.applyDatanodeFilter = function () {
              FilterDatanodeService.applyDatanodeFilter();
            };

            /*---------- filter By Type btn --> select ----------------*/
            $scope.filterByType = function (type, element) {
              FilterDatanodeService.filterByType(type, element);
            };

            /*---------- filter By Type btn  --> cancel ----------------*/
            $scope.resetNodesFilters = function (e) {
              FilterDatanodeService.resetNodesFilters(e);
            };
            /*---------- sort datanodes ----------------*/
            $scope.sortNodes = function (value) {
              FilterDatanodeService.sortNodes(value);
              $scope.displayedShowIndex = 0;
            };

            if ($rootScope.filtredList.length === 0) {
              FilterDatanodeService.resetNodesFilters();
            }

            /*---------- getUniqTypes ----------------*/
            $scope.getUniqTypes = function () {
              let allTypes = [];
              for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
                allTypes.push($rootScope.alldatanodes[i].type());
              }
              $scope.uniqGraphNodesTypes = _.uniq(allTypes);
            };

            // Set initial position from attributes.
            var initialTop = parseInt($scope.startTop, 10) || 0;
            var initialLeft = parseInt($scope.startLeft, 10) || 0;
            $element.css({
              position: 'absolute',
              top: initialTop + 'px',
              left: initialLeft + 'px',
            });
            var startX,
              startY,
              x = initialLeft,
              y = initialTop;

            // Only start drag if mousedown occurs on an element with the 'drag-handle' class.
            $element.on('mousedown', function (event) {
              if (!angular.element(event.target).hasClass('drag-handle')) return;
              event.preventDefault();
              startX = event.clientX - x;
              startY = event.clientY - y;
              $document.on('mousemove', mousemove);
              $document.on('mouseup', mouseup);
            });

            function mousemove(event) {
              y = event.clientY - startY;
              x = event.clientX - startX;
              $element.css({
                top: y + 'px',
                left: x + 'px',
              });
            }

            function mouseup() {
              $document.off('mousemove', mousemove);
              $document.off('mouseup', mouseup);
            }
          },
        ],
        controllerAs: 'ctrl',
        bindToController: true,
      };
    },
  ]);
