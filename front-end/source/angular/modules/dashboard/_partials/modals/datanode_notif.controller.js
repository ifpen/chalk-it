// ┌─────────────────────────────────────────────────────────────────────────────────┐ \\
// │ datanode_notif.controller                                                       │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                     │ \\
// | Licensed under the Apache License, Version 2.0                                  │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                               │ \\
// └─────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.dashboard').controller('DatanodeNotifController', [
  '$scope',
  function ($scope) {
    $scope.notificationFilerValue = 'all';
    $scope.showOneDatanodeData = {};

    $scope.$watch('popup.data', (data) => ($scope.showOneDatanodeData = data));

    /*---------- Notification filter button ----------------*/
    $scope.notificationFilters = function (filter) {
      $scope.notificationFilerValue = filter;
    };
  },
]);
