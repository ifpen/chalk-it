// +--------------------------------------------------------------------+ \\
// ¦ xdash                                                              ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2023 IFPEN                                        ¦ \\
// ¦ Licensed under the Apache License, Version 2.0                     ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Mongi BEN GAID; Abir EL FEKI                  ¦ \\
// +--------------------------------------------------------------------+ \\

var xdsjson = (function () {


    //--------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------
    // Load (open) existing xdsjsonsources (specific functions)
    //-------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------


    /*--------openJsonManager--------*/
    function openJsonManager(data) {
        var jsonObject;
        try {
            jsonObject = JSON.parse(data);
        } catch (err) {
            swal("Unable to load file", "Project loading will be interrupted.", "error");
            return;
        }

        if (datanodesManager.getAllDataNodes().length == 0) {
            datanodesManager.load(jsonObject, true);
        } else {
            swal({
                title: "Loading dataNodes from xdsjson file",
                text: "Do you want to append the xdsjson file to your existing list or overwrite it?",
                type: "warning",
                showCancelButton1: true,
                showConfirmButton: false,
                showConfirmButton1: true,
                confirmButtonText: 'Append',
                cancelButtonText: "Overwrite",
                closeOnConfirm: true,
                closeOnConfirm1: true,
                closeOnCancel1: true
            },
                function (isConfirm) {
                    var bClear = true;
                    if (isConfirm) {
                        bClear = false;
                    } else {
                        bClear = true;
                    }
                    datanodesManager.load(jsonObject, bClear, function () {
                        //AEF
                        var $body = angular.element(document.body);
                        var $rootScope = $body.scope().$root;
                        $rootScope.filtredNodes = $rootScope.alldatanodes.length;
                        $rootScope.updateFlagDirty(true);
                    });
                });
        }
        datanodesManager.showLoadingIndicator(false);
    }


    //-------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------
    //  Save file json) 
    //-------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------


    /*--------saveJson--------*/
    function saveJson() {
        //AEF only on server
        selectDataToSave("server");
    }

    /*--------selectDataToSave--------*/
    function selectDataToSave(dest) {
        var data = datanodesManager.getAllDataNodes();
        var sortedData = data.sort((a, b) => a.name().localeCompare(b.name()));

        var dataToSave = [];
        var bFound = false;
        var contentElement = getDataList(sortedData, "Please check data to be saved in the xdsjson file: ");
        var i, j;

        new DialogBoxForData(contentElement, "List of data", "Save", "Cancel", function () {
            for (i = 0; i < data.length; i++) {
                if ($('#data-checkbox-' + i).is(':checked')) {
                    dataToSave[i] = data[i].name();
                    bFound = true;
                }
            }
            if (bFound) {
                var saveDatanodes = datanodesManager.serialize();
                var isDataFound = false;
                for (i = 0; i < saveDatanodes.datanodes.length; i++) {
                    isDataFound = false;
                    for (j = 0; j < dataToSave.length; j++) {
                        if (saveDatanodes.datanodes[i].name == dataToSave[j]) {
                            isDataFound = true;
                            break;
                        }
                    }
                    if (!isDataFound) { //delete unchecked data
                        delete saveDatanodes.datanodes[i];
                        delete saveDatanodes.reIndexMap[i];
                    }
                }
                var cleanData = [];
                var cleanIndex = [];
                var k = 0;
                for (i = 0; i < saveDatanodes.datanodes.length; i++) {
                    if (!_.isUndefined(saveDatanodes.datanodes[i])) {
                        cleanData[k] = saveDatanodes.datanodes[i];
                        cleanIndex[k] = saveDatanodes.reIndexMap[i];
                        k++;
                    }
                }
                saveDatanodes.datanodes = cleanData;

                var sortedIndexMap = _.sortBy(cleanIndex, function list(a) { return a; });
                var cleanIndexMap = [];

                for (j = 0; j < sortedIndexMap.length; j++) {
                    cleanIndexMap[j] = _.indexOf(sortedIndexMap, cleanIndex[j]);
                }

                saveDatanodes.reIndexMap = cleanIndexMap; // MBG 11/07/2018 : fix issue #67
                if (dest == "server") {
                    fileManager.saveOnServer("datanode", null, saveDatanodes);
                }
            } else
                return true; //do not close modal
        });
    }

    /*--------getDataList--------*/
    function getDataList(data, text) {
        var contentElement = $('<div class="datalist"></div>');
        contentElement.append('<p>' + text + '</p>');

        var datalistItems = $('<ul class="datalist__elems list-unstyled"></ul>');
        if (!_.isUndefined(data)) {
            for (var i = 0; i < data.length; i++) {
                var name = "";
                if (_.isFunction(data[i].name)) {
                    name = data[i].name();
                } else {
                    name = data[i];
                }
                if (!_.isUndefined(name)) {
                    datalistItems.append('<li><label for="data-checkbox-' + i + '"><input type="checkbox" class="check-option1" id="data-checkbox-' + i + '">' + name + '</label></li>');
                }
            }
        }
        contentElement.append(datalistItems);

        var datalistActions = $('<ul class="datalist__actions list-unstyled"></ul>');
        datalistActions.append('<li><label for="check-all"><input type="checkbox" class="check-option2" id="check-all">Check all</label></li>');
        datalistActions.append('<li><label for="uncheck-all"><input type="checkbox" class="check-option2" id="uncheck-all">Uncheck all</label></li>');
        contentElement.append(datalistActions);

        return contentElement;
    }

    /*--------getDuplicateDataList--------*/ //A long terme, il faudrait factoriser une partie de cette fonction avec getDataList
    function getDuplicateDataList(data, text) {
        var contentElement = document.createElement('div');
        var divContent = '<p style="margin-bottom:5px;">' + text + '</p>';
        divContent = divContent + '<div style="height:220px;overflow:auto;width:80%; max-width:80%; margin-bottom:15px;border: 1px solid white; background:var(--fill-background-color); color:black;float:left">';

        if (!_.isUndefined(data)) {
            for (var i = 0; i < data.length; i++) {
                if (!_.isUndefined(data[i].name)) {
                    divContent = divContent + '<li style="list-style-type: none;padding: 5px 10px;"><input type="checkbox" class="check-option1" id=data-checkbox-' + i + '>';
                    divContent = divContent + '<input type="text" style="width:70%" class="data-check-input" value="' + data[i].name + '" id="data-check-' + i + '">';
                    divContent = divContent + '<input type="radio" class="data-radio" style="margin: 0px 0px 0px 5px;" name="data-radio-' + i + '" id="data-rename-' + i + '">';
                    divContent = divContent + '<span class="data-radio-span">rename</span>';
                    divContent = divContent + '<input type="radio" class="data-radio" name="data-radio-' + i + '" checked id="data-overwrite-' + i + '">';
                    divContent = divContent + '<span class="data-radio-span" >overwrite</span>';
                    divContent = divContent + '</li>';
                }
            }
        }
        divContent = divContent + "</div>";
        divContent = divContent + '<div style="width: 16%; float:right">';
        divContent = divContent + '<div style="list-style-type: none;padding-left: 8px;"><input type="checkbox" class="check-option2"  id="check-all"><span> Check all</span></div>';
        divContent = divContent + '<div style="list-style-type: none;padding-left: 8px;"><input type="checkbox" class="check-option2"  id="uncheck-all"><span> Uncheck all</span></div>';
        divContent = divContent + '</div>';
        contentElement.innerHTML = divContent;

        return contentElement;
    }

    //-------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------
    // Clear datanodes 
    //-------------------------------------------------------------------------------------------------------------------
    //-------------------------------------------------------------------------------------------------------------------


    /*--------clear all data--------*/
    function clearAllData() {
        swal({
            title: "Are you sure?",
            text: "All dataNodes will be deleted and their connections with widgets!",
            type: "warning",
            showCancelButton: true,
            showConfirmButton: false,
            showConfirmButton1: true,
            confirmButtonText: 'Yes',
            cancelButtonText: "Abandon",
            closeOnConfirm: true,
            closeOnConfirm1: true,
            closeOnCancel: true
        },
            function (isConfirm) {
                if (isConfirm) {
                    datanodesManager.clear();
                    //AEF
                    var $body = angular.element(document.body);
                    var $rootScope = $body.scope().$root;
                    $rootScope.alldatanodes = datanodesManager.getAllDataNodes();
                    $rootScope.filtredNodes = $rootScope.alldatanodes.length;
                    $rootScope.showOneDatasource = false;
                    $rootScope.showNotifications = false;
                    $rootScope.updateFlagDirty(true);
                    $rootScope.safeApply();
                } else {
                    //nothing
                }
            });
    }

    //-------------------------------------------------------------------------------------------------------------------

    // public functions
    return {
        saveJson,
        clearAllData,
        getDuplicateDataList,
        getDataList,
        openJsonManager
    };

}());