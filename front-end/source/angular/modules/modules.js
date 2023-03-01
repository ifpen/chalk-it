// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ modules.js                                                                       │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2018-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Abir EL FEKI                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

angular
    .module("modules", [
        "modules.cards",
        "modules.python-images",
        'modules.headerbar',
        'modules.editor',
        'modules.sidebar',

        "modules.discover",
        "modules.training"
    ])
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('modules', {
                    notAuthenticate: true,
                    userAuthenticated: false,
                    abstract: false,
                    resolve: {
                        _settings: ['ApisFactory', '$rootScope', function (ApisFactory, $rootScope) {
                            // if ($rootScope.enableServer) {
                                return ApisFactory.getSettings();
                            // } else {
                            //     return {
                            //         "info": {},
                            //         "settings": {},
                            //         "profile": { "userName": "Guest", "Id": "-1" },
                            //         "help": { "isDiscoverDone": false, "displayHelp": true }
                            //     };
                            }
                        // }
                    ],

                    },
                    url: '?project',
                    templateUrl: 'source/angular/templates/layout/default.html',
                    controller: 'ModulesController'
                });
        }
    ])
    .directive('compile', ['$compile', function ($compile) {
        return function (scope, element, attrs) {
            scope.$watch(
                function (scope) {
                    // watch the 'compile' expression for changes
                    return scope.$eval(attrs.compile);
                },
                function (value) {
                    // when the 'compile' expression changes
                    // assign it into the current DOM
                    element.html(value);

                    // compile the new DOM and link it to the current
                    // scope.
                    // NOTE: we only compile .childNodes so that
                    // we don't get into infinite loop compiling ourselves
                    $compile(element.contents())(scope);
                }
            );
        };
    }])
    .directive("ngUploadChange", function () {
        return {
            scope: {
                ngUploadChange: "&"
            },
            link: function ($scope, $element, $attrs) {
                $element.on("change", function (event) {
                    $scope.$apply(function () {
                        $scope.ngUploadChange({ $event: event });
                    });
                });
                $scope.$on("$destroy", function () {
                    $element.off();
                });
            }
        };
    });
    