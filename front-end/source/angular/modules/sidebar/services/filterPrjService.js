// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ FilterPrjService                                                                 │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

angular
    .module('modules.sidebar')
    .service('FilterPrjService', ['$rootScope', function ($rootScope) {
        const self = this;

        /*---------- ProjectsFilter ----------------*/
        self.ProjectsFilter = function (tmpStr, vm) {
            setTimeout(function () {
                //Projects without groups
                for (let j = 0; j <= vm.nbCat - 1; j++) {
                    let tempFile = [];
                    var totalShowedData = 0;
                    $rootScope.pagination.startData = 0;
                    $rootScope.pagination.endData = vm.perPage;
                    $rootScope.pagination.currentPage = 0;
                    if (!_.isUndefined(vm.allFilesWithNoGrp[j])) { //when no project exist
                        for (var tt = 0; tt < vm.allFilesWithNoGrp[j].FileList.length; tt++) {
                            if (!(vm.allFilesWithNoGrp[j].FileList[tt].Name.toLowerCase().indexOf(tmpStr.toLowerCase()) >= 0)) {
                                vm.allFilesWithNoGrp[j].FileList[tt].hide = true;
                            } else {
                                vm.allFilesWithNoGrp[j].FileList[tt].hide = false;
                                totalShowedData++;
                                tempFile.push(vm.allFilesWithNoGrp[j].FileList[tt]);
                            }
                        }

                        vm.allFilesFiltredValue[j].FileList = angular.copy(tempFile);
                        vm.allFilesFiltred[j].FileList = angular.copy(tempFile);
                    }
                    $rootScope.pagination.totalPages = Math.ceil(
                        totalShowedData / vm.perPage
                    );
                    $rootScope.pagination.listPages = Array.apply(null, {
                        length: Math.ceil(totalShowedData / vm.perPage),
                    }).map(Number.call, Number);

                }
                //Projects with groups
                for (let k = 0; k <= vm.grpFiles.length - 1; k++) {
                    let tempFile = [];
                    if (!_.isUndefined(vm.grpFiles[k])) { //when no project exist
                        for (var tt = 0; tt < vm.grpFiles[vm.grpFiles[k]].length; tt++) {
                            if (!(
                                vm.grpFiles[vm.grpFiles[k]][tt].Name.toLowerCase().indexOf(
                                    tmpStr.toLowerCase()
                                ) >= 0
                            )) {
                                vm.grpFiles[vm.grpFiles[k]][tt].hide = true;
                            } else {
                                vm.grpFiles[vm.grpFiles[k]][tt].hide = false;
                                tempFile.push(vm.grpFiles[vm.grpFiles[k]][tt]);
                            }
                        }

                        vm.allFilesFiltredValueGrp[vm.grpFiles[k]] = angular.copy(tempFile);
                        vm.allFilesFiltredGrp[vm.grpFiles[k]] = angular.copy(tempFile);
                    }

                }
                $rootScope.$apply();
                //after filtering by keyword, re-apply already selected tags
                self.ProjectsFilterByTags("", undefined, vm);
            }, 600);

        };


        /*---------- ProjectsFilterByTags ----------------*/
        self.ProjectsFilterByTags = function (Str, element, vm) {
            setTimeout(function () {
                _addFilterTags(Str, vm);
                //Projects without groups
                for (let j = 0; j <= vm.nbCat - 1; j++) {
                    var TagList = [];
                    var currentFiles = [];
                    //_addFilterTags(Str,vm); dont call it here, it create a display bug when we have more than one iteration

                    if (_.isUndefined(element)) { //when called after a filter value
                        element = {};
                        element.className = "";
                    }

                    if (element.className.includes("active")) { //add tag on current filter
                        currentFiles = angular.copy(vm.allFilesFiltred[j]); //start from current filter
                        TagList[0] = Str;
                    } else { //remove current selected tag and re-aply past tag filters
                        currentFiles = angular.copy(vm.allFilesFiltredValue[j]); //start from filtered keyword
                        TagList = vm.filterTagsList;
                        if (TagList.length == 0)
                            TagList[0] = "";
                    }

                    if (!_.isUndefined(currentFiles)) { //when no project exist
                        for (let i in TagList) {
                            var tmpStr = TagList[i];
                            var tempFile = [];
                            var totalShowedData = 0;
                            $rootScope.pagination.startData = 0;
                            $rootScope.pagination.currentPage = 0;
                            $rootScope.pagination.endData = vm.perPage;

                            for (var tt = 0; tt < currentFiles.FileList.length; tt++) {
                                var hide = true;
                                if (tmpStr === "") {
                                    hide = false;
                                }

                                if (currentFiles.FileList[tt].Tags) {
                                    for (
                                        var tg = 0; tg <
                                        currentFiles.FileList[tt].Tags.length; tg++
                                    ) {
                                        if (
                                            currentFiles.FileList[tt].Tags[
                                                tg
                                            ].toLowerCase()
                                                .indexOf(tmpStr.toLowerCase()) >= 0
                                        ) {
                                            hide = false;
                                        }
                                    }
                                }

                                currentFiles.FileList[tt].hide = hide;

                                if (!hide) {
                                    totalShowedData++;
                                    tempFile.push(
                                        currentFiles.FileList[tt]
                                    );
                                }
                            }

                            currentFiles.FileList = angular.copy(tempFile); //update current files
                            vm.allFilesFiltred[j].FileList = angular.copy(tempFile);

                            $rootScope.pagination.totalPages = Math.ceil(
                                totalShowedData / vm.perPage
                            );
                            $rootScope.pagination.listPages = Array.apply(null, {
                                length: Math.ceil(totalShowedData / vm.perPage),
                            }).map(Number.call, Number);
                        }
                    }
                }
                //Projects with groups
                for (let k = 0; k <= vm.grpFiles.length - 1; k++) {
                    let TagList = [];
                    let currentFiles = [];

                    if (_.isUndefined(element)) { //when called after a filter value
                        element = {};
                        element.className = "";
                    }

                    if (element.className.includes("active")) { //add tag on current filter
                        currentFiles = angular.copy(vm.allFilesFiltredGrp[vm.grpFiles[k]]); //start from current filter
                        TagList[0] = Str;
                    } else { //remove current selected tag and re-aply past tag filters
                        currentFiles = angular.copy(vm.allFilesFiltredValueGrp[vm.grpFiles[k]]); //start from filtered keyword
                        TagList = vm.filterTagsList;
                        if (TagList.length == 0)
                            TagList[0] = "";
                    }

                    if (!_.isUndefined(currentFiles)) { //when no project exist
                        for (let i in TagList) {
                            var tmpStr = TagList[i];
                            var tempFile = [];

                            for (let tt = 0; tt < currentFiles.length; tt++) {
                                var hide = true;
                                if (tmpStr === "") {
                                    hide = false;
                                }

                                if (currentFiles[tt].Tags) {
                                    for (let tg = 0; tg < currentFiles[tt].Tags.length; tg++) {
                                        if (currentFiles[tt].Tags[tg].toLowerCase().indexOf(tmpStr.toLowerCase()) >= 0) {
                                            hide = false;
                                        }
                                    }
                                }

                                currentFiles[tt].hide = hide;

                                if (!hide) {
                                    tempFile.push(
                                        currentFiles[tt]
                                    );
                                }
                            }

                            currentFiles = angular.copy(tempFile); //update current files
                            vm.allFilesFiltredGrp[vm.grpFiles[k]] = angular.copy(tempFile);

                        }
                    }
                }
                //Projects with groups
                for (let k = 0; k <= vm.grpFiles.length - 1; k++) {
                    let TagList = [];
                    let currentFiles = [];

                    if (_.isUndefined(element)) { //when called after a filter value
                        element = {};
                        element.className = "";
                    }

                    if (element.className.includes("active")) { //add tag on current filter
                        currentFiles = angular.copy(vm.allFilesFiltredGrp[vm.grpFiles[k]]); //start from current filter
                        TagList[0] = Str;
                    } else { //remove current selected tag and re-aply past tag filters
                        currentFiles = angular.copy(vm.allFilesFiltredValueGrp[vm.grpFiles[k]]); //start from filtered keyword
                        TagList = vm.filterTagsList;
                        if (TagList.length == 0)
                            TagList[0] = "";
                    }

                    if (!_.isUndefined(currentFiles)) { //when no project exist
                        for (let i in TagList) {
                            var tmpStr = TagList[i];
                            var tempFile = [];

                            for (let tt = 0; tt < currentFiles.length; tt++) {
                                let hide = true;
                                if (tmpStr === "") {
                                    hide = false;
                                }

                                if (currentFiles[tt].Tags) {
                                    for (var tg = 0; tg < currentFiles[tt].Tags.length; tg++) {
                                        if (currentFiles[tt].Tags[tg].toLowerCase().indexOf(tmpStr.toLowerCase()) >= 0) {
                                            hide = false;
                                        }
                                    }
                                }

                                currentFiles[tt].hide = hide;

                                if (!hide) {
                                    tempFile.push(
                                        currentFiles[tt]
                                    );
                                }
                            }

                            currentFiles = angular.copy(tempFile); //update current files
                            vm.allFilesFiltredGrp[vm.grpFiles[k]] = angular.copy(tempFile);

                        }
                    }
                }
                $rootScope.$apply();
            }, 500);
        };

        //AEF: add selected tag to the list
        function _addFilterTags(tmpStr, vm) {
            let index = vm.filterTagsList.findIndex(element => element === tmpStr);
            if (index != -1) { //remove
                vm.filterTagsList.splice(index, 1);
            } else { //add
                vm.filterTagsList.push(tmpStr);
            }
        };
    }]);