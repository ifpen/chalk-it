// ┌───────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard.controller                                                              │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                       │ \\
// | Licensed under the Apache License, Version 2.0                                    │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                                 │ \\
// └───────────────────────────────────────────────────────────────────────────────────┘ \\

let tabActive = 'widgets';
let modeActive = "edit-dashboard";
let editorStatus = "full";

angular
    .module('modules.dashboard')
    .value('DashboardActiveTabGetter', () => tabActive)
    .value('DashboardActiveModeGetter', () => modeActive)
    .controller('DashboardController', ['$scope', '$rootScope', 'DepGraphService', 'ManageDatanodeService', 'EditPlaySwitchService',
        function($scope, $rootScope, DepGraphService, ManageDatanodeService, EditPlaySwitchService) {


            // //toggle window of widget lib 
            // $scope.displayedWdgtIndex = 0;
            // $scope.toggleWidgetLibDisplay = function(index) {
            //     if (index == $scope.displayedWdgtIndex)
            //         $scope.displayedWdgtIndex = -1;
            //     else
            //         $scope.displayedWdgtIndex = index;
            // };



            $scope.info = {
                openProjectInfo: false,
                checkboxModelLater: false,
                showCheckbox: true,
                title: "New project",
                left: "50%",
                // origin: "create",
                tmp: {},
                pastName: "",
                idForm: 2 // unique
            };

            $scope.sharePrj = {
                left: "50%",
                flag: false
            };

            $scope.popup = {
                datanodeInfo: false,
                datanodeNotif: false
            };

            $scope.modalDiagNotif = false;


            $scope.editorView = {
                checkboxModelView: false,
                leftSidePanel: {
                    size: 3,
                    target: "Widgets",
                    view: false
                },
                rightSidePanel: {
                    size: 1,
                    screen: "Enlarge screen view",
                    icn: "icn-full-screen",
                    target: "Data Connection",
                    view: false
                },
                newDatanodePanel: {
                    view: false,
                    list: false,
                    type: false,

                },
                showGraphPanel: false,
                sortValue: "typeA"
            };

            /*---------- copyContent ----------------*/
            $scope.copyContentValue = "";
            $scope.copyContent = function (content) {
                let contentSize = new Blob([content]).size;  // size: bytes
                var notice;
                if (contentSize <= 10_485_760) {  // 10_485_760 bytes = 10 MB
                    navigator.clipboard.writeText(content).then(function() {
                        notice = new PNotify({
                            title: "Copy content",
                            text: "Copying to clipboard was successful!",
                            type: "success",
                            styling: "bootstrap3"
                        });
                    }, function(err) {
                        notice = new PNotify({
                            title: "Copy content",
                            text: "Could not copy content: " + err,
                            type: "error",
                            styling: "bootstrap3"
                        });
                    });
                    $scope.copyContentValue = "";
                } else {
                    notice = new PNotify({
                        title: "Copy content",
                        text: "Could not copy content due to data big size",
                        type: "error",
                        styling: "bootstrap3"
                    });
                }
                $('.ui-pnotify-container').on('click', function () {
                    notice.remove();
                });
            }

            /***********************************************************************************/
            /**********************************manage editor view*******************************/
            /***********************************************************************************/

            /*---------- setLeftContent ----------------*/
            $scope.setLeftContent = function(name) {
                $scope.resetPanelStateR();
                if ($scope.editorView.leftSidePanel.target == name || !$scope.editorView.leftSidePanel.view) {
                    $scope.editorView.leftSidePanel.view = !$scope.editorView.leftSidePanel.view;
                }
                $scope.editorView.leftSidePanel.target = name;

                $scope.editorView.leftSidePanel.size = 3;
                $scope.editorView.leftSidePanel.screen = "Enlarge screen view";

                $rootScope.filtredList = [];
                $rootScope.filtredNodes = $rootScope.alldatanodes.length;


                let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
                scopeDashDn.searchDatanodeByName = "";
                scopeDashDn.applyDatanodeFilter("");
            };

            /*---------- closeLeftSidePanel ----------------*/
            $scope.closeLeftSidePanel = function() {
                $scope.editorView.newDatanodePanel.view = false;
                $scope.editorView.leftSidePanel.view = false;
                editorStatus = "full";
            };

            /*---------- dataConnectionPanel ----------------*/
            $scope.dataConnectionPanel = function(vm) {
                $scope.resetPanelStateL();
                $scope.editorView.rightSidePanel.target = 'DataNode Connection';
                $scope.editorView.rightSidePanel.size = 1;

                if (!$scope.editorView.rightSidePanel.view) {
                    $scope.editorView.rightSidePanel.view = !$scope.editorView.rightSidePanel.view;
                }
                vm.editSelectedWidget();
            };

            /*---------- setRightContent ----------------*/
            $scope.setRightContent = function(name, vm) {
                $scope.resetPanelStateL();
                let opendedPanel = false;
                if ($scope.editorView.rightSidePanel.target == name || !$scope.editorView.rightSidePanel.view) {
                    $scope.editorView.rightSidePanel.view = !$scope.editorView.rightSidePanel.view;
                    opendedPanel = true;
                }
                $scope.editorView.rightSidePanel.target = name;

                if ($scope.editorView.rightSidePanel.view) {
                    switch (name) {
                        case 'DataNode Connection':
                            $scope.editorView.rightSidePanel.size = 1;
                            break;
                        case 'Graphical Properties':
                            $scope.editorView.rightSidePanel.size = 2;
                            $scope.editorView.rightSidePanel.screen = "Enlarge screen view";
                            $scope.editorView.rightSidePanel.icn = "icn-full-screen";
                            break;
                        case 'Aspect':
                            $scope.editorView.rightSidePanel.size = 3;
                            break;
                        default:
                            break;
                    }
                }

                if (opendedPanel) {
                    vm.editSelectedWidget();
                }
            };

            /*---------- enlargeScreenRight ----------------*/
            $scope.enlargeScreenRight = function() {
                let isFullSize = true;
                if ($scope.editorView.rightSidePanel.size == 1)
                    isFullSize = false;
                switch (isFullSize) {
                    case true:
                        $scope.editorView.rightSidePanel.screen = "Reduce screen view";
                        $scope.editorView.rightSidePanel.icn = "icn-reduced-screen";
                        $scope.editorView.rightSidePanel.size = 1;
                        break;
                    case false:
                        $scope.editorView.rightSidePanel.screen = "Enlarge screen view";
                        $scope.editorView.rightSidePanel.icn = "icn-full-screen";
                        $scope.editorView.rightSidePanel.size = 2;
                        break;
                }
            };

            /*---------- enlargeScreenLeft ----------------*/
            $scope.enlargeScreenLeft = function() {
                let isFullSize = true;
                if ($scope.editorView.leftSidePanel.size == 2)
                    isFullSize = false;
                switch (isFullSize) {
                    case true:
                        $scope.editorView.leftSidePanel.screen = "Reduce screen view";
                        $scope.editorView.rightSidePanel.icn = "icn-reduced-screen";
                        $scope.editorView.leftSidePanel.size = 2;
                        break;
                    case false:
                        $scope.editorView.leftSidePanel.screen = "Enlarge screen view";
                        $scope.editorView.rightSidePanel.icn = "icn-full-screen";
                        $scope.editorView.leftSidePanel.size = 3;
                        break;
                }
            };

            /*---------- resetPanelState ----------------*/
            $scope.resetPanelState = function() {
                $scope.resetPanelStateR();
                $scope.resetPanelStateL();
            };

            /*---------- closeRightSidePanel ----------------*/
            $scope.closeRightSidePanel = function() {
                $scope.editorView.rightSidePanel.view = false;
                editorStatus = "full";
            };

            /*---------- resetPanelStateR ----------------*/
            $scope.resetPanelStateR = function() {
                $scope.editorView.rightSidePanel.view = false;
            };

            /*---------- resetPanelStateL ----------------*/
            $scope.resetPanelStateL = function() {
                $scope.editorView.leftSidePanel.view = false;
                $scope.editorView.showGraphPanel = false;
                $scope.editorView.newDatanodePanel.view = false;
                DepGraphService.closeGraph();
            };

            /*---------- reset ----------------*/
            $scope.reset = function() {
                $scope.resetPanelState();
                $(".datanode__wrap--info p").removeAttr("style");
                // ManageDatanodeService.applyDatanodeFilter("");
                if ($scope.editorView.checkboxModelView) {
                    EditPlaySwitchService.onEditPlaySwitch();
                }
                $scope.editorView.checkboxModelView = false;
            };

            // /**************************************************************/
            // /****************** Edit/View switch button *******************/
            // /**************************************************************/

            /*---------- switchEditView ----------------*/
            $scope.switchEditView = function() {
                const switchLabel = document.getElementById("switch-label");
                if (switchLabel.classList.contains("disabled")) return;
                switchLabel.classList.add("disabled");
                EditPlaySwitchService.onEditPlaySwitch();
                $scope.resetPanelState();
                setTimeout(() => {
                    switchLabel.classList.remove("disabled");
                }, 1000); // Adjust the delay to match the transition duration
            }

            // /**************************************************************/
            // /****************** New DataNode side panel *******************/
            // /**************************************************************/

            /*---------- dataNode type button ----------------*/
            $scope.openDataNodeTypePlugin = function(val) {
                ManageDatanodeService.openDataNodeTypePlugin(val, $scope);
            };

            /*---------- save datanode button ----------------*/
            $scope.saveDataNodeSettings = function(isFromJsEditor) {
                ManageDatanodeService.saveDataNodeSettings(isFromJsEditor, $scope);
            };

            /*---------- cancel datanode button ----------------*/
            $scope.getOldDataNodeSettings = function() {
                ManageDatanodeService.getOldDataNodeSettings($scope);
            };


            /*******************************************************/
            /******************* Graph button **********************/
            /*******************************************************/

            /*---------- show graph button ----------------*/
            $scope.showDepGraph = function(name) {
                DepGraphService.showDepGraph(name, $scope);
            };


            /*******************************************************/
            /******************* Help button **********************/
            /*******************************************************/

            /*---------- help button ----------------*/
            $scope.initFrame = function() {
                const iframe = document.getElementById('helpFrame');
                iframe.src = xDashConfig.urlDoc + 'index.html';
            };


            /**************************************************************/
            /***********************Dependency graph***********************/
            /**************************************************************/

            /*---------- selectConnectedWithWidget ----------------*/
            $scope.selectConnectedWithWidget = function (tag) {
                DepGraphService.selectConnectedWithWidget(tag);
            };
        }
    ]);
