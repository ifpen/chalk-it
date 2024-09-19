import { xDashConfig } from 'config.js';
import template from 'angular/modules/training/training.html';

angular
  .module('modules.training')
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('modules.training.layout', {
        userNotAuthenticated: true,
        userAuthenticated: false,
        url: '/',
        template,
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
      const iframe = document.getElementById('trainingFrame');
      iframe.src = `${xDashConfig.urlDoc}quick-start/quickstart/`;

      // Helper function to hide elements by class name
      const hideElementByClassName = (className) => {
        const element = iframe.contentWindow.document.getElementsByClassName(className)[0];
        if (element) {
          element.style.display = 'none';
        }
      };

      // Helper function to disable pointer events by class name
      const disablePointerEventsByClassName = (className) => {
        const element = iframe.contentWindow.document.getElementsByClassName(className)[0];
        if (element) {
          element.style.pointerEvents = 'none';
        }
      };

      // Function to handle iframe content manipulations
      const handleIframeContentLoaded = () => {
        hideElementByClassName('md-sidebar');
        disablePointerEventsByClassName('md-header__button md-logo');
        hideElementByClassName('md-search');
        hideElementByClassName('md-footer__inner md-grid');

        const iBody = iframe.contentWindow.document.body;
        if (iBody) {
          iBody.style.paddingLeft = '15vw';
          iBody.style.paddingRight = '15vw';
        }
      };

      // Listen for messages from the iframe
      window.addEventListener(
        'message',
        (event) => {
          if (event.origin === xDashConfig.urlDoc && event.data === 'contentLoaded') {
            handleIframeContentLoaded();
          }
        },
        false
      );
    },
  ]);
