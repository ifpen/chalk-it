// ┌──────────────────────────────────────────────────────────────────────┐ \\
// │ sidebar.controller                                                   │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                          │ \\
// | Licensed under the Apache License, Version 2.0                       │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Ghiles HIDEUR     │ \\
// └──────────────────────────────────────────────────────────────────────┘ \\

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
      if ($rootScope.taipyLink) {
        taipyManager.getFileList();
        taipyManager.endAction = _responseCallback;
      } else {
        const FileMngrInst = new FileMngrFct();
        FileMngrInst.GetFileList('project', _responseCallback);
      }
    };

    function _responseCallback(result, msg2, type) {
      const isTaipyLink = $rootScope.taipyLink;
      const fileList = isTaipyLink ? result.file_names : result.FileList;
      const absolutePath = isTaipyLink ? result.base_path : result.Path;

      const contentElement = document.createElement('div');
      const divContent = document.createElement('div');

      if (fileList.length) {
        divContent.classList.add('list-project');
        for (const file of fileList) {
          const fileName = isTaipyLink ? file : file.Name;
          const projectName = isTaipyLink ? file.replace('.xprjson', '') : file.Name;
          const divItemContent = document.createRange().createContextualFragment(`
            <div class="list-project__container ">
              <input type="radio" id="${fileName}" name="localProject" value="${fileName}"/>
              <label for="${fileName}" class="list-project__container__label">${projectName}</label>
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
            const fileName = selectedProject.value;
            const $rootScope = angular.element(document.body).scope().$root;
            if ($rootScope.taipyLink) {
              ManagePrjService.openTaipyPage(fileName);
            } else {
              ManagePrjService.openProject(fileName, 'xprjson', '');
            }
          }
        }
      );
    }

    /*---------- Import project from local ----------------*/
    $scope.importFromLocal = function () {
      $rootScope.origin = 'openProject';
      $rootScope.toggleMenuOptionDisplay('none');
      $state.go('modules', {});
      xdash.openFile('project', 'local');
    };

    /*---------- Open Taipy Designer documentation ----------------*/
    $scope.openDoc = function () {
      const docURL = xDashConfig.urlDoc;
      const tab = window.open(docURL, '_blank');
      tab.focus();
    };

    /*---------- start Taipy project ----------------*/
    $scope.startTaipyProject = function () {
      ManagePrjService.clearForNewProject();
      $rootScope.origin = 'newProject';
      taipyManager.endAction = () => {
        ManagePrjService.openTaipyPage(taipyManager.xprjsonFileName);
      };
      taipyManager.initTaipyApp();
    };
  },
]);
