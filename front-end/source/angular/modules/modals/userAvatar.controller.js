// ┌────────────────────────────────────────────────────────────────────────────┐ \\
// │ userAvatar.controller                                                      │ \\
// ├────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                │ \\
// | Licensed under the Apache License, Version 2.0                             │ \\
// ├────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                          │ \\
// └────────────────────────────────────────────────────────────────────────────┘ \\

import userAvatarTemplate from './userAvatar.html';
import { modalsModule } from './modals';

modalsModule.controller('UserAvatarController', [
  '$scope',
  'AvatarService',
  function ($scope, AvatarService) {
    $scope.openUserAvatar = false;
    $scope.userAvatar = {
      text: '',
    };

    /*---------- closeAvatarManager ----------------*/
    $scope.closeAvatarManager = function () {
      let avatarCtrl = angular.element(document.getElementById('avatar-ctrl')).scope();
      AvatarService.closeAvatarManager(avatarCtrl);
    };

    /*---------- selectAvatar ----------------*/
    $scope.selectAvatar = function () {
      AvatarService.selectAvatar();
    };

    /*---------- updateSelectedAvatar ----------------*/
    $scope.updateSelectedAvatar = function ($event) {
      let avatarCtrl = angular.element(document.getElementById('avatar-ctrl')).scope();
      AvatarService.updateSelectedAvatar($event, avatarCtrl);
    };

    /*---------- sendAvatar ----------------*/
    $scope.sendAvatar = function () {
      let avatarCtrl = angular.element(document.getElementById('avatar-ctrl')).scope();
      AvatarService.sendAvatar(avatarCtrl);
    };

    /*---------- deleteAvatar ----------------*/
    $scope.deleteAvatar = function () {
      AvatarService.deleteAvatar();
    };
  },
]);
