// ┌─────────────────────────────────────────────────────────────┐ \\
// │ cards.js                                                    │ \\
// ├─────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                 │ \\
// | Licensed under the Apache License, Version 2.0              │ \\
// ├─────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI           │ \\
// └─────────────────────────────────────────────────────────────┘ \\

angular.module('modules.cards', []).config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('modules.cards', {
      notAuthenticate: true,
      userAuthenticated: false,
      abstract: true,
      url: '/cards',
      templateUrl: '',
    });
  },
]);
