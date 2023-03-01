// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_contentTop.controller                                                      │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                          │ \\
// | Licensed under the Apache License, Version 2.0                                       │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                                    │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\

angular
    .module('modules.dashboard')
    .controller('DashboardContentTopController', ['$scope', '$rootScope', '$uibModal', 'ManagePrjService', 'ManagePrjSharingService', 'ManagePageSharingService', 'EditPlaySwitchService',
        function ($scope, $rootScope, $uibModal, ManagePrjService, ManagePrjSharingService, ManagePgSharingService, EditPlaySwitchService) {


            /***********************************************************************************/
            /*******************dashboard_contentTop: menu under project name*******************/
            /***********************************************************************************/

            /*---------- Settings button ----------------*/
            $scope.exportSettings = function() {
                var modalInstance = $uibModal.open({
                    templateUrl: 'source/angular/modules/dashboard/_partials/modals/exportDownloadPage.html',
                    controller: 'exportSettingDownload',
                    scope: $scope,
                    resolve: {
                        options: function() {
                            return "exportSettings";
                        }
                    }
                });

                modalInstance.result.then(function(resultFromModal) {
                    htmlExport.exportOptions = resultFromModal.scalingMethod;
                }, function() {
                    console.info('Modal dismissed at: ' + new Date());
                });
            };

            /*---------- Rename button   ----------------*/
            $scope.renameProject = function(fileName, flag, msg) {
                ManagePrjService.renameProject(fileName, flag, msg, "xprjson");
            };

            /*---------- Share button   ----------------*/
            $scope.shareProject = function(fileName, fileType) {
                ManagePrjSharingService.shareProject(fileName, fileType);
            };

            /*---------- Duplicate button   ----------------*/
            $scope.duplicateProject = function(projectName) {
                ManagePrjService.duplicateProject(projectName, "xprjson");
            };

            /*---------- Export button   ----------------*/
            $scope.exportProjectToLocal = function() {
                const xdashFileSerialized = xdash.serialize();
                const fileName = $rootScope.currentProject.name;
                saveAs(new Blob([JSON.stringify(xdashFileSerialized, null, '\t')], { 'type': 'application/octet-stream' }), fileName + ".xprjson");
            };

            /*---------- Delete button   ----------------*/
            $scope.deleteFileInServer = function(projectName) {
                ManagePrjService.deleteFileInServer(projectName, "xprjson");
            };

            /*---------- Infos button    ----------------*/
            $scope.infoProject = function(projectName) {
                let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

                scopeDash.info.pastName = projectName;
                scopeDash.info.openProjectInfo = true;
                $rootScope.info.origin = "editor";
                scopeDash.info.title = "Project info";
                scopeDash.info.tmp = angular.copy($rootScope.currentProject);
                scopeDash.info.showCheckbox = false;
                $rootScope.currentInfoProject = angular.copy($rootScope.currentProject);
            };

            /**********************************************************************/
            /*******************dashboard_contentTop: Edit mode********************/
            /**********************************************************************/

            /*---------- Save button ----------------*/
            $scope.saveProjectInServer = function() {
                const is_defaultOverwrite = true;
                const name = $rootScope.currentProject.name;
                if (name != "Untitled")
                    fileManager.saveOnServer('project', name, undefined, is_defaultOverwrite);
                else
                    $scope.renameProject(name);
            };

            /**
             * For basic version
             * 
             * @param {*} openProjectCallback 
             * @returns 
             */
            $scope.saveProjectToLocal = function (openProjectCallback) {
                const is_defaultOverwrite = true;
                const currentProjectName = $rootScope.currentProject.name;
                const inputProjectName = $("#projectName").val();
                const fileType = "project";

                $rootScope.oldFileName = currentProjectName;
                const flag = false;
                const fileName = currentProjectName;
                const inputValue = inputProjectName;
                if (inputProjectName === "Untitled" || inputProjectName === "") {
                    $scope.renameProject(currentProjectName, flag);
                } else if (inputProjectName !== currentProjectName) {
                    const endAction = function (msg1, msg2, type) {
                        if (type === "success") {
                            const notice = new PNotify({
                                title: inputValue,
                                text: "'" + currentProjectName + "' has been successfully renamed to " + inputValue + "'!",
                                type: type,
                                styling: "bootstrap3",
                            });
                            $('.ui-pnotify-container').on('click', function () {
                                notice.remove();
                            });
                            $("#projectName")[0].value = inputValue;
                            $rootScope.currentProject.name = inputValue;
                            $rootScope.loadingBarStop();
                            fileManager.saveOnServer('project', inputProjectName, undefined, is_defaultOverwrite, openProjectCallback);
                        } else if (type === "error") {
                            const notice = new PNotify({
                                title: inputValue,
                                text: "Fail to rename your " + fileType + " '" + currentProjectName + "' to '" + inputValue + "'!",
                                type: type,
                                styling: "bootstrap3",
                            });
                            $('.ui-pnotify-container').on('click', function () {
                                notice.remove();
                            });
                        }
                    };
                    fileManager.renameFile(fileType, fileName, inputValue, endAction, flag);
                } else {
                    fileManager.saveOnServer('project', inputProjectName, undefined, is_defaultOverwrite, openProjectCallback);
                }
            }

            /*---------- Rename input ----------------*/
            $scope.$watch(function() {
                return $("#projectName").val();
              }, function(newName) {
                if (!_.isUndefined($rootScope.currentProject)) {
                    const oldName = $rootScope.currentProject.name
                    if (oldName !== undefined && newName !== oldName) {
                        $rootScope.currentPrjDirty = " *";
                    }
                }
            });

            /**********************************************************************/
            /*******************dashboard_contentTop: Edit mode********************/
            /**********************************************************************/

            /*---------- Switch button    ----------------*/
            $scope.onEditPlaySwitch = function() {
                EditPlaySwitchService.onEditPlaySwitch();
            };


            /*********************************************************************/
            /*******************dashboard_contentTop: View mode*******************/
            /*********************************************************************/

            /*---------- Deploy button --> Dashboard ----------------*/
            $scope.showForm = function() {
                htmlExport.saveDashboard();
            };

            /*---------- Export button -------------------*/
            $scope.exportHTMLPage = function (projectName) {
                let txt = htmlExport.createDashboardDocument(projectName);
                let blob = new Blob([txt], { type: "text/html;charset=utf-8" });
                saveAs(blob, projectName + ".html");
            }

            /*---------- Preview button   ----------------*/
            $scope.previewDashboard = function() {
                htmlExport.previewDashboardCallback();
            };

            /*--------------- Share button  -----------------*/
            /*---------- verifyPageExistence ----------------*/
            $scope.verifyPageExistence = function(projectName) {
                ManagePgSharingService.verifyPageExistence(projectName);
            };

            /*---------- verifyAccessPage ----------------*/
            $scope.verifyAccessPage = function(projectName) {
                ManagePgSharingService.verifyAccessPage(projectName);
            };

            /*---------- Share button --> Get page link ----------------*/
            $scope.showPageLink = function(pageName) {
                let FileMngrIn = new FileMngrFct();
                FileMngrIn.GetPage(pageName + ".html", function(msg) {
                    if (msg.Success) {
                        var encodedUri = encodeURI(msg.Msg);
                        swal({
                                title: "HTML page link",
                                text: pageName + ".html",
                                type: "input",
                                closeOnConfirm: true,
                                showCopyButton: true,
                                inputValue: encodedUri
                            },
                            function(inputValue) {});
                    }
                });
            };

            /*---------- Share button --> Set page access ----------------*/
            $scope.openPageAccess = function(name) {
                ManagePgSharingService.openPageAccess(name);
            };

            /*---------- Share button --> Manage sharing ----------------*/
            // see $scope.shareProject(fileName, fileType) 

        }
    ]);