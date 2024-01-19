// ┌─────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_header.controller                                                         │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                         │ \\
// | Licensed under the Apache License, Version 2.0                                      │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Ameur HAMDOUNI, Ghiles HIDEUR    │ \\
// └─────────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.headerbar').controller('DashboardHeaderController', [
  '$scope',
  '$rootScope',
  'AvatarService',
  'LogoutService',
  'NotificationService',
  'ManagePrjService',
  function ($scope, $rootScope, AvatarService, LogoutService, NotificationService, ManagePrjService) {
    $rootScope.listNotifications = [];
    $rootScope.nbNotifications = 0;
    $rootScope.shownNotificationsMax = 100;
    $rootScope.shownNotificationsLength = $rootScope.shownNotificationsMax;

    /*---------- logout ----------------*/
    $scope.logout = function () {
      LogoutService.logout();
    };

    /*---------- openAvatarManager ----------------*/
    $scope.openAvatarManager = function () {
      let avatarCtrl = angular.element(document.getElementById('avatar-ctrl')).scope();
      AvatarService.openAvatarManager(avatarCtrl);
    };

    /*---------- closeProject ----------------*/
    $scope.closeProject = function (name) {
      ManagePrjService.closeProject(name);
    };

    /*---------- clearAllNotifications ----------------*/
    $scope.clearAllNotifications = function (filter) {
      NotificationService.clearAllNotifications(filter);
    };

    /*---------- hideNotificationFromNavBar ----------------*/
    $scope.hideNotificationFromNavBar = function (notification) {
      NotificationService.hideNotificationFromNavBar(notification);
    };

    /*---------- displayDataNodeError ----------*/
    $scope.displayDataNodeError = function (notification) {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
      NotificationService.displayDataNodeError(
        datanodesManager.getDataNodeByName(notification.dataNode),
        scopeDash,
        scopeDashDn
      );
    };
  },
]);
