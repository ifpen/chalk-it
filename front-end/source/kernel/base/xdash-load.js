// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xdash-load                                                         │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2018-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Abir EL FEKI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var userCode = null;

var angularModule = angular
  .module('xCLOUD', [
    'ui.router',
    'angularjs-gauge',
    'ui.bootstrap',
    'angular-loading-bar',
    'modules',
    'ngTagsInput',
    'ngSanitize',
    'rzSlider',
    '720kb.datepicker',
  ])
  .run([
    '$rootScope',
    '$state',
    '$stateParams',
    'SessionUser',
    function ($rootScope, $state, $stateParams, SessionUser) {
      $rootScope.safeApply = function (fn) {
        var scopePhase = $rootScope.$root.$$phase;
        if (scopePhase == '$apply' || scopePhase == '$digest') {
        } else {
          $rootScope.$apply();
        }
      };

      // 20/11/2019 : AH & MBG for modularization. MBG moved here on 09/03/2020
      $rootScope.enableServer = !_.isUndefined(xServConfig.urlApi) && !_.isNull(xServConfig.urlApi);
      $rootScope.xDashFullVersion = !(xDashConfig.xDashBasicVersion == 'true');
      $rootScope.enableRegistration = !(xDashConfig.disableRegistration == 'true');
      $rootScope.urlTerms = xDashConfig.urlWebSite + 'terms-credits/xDashTermsofUse10062020.html';
      if ($rootScope.xDashFullVersion) $rootScope.urlCredits = xDashConfig.urlWebSite + 'terms-credits/Credits.html';
      else $rootScope.urlCredits = xDashConfig.urlWebSite + '/blob/main/credits.html';

      $rootScope.enableLocalServer = !(xDashConfig.disableLocalServer == 'true');
      $rootScope.disableSchedulerProfiling = xDashConfig.disableSchedulerProfiling == 'true';

      if ($rootScope.xDashFullVersion) {
        document.title = "Chalk'it - SaaS version";
      } else {
        document.title = "Chalk'it";
      }

      $rootScope.listAvailablesTags = [
        { name: 'tags 1', value: 'tag1' },
        { name: 'tags 2', value: 'tag2' },
        { name: 'tags 3', value: 'tag3' },
        { name: 'tags 4', value: 'tag4' },
        { name: 'tags 5', value: 'tag5' },
      ];

      $rootScope.DefaultSettings = {
        data: {},
        projects: [],
        dataNode: [],
        tags: [],
        updatedAt: '',
        createdAt: '',
        scope: {},
        info: {},
        settings: {},
        profile: {
          userName: '',
          Id: '',
        },
      };

      $rootScope.$on('$stateNotFound', function (event, to) {
        console.log('$stateNotFound');
      });

      $rootScope.$on('$stateChangeError', function (event, to) {
        console.log('$stateChangeError');
      });

      $rootScope.$on('$stateChangeStart', function (event, to) {
        if (to.name !== 'login.user') {
          if (!$rootScope.UserProfile) {
            if (SessionUser.getUserId() && SessionUser.getUserName() && $rootScope.xDashFullVersion) {
              userCode = SessionUser.getUserId();
              $rootScope.UserProfile = SessionUser.getUserProfile();

              $state.transitionTo('modules', {});
              event.preventDefault();
            } else {
              var param = findGetParameter('data');
              var bFoundParam = false;
              var data;
              if (param && param != '') {
                try {
                  var decodedData = window.atob(param);
                  data = JSON.parse(decodedData);
                  if (data.ID && data.Name)
                    //ABK to be sure that ID and Name do exist
                    bFoundParam = true;
                } catch (e) {
                  //ABK someone tried to change the crypted data
                  bFoundParam = false;
                }
              }
              if (bFoundParam) {
                $rootScope.UserProfile = {};
                $rootScope.UserProfile.userId = data.ID;
                $rootScope.UserProfile.userName = data.Name;
                $state.transitionTo('modules', {});
              } else {
                if (!$rootScope.xDashFullVersion) {
                  // no authentication needed
                  $rootScope.UserProfile = {};
                  $rootScope.UserProfile.userId = -1;
                  $rootScope.UserProfile.userName = 'Guest';
                  $state.transitionTo('modules', {});
                  event.preventDefault();
                } else {
                  $rootScope.UserProfile = {};
                  userCode = undefined;
                  sessionStorage.removeItem('userId');
                  $state.transitionTo('login.user', {});
                  event.preventDefault();
                }
              }
            }
          } else {
            if (!$rootScope.UserProfile.userId) {
              sessionStorage.removeItem('userId');
              $state.transitionTo('login.user', {});
              event.preventDefault();
            }
          }
        } else {
          if (!$rootScope.UserProfile) {
            if (SessionUser.getUserId() && SessionUser.getUserName()) {
            } else {
            }
          } else {
          }
        }

        if (to.name === 'modules') {
          $rootScope.moduleOpened = false;
        } else {
          $rootScope.moduleOpened = true;
        }
      });

      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.$on('$routeChangeStart', function (event, next, current) {});
    },
  ])
  .run([
    '$rootScope',
    'cfpLoadingBar',
    function ($rootScope, cfpLoadingBar) {
      $rootScope.xdashVersion = xDashConfig.version.fullVersion;
      $rootScope.chalkitVersion = xDashConfig.version.chalkitVersion;
      $rootScope.loadingBarStart = function () {
        cfpLoadingBar.start();
        $rootScope.isLoading = true;
        timer = setTimeout(function () {
          cfpLoadingBar.complete();
          $rootScope.isLoading = false;
        }, 10000);
      };

      $rootScope.loadingBarStop = function () {
        cfpLoadingBar.complete();
        $rootScope.isLoading = false;
      };
    },
  ])
  .config([
    '$locationProvider',
    function ($locationProvider) {
      $locationProvider.html5Mode(false);
      $locationProvider.hashPrefix('');
    },
  ])
  .config([
    'cfpLoadingBarProvider',
    function (cfpLoadingBarProvider) {
      cfpLoadingBarProvider.includeSpinner = true; // Show the spinner.
      cfpLoadingBarProvider.includeBar = true; // Show the bar.
    },
  ])
  .config([
    '$urlRouterProvider',
    function ($urlRouterProvider) {
      $urlRouterProvider.otherwise(async function (injector) {
        injector.invoke([
          '$state',
          '$rootScope',
          'SessionUser',
          'ApisFactory',
          async function ($state, $rootScope, SessionUser, ApisFactory) {
            $rootScope.isTemplateOpen = window.location.href.includes('template');
            $rootScope.isDiscoverDone = false;
            $rootScope.getConfigDiscover = async function () {
              const settings = await ApisFactory.getSettings();
              if (settings.help) {
                if (!_.isUndefined(settings.help.isDiscoverDone)) {
                  $rootScope.isDiscoverDone = settings.help.isDiscoverDone;
                }
              }
              if ($rootScope.xDashFullVersion) {
                $rootScope.saveConfigDiscover(settings);
              }
            };

            $rootScope.saveConfigDiscover = function (settings) {
              if (!$rootScope.isDiscoverDone) {
                //change flag for next connection
                if (!settings.help) settings.help = {};
                settings.help.isDiscoverDone = true;
                ApisFactory.saveSettings(settings);
                $rootScope.toggleMenuOptionDisplay('discover');
                $state.go('modules.discover.layout');
              }
            };

            if (!$rootScope.xDashFullVersion) {
              if ($rootScope.enableLocalServer) {
                await $rootScope.getConfigDiscover();
              }
            } else {
              $rootScope.getConfigDiscover();
            }

            if (!$rootScope.UserProfile) {
              if (SessionUser.getUserId() && SessionUser.getUserName() && $rootScope.xDashFullVersion) {
                userCode = SessionUser.getUserId();
                $rootScope.UserProfile = SessionUser.getUserProfile();
                $rootScope.origin = 'reload'; //AEF
                $state.go('modules');
              } else {
                // This section is executed when reloading the dashboard
                if (!$rootScope.xDashFullVersion) {
                  // no authentication needed
                  $rootScope.UserProfile = {};
                  $rootScope.UserProfile.userId = -1;
                  $rootScope.UserProfile.userName = 'Guest';
                  $state.go('modules.discover.layout').then(() => {
                    $rootScope.toggleMenuOptionDisplay('discover');
                  });
                } else {
                  $state.go('login.user');
                }
              }
            } else {
              if (!$rootScope.UserProfile.userId) {
                $state.go('login.user');
              } else {
                //AEF
                // start view with recent projects
                if (
                  $rootScope.origin == 'newProject' ||
                  $rootScope.origin == 'openProject' ||
                  $rootScope.origin == 'closeProject' ||
                  $rootScope.origin == 'backToEditor'
                ) {
                  $rootScope.toggleMenuOptionDisplay('none');
                  $state.go('modules', {});
                } else {
                  if ($rootScope.xDashFullVersion) {
                    $rootScope.toggleMenuOptionDisplay('recent');
                    $state.go('modules.cards.layout', { action: 'recent' });
                    // $rootScope.isMaintenanceInfo = false;
                    // let FileMngrInst = new FileMngrFct();
                    // FileMngrInst.GetMaintenanceInfo(function(msg1, msg2, type) {
                    //     let notice;
                    //     if (type == "error") {
                    //         notice = new PNotify({
                    //             title: "Maintenance info",
                    //             text: msg1,
                    //             type: "error",
                    //             styling: "bootstrap3",
                    //         });
                    //     } else if (type === "success") {
                    //         if (msg1.Msg !== "") {
                    //             $rootScope.isMaintenanceInfo = true;
                    //             $rootScope.msgMaintenanceInfo = msg1.Msg;
                    //             notice = new PNotify({
                    //                 title: "Maintenance info",
                    //                 text: msg1.Msg,
                    //                 type: "info",
                    //                 styling: "bootstrap3",
                    //             });
                    //         }
                    //     }
                    //     $('.ui-pnotify-container').on('click', function() {
                    //         notice.remove();
                    //     });
                    // });
                  } else {
                    // This section will not be executed when opening the guided tour project
                    if ($rootScope.origin !== 'projectEdition') {
                      $rootScope.toggleMenuOptionDisplay('discover');
                      $state.go('modules.discover.layout');
                    }
                  }
                }
              }
            }
          },
        ]);
      });
    },
  ]);
