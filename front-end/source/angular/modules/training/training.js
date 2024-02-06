export const trainingModule = angular.module('modules.training', []).config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('modules.training', {
      notAuthenticate: true,
      userAuthenticated: false,
      abstract: true,
      url: '/training',
      template: '',
    });
  },
]);
