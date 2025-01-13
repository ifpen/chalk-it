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

export const angularModule = angular.module('xCLOUD', [
  'angularjs-gauge',
  'rzSlider',
  '720kb.datepicker',
  'ui.router.state', // TODO only needed for pythonImagesModule
  pythonImagesModule.name,
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

class DashboardController {
  constructor() {
    initXdashRuntime();
    onAngularReady();
  }
}

angularModule.controller('DashboardController', [DashboardController]);
