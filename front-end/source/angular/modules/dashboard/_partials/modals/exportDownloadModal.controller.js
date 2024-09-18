import { htmlExport } from 'kernel/general/export/html-export';
import { editorSingletons } from 'kernel/editor-singletons';

angular.module('modules').controller('exportSettingDownload', [
  '$uibModalInstance',
  '$rootScope',
  '$scope',
  'options',
  function ($uibModalInstance, $rootScope, $scope, options) {
    $scope.optionsModal = options;
    $scope.form = {};

    $scope.keepChoice = true;
    $scope.status = htmlExport.navBarNotification; // AEF: changed to keep last choice of notification

    const layoutMgr = editorSingletons.layoutMgr;
    $scope.scalingMethod = htmlExport.exportOptions;
    $scope.nbRows = layoutMgr.getRows();
    $scope.pageNamesObj = layoutMgr.getRowNamesObj();
    $scope.defaultPageID = layoutMgr.getDefaultRowID();

    $scope.changeStatus = function () {
      $scope.status = !$scope.status;
    };

    $scope.submitForm = function () {
      if ($scope.form.userForm.$valid) {
        htmlExport.exportOptions = $scope.scalingMethod;
        htmlExport.navBarNotification = $scope.status;

        if (htmlExport.exportOptions === 'customNavigation') {
          const rowName = $('#select-default-page').find(':selected').text();
          const rowNumber = $('#select-default-page').find(':selected').val();
          layoutMgr.setDefaultRow({
            id: rowNumber,
            name: rowName,
          });
        }

        $rootScope.updateFlagDirty(true);

        $uibModalInstance.close({
          notification: $scope.status,
          scalingMethod: $scope.scalingMethod,
        });
      } else {
        $uibModalInstance.dismiss('cancel');
      }
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  },
]);
