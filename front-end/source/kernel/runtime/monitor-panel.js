// panel.js
export const draggablePanelModule = angular.module('draggablePanelModule', [])
  .directive('draggablePanel', function() {
    return {
      restrict: 'E',
      transclude: true,
      scope: {
        startTop: '@',
        startLeft: '@'
      },
      template: '<div class="panel" ng-transclude></div>',
      link: function(scope, element) {
        // Set initial position from attributes (defaults to 0 if not provided)
        const initialTop = parseInt(scope.startTop, 10) || 0;
        const initialLeft = parseInt(scope.startLeft, 10) || 0;
        element.css({
          position: 'absolute',
          top: initialTop + 'px',
          left: initialLeft + 'px'
        });
        let startX, startY, x = initialLeft, y = initialTop;
        
        // Only start drag if mousedown occurs on an element with the 'drag-handle' class
        element.on('mousedown', function(event) {
          if (!angular.element(event.target).hasClass('drag-handle')) return;
          event.preventDefault();
          startX = event.clientX - x;
          startY = event.clientY - y;
          
          document.addEventListener('mousemove', mousemove);
          document.addEventListener('mouseup', mouseup);
        });
        
        function mousemove(event) {
          y = event.clientY - startY;
          x = event.clientX - startX;
          element.css({
            top: y + 'px',
            left: x + 'px'
          });
        }
        
        function mouseup() {
          document.removeEventListener('mousemove', mousemove);
          document.removeEventListener('mouseup', mouseup);
        }
      }
    };
  });
