// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ ManagePageSharingService                                                         │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules').service('ManagePageSharingService', [
  '$rootScope',
  function ($rootScope) {
    const self = this;

    /*---------- openPageAccess ----------------*/
    self.openPageAccess = function (name) {
      $rootScope.infoPage = {
        isPrivatePage: $rootScope.securedLink === 'True' ? true : false,
        name: name,
        title: 'HTML page access',
        btnTxt: 'Ok',
        exportPage: false,
        isManagePageOpen: true,
      };
    };

    /*---------- okPage ----------------*/
    self.okPage = function () {
      if ($rootScope.infoPage.exportPage) _savePage();
      else {
        _setPageAccess();
      }
    };

    function _savePage() {
      var txt = htmlExport.createDashboardDocument($rootScope.infoPage.name);
      fileManager.getFileListExtended('page', $rootScope.infoPage.name, txt);
      $rootScope.infoPage.isManagePageOpen = false;
    }

    function _setPageAccess() {
      $rootScope.infoPage.isManagePageOpen = false;
      let name = $rootScope.currentProject.name;
      let FileMngrInst = new FileMngrFct();

      $rootScope.securedLink = $rootScope.infoPage.isPrivatePage ? 'True' : 'False';

      FileMngrInst.SetPageAccess(name + '.html', 'page', $rootScope.securedLink, function (msg, name) {
        let notice = new PNotify({
          title: name,
          text: msg,
          type: 'info',

          styling: 'bootstrap3',
        });
        $('.ui-pnotify-container').on('click', function () {
          notice.remove();
        });
      });
    }

    /*---------- verifyPageExistence ----------------*/
    self.verifyPageExistence = function (projectName) {
      let FileMngrInst2 = new FileMngrFct();
      FileMngrInst2.GetPage(projectName + '.html', function (msg) {
        if (msg.Success) {
          $rootScope.isPageExist = msg.Success;
          self.verifyAccessPage(projectName);
        } else {
          $rootScope.isPageExist = false;
          $rootScope.securedLink = 'False';
          $rootScope.$apply();
        }
      });
    };

    /*---------- verifyAccessPage ----------------*/
    self.verifyAccessPage = function (projectName) {
      let FileMngrInst2 = new FileMngrFct();
      FileMngrInst2.GetStatus(projectName, 'page', function (msg1, msg2, type) {
        if (type == 'success') {
          let msg = JSON.parse(msg1.Msg);
          $rootScope.securedLink = msg.SecuredLink;
          $rootScope.$apply();
        }
      });
    };
  },
]);
