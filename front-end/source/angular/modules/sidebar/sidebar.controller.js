// ┌──────────────────────────────────────────────────────────────────────┐ \\
// │ sidebar.controller                                                   │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                          │ \\
// | Licensed under the Apache License, Version 2.0                       │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Ghiles HIDEUR     │ \\
// └──────────────────────────────────────────────────────────────────────┘ \\
import _ from 'underscore';

import { fileManager } from 'kernel/general/backend/file-management';
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { DialogBoxForToolboxEdit } from 'kernel/datanodes/gui/DialogBox';
import { singletons } from 'kernel/runtime/xdash-runtime-main';

angular.module('modules.sidebar').controller('SidebarController', [
  '$scope',
  '$rootScope',
  '$state',
  'FilterPrjService',
  'ManagePrjService',
  function ($scope, $rootScope, $state, FilterPrjService, ManagePrjService) {
    /*---------- New project ----------------*/
    $scope.ProjectsFilter = function (tmpStr) {
      const CardsController = angular.element(document.getElementById('cards-ctrl')).scope();
      FilterPrjService.ProjectsFilter(tmpStr, CardsController);
    };

    /*---------- New project ----------------*/
    $scope.newProject = function () {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      const isCurrentPrjDirty = !_.isUndefined($rootScope.currentPrjDirty) && $rootScope.currentPrjDirty !== '';
      const hasCurrentPrjName = $rootScope.currentProject.name !== '';

      if (!$rootScope.xDashFullVersion) {
        if (((isCurrentPrjDirty && !hasCurrentPrjName) || hasCurrentPrjName) && !$rootScope.isLiveDemo) {
          $state.go('modules', {});
          $rootScope.toggleMenuOptionDisplay('none');
        } else {
          _newPrj(scopeDash);
        }
      } else {
        if (isCurrentPrjDirty) {
          swal(
            {
              title: 'Are you sure?',
              text: 'Your current project will be saved and closed before starting a new project.',
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
                  _newPrj(scopeDash);
                };
                //save current project
                fileManager.getFileListExtended('project', $rootScope.currentProject.name, undefined, endAction, true);
              } else {
                //nothing
              }
            }
          );
        } else {
          _newPrj(scopeDash);
        }
      }
    };

    function _newPrj(scopeDash) {
      $state.go('modules', {});
      ManagePrjService.clearForNewProject();
      $rootScope.currentInfoProject = angular.copy($rootScope.currentProject);
      scopeDash.info.tmp = angular.copy($rootScope.currentProject);

      $rootScope.origin = 'newProject';
      $rootScope.toggleMenuOptionDisplay('none');
      scopeDash.info.origin = 'create';
      scopeDash.projectFormSubmitted = false; // reset form
      scopeDash.info.showCheckbox = true;
      $rootScope.readOnly = false;
      if ($rootScope.xDashFullVersion) {
        scopeDash.info.checkboxModelLater = false;
        scopeDash.info.openProjectInfo = true; // open display info
      } else {
        scopeDash.info.checkboxModelLater = true;
        scopeDash.info.openProjectInfo = false; // close display info
        if (!$rootScope.enableLocalServer) {
          const $scopeInfoProject = angular.element(document.getElementById('info-project-ctrl')).scope();
          $scopeInfoProject.saveInfoProject();
        }
      }
    }

    /*---------- Import project ----------------*/
    $scope.uploadFileToServer = function () {
      $rootScope.origin = 'importProject';
      var endAction = function () {
        datanodesManager.showLoadingIndicator(false);
        $rootScope.updateView();
        $rootScope.toggleMenuOptionDisplay('recent');
        $state.go('modules.cards.layout', { action: 'recent' });
      };
      fileManager.dialogBoxFileUpload('project', endAction);
    };

    /*---------- Contact Us ----------------*/
    $scope.openContactUs = function () {
      let templUrl =
        'https://xfiles20210611165922.azurewebsites.net/Pages/ContactUs.aspx' +
        '?token=' +
        sessionStorage.authorizationToken;
      var tab = window.open(templUrl, '_blank');
      tab.focus();
    };

    /**
     * Basic version
     *
     */

    /*---------- Open project from local ----------------*/
    $scope.openFromLocal = function () {
      const FileMngrInst = new FileMngrFct();
      FileMngrInst.GetFileList('project', _responseCallback);
    };

    function _responseCallback(result, msg2, type) {
      const projectList = result.FileList;
      const absolutePath = result.Path;

      const contentElement = document.createElement('div');
      const divContent = document.createElement('div');

      if (projectList.length) {
        divContent.classList.add('list-project');
        for (const project of projectList) {
          const divItemContent = document.createRange().createContextualFragment(`
            <div class="list-project__container ">
              <input type="radio" id="${project.Name}" name="localProject" value="${project.Name}"/>
              <label for="${project.Name}" class="list-project__container__label">${project.Name}</label>
            </div>
          `);
          divContent.appendChild(divItemContent);
        }
        contentElement.innerHTML = divContent.outerHTML;
      }

      new DialogBoxForToolboxEdit(
        contentElement,
        'Select a project from <br>' + absolutePath,
        'OK',
        'Cancel',
        function () {
          const selectedProject = document.querySelector('input[name="localProject"]:checked');
          if (selectedProject) {
            const projectName = selectedProject.value;
            ManagePrjService.openProject(projectName, 'xprjson', '');
          } else {
            // TODO: Display an error message if no project is selected
          }
        }
      );
    }

    /*---------- Import project from local ----------------*/
    $scope.importFromLocal = function () {
      $rootScope.origin = 'openProject';
      $rootScope.toggleMenuOptionDisplay('none');
      $state.go('modules', {});
      singletons.xdash.openFile('project', 'local');
    };
  },
]);
