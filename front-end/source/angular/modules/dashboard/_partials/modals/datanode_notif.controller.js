// ┌─────────────────────────────────────────────────────────────────────────────────┐ \\
// │ datanode_notif.controller                                                       │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                     │ \\
// | Licensed under the Apache License, Version 2.0                                  │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                               │ \\
// └─────────────────────────────────────────────────────────────────────────────────┘ \\

angular
    .module('modules.dashboard')
    .controller('DatanodeNotifController', ['$scope', '$rootScope', 'JsonDisplayService',
        function($scope, $rootScope, JsonDisplayService) {

            $scope.notificationFilerValue = "all";
            $scope.showOneDatanodeData = {};

            /*---------- Notification filter button ----------------*/
            $scope.notificationFilters = function(filter) {
                $scope.notificationFilerValue = filter;
            };

            /*---------- json result display ----------------*/
            $scope.beautifulStringFromHtml = function(data) {
                return JsonDisplayService.beautifulStringFromHtml(data);
            };

        }
    ]);