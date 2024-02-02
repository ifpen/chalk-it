// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ sidebar                                                                          │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

export const sidebarModule = angular.module('modules.sidebar', []).config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('modules.sidebar', {
      notAuthenticate: true,
      userAuthenticated: false,
      abstract: true,
      url: '/sidebar',
      templateUrl: '',
    });
  },
]);
