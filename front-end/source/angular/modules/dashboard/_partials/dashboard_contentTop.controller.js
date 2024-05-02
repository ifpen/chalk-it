// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_contentTop.controller                                                      │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                          │ \\
// | Licensed under the Apache License, Version 2.0                                       │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI, Ghiles HIDEUR                     │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.dashboard').controller('DashboardContentTopController', [
  '$scope',
  '$rootScope',
  '$uibModal',
  'ManagePrjService',
  'ManagePrjSharingService',
  'ManagePageSharingService',
  'EditPlaySwitchService',
  function (
    $scope,
    $rootScope,
    $uibModal,
    ManagePrjService,
    ManagePrjSharingService,
    ManagePgSharingService,
    EditPlaySwitchService
  ) {
    /***********************************************************************************/
    /*******************dashboard_contentTop: menu under project name*******************/
    /***********************************************************************************/

    /*---------- Settings button ----------------*/
    $scope.exportSettings = function () {
      const modalInstance = $uibModal.open({
        templateUrl: 'source/angular/modules/dashboard/_partials/modals/exportDownloadPage.html',
        controller: 'exportSettingDownload',
        scope: $scope,
        resolve: {
          options: function () {
            return 'exportSettings';
          },
        },
      });

      modalInstance.result.then(
        function (resultFromModal) {
          htmlExport.exportOptions = resultFromModal.scalingMethod;
        },
        function () {
          console.info('Modal dismissed at: ' + new Date());
        }
      );
    };

    /*---------- Rename button   ----------------*/
    $scope.renameProject = function (fileName, flag, msg) {
      ManagePrjService.renameProject(fileName, flag, msg, 'xprjson');
    };

    /*---------- Share button   ----------------*/
    $scope.shareProject = function (fileName, fileType) {
      ManagePrjSharingService.shareProject(fileName, fileType);
    };

    /*---------- Duplicate button   ----------------*/
    $scope.duplicateProject = function (projectName) {
      ManagePrjService.duplicateProject(projectName, 'xprjson');
    };

    /*---------- Export button   ----------------*/
    $scope.exportProjectToLocal = function () {
      const xdashFileSerialized = xdash.serialize();
      const fileName = $('#projectName').val() || 'Untitled';
      saveAs(
        new Blob([JSON.stringify(xdashFileSerialized, null, '\t')], { type: 'application/octet-stream' }),
        fileName + '.xprjson'
      );
    };

    /*---------- Delete button   ----------------*/
    $scope.deleteFileInServer = function (projectName) {
      ManagePrjService.deleteFileInServer(projectName, 'xprjson');
    };

    /*---------- Infos button    ----------------*/
    $scope.infoProject = function (projectName) {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

      scopeDash.info.pastName = projectName;
      scopeDash.info.openProjectInfo = true;
      $rootScope.info.origin = 'editor';
      scopeDash.info.title = 'Project info';
      scopeDash.info.tmp = angular.copy($rootScope.currentProject);
      scopeDash.info.showCheckbox = false;
      $rootScope.currentInfoProject = angular.copy($rootScope.currentProject);

      // Need to display the current project name
      if (!$rootScope.xDashFullVersion) {
        $rootScope.currentInfoProject.name = $('#projectName').val();
      }
    };

    /**********************************************************************/
    /*******************dashboard_contentTop: Edit mode********************/
    /**********************************************************************/

    /*---------- Save button ----------------*/
    $scope.saveProjectInServer = function () {
      const is_defaultOverwrite = true;
      const name = $rootScope.currentProject.name;
      if (name != 'Untitled') fileManager.saveOnServer('project', name, undefined, is_defaultOverwrite);
      else $scope.renameProject(name);
    };

    /**
     * For opensource version
     * Saves current project to local storage.
     * @name saveProjectToLocal
     * @memberof $scope
     */
    $scope.saveProjectToLocal = function () {
      ManagePrjService.saveProjectToLocal();
    };

    /**
     * For opensource version
     * Watches for changes in the value of the #projectName element.
     * When the value changes, it checks if the new value is different from the old value.
     * If so, it updates the $rootScope.currentPrjDirty property to indicate the project is dirty (has unsaved changes).
     */
    $scope.$watch(
      function () {
        return $('#projectName').val();
      },
      function (newName) {
        if (!_.isUndefined($rootScope.currentProject)) {
          const oldName = $rootScope.currentProject.name;
          if (oldName !== undefined && newName !== oldName) {
            $rootScope.currentPrjDirty = ' *';
          }
        }
      }
    );

    /**
     * Watches for changes in the `currentPrjDirty` property on the root scope
     * and triggers local project saving when the property's value becomes ' *'.
     */
    $scope.$watch(
      () => $rootScope.currentPrjDirty,
      (value) => {
        if (value == ' *' && $rootScope.autoSave) ManagePrjService.saveProjectToLocal(undefined, true);
      }
    );

    /**********************************************************************/
    /*******************dashboard_contentTop: Edit mode********************/
    /**********************************************************************/

    /*---------- Switch button    ----------------*/
    $scope.onEditPlaySwitch = function () {
      EditPlaySwitchService.onEditPlaySwitch();
    };

    /*********************************************************************/
    /*******************dashboard_contentTop: View mode*******************/
    /*********************************************************************/

    /*---------- Deploy button --> Dashboard ----------------*/
    $scope.showForm = function () {
      htmlExport.saveDashboard();
    };

    /*---------- Export button -------------------*/
    $scope.exportHTMLPage = function (projectName) {
      const _projectName = $rootScope.xDashFullVersion ? projectName : $('#projectName').val() || 'Untitled';
      const txt = htmlExport.createDashboardDocument(_projectName);
      const blob = new Blob([txt], { type: 'text/html;charset=utf-8' });
      saveAs(blob, _projectName + '.html');
    };

    /*---------- Preview button   ----------------*/
    $scope.previewDashboard = function () {
      htmlExport.previewDashboardCallback();
    };

    /*--------------- Share button  -----------------*/
    /*---------- verifyPageExistence ----------------*/
    $scope.verifyPageExistence = function (projectName) {
      ManagePgSharingService.verifyPageExistence(projectName);
    };

    /*---------- verifyAccessPage ----------------*/
    $scope.verifyAccessPage = function (projectName) {
      ManagePgSharingService.verifyAccessPage(projectName);
    };

    /*---------- Share button --> Get page link ----------------*/
    $scope.showPageLink = function (pageName) {
      const FileMngrIn = new FileMngrFct();
      FileMngrIn.GetPage(pageName + '.html', function (msg) {
        if (msg.Success) {
          const encodedUri = encodeURI(msg.Msg);
          swal(
            {
              title: 'HTML page link',
              text: pageName + '.html',
              type: 'input',
              closeOnConfirm: true,
              showCopyButton: true,
              inputValue: encodedUri,
            },
            function (inputValue) {}
          );
        }
      });
    };

    /*---------- Share button --> Set page access ----------------*/
    $scope.openPageAccess = function (name) {
      ManagePgSharingService.openPageAccess(name);
    };

    /*---------- Share button --> Manage sharing ----------------*/
    // see $scope.shareProject(fileName, fileType)
  },
]);
