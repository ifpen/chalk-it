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
    const $body = angular.element(document.body); // 1
    const $rootScope = $body.scope().$root;
    const $state = $body.scope().$state; //AEF
    $rootScope.toggleMenuOptionDisplay('cards');
    $state.go('modules.cards.layout', { action: 'myProjects' });
  };

  // TODO refactor with openProjectFromServer in modules.js
  this.openDemoProject = function (demoPrj, callback) {
    const $body = angular.element(document.body); // 1
    const $rootScope = $body.scope().$root;
    const $state = $body.scope().$state; //AEF
    if (!$rootScope.xDashFullVersion) {
      const $scopeDashCtrl = angular.element(document.getElementById('dash-ctrl')).scope();
      $scopeDashCtrl.closeLeftSidePanel();
    }
    $rootScope.loadingBarStart();
    $rootScope.toggleMenuOptionDisplay('none');
    $rootScope.moduleOpened = false;

    if ($rootScope.taipyLink) {
      angular
        .element(document.body)
        .injector()
        .invoke([
          'ManagePrjService',
          (ManagePrjService) => {
            ManagePrjService.openTaipyPage('live-demo-js.xprjson', true, callback);
          },
        ]);
      return;
    }

    $rootScope.origin = 'openProject';
    $state.go('modules', {});
    $rootScope.isLiveDemo = !$rootScope.xDashFullVersion;
    const projectName = demoPrj;
    const FileMngrInst = new FileMngrFct();
    const fileTypeServer = 'template';

    FileMngrInst.ReadFile(fileTypeServer, projectName + '.' + 'xprjson', function (msg1, msg2, type) {
      //AEF: fix bug add params and test on it
      if (type === 'success') {
        xdash.openProjectManager(msg1);
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
