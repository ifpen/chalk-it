import 'angular/modules/dashboard/services/filterDatanodeService';
import draggablePanelTemplate from './draggable-panel.html';

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
          togglePanel: '&' // Parent's togglePanel function passed in via attribute.
        },
        template: draggablePanelTemplate,
        controller: [
          '$scope',
          '$element',
          '$rootScope',
          function ($scope, $element, $rootScope) {
            // Initialize search property for filtering.
            $scope.searchDatanodeByName = '';

            // Instead of creating a new array, reference the $rootScope.filtredList.
            if (!$rootScope.filtredList) {
              $rootScope.filtredList = [];
            }
            $scope.filtredList = $rootScope.filtredList;

            // Expose the filtering function on the isolated scope.
            // Note: The filter service will fetch the search string from the directive's scope.
            $scope.applyDatanodeFilter = function () {
              FilterDatanodeService.applyDatanodeFilter();
            };

            // Set initial position from attributes.
            var initialTop = parseInt($scope.startTop, 10) || 0;
            var initialLeft = parseInt($scope.startLeft, 10) || 0;
            $element.css({
              position: 'absolute',
              top: initialTop + 'px',
              left: initialLeft + 'px'
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
                left: x + 'px'
              });
            }

            function mouseup() {
              $document.off('mousemove', mousemove);
              $document.off('mouseup', mouseup);
            }
          }
        ],
        controllerAs: 'ctrl',
        bindToController: true
      };
    }
  ]);
