// ┌───────────────────────────────────────────────────────────────────────────────────┐ \\
// │ NotificationService                                                               │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                       │ \\
// | Licensed under the Apache License, Version 2.0                                    │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                                 │ \\
// └───────────────────────────────────────────────────────────────────────────────────┘ \\

angular
    .module('modules.headerbar')
    .service('NotificationService', ['$rootScope', function ($rootScope) {

        const self = this;

        /*---------- clearAllNotifications ----------------*/
        self.clearAllNotifications = function (filter) {
            $rootScope.listNotifications = [];
            $rootScope.nbNotifications = 0;
            for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
                $rootScope.alldatanodes[i].__notifications = undefined;
            }
        };

        /*---------- hideNotificationFromNavBar ----------------*/
        self.hideNotificationFromNavBar = function (notification) {
            notification.hide = true;
            this.shownNotificationsLength++;
            $rootScope.nbNotifications--;
            let list = datanodesManager.getDataNodeByName(notification.dataNode).__notifications;
            for (let i = 0; i < list.length; i++) {
                if (list[i].time === notification.time) {
                    list[i].hide = true;
                }
            }
            if ($rootScope.nbNotifications === 0) {
                this.clearAllNotifications();
            }

            $rootScope.safeApply();
        };

        /*---------- displayDataNodeError ----------*/
        self.displayDataNodeError = function (dataNode, scopeDash, scopeDashDn) {
            scopeDash.resetPanelStateR();
            scopeDash.editorView.showGraphPanel = false;
            datanodesManager.closeGraph();
            scopeDashDn.openDataNode(dataNode);
        }

    }]);