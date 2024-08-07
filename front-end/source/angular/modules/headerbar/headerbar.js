// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ headerbar                                                                        │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

export const headerbarModule = angular.module('modules.headerbar', []).config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('modules.headerbar', {
      notAuthenticate: true,
      userAuthenticated: false,
      abstract: true,
      url: '/headerbar',
      template: '',
    });
  },
]);
