angular
  .module('modules.discover')
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('modules.discover.layout', {
        userNotAuthenticated: true,
        userAuthenticated: false,
        url: '/',
        resolve: {},
        templateUrl: function () {
          return xDashConfig.xDashBasicVersion == 'true'
            ? 'source/angular/modules/discover/discover-basic.html'
            : 'source/angular/modules/discover/discover.html';
        },
        controller: 'DiscoverController',
        params: {
          action: null,
        },
      });
    },
  ])

  .controller('DiscoverController', [
    '$scope',
    '$rootScope',
    '$stateParams',
    '$state',
    'ApisFactory',
    'ManagePrjService',
    function ($scope, $rootScope, $stateParams, $state, ApisFactory, ManagePrjService) {
      const matches = document.querySelectorAll('.docsLink');
      matches.forEach(function (item) {
        item.href = xDashConfig.urlDoc + 'index.html';
      });

      $scope.discoverSteps = [0, 0, 0, 0, 0];
      $scope.getConfigDiscover = async function () {
        const settings = await ApisFactory.getSettings();
        if (!settings.help) {
          $scope.discoverSteps = [0, 0, 0, 0, 0];
        } else {
          if (settings.help.discoverSteps) {
            $scope.discoverSteps = settings.help.discoverSteps;
          }
        }
      };

      if ($rootScope.enableLocalServer) {
        $scope.getConfigDiscover();
      }

      $scope.startGuidedTour = function () {
        const projectName = 'live-demo-py';
        if (
          !_.isUndefined($rootScope.currentPrjDirty) &&
          $rootScope.currentPrjDirty !== '' &&
          $rootScope.currentProject.name !== projectName
        ) {
          swal(
            {
              title: 'Are you sure?',
              text: 'Your current project will be saved and closed before starting the guided tour.',
              type: 'warning',
              showCancelButton: true,
              showConfirmButton: false,
              showConfirmButton1: true,
              confirmButtonText: 'Yes',
              cancelButtonText: 'Abandon',
              closeOnConfirm: true,
              closeOnConfirm1: true,
              closeOnCancel: true,
            },
            function (isConfirm) {
              if (isConfirm) {
                const endAction = function () {
                  navHelper.openDemoProject(projectName, startIntroProject);
                  if ($('#inputSearchWidget').val()) {
                    $('#inputSearchWidget').val('');
                    const clearWidgetSearch = new widgetToolboxClass();
                  }
                };
                if ($rootScope.xDashFullVersion) {
                  //save current project then duplicate
                  fileManager.getFileListExtended(
                    'project',
                    $rootScope.currentProject.name,
                    undefined,
                    endAction,
                    true
                  );
                } else {
                  // Use setTimeout to wait for the swal to close
                  setTimeout(() => {
                    ManagePrjService.saveProjectToLocal(endAction);
                  }, 500);
                }
              } else {
                //nothing
              }
            }
          );
        } else {
          navHelper.openDemoProject(projectName, startIntroProject);
          if ($('#inputSearchWidget').val()) {
            $('#inputSearchWidget').val('');
            const clearWidgetSearch = new widgetToolboxClass();
          }
        }
      };

      $scope.saveConfigDiscover = async function (index) {
        if ($rootScope.enableLocalServer) {
          $scope.discoverSteps[index] = 1; // to validate step
          const settings = await ApisFactory.getSettings();
          if (!settings.help) {
            settings.help = {};
          }
          settings.help.discoverSteps = $scope.discoverSteps;
          ApisFactory.saveSettings(settings);
        }
      };

      // For basic version
      $scope.skipTutorial = async function () {
        const settings = await ApisFactory.getSettings();
        if (!settings.help) {
          settings.help = {};
        }
        settings.help.discoverSteps = settings.help.discoverSteps.map((_) => 1);
        settings.help.isDiscoverDone = true;
        ApisFactory.saveSettings(settings);
      };

      /*---------- New project in discover view ----------------*/
      $scope.newProject = function () {
        const vm = angular.element(document.getElementById('sidebar-ctrl')).scope();
        vm.newProject();
      };
    },
  ]);
