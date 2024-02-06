export const discoverModule = angular.module('modules.discover', []).config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('modules.discover', {
      notAuthenticate: true,
      userAuthenticated: false,
      abstract: true,
      url: '/discover',
      template: '',
    });
  },
]);
