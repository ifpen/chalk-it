// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ navigationHelperClass                                              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function navigationHelperClass() {
  this.gotoMyProjects = function () {
    var $body = angular.element(document.body); // 1
    var $rootScope = $body.scope().$root;
    var $state = $body.scope().$state; //AEF
    $rootScope.toggleMenuOptionDisplay('cards');
    $state.go('modules.cards.layout', { action: 'myProjects' });
  };

  // TODO refactor with openProjectFromServer in modules.js
  this.openDemoProject = function (demoPrj, callback) {
    var projectName = demoPrj;
    var $body = angular.element(document.body); // 1
    var $rootScope = $body.scope().$root;
    var $state = $body.scope().$state; //AEF
    $rootScope.origin = 'openProject';
    $rootScope.loadingBarStart();
    $rootScope.toggleMenuOptionDisplay('none');
    $state.go('modules', {});
    $rootScope.isLiveDemo = false;
    if (!$rootScope.xDashFullVersion) {
      const $scopeDashCtrl = angular.element(document.getElementById('dash-ctrl')).scope();
      $scopeDashCtrl.closeLeftSidePanel();
      $rootScope.isLiveDemo = true;
    }

    $rootScope.moduleOpened = false;
    var FileMngrInst = new FileMngrFct();

    var fileTypeServer = 'template';

    FileMngrInst.ReadFile(fileTypeServer, projectName + '.' + 'xprjson', async function (msg1, msg2, type) {
      //AEF: fix bug add params and test on it
      if (type === 'success') {
        await xdash.openProjectManager(msg1);
        $rootScope.loadingBarStop();
        $rootScope.currentProject.name = projectName;
        if (_.isFunction(callback)) callback();
        $rootScope.origin = 'projectEdition';
      } else {
        swal(msg1, msg2, type);
      }
    });
  };
}

var navHelper = new navigationHelperClass();
