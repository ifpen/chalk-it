// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xdash-load-runtime                                                 │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Abir EL FEKI, Mongi BEN GAID  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var angularModule = angular.module("xCLOUD", [
    "angularjs-gauge",
    "rzSlider",
    "720kb.datepicker",
    "ui.router.state",
    "modules.python-images",
]);

angularModule.run([
    "$rootScope",
    function ($rootScope) {
        $rootScope.urlBase = urlBase;
        $rootScope.navBarNotification = navBarNotification === "true"; //AEF: visible if show notifications is checked
        $rootScope.showNavBar = showNavBar === "true"; // MBG 03/05/2021 : for rowToPage and rowToTab modes
        $rootScope.loadingBarStart = function (fn) { };
        $rootScope.loadingBarStop = function (fn) { };
        $rootScope.notificationFilterDataValue = "";
        $rootScope.listNotifications = [];
        $rootScope.nbNotifications = 0;
        $rootScope.pageNumber = 1; // MBG pagination mode
        $rootScope.totalPages = 1; // MBG pagination mode
        $rootScope.pageNames = []; // GHI #245

        $rootScope.clearAllNotifications = function (filter) {
            $rootScope.listNotifications = [];
            $rootScope.nbNotifications = 0;
            for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
                $rootScope.alldatanodes[i].__notifications = undefined;
            }
        };

        $rootScope.safeApply = function (fn) {
            var scopePhase = $rootScope.$root.$$phase;
            if (scopePhase == "$apply" || scopePhase == "$digest") {
            } else {
                $rootScope.$apply();
            }
        };
    },
]);
