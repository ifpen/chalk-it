angular.module('modules')
    .controller('exportSettingDownload', ['$uibModalInstance', '$rootScope', '$scope', 'options',
        function ($uibModalInstance, $rootScope, $scope, options) {
            $scope.optionsModal = options;
            $scope.form = {};

            $scope.keepChoice = true;
            $scope.status = htmlExport.navBarNotification; // AEF: changed to keep last choice of notification

            $scope.changeStatus = function () {
                $scope.status = !$scope.status;
            };

            $scope.scalingMethod = htmlExport.exportOptions;
            $scope.nbRows = layoutMgr.getRows();
            $scope.pageNamesObj = layoutMgr.getRowNamesObj();
            $scope.defaultPageID = layoutMgr.getDefaultRowID();

            $scope.submitForm = function () {
                if ($scope.form.userForm.$valid) {

                    htmlExport.exportOptions = $scope.scalingMethod;
                    htmlExport.navBarNotification = $scope.status;

                    let rowName = $('#select-default-page').find(":selected").text();
                    let rowNumber = $('#select-default-page').find(":selected").val();
                    layoutMgr.setDefaultRow({
                        id: rowNumber,
                        name: rowName
                    });
                    
                    $rootScope.updateFlagDirty(true);

                    $uibModalInstance.close({
                        notification: $scope.status,
                        scalingMethod: $scope.scalingMethod
                    });
                } else {
                    $uibModalInstance.dismiss("cancel");
                }
            };

            $scope.cancel = function () {
                $uibModalInstance.dismiss("cancel");
            };
        }
    ]);