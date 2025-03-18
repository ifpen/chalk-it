// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xdash-load-runtime                                                 │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Abir EL FEKI, Mongi BEN GAID  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import 'angular-ui-router';
import 'angularjs-gauge';
import 'angularjs-slider';
import 'angularjs-datepicker';

import { urlBase } from 'config.js';

import { pythonImagesModule } from 'angular/modules/python/python-images.module';
import { initXdashRuntime } from 'kernel/runtime-singletons';
import { onAngularReady } from 'kernel/runtime/xdash-runtime-main';
import { jsonDataToBasicHtmlElement } from 'kernel/datanodes/plugins/thirdparty/utils';
// Import the draggable panel module
import { draggablePanelModule } from './monitor-panel.js';

export const angularModule = angular.module('xCLOUD', [
  'angularjs-gauge',
  'rzSlider',
  '720kb.datepicker',
  'ui.router.state', // TODO only needed for pythonImagesModule
  pythonImagesModule.name,
  draggablePanelModule.name, // include the draggable panel module here
]);

angularModule.run([
  '$rootScope',
  function ($rootScope) {
    $rootScope.urlBase = urlBase; // TODO
    $rootScope.notificationFilterDataValue = '';
    $rootScope.listNotifications = [];
    $rootScope.nbNotifications = 0;

    $rootScope.loadingBarStart = (fn = () => {}) => fn(); // Arrow function with default param
    $rootScope.loadingBarStop = (fn = () => {}) => fn();

    // Control for showing/hiding the panel
    $rootScope.panelOpen = false;
    $rootScope.togglePanel = function () {
      $rootScope.panelOpen = !$rootScope.panelOpen;
    };

    $rootScope.clearAllNotifications = function (filter) {
      $rootScope.listNotifications = [];
      $rootScope.nbNotifications = 0;

      if ($rootScope.alldatanodes?.length) {
        for (const node of $rootScope.alldatanodes) {
          node.__notifications = undefined;
        }
      }
    };

    $rootScope.safeApply = function (fn) {
      const phase = $rootScope?.$$phase;

      if (phase === '$apply' || phase === '$digest') {
        fn?.();
      } else {
        $rootScope.$apply(fn); // Safely apply the function in the Angular digest cycle
      }
    };
  },
]);

// Import your formatting function
// formatData.directive.js

angularModule.directive('formatData', function () {
  return {
    restrict: 'A',
    scope: {
      formatData: '=', // Two-way binding for the value passed in
    },
    link: function (scope, element) {
      scope.$watch('formatData', function (newVal) {
        if (newVal) {
          element.empty();
          const formattedElem = jsonDataToBasicHtmlElement(newVal, { jsonFormat: { maxLines: 10, maxLineWidth: 40 } });
          element.append(formattedElem);
        }
      });
    },
  };
});

class DashboardController {
  constructor() {
    initXdashRuntime();
    onAngularReady();
  }
}

angularModule.controller('DashboardController', [DashboardController]);
