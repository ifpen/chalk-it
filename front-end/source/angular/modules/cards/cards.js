// ┌─────────────────────────────────────────────────────────────┐ \\
// │ cards.js                                                    │ \\
// ├─────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                 │ \\
// | Licensed under the Apache License, Version 2.0              │ \\
// ├─────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI           │ \\
// └─────────────────────────────────────────────────────────────┘ \\

import listProjectPagination from './_partials/list_project_pagination.html';

export const cardsModule = angular
  .module('modules.cards', [])
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('modules.cards', {
        notAuthenticate: true,
        userAuthenticated: false,
        abstract: true,
        url: '/cards',
        template: '<div ui-view></div>',
      });
    },
  ])
  .directive('listProjectPagination', function () {
    return {
      template: listProjectPagination,
    };
  });
