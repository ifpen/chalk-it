// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ cards.controller.js                                                │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { xDashConfig } from 'config.js';
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import _ from 'underscore';
import swal from 'sweetalert';
import template from 'angular/modules/cards/cards.html';
import PNotify from 'pnotify';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { htmlExport } from 'kernel/general/export/html-export';

angular
  .module('modules.cards')
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('modules.cards.layout', {
        userNotAuthenticated: true,
        userAuthenticated: false,
        url: '/',
        template,
        controller: 'CardsController',
        params: {
          action: null,
        },
      });
    },
  ])
  // AEF: multiselect tags in filters window
  .directive('toggleClass', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.bind('click', function () {
          element.toggleClass(attrs.toggleClass);
        });
      },
    };
  })
  //AEF: clear tags selection in filters window
  .directive('clearToggleClass', function () {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        element.bind('click', function () {
          $('li[toggle-class=' + attrs.clearToggleClass + ']').removeClass(attrs.clearToggleClass);
          if (!_.isUndefined($('#search-input')[0])) $('#search-input')[0].value = '';
          if (!_.isUndefined($('#search-input-sidebar')[0])) $('#search-input-sidebar')[0].value = '';
        });
      },
    };
  })
  .controller('CardsController', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'ApisFactory',
    'cfpLoadingBar',
    'FilterPrjService',
    'ManagePrjService',
    'ManagePageSharingService',
    'ManagePrjSharingService',
    function (
      $scope,
      $rootScope,
      $state,
      $http,
      ApisFactory,
      cfpLoadingBar,
      FilterPrjService,
      ManagePrjService,
      ManagePgSharingService,
      ManagePrjSharingService
    ) {
      $rootScope.moduleOpened = true;
      $scope.Fmin = 0;
      $scope.Fmax = 8;
      $scope.perPage = 10;
      $scope.currentPage = 0;
      $rootScope.pagination = {};
      $rootScope.displayedIndexG = [];

      $rootScope.allFiles = [];

      $scope.allFilesWithNoGrp = []; //AEF: default files that don't belong to any group
      $scope.allFilesFiltred = []; //AEF: filtered files
      $scope.allFilesFiltredGrp = [];
      $scope.allFilesFiltredValue = []; //AEF: filtered files with keywords user input
      $scope.allFilesFiltredValueGrp = [];
      $scope.filterTagsList = []; //AEF: list of selected Tags
      $scope.grpFiles = []; //AEF: group files
      $scope.nbCat = 1; //AEF: nb of category of cards in a view (default==1). Needed for template that has 2 category

      $rootScope.ProjectsFilterField = {
        value: '',
        tags: '',
      };

      $scope.info = {
        openProjectInfo: false,
        title: 'Info project',
        left: '59%',
        checkboxModelLater: false,
        showCheckbox: false,
        pastName: '',
        tmp: {},
        idForm: 1, // unique
      };

      $scope.sharePrj = {
        left: '59%',
        flag: true,
      };

      $scope.form = {};
      $scope.listView = false;

      $scope.helpDisplay = {
        checkboxModel: false,
        isOpen: true,
      };

      $rootScope.userList = [];
      $scope.templatesList = [];

      $scope.fileTypes = ['My projects', 'My pages', 'My dataNodes'];
      $scope.fileType = 'xprjson';

      //AEF: 3 views for list: recent/My projects/template gallery
      if ($state.params.action === 'recent' || _.isNull($state.params.action)) {
        $scope.projectVue = 'recent';
      } else if ($state.params.action === 'myProjects') {
        $scope.projectVue = 'all';
      } else if ($state.params.action === 'templateGallery') {
        $scope.projectVue = 'gallery';
      }

      /*---------- _getConfigHelp ----------------*/
      _getConfigHelp = async function () {
        const settings = await ApisFactory.getSettings();
        if (!settings.help) {
          $scope.helpDisplay.checkboxModel = false;
        } else {
          $scope.helpDisplay.checkboxModel = settings.help.displayHelp;
          $scope.helpDisplay.isOpen = !$scope.helpDisplay.checkboxModel;
        }
      };

      _getConfigHelp();

      /*---------- saveConfigHelp ----------------*/
      $scope.saveConfigHelp = async function () {
        const settings = await ApisFactory.getSettings();
        if (!settings.help) {
          settings.help = {};
        }
        settings.help.displayHelp = $scope.helpDisplay.checkboxModel;
        ApisFactory.saveSettings(settings);
      };

      /*---------- updateView ----------------*/
      $rootScope.updateView = function () {
        let action = $state.params.action;
        let fileType = $scope.fileType;
        if (_.isNull(action))
          $state.go('modules.cards.layout', { action: 'recent' }).then($scope.findFilesByFilters(fileType));
        else $state.go('modules.cards.layout', { action: action }).then($scope.findFilesByFilters(fileType));
      };

      //AEF: separate grpFiles from default files
      function _manageGrpFile() {
        var indexes = [];
        $scope.grpFiles = [];
        $scope.allFilesFiltredGrp = [];
        $scope.allFilesFiltredValueGrp = [];

        if (!_.isUndefined($scope.allFilesWithNoGrp[0])) {
          //when no project exist
          for (let i = 0; i < $scope.allFilesWithNoGrp[0].FileList.length; i++) {
            //group only for [0] ==> project
            grpName = $scope.allFilesFiltred[0].FileList[i].GroupName;
            if (grpName !== '' && !_.isUndefined(grpName) && !_.isNull(grpName)) {
              indexes.push(i);
              if (_.isUndefined($scope.grpFiles[grpName])) {
                $scope.grpFiles.push(grpName);
                $scope.grpFiles[grpName] = [];
              }
              $scope.grpFiles[grpName].push($scope.allFilesWithNoGrp[0].FileList[i]);

              if (_.isUndefined($scope.allFilesFiltredGrp[grpName])) {
                $scope.allFilesFiltredGrp.push(grpName);
                $scope.allFilesFiltredGrp[grpName] = [];
              }
              $scope.allFilesFiltredGrp[grpName].push($scope.allFilesWithNoGrp[0].FileList[i]);

              if (_.isUndefined($scope.allFilesFiltredValueGrp[grpName])) {
                $scope.allFilesFiltredValueGrp.push(grpName);
                $scope.allFilesFiltredValueGrp[grpName] = [];
              }
              $scope.allFilesFiltredValueGrp[grpName].push($scope.allFilesWithNoGrp[0].FileList[i]);
            }
          }
          $scope.grpFiles.sort(); // sort group files before display
          $scope.allFilesFiltredGrp.sort();
          $scope.allFilesFiltredValueGrp.sort();

          //remove files that have a group from the list
          for (let i = $scope.allFilesWithNoGrp[0].FileList.length - 1; i >= 0; i--) {
            if (i in indexes) {
              $scope.allFilesWithNoGrp[0].FileList.splice(indexes[i], 1);
            }
          }
        }
        //update filtered files (concern only files with no group)
        $scope.allFilesFiltred = angular.copy($scope.allFilesWithNoGrp);
        $scope.allFilesFiltredValue = angular.copy($scope.allFilesWithNoGrp);
      }

      function _initFiles(file) {
        //clean old projects
        _.each(file.FileList, (fl) => {
          if (_.isNull(fl.Tags)) {
            fl.Tags = [];
          }
        });
        //AEF: initialize allFilesWithNoGrp
        $scope.allFilesWithNoGrp[0] = angular.copy(file);
        //$scope.projectVue = "all" ||  "recent" ||  "gallery"
        if ($scope.projectVue === 'gallery') {
          //gallery of template view
          $scope.nbCat = 1; //(templates with JS and templates with APIs) // MBG nbCat from 2 to 1
          $scope.allFilesWithNoGrp[1] = angular.copy(file);
          let templatesTagsList = [];
          _.each(file.FileList, (fl) => {
            templatesTagsList.push(..._.flatten(fl.Tags));
          });
          $scope.templatesList = _.uniq(templatesTagsList);
        } else {
          let projectsTagsList = [];
          _.each(file.FileList, (fl) => {
            projectsTagsList.push(..._.flatten(fl.Tags));
          });
          projectsTagsList = projectsTagsList.map((name) => name.toLowerCase());
          $rootScope.userList = _.uniq(projectsTagsList);
        }
        //AEF: initialize
        $scope.allFilesFiltred = angular.copy($scope.allFilesWithNoGrp);
        $scope.allFilesFiltredValue = angular.copy($scope.allFilesWithNoGrp);
      }

      function _initPagination() {
        let val = 1;
        if (!_.isUndefined($scope.allFilesWithNoGrp[0])) {
          if (!_.isUndefined($scope.allFilesWithNoGrp[0].FileList)) {
            val = $scope.allFilesWithNoGrp[0].FileList.length;
          }
        }
        $scope.currentPage = 0;
        $rootScope.pagination = {
          Fmin: $scope.Fmin,
          Fmax: $scope.perPage,
          length: val,
          currentPage: $scope.currentPage,
          startData: 0,
          endData: $scope.perPage,
          totalPages: Math.ceil(val / $scope.perPage),
          listPages: Array.apply(null, {
            length: Math.ceil(val / $scope.perPage),
          }).map(Number.call, Number),
        };
      }

      //get th right files depending on selected filetype
      function _responseCallback(result, msg2, type) {
        _initFiles(result);

        $scope.resetFilters(); // AEF: clear filter window

        if ($scope.projectVue === 'all') {
          //my projects view
          _manageGrpFile();
        }
        _initPagination();
        $rootScope.loadingBarStop();
        try {
          datanodesManager.showLoadingIndicator(false);
        } catch (err) {}
      }

      $scope.findFilesByFilters = function (filter) {
        $scope.fileType = filter;
        var fileTypeServer = ManagePrjService.translateExtension($scope.fileType);
        var flag = false;
        $rootScope.loadingBarStart();
        try {
          datanodesManager.showLoadingIndicator(true);
        } catch (err) {}
        if ($scope.projectVue === 'recent') {
          flag = true;
        } else if ($scope.projectVue === 'gallery') {
          fileTypeServer = 'template';
        }
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.GetFileList(fileTypeServer, _responseCallback, flag);
      };

      $scope.findFilesByFilters('xprjson');

      /************************************************************************************/
      /***************************************Top page*************************************/
      /************************************************************************************/

      /*---------- switchFile: swicth views in "my projects" ----------------*/
      $scope.switchFile = function (selected) {
        if (selected === 'My projects') $scope.findFilesByFilters('xprjson');
        else if (selected === 'My pages') $scope.findFilesByFilters('html');
        else if (selected === 'My dataNodes') $scope.findFilesByFilters('xdsjson');
      };

      /*---------- Filters btn: resetFilters ----------------*/
      $scope.resetFilters = function () {
        //AEF: reset filters (keywords value and tags list)
        $scope.filterTagsList = [];
        $scope.allFilesFiltred = angular.copy($scope.allFilesWithNoGrp);
        FilterPrjService.ProjectsFilter($rootScope.ProjectsFilterField.value, $scope);
        _initPagination();
      };

      /*---------- Filters btn: ProjectsFilterByTags ----------------*/
      $scope.ProjectsFilterByTags = function (Str, element) {
        FilterPrjService.ProjectsFilterByTags(Str, element, $scope);
      };

      /*---------- Filters btn: ProjectsFilter ----------------*/
      $scope.ProjectsFilter = function (tmpStr) {
        FilterPrjService.ProjectsFilter(tmpStr, $scope);
      };

      /*---------- sortFiles:Sort btn ----------------*/
      $scope.sortFiles = function () {
        //AEF: sort and reverse cards view
        if (!_.isUndefined($scope.allFilesWithNoGrp[0])) {
          //when no project exist
          //each category in a view is filtered separately
          for (let i = 0; i <= $scope.nbCat - 1; i++) {
            $scope.allFilesFiltred[i].FileList.sort();
            $scope.allFilesFiltred[i].FileList.reverse();
          }
          for (let i = 0; i <= $scope.nbCat - 1; i++) {
            $scope.allFilesWithNoGrp[i].FileList.sort();
            $scope.allFilesWithNoGrp[i].FileList.reverse();
          }
        }
        if (!_.isUndefined($scope.grpFiles[0])) {
          for (let j = 0; j <= $scope.grpFiles.length - 1; j++) {
            $scope.allFilesFiltredGrp[$scope.grpFiles[j]].sort();
            $scope.allFilesFiltredGrp[$scope.grpFiles[j]].reverse();
          }
        }
      };

      /************************************************************************************/
      /*******************************menu in cards  view*********************************/
      /************************************************************************************/

      /*----------  Open project btn ----------------*/
      $scope.openProjectFromServer = function (projectName) {
        ManagePrjService.openProject(projectName, $scope.fileType, $scope.projectVue, _checkReadOnlyCallback);
      };

      function _checkReadOnlyCallback(projectName) {
        /////////// READONLY
        let FileMngrInst = new FileMngrFct();
        FileMngrInst.GetStatus(projectName, 'project', function (msg1, msg2, type) {
          if (type == 'error') {
            let notice = new PNotify({
              title: projectName,
              text: msg1.Msg,
              type: 'error',
              styling: 'bootstrap3',
            });
            $('.ui-pnotify-container').on('click', function () {
              notice.remove();
            });
          } else if (type == 'success') {
            let msg = JSON.parse(msg1.Msg);
            $rootScope.readOnly = msg.OpenedBy.length > 0;
            if ($rootScope.readOnly) {
              let notice = new PNotify({
                title: projectName,
                text: 'This project is read-only!\n' + "It is already opened by\n'" + msg.OpenedBy + "'",
                type: 'warning',
                delay: 4000,
                styling: 'bootstrap3',
              });
              $('.ui-pnotify-container').on('click', function () {
                notice.remove();
              });
            }
          }
        });
        //////////////
        ManagePgSharingService.verifyPageExistence(projectName);
        //////////////
      }

      /*----------  Open template btn ----------------*/
      $scope.openTemplateToNewTab = function (projectName) {
        let templUrl = xDashConfig.urlBase + 'index.html?template=' + escape(projectName);
        var tab = window.open(templUrl, '_blank');
        tab.focus();
      };

      /*----------  Preview btn ----------------*/
      $scope.viewFileFromServer = function (projectName) {
        $rootScope.loadingBarStart();

        var fileTypeServer = ManagePrjService.translateExtension($scope.fileType);
        if ($scope.projectVue === 'gallery') {
          fileTypeServer = 'template';
        }

        if ($scope.fileType === 'xprjson') {
          var FileMngrInst = new FileMngrFct();
          FileMngrInst.ReadFile(fileTypeServer, projectName + '.' + $scope.fileType, function (msg1, msg2, type) {
            //AEF: fix bug add params and test on it
            if (type === 'success') {
              try {
                var xprjson = JSON.parse(msg1);
                htmlExport.previewDashboard(xprjson, projectName, true);
                new PNotify({
                  title: projectName,
                  text: "Project '" + projectName + "' was opended in a new tab",
                  type: 'success',
                  delay: 1800,
                  styling: 'bootstrap3',
                });
                $rootScope.loadingBarStop();
              } catch (err) {
                new PNotify({
                  title: projectName,
                  text: 'Error opening ' + projectName + '. Check browser popup blocker!',
                  type: 'error',
                  delay: 1800,
                  styling: 'bootstrap3',
                });
                $rootScope.loadingBarStop();
                return;
              }
            } else {
              swal(msg1, msg2, type);
            }
          });
        } else if ($scope.fileType === 'html') {
          var FileMngrInst = new FileMngrFct();
          FileMngrInst.GetPage(projectName + '.' + $scope.fileType, function (data) {
            let notice;
            if (data.Success) {
              try {
                //open page with user token
                let msg = data.Msg;
                if (msg.includes('AccessPage.aspx')) {
                  let token = LoginMngr.GetSavedJwt();
                  if (token) {
                    msg = msg + '&token=' + token;
                  }
                }
                //
                var tab = window.open(msg, '_blank');
                tab.focus();
              } catch (exc) {
                notice = new PNotify({
                  title: projectName,
                  text: 'Error opening ' + projectName + '. Check browser popup blocker!',
                  type: 'error',
                  delay: 1800,
                  styling: 'bootstrap3',
                });
                cfpLoadingBar.complete();
              }
            } else {
              notice = new PNotify({
                title: projectName,
                text: "Error downloading page '" + projectName + "'!",
                type: 'error',
                delay: 1800,
                styling: 'bootstrap3',
              });
            }
            $('.ui-pnotify-container').on('click', function () {
              notice.remove();
            });
          });
          $rootScope.loadingBarStop();
        }
      };

      /*----------  Rename prroject btn ----------------*/
      $scope.renameProject = function (fileName, flag, msg) {
        ManagePrjService.renameProject(fileName, flag, msg, $scope.fileType);
      };

      /*----------  duplicate prroject btn ----------------*/
      $scope.duplicateProject = function (projectName) {
        ManagePrjService.duplicateProject(projectName, $scope.fileType);
      };

      /*----------  Get page link btn ----------------*/
      $scope.showPageLink = function (pageName) {
        $scope.showShareLink = true;
        $scope.pageName = pageName;
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.GetThumbnailURL(
          'page',
          pageName + '.html',
          function (msg1, msg2) {
            if (msg1) {
              let scopeShare = angular.element(document.getElementById('share-ctrl')).scope();
              scopeShare.publicHtmlLink = encodeURI(msg2);
              $('#pLink').attr('placeholder', msg2);
            }
          },
          false
        );
      };

      // $scope.getPageLink = function(pageName) {
      //     var FileMngrInst = new FileMngrFct();
      //     return FileMngrInst.GetPageLink(pageName);
      // };

      /*----------  Set page access btn ----------------*/
      $scope.openPageAccess = function (name) {
        ManagePgSharingService.openPageAccess(name);
      };

      /*----------  Share btn / Manage page sharing btn ----------------*/
      $scope.shareProject = function (fileName, fileType) {
        ManagePrjSharingService.shareProject(fileName, fileType);
      };

      /*----------  Export btn ----------------*/
      $scope.downloadFile = function (projectName) {
        ManagePrjService.downloadFile(projectName, $scope.fileType, $scope.projectVue);
      };

      /*----------  Delete btn ----------------*/
      $scope.deleteFileInServer = function (projectName) {
        ManagePrjService.deleteFileInServer(projectName, $scope.fileType);
      };

      /*----------  Infos prroject btn ----------------*/
      $scope.infoProject = function (projectName, origin) {
        if (!_.isUndefined(origin)) $rootScope.info.origin = origin;
        $scope.info.pastName = projectName;
        $scope.info.openProjectInfo = true;
        $scope.info.tmp = angular.copy($rootScope.currentProject);

        $rootScope.currentInfoProject = angular.copy($rootScope.currentProject);

        let bFound = false;
        for (var pro = 0; pro < $scope.allFilesWithNoGrp[0].FileList.length; pro++) {
          if (projectName === $scope.allFilesWithNoGrp[0].FileList[pro].Name) {
            $rootScope.currentInfoProject.name = $scope.allFilesWithNoGrp[0].FileList[pro].Name;
            $rootScope.currentInfoProject.description = $scope.allFilesWithNoGrp[0].FileList[pro].Description;
            $rootScope.currentInfoProject.tags = $scope.allFilesWithNoGrp[0].FileList[pro].Tags;
            $rootScope.currentInfoProject.groupName = $scope.allFilesWithNoGrp[0].FileList[pro].GroupName;
            bFound = true;
            break;
          }
        }
        if (!bFound) {
          //search in groupss
          for (var grpName in $scope.grpFiles) {
            for (var pro = 0; pro < $scope.grpFiles[grpName].length; pro++) {
              if (projectName === $scope.grpFiles[grpName][pro].Name) {
                $rootScope.currentInfoProject.name = $scope.grpFiles[grpName][pro].Name;
                $rootScope.currentInfoProject.description = $scope.grpFiles[grpName][pro].Description;
                $rootScope.currentInfoProject.tags = $scope.grpFiles[grpName][pro].Tags;
                $rootScope.currentInfoProject.groupName = $scope.grpFiles[grpName][pro].GroupName;
                break;
              }
            }
          }
        }
      };

      /*---------- toggleTagDisplay: more tags btn ----------------*/
      $scope.toggleTagDisplay = function (index, origin, grpIndex) {
        if (origin === 'group') {
          //reset
          $rootScope.displayedIndex = -1;
          for (let i = 0; i < $rootScope.displayedIndexG.length; i++) $rootScope.displayedIndexG[i] = -1;
          //
          if (index == $rootScope.displayedIndexG[grpIndex]) $rootScope.displayedIndexG[grpIndex] = -1;
          else $rootScope.displayedIndexG[grpIndex] = index;
        } else {
          //reset
          for (let i = 0; i < $rootScope.displayedIndexG.length; i++) $rootScope.displayedIndexG[i] = -1;
          //
          if (index == $rootScope.displayedIndex) $rootScope.displayedIndex = -1;
          else $rootScope.displayedIndex = index;
        }
      };

      /************************************************************************************/
      /********************************New project btn*************************************/
      /************************************************************************************/

      /*---------- Create new project in cards view ----------------*/
      $scope.newProject = function () {
        let vm = angular.element(document.getElementById('sidebar-ctrl')).scope();
        vm.newProject();
      };
    },
  ]);
