angular
  .module('modules.training')
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('modules.training.layout', {
        userNotAuthenticated: true,
        userAuthenticated: false,
        url: '/',
        templateUrl: 'source/angular/modules/training/training.html',
        controller: 'TrainingController',
      });
    },
  ])

  .controller('TrainingController', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'SessionUser',
    function ($scope, $rootScope, $state, $http, SessionUser) {
      var iframe = document.getElementById('trainingFrame');
      iframe.src = xDashConfig.urlDoc + 'taipy_quick_start/quickstart/index.html';
      iframe.onload = function () {
        var sidebar = iframe.contentWindow.document.getElementsByClassName('md-sidebar')[0];
        sidebar.style.display = 'none';
        var logobutton = iframe.contentWindow.document.getElementsByClassName('md-header__button md-logo')[0];
        logobutton.style = 'pointer-events: none;';
        var searchbar = iframe.contentWindow.document.getElementsByClassName('md-search')[0];
        searchbar.style.display = 'none';
        var navFooter = iframe.contentWindow.document.getElementsByClassName('md-footer__inner md-grid')[0];
        navFooter.style.display = 'none';
        var iBody = iframe.contentWindow.document.body;
        iBody.style['padding-left'] = '15vw';
        iBody.style['padding-right'] = '15vw';
      };
      return;
    },
  ]);
