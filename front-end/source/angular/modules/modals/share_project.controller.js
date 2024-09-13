// ┌─────────────────────────────────────────────────────────────────────────────────┐ \\
// │ share_project.controller                                                        │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                     │ \\
// | Licensed under the Apache License, Version 2.0                                  │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                               │ \\
// └─────────────────────────────────────────────────────────────────────────────────┘ \\
import { modalsModule } from './modals';

modalsModule.controller('ShareProjectController', [
  '$scope',
  '$rootScope',
  'ManagePrjSharingService',
  function ($scope, $rootScope, ManagePrjSharingService) {
    /*---------- closeShareProject ----------------*/
    $scope.closeShareProject = function (flag) {
      ManagePrjSharingService.closeShareProject(flag);
    };

    /*---------- updateTypedEmail ----------------*/
    $scope.updateTypedEmail = function () {
      ManagePrjSharingService.updateTypedEmail();
    };

    /*---------- shareProjectWithEmail ----------------*/
    $scope.shareProjectWithEmail = function () {
      ManagePrjSharingService.shareProjectWithEmail();
    };

    /*---------- unshareProjectWithEmail ----------------*/
    $scope.unshareProjectWithEmail = function () {
      ManagePrjSharingService.unshareProjectWithEmail();
    };
  },
]);
