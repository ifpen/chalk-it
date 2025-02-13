// ┌──────────────────────────────────────────────────────────────────────┐ \\
// │ sidebar.controller                                                   │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                          │ \\
// | Licensed under the Apache License, Version 2.0                       │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Ghiles HIDEUR     │ \\
// └──────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';

import { fileManager } from 'kernel/general/backend/file-management';
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { DialogBoxForToolboxEdit } from 'kernel/datanodes/gui/DialogBox';
import { runtimeSingletons } from 'kernel/runtime-singletons';
import { editorSingletons } from 'kernel/editor-singletons';

import {
  EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED,
} from 'angular/modules/editor/editor.events';

angular.module('modules.sidebar').controller('SidebarController', [
  '$scope',
  '$rootScope',
  '$state',
  'FilterPrjService',
  'ManagePrjService',
  '$timeout',
  function ($scope, $rootScope, $state, FilterPrjService, ManagePrjService, $timeout) {
    /*---------- New project ----------------*/
    $scope.ProjectsFilter = function (tmpStr) {
      const CardsController = angular.element(document.getElementById('cards-ctrl')).scope();
      FilterPrjService.ProjectsFilter(tmpStr, CardsController);
    };

    /*---------- New project ----------------*/
    $scope.newProject = function () {
      const isCurrentPrjDirty = !!$rootScope.currentPrjDirty;
      const hasCurrentPrjName = !!$rootScope.currentProject.name;

      if (!$rootScope.xDashFullVersion) {
        if (((isCurrentPrjDirty && !hasCurrentPrjName) || hasCurrentPrjName) && !$rootScope.isLiveDemo) {
          $state.go('modules', {});
          $rootScope.toggleMenuOptionDisplay('none');
        } else {
          _newPrj();
        }
      } else if (isCurrentPrjDirty) {
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
                _newPrj();
              };
              //save current project
              fileManager.getFileListExtended('project', $rootScope.currentProject.name, undefined, endAction, true);
            }
          }
        );
      } else {
        _newPrj();
      }
    };

    function _newPrj() {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      $state.go('modules', {}).then(function () {
        $timeout(function () {
          let canvasSize = editorSingletons.widgetEditor.widgetEditorViewer.getMaximalFitCanvasSize();
          editorSingletons.widgetEditor.widgetEditorViewer.setSize(canvasSize.width, canvasSize.height);
          angular
          .element(document.body)
          .injector()
          .invoke([
            'EventCenterService',
            (eventCenterService) => {
              eventCenterService.sendEvent(EVENTS_EDITOR_DASHBOARD_ASPECT_CHANGED);
            },
          ]);
        }, 0);
      });
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
      const endAction = function () {
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
      const tab = window.open(templUrl, '_blank');
      tab.focus();
    };

    /*******************************************************/
    /****************** Opensource version *****************/
    /*******************************************************/

    /*---------- Open project from local ----------------*/
    $scope.openFromLocal = function () {
      const FileMngrInst = new FileMngrFct();
      FileMngrInst.GetFileList('project', _responseCallback);
    };

    function _responseCallback(result, msg2, type) {
      const fileList = result.FileList;
      const absolutePath = result.Path;

      const contentElement = document.createElement('div');
      const divContent = document.createElement('div');

      if (fileList.length) {
        divContent.classList.add('list-project');
        for (const file of fileList) {
          const divItemContent = document.createRange().createContextualFragment(`
            <div class="list-project__container ">
              <input type="radio" id="${file.Name}" name="localProject" value="${file.Name}"/>
              <label for="${file.Name}" class="list-project__container__label">${file.Name}</label>
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
          }
        }
      );
    }

    /*---------- Import project from local ----------------*/
    $scope.importFromLocal = function () {
      $rootScope.origin = 'openProject';
      $rootScope.toggleMenuOptionDisplay('none');
      $state.go('modules', {});
      runtimeSingletons.xdash.openFile('project', 'local');
    };
  },
]);
