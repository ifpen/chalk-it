angular
  .module('termsofuse')
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('termsofuse.show', {
        userNotAuthenticated: true,
        userAuthenticated: false,
        url: '/',
        templateUrl: 'source/angular/modules/terms-of-use/terms-of-use.html',
        controller: 'TermsofuseController',
      });
    },
  ])

  .controller('TermsofuseController', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'SessionUser',
    function ($scope, $rootScope, $state, $http, SessionUser) {
      $scope.access = function () {
        SessionUser.setLegalConditionsAccepted(true);
        $state.transitionTo('modules', {});
      };
      $scope.deny = function () {
        SessionUser.setLegalConditionsAccepted(false);
        //console.log(xDashConfig);
        window.location = xDashConfig.urlWebSite + 'index.html';
      };
    },
  ]);
