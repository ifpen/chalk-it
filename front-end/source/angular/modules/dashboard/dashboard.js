// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard                                                             │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                     │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\

export const dashState = {
  tabActive: 'widgets',
  modeActive: 'edit-dashboard',
  editorStatus: 'full',
};

export const dashboardModule = angular.module('modules.dashboard', []).config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('modules.dashboard', {
      notAuthenticate: true,
      userAuthenticated: false,
      abstract: true,
      url: '/dashboard',
      templateUrl: '',
    });
  },
]);
