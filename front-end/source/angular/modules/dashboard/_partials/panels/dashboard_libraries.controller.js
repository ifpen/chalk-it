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
        function($scope, $rootScope) {

            const self = this;

            // ├────────────────────────────────────────────────────────────────────┤ \\
            // |                           Pyodide Libraries                        | \\
            // ├────────────────────────────────────────────────────────────────────┤ \\
            /*--------------listPyodideLibs--------------*/
            const listPyodideLibs = {
                standardLibs: standardAvailablePyodideLibs.sort(),
                micropipLibs: microPipAvailablePyodideLibs.sort()
            }

            /*--------------addLoadState--------------*/
            self.initLoadState = function(listLibs) {
                const loadedLibs = { 
                    standardLibs: [], 
                    micropipLibs: [] 
                };
                for (const key in listLibs) {
                    listLibs[key].forEach(lib => {
                        loadedLibs[key].push({
                            name: lib,
                            loaded: false
                        });
                    });
                }
                return loadedLibs;
            };

            $scope.pyodideLibsObj = self.initLoadState(listPyodideLibs);

            /*--------------updateLibsList--------------*/
            $scope.updateLibsList = function() {
                const projectLibs = pyodideManager.getProjectLibs();
                const listLibs = $scope.pyodideLibsObj;
                for (const key in listLibs) {
                    listLibs[key].forEach((lib, index) => {
                        if (projectLibs[key].indexOf(lib.name) !== -1) {
                            lib.loaded = true;
                        } else {
                            lib.loaded = false;
                        }
                    });
                }
                self.scrollToTop();
            };

            // ├────────────────────────────────────────────────────────────────────┤ \\
            // |                       Load Pyodide Libraries                       | \\
            // ├────────────────────────────────────────────────────────────────────┤ \\
            /*--------------selectedLibs--------------*/
            $scope.selectedLibs = {};
            $scope.isSelectedLibsEmpty = function(selectedLibs) {
                let result = true;
                angular.forEach(selectedLibs, (selected, lib) => {
                    if (selected)
                        result = false;
                });
                return result;
             }
            
            /*--------------loadPyodideLibs--------------*/
            $scope.loadPyodideLibs = async function() {
                const libsToLoad = { 
                    standardLibs: [], 
                    micropipLibs: [] 
                };
                angular.forEach($scope.selectedLibs, (selected, lib) => {
                    const libraryType = $("#" + lib + "_lib").attr("name");
                    switch (libraryType) {
                        case "standard": libsToLoad.standardLibs.push(lib); break;
                        case "micropip": libsToLoad.micropipLibs.push(lib); break;
                        default: break;
                    }
                });
                await pyodideManager.loadPyodideLibs(libsToLoad);
                $scope.updateLibsList(); // update display
                $scope.selectedLibs = {};
                $rootScope.updateFlagDirty(true);
            };

            // ├────────────────────────────────────────────────────────────────────┤ \\
            // |                      Reset Pyodide Libraries                       | \\
            // ├────────────────────────────────────────────────────────────────────┤ \\
            /*--------------resetPyodideLibs--------------*/
            $rootScope.resetPyodideLibs = function() {
                pyodideManager.resetProjectLibs();
                $scope.pyodideLibsObj = self.initLoadState(listPyodideLibs);
                $("#inputSearchLib").val("");
                $scope.displayedLibIndex = -1;
                if (!_.isUndefined(self.searchCtrl))
                    self.searchCtrl.searchLib = "";
            };
            // ├────────────────────────────────────────────────────────────────────┤ \\
            // |                         Filters & Display                          | \\
            // ├────────────────────────────────────────────────────────────────────┤ \\
            /*--------------sortByLoadStatus--------------*/
            $scope.sortByLoadStatus = function(lib) {
                if (lib.loaded)
                    return -1;
                return lib.name;
            };
            /*--------------searchLibsDisplay--------------*/
            $scope.searchLibsDisplay = function() {
                self.searchCtrl = this;
                const value = $("#inputSearchLib").val();
                if (!value) {
                    $scope.displayedLibIndex = -1;
                } else {
                    $scope.displayedLibIndex = 0;
                }
            };
            /*--------------toggleLibsDisplay--------------*/
            $scope.displayedLibIndex = -1;
            $scope.toggleLibsDisplay = function(index) {
                if (index == $scope.displayedLibIndex)
                    $scope.displayedLibIndex = -1;
                else
                    $scope.displayedLibIndex = index;
            };
            /*--------------scrollToTop--------------*/
            self.scrollToTop = function() {
                $("#list_micropip, #list_standard").each(function() {
                    this.scrollTo({
                        top: 0,
                        left: 0,
                        behavior: "auto",
                    });
                });
            }
        }
    ]);