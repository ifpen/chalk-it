// ┌──────────────────────────────────────────────────────────────────────────────┐ \\
// │ headerbar.controller                                                         │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                  │ \\
// | Licensed under the Apache License, Version 2.0                               │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                            │ \\
// └──────────────────────────────────────────────────────────────────────────────┘ \\
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import _ from 'lodash';
import PNotify from 'pnotify';

angular
    .module('modules.headerbar')
    .controller('HeaderbarController', ['$scope', '$rootScope', 'AvatarService', 'LogoutService', 'ManagePrjService',
        function($scope, $rootScope, AvatarService, LogoutService, ManagePrjService) {

            /*---------- logout ----------------*/
            $scope.logout = function() {
                LogoutService.logout();
            };

            /*---------- openAvatarManager ----------------*/
            $scope.openAvatarManager = function() {
                let avatarCtrl = angular.element(document.getElementById('avatar-ctrl')).scope();
                AvatarService.openAvatarManager(avatarCtrl);
            };

            /*---------- closeProject ----------------*/
            $scope.closeProject = function(name, forceClose) {
                ManagePrjService.closeProject(name, forceClose);
            };

            /*---------- maintenance info ----------------*/
            $scope.isMaintenanceInfo = false;

            if ($rootScope.xDashFullVersion) {
                let FileMngrInst = new FileMngrFct();
                FileMngrInst.GetMaintenanceInfo(function(msg1, msg2, type) {
                    let notice;
                    if (type == "error") {
                        notice = new PNotify({
                            title: "Maintenance info",
                            text: msg1,
                            type: "error",
                            styling: "bootstrap3",
                        });
                    } else if (type === "success") {
                        if (msg1.Msg !== "") {
                            $scope.isMaintenanceInfo = true;
                            $scope.msgMaintenanceInfo = msg1.Msg;
                            if (_.isUndefined($scope.pastMsgMaintenanceInfo) || $scope.pastMsgMaintenanceInfo.localeCompare($rootScope.msgMaintenanceInfo)) {
                                notice = new PNotify({
                                    title: "Maintenance info",
                                    text: msg1.Msg,
                                    type: "info",
                                    styling: "bootstrap3",
                                });
                            }
                            $scope.pastMsgMaintenanceInfo = $scope.msgMaintenanceInfo;
                        }
                    }
                    $('.ui-pnotify-container').on('click', function() {
                        notice.remove();
                    });
                });
            }
        }
    ]);