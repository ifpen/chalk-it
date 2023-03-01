// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_wdgtLibs.controller                                                        │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                          │ \\
// | Licensed under the Apache License, Version 2.0                                       │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                                    │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.dashboard')
    .controller('DashboardWdgtLibsController', ['$scope', '$rootScope', '$state',
        function($scope, $rootScope, $state) {



            //toggle window of widget lib 
            $scope.displayedWdgtIndex = 0;
            $scope.toggleWidgetLibDisplay = function(index) {
                if (index == $scope.displayedWdgtIndex)
                    $scope.displayedWdgtIndex = -1;
                else
                    $scope.displayedWdgtIndex = index;
            };




        }
    ]);