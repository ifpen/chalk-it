import { PAGE_MODE_PAGES, PAGE_MODE_TABS, PAGE_MODE_CUSTOM } from 'kernel/general/export/html-export';
import { editorSingletons } from 'kernel/editor-singletons';

angular.module('modules').controller('exportSettingDownload', [
  '$uibModalInstance',
  '$scope',
  'options',
  function ($uibModalInstance, $scope, options) {
    const exportCtrl = this;
    exportCtrl.pageModePages = PAGE_MODE_PAGES;
    exportCtrl.pageModeTabs = PAGE_MODE_TABS;
    exportCtrl.pageModeCustom = PAGE_MODE_CUSTOM;

    exportCtrl.optionsModal = options;
    exportCtrl.form = {};

    exportCtrl.pageMode = options.pageMode;
    exportCtrl.initialPageIndex = options.initialPageIndex;
    exportCtrl.navBarNotification = options.navBarNotification ?? false;

    exportCtrl.pageNames = [...editorSingletons.widgetEditor.widgetContainer.pageNames];

    if (exportCtrl.pageNames.length) {
      exportCtrl.pageMode ??= PAGE_MODE_PAGES;
      exportCtrl.initialPageIndex ??= 0;
      if (exportCtrl.initialPageIndex >= exportCtrl.pageNames.length) {
        exportCtrl.initialPageIndex = exportCtrl.initialPageIndex.length - 1;
      }
    } else {
      exportCtrl.pageMode = undefined;
      exportCtrl.initialPageIndex = undefined;
    }

    exportCtrl.submitForm = function () {
      if (exportCtrl.form.userForm.$valid) {
        $uibModalInstance.close({
          pageMode: exportCtrl.pageMode,
          initialPageIndex: exportCtrl.initialPageIndex,
          navBarNotification: exportCtrl.navBarNotification,
        });
      } else {
        $uibModalInstance.dismiss('invalid');
      }
    };

    exportCtrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
  },
]);
