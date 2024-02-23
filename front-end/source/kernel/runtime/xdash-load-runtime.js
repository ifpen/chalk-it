// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xdash-load-runtime                                                 │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Abir EL FEKI, Mongi BEN GAID  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import 'angular-ui-router';
import 'angularjs-gauge';
import 'angularjs-slider';
import 'angularjs-datepicker';

import { urlBase } from 'config.js';

import { pythonImagesModule } from 'angular/modules/python/python-images.module.js';
import { initXdashRuntime } from 'kernel/runtime-singletons';
import { onAngularReady } from 'kernel/runtime/xdash-runtime-main';
import { dashState } from 'angular/modules/dashboard/dashboard';

// TODO contant
dashState.modeActive = 'play-dashboard';

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
    $rootScope.navBarNotification = window.navBarNotification === 'true'; //AEF: visible if show notifications is checked // TODO
    $rootScope.showNavBar = window.showNavBar === 'true'; // MBG 03/05/2021 : for rowToPage and rowToTab modes // TODO
    $rootScope.loadingBarStart = function (fn) {};
    $rootScope.loadingBarStop = function (fn) {};
    $rootScope.notificationFilterDataValue = '';
    $rootScope.listNotifications = [];
    $rootScope.nbNotifications = 0;
    $rootScope.pageNumber = 1; // MBG pagination mode
    $rootScope.totalPages = 1; // MBG pagination mode
    $rootScope.pageNames = []; // GHI #245

    $rootScope.clearAllNotifications = function (filter) {
      $rootScope.listNotifications = [];
      $rootScope.nbNotifications = 0;
      for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
        $rootScope.alldatanodes[i].__notifications = undefined;
      }
    };

    $rootScope.safeApply = function (fn) {
      var scopePhase = $rootScope.$root.$$phase;
      if (scopePhase == '$apply' || scopePhase == '$digest') {
      } else {
        $rootScope.$apply();
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
