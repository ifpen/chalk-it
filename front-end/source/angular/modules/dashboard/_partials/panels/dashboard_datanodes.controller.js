// ┌────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_datanodes.controller                                                 │ \\
// ├────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                    │ \\
// | Licensed under the Apache License, Version 2.0                                 │ \\
// ├────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Ameur HAMDOUNI              │ \\
// └────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.dashboard')
    .component('xdashDataNodeInfo', {
        bindings: {
            name: '=',
            data: '=',
            show: '=',
        },
        bindToController: true,
        controller: ['UiNotifications', class DataNodeInfo {
            constructor(uiNotifications) {
                this.options = VIEW_JSON_FORMAT;
                this.uiNotifications = uiNotifications;
            }

            download() {
                const blob = new Blob([JSON.stringify(this.data, null, '\t')], { type: 'application/json' });
                saveAs(blob, `${this.name}-result.json`);
            }

            async copy() {
                const title = 'Copy content';
                try {
                    const content = JSON.stringify(this.data, null, '\t');
                    await navigator.clipboard.writeText(content);

                    this.uiNotifications.notifyMessage(title, 'Content was copied to the clipboard.', UiNotifications.TYPE_SUCCESS);
                }
                catch (err) {
                    this.uiNotifications.notifyMessage(title, `Copying to the clipboard failed: ${err}`, UiNotifications.TYPE_ERROR);
                }
            }
        }],
        template: `
        <div class="cancel__container" ng-class="{open: $ctrl.show}">
            <div class="cancel__box cancel__box--xl">
                <div class="cancel__title">DataNode JSON result: {{$ctrl.name}}</div>
                <div class="cancel__text" id="popup-text" style="overflow: auto;height:84%;min-height:50px;text-align: initial;">
                    <div json-display="$ctrl.data" options="$ctrl.options"></div>
                </div>

                <div class="cancel__box__bottom">
                    <button class="btn btn-rounded-fill primary" ng-click="$ctrl.show = false; $ctrl.data = undefined">Close</button>
                    <button class="btn btn-rounded-fill cancel" ng-click="$ctrl.copy()"><i class="basic icn-duplicate"></i>Copy</button>
                    <button class="btn btn-rounded-fill cancel" ng-click="$ctrl.download()"><i class="basic icn-download"></i>Download</button>

                </div>
            </div>
            <div class="cancel__overlay"></div>
        </div>
        `,
    })
    .component('xdashDataNodePreview', {
        bindings: {
            data: '<',
        },
        bindToController: true,
        controller: ['$scope', class DataNodePreview {
            constructor($scope) {
                this.jsonOptions = PREVIEW_JSON_FORMAT;

                $scope.$watch('$ctrl.data', (data) => {
                    if (data && data.isBinary && data.content && BROWSER_SUPPORTED_IMAGES.includes(data.type)) {
                        this.image = `data:${data.type};base64,${data.content}`;
                    } else {
                        this.image = undefined;
                    }
                });
            }
        }],
        template: `
        <span ng-if="!$ctrl.image">
            <div json-display="$ctrl.data" options="$ctrl.jsonOptions"></div>
        </span>
        <img ng-if="$ctrl.image" ng-src="{{$ctrl.image}}" style="object-fit: contain;" />
        `,
    })
    .controller('DashboardDatanodesController', ['$scope', '$rootScope', '$state', 'DepGraphService', 'ManageDatanodeService',
        function ($scope, $rootScope, $state, DepGraphService, ManageDatanodeService) {
            $scope.nodeInfo = {
                name: '',
                data: null,
                show: false,
            };

            $scope.searchDatanodeByName = "";

            /**************************************************************/
            /*******************DataNode left side panel*******************/
            /**************************************************************/

            /*---------- New button ----------------*/
            $scope.newDataNode = function() {
                ManageDatanodeService.newDataNode($scope);
            };

            /*---------- open button /Load datanodes from xdjson ----------------*/
            $scope.openFileData = function(target) {
                ManageDatanodeService.openFileData(target);
            };


            /**********************************************************************/
            /*******************DataNode menu in left side panel*******************/
            /**********************************************************************/

            /*---------- filter By Connection btn----------------*/
            // $scope.filterByConnection = function(singleton, element) {
            //     ManageDatanodeService.filterByConnection(type, element);
            // };

            /*---------- filter By Type btn ----------------*/
            $scope.getUniqTypes = function() {
                let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
                DepGraphService.getUniqTypes(scopeDash);
            };

            /*---------- filter By Type btn --> select ----------------*/
            $scope.filterByType = function(type, element) {
                ManageDatanodeService.filterByType(type, element);
            };


            /*---------- filter By Type btn  --> cancel ----------------*/
            $scope.resetNodesFilters = function(e) {
                ManageDatanodeService.resetNodesFilters(e);
            };
            /*---------- sort datanodes ----------------*/
            $scope.sortNodes = function(value) {
                switch (value) {
                    case 'typeA':
                        $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, el => el.type().toLowerCase());
                        break;
                    case 'typeD':
                        $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, el => el.type().toLowerCase()).reverse();
                        break;
                    case 'nameA':
                        $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, el => el.name().toLowerCase());
                        break;
                    case 'nameD':
                        $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, el => el.name().toLowerCase()).reverse();
                        break;
                    case 'statusA':
                        $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, el => el.status().toLowerCase());
                        break;
                    case 'statusD':
                        $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, el => el.status().toLowerCase()).reverse();
                        break;
                    case 'lastUpdateA':
                        $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, el => el.last_updated().toLowerCase());
                        break;
                    case 'lastUpdateD':
                        $rootScope.alldatanodes = _.sortBy($rootScope.alldatanodes, el => el.last_updated().toLowerCase()).reverse();
                        break;
                }
                $scope.displayedShowIndex = 0;
            };


            /*---------- Load datanodes button (from xdjson) ----------------*/
            // see  $scope.openFileData fct

            /*---------- Save datanodes button (to xdjson) ----------------*/
            $scope.saveJson = function() {
                xdsjson.saveJson();
            };

            /*---------- stop scheduler button  ----------------*/
            $scope.stopSchedule = function() {
                datanodesManager.stopSchedule();
            };

            /*---------- clear datanodes list button ----------------*/
            $scope.clearAllData = function() {
                xdsjson.clearAllData();
            };

            /*---------- Remove unused datanodes button ----------------*/
            $scope.RemoveUnusedDatanodes = function() {
                $rootScope.selectedButtonDataMove = $rootScope.selectedButtonDataMove === "RemoveUnusedDatanodes" ? "" : "RemoveUnusedDatanodes";
                datanodesManager.RemoveUnusedDatanodes();
            };


            /*---------- applyDatanodeFilter----------------*/
            $scope.applyDatanodeFilter = function(tmpStr) {
                ManageDatanodeService.applyDatanodeFilter(tmpStr);
            };


            /*******************************************************/
            /*******************DataNode cardTop *******************/
            /*******************************************************/

            //AEF: toggle window of dataNode result
            $scope.toggleDataNodeDisplay = function(index) {
                if (index == $scope.displayedShowIndex)
                    $scope.displayedShowIndex = -1;
                else
                    $scope.displayedShowIndex = index;
            };

            /*---------- see json result button ----------------*/
            $scope.getDataNodeDetail = function(data) {
                $scope.nodeInfo = {
                    name: data.name(),
                    data: data.latestData(),
                    show: true,
                };
            };

            /*---------- refresh button ----------------*/
            $scope.refreshDataNode = function(data) {
                data.schedulerStart(undefined, undefined, 'refresh');
            };

            /*---------- edit button ----------------*/
            $scope.openDataNode = function(data) {
                let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

                let instanceType = data.type();
                let val = instanceType;
                let settings = data.settings();
                settings.name = data.name();

                $rootScope.dataNodeViewModel = data;
                let types = datanodesManager.getDataNodePluginTypes();
                scopeDash.editorView.newDatanodePanel.view = true;
                scopeDash.editorView.newDatanodePanel.list = false;
                scopeDash.editorView.newDatanodePanel.type = true;
                scopeDash.editorView.operationDataNode = "edit";
                $rootScope.safeApply();
                datanodesManager.createPluginEditor(types, instanceType, settings, val);

            };

            /*---------- show graph button ----------------*/
            $scope.showDepGraph = function(name) {
                let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
                DepGraphService.showDepGraph(name, scopeDash);
            };


            /**************************************************************/
            /*******************DataNode menu in cardTop*******************/
            /**************************************************************/

            /*---------- duplicate button ----------------*/
            $scope.duplicateDataNode = function(data) {
                ManageDatanodeService.duplicateDataNode(data, $scope);
            };

            /*---------- interrupt button ----------------*/
            $scope.interruptDataNode = function(data) {
                if (data.execInstance() != null) { // scheduling is in progress
                    data.execInstance().stopOperation(data.name());
                }
            };

            /*---------- Download JSON result button----------------*/
            $scope.showDataNodeInfo = function(dataNode) {
                const result = dataNode.latestData();
                saveAs(new Blob([JSON.stringify(result, null, '\t')], { 'type': 'application/octet-stream' }), dataNode.name() + '-result.json');
            };

            /*---------- Delete button ----------------*/
            $scope.deleteDataNode = function(data) {
                datanodesManager.deleteDataNode(data, "datanode", "DataNode");
            };

            /*---------- Notification button ----------------*/
            $scope.getDataNodeDetailsAndNotifications = function(data) {
                let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

                scopeDash.popup.datanodeNotif = true;
                scopeDash.popup.title = data.name();
                scopeDash.popup.data = data;
            };
        }
    ]);