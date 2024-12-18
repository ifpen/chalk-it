// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_contentTop.controller                                                      │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                          │ \\
// | Licensed under the Apache License, Version 2.0                                       │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI, Ghiles HIDEUR                     │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import _ from 'lodash';
import template from 'angular/modules/dashboard/_partials/modals/exportDownloadPage.html';
import { fileManager } from 'kernel/general/backend/file-management';
import { htmlExport } from 'kernel/general/export/html-export';
import { runtimeSingletons } from 'kernel/runtime-singletons';
import { saveAs } from 'file-saver';

angular.module('modules.dashboard').controller('DashboardContentTopController', [
  '$scope',
  '$rootScope',
  '$uibModal',
  'ManagePrjService',
  'ManagePrjSharingService',
  'ManagePageSharingService',
  function ($scope, $rootScope, $uibModal, ManagePrjService, ManagePrjSharingService, ManagePgSharingService) {
    /***********************************************************************************/
    /*******************dashboard_contentTop: menu under project name*******************/
    /***********************************************************************************/

    /*---------- Settings button ----------------*/
    $scope.exportSettings = function () {
      const modalInstance = $uibModal.open({
        template,
        controller: 'exportSettingDownload',
        controllerAs: 'exportCtrl',
        resolve: {
          options: function () {
            return {
              pageMode: htmlExport.pageMode,
              initialPageIndex: htmlExport.initialPage,
              navBarNotification: htmlExport.navBarNotification,
            };
          },
        },
      });

      modalInstance.result.then(
        function (resultFromModal) {
          htmlExport.pageMode = resultFromModal.pageMode;
          htmlExport.initialPage = resultFromModal.initialPageIndex;
          htmlExport.navBarNotification = resultFromModal.navBarNotification;

          $rootScope.updateFlagDirty(true);
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
      const xdashFileSerialized = runtimeSingletons.xdash.serialize();
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

    /*********************************************************************/
    /*******************dashboard_contentTop: View mode*******************/
    /*********************************************************************/

    /*---------- Deploy button --> Dashboard ----------------*/
    $scope.showForm = function () {
      htmlExport.saveDashboard();
    };

    /*---------- Export button -------------------*/
    $scope.exportHTMLPage = async function (projectName) {
      const _projectName = $rootScope.xDashFullVersion ? projectName : $('#projectName').val() || 'Untitled';
      const txt = await htmlExport.createDashboardDocument(_projectName);
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
