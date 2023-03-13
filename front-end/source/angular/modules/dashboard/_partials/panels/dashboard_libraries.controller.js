// ┌───────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_libraries.controller                                                │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                                   │ \\
// | Licensed under the Apache License, Version 2.0                                │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR, Abir EL FEKI                              │ \\
// └───────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.dashboard')
    .controller('DashboardLibrariesController', ['$scope', '$rootScope',
        function ($scope, $rootScope) {

            const self = this;

            // ├────────────────────────────────────────────────────────────────────┤ \\
            // |                           Pyodide Libraries                        | \\
            // ├────────────────────────────────────────────────────────────────────┤ \\
            /*--------------listPyodideLibs--------------*/
            const listPyodideLibs = {
                standardLibs: standardAvailablePyodideLibs.sort(),
                micropipLibs: microPipAvailablePyodideLibs.sort()
            }

            /*--------------_initLoadState--------------*/
            function _initLoadState(libList) {
                return {
                    standardLibs: libList.standardLibs.map(name => ({ name, loaded: false })),
                    micropipLibs: libList.micropipLibs.map(name => ({ name, loaded: false }))
                };
            };

            $scope.pyodideLibsObj = _initLoadState(listPyodideLibs);

            /*--------------updateLibsList--------------*/
            $scope.updateLibsList = function () {
                const projectLibs = pyodideManager.getProjectLibs();
                const listLibs = $scope.pyodideLibsObj;
                for (const key in listLibs) {
                    listLibs[key] = listLibs[key].map(lib => ({
                        ...lib,
                        loaded: projectLibs[key].includes(lib.name),
                    }));
                }
                _scrollToTop();
            };

            // ├────────────────────────────────────────────────────────────────────┤ \\
            // |                       Load Pyodide Libraries                       | \\
            // ├────────────────────────────────────────────────────────────────────┤ \\
            /*--------------selectedLibs--------------*/
            $scope.selectedLibs = {};
            $scope.isSelectedLibsEmpty = function (selectedLibs) {
                return !Object.values(selectedLibs).some(selected => selected);
            }

            /*--------------loadPyodideLibs--------------*/
            $scope.loadPyodideLibs = async function () {
                const libsToLoad = {
                    standardLibs: [],
                    micropipLibs: []
                };
                const libTypes = Object.keys(listPyodideLibs);      
                for (const [lib, selected] of Object.entries($scope.selectedLibs)) {
                    if (selected) {
                        const libType = libTypes.find(key => listPyodideLibs[key].includes(lib)) || "Unknown library type";
                        libsToLoad[libType].push(lib);
                    }
                }
                await pyodideManager.loadPyodideLibs(libsToLoad);
                $scope.updateLibsList(); // update display
                $scope.selectedLibs = {};
                $rootScope.updateFlagDirty(true);
            };

            // ├────────────────────────────────────────────────────────────────────┤ \\
            // |                      Reset Pyodide Libraries                       | \\
            // ├────────────────────────────────────────────────────────────────────┤ \\
            /*--------------resetPyodideLibs--------------*/
            $scope.resetPyodideLibs = function () {
                pyodideManager.resetProjectLibs();
                $scope.pyodideLibsObj = _initLoadState(listPyodideLibs);
                $("#inputSearchLib").val("");
                $scope.displayedLibIndex = -1;
                if (!_.isUndefined(self.searchCtrl))
                    self.searchCtrl.searchLib = "";
            };

            // ├────────────────────────────────────────────────────────────────────┤ \\
            // |                         Filters & Display                          | \\
            // ├────────────────────────────────────────────────────────────────────┤ \\
            /*--------------sortByLoadStatus--------------*/
            $scope.sortByLoadStatus = function (lib) {
                return lib.loaded ? -1 : lib.name;
            };

            /*--------------searchLibsDisplay--------------*/
            $scope.searchLibsDisplay = function () {
                self.searchCtrl = this;
                const inputValue = $("#inputSearchLib").val();
                $scope.displayedLibIndex = inputValue ? 0 : -1;
            };

            /*--------------toggleLibsDisplay--------------*/
            $scope.displayedLibIndex = -1;
            $scope.toggleLibsDisplay = function (index) {
                $scope.displayedLibIndex = (index === $scope.displayedLibIndex) ? -1 : index;
            };

            /*--------------clearSearchLib--------------*/
            $scope.clearSearchLib = function () {
                $("#inputSearchLib").val("");
                $scope.displayedLibIndex = -1;
                if (!_.isUndefined(self.searchCtrl))
                    self.searchCtrl.searchLib = "";
            }

            /*--------------scrollToTop--------------*/
            function _scrollToTop() {
                $("#list_micropip, #list_standard").each(function () {
                    this.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "auto",
                    });
                });
            }
        }
    ]);