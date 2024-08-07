// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ manage_page_share.controller                                                     │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\
import { modalsModule } from './modals';

modalsModule.controller('ManagePageShareController', [
  '$scope',
  '$rootScope',
  'ManagePageSharingService',
  function ($scope, $rootScope, ManagePgSharingService) {
    /*********************************************************************/
    /*******************dashboard_contentTop: View mode*******************/
    /*********************************************************************/
    /*-------- Export button --> Dashboard --> ok btn -------*/
    $scope.okPage = function () {
      ManagePgSharingService.okPage();
    };
  },
]);
