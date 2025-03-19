// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard                                                             │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                     │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\

export const dashState = {
  tabActive: 'widgets',
};

export const dashboardModule = angular.module('modules.dashboard', ['datanodes.filter']).config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('modules.dashboard', {
      notAuthenticate: true,
      userAuthenticated: false,
      abstract: true,
      url: '/dashboard',
      template: '',
    });
  },
]);
