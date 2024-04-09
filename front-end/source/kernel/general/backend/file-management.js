﻿// +--------------------------------------------------------------------+ \\
// ¦ file manager                                                       ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2017-2023 IFPEN                                        ¦ \\
// ¦ Licensed under the Apache License, Version 2.0                     ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Abir EL FEKI                                  ¦ \\
// +--------------------------------------------------------------------+ \\

//-------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------
//  File Management: upload, download, delete
//-------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------


var fileManager = (function () {

    var is_xDash = true;
    var managerCallback = null;
    var endAction;
    var is_defaultOverwrite = false;
    var FileName = "";
    var openProjectCallback = null;

    /*--------getFileList--------*/
    function getFileList(data, text) {
        var contentElement = document.createElement('div');
        var divContent = '<p style="margin-bottom:5px">' + text + '</p>';
        divContent = divContent + '<select style="height:220px;overflow:auto;width:100%; max-width:100%; margin-bottom:15px" name="select-file" id="selectFile" multiple>';

        if (!_.isUndefined(data.FileList)) {
            for (var i = 0; i < data.FileList.length; i++) {
                if (!_.isUndefined(data.FileList[i].Name)) {
                    divContent = divContent + '<option value ="' + data.FileList[i].Name + '">' + data.FileList[i].Name + '</option>';
                }
            }
        }
        divContent = divContent + "</select>";
        contentElement.innerHTML = divContent;
        return contentElement;
    }

    //-------------------------------------------------------------------------------------------------------------------
    /*--------uploadFileCallback--------*/
    function uploadFileCallback(fileType, endActionArg) {
        endAction = endActionArg;
        var FileMngrInst = new FileMngrFct();
        var fileExtension = FileMngrInst.GetFileExt(fileType);

        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            var input = document.createElement('input');
            input.setAttribute('accept', fileExtension);
            input.type = "file";
            $(input).on("change", function (event) {
                var files = event.target.files;
                if (files && files.length > 0) {
                    var file = files[0];
                    var name = file.name.substring(0, file.name.length - fileExtension.length);
                    if (is_xDash) {
                        var reader = new FileReader();
                        reader.name = name;
                        datanodesManager.showLoadingIndicator(true);
                        reader.onload = function (event) {
                            datanodesManager.showLoadingIndicator(true);
                            var FileMngrInst = new FileMngrFct();
                            FileMngrInst.setEndAction(endActionArg); // MBG may be tmp
                            FileMngrInst.GetFileList(fileType, writeFileCallback, false, reader.name, reader.result);

                            var jsonObject;
                            try {
                                jsonObject = JSON.parse(reader.result);
                            } catch (err) {
                                swal("Parsing error while readling the file", "Project upload will be interrupted.", "error");
                                return;
                            }
                            // cache in settings.usr
                            var currentProject = {
                                name: jsonObject.meta.name,
                                description: jsonObject.meta.description,
                                tags: jsonObject.meta.tags,
                                groupName: jsonObject.meta.groupName
                            };
                        };
                        reader.readAsText(file);
                    } else {
                        var FileMngrInst = new FileMngrFct();
                        FileMngrInst.GetFileList(fileType, writexMAASFileCallback, false, name, file);
                    }
                }
            });
            $(input).trigger("click");
        } else {
            swal('Unable to load a file in this browser.', '', 'error');
        }
    }

    /*--------writeFileCallback--------*/
    function writeFileCallback(msg1, msg2, type, inputValue, xdashFileSerialized) {
        if (type == "error") {
            swal(msg1, msg2, type);
        } else if (type == "success") {
            var data = msg1;
            var fileType = msg2;
            var FileMngrInst = new FileMngrFct();
            var fileExtension = FileMngrInst.GetFileExt(fileType);
            var titleText = "file";

            if (fileType == "project") {
                titleText = "project";
            } else if (fileType == "datanode") {
                titleText = "xdsjson";
            } else if (fileType == "settings") {
                titleText = "User settings";
            }

            var bFound = isFileNameExist(data, inputValue);
            if (bFound && !is_defaultOverwrite) {
                let FileMngrInst = new FileMngrFct();
                FileMngrInst.GetStatus(inputValue, fileType, function (msg1, msg2, type) {
                    let $body = angular.element(document.body);
                    let $rootScope = $body.scope().$root;
                    if (type == "success") {
                        let msg = JSON.parse(msg1.Msg);
                        $rootScope.Shared = msg.Shared; //"True"
                    } else {
                        $rootScope.Shared = "False";
                    }
                    if ($rootScope.Shared == "True") { //ask to choose another name
                        new PNotify({
                            title: "Info project",
                            text: "'" + inputValue + "' is already in use",
                            type: "warning",
                            styling: "bootstrap3",
                        });
                        swal.close();
                        setTimeout(function () {
                            if (!_.isUndefined(xdashFileSerialized))
                                saveOnServer(fileType, inputValue, xdashFileSerialized, is_defaultOverwrite);
                            else
                                saveOnServer(fileType, inputValue, undefined, is_defaultOverwrite);
                        }, 500);
                    } else {
                        if (is_xDash)
                            datanodesManager.showLoadingIndicator(false);
                        swal({
                            title: "Are you sure?",
                            text: "'" + inputValue + fileExtension + "' " + titleText + " already exist! Rename or Overwrite?",
                            type: "warning",
                            showCancelButton: true,
                            showConfirmButton: false,
                            showConfirmButton1: true,
                            confirmButtonText: "Overwrite",
                            cancelButtonText: "Rename",
                            closeOnConfirm: true,
                            closeOnConfirm1: true,
                            closeOnCancel: false
                        },
                            function (isConfirm) {
                                if (isConfirm) {
                                    if (is_xDash)
                                        datanodesManager.showLoadingIndicator(true);
                                    if (!_.isUndefined(xdashFileSerialized))
                                        saveFileManager(fileType, inputValue, xdashFileSerialized);
                                    else
                                        saveFileManager(fileType, inputValue);
                                } else {
                                    if (!_.isUndefined(xdashFileSerialized))
                                        saveOnServer(fileType, inputValue, xdashFileSerialized, is_defaultOverwrite, openProjectCallback);
                                    else
                                        saveOnServer(fileType, inputValue, undefined, is_defaultOverwrite, openProjectCallback);
                                }
                            });
                    }
                });
            } else {
                if (!_.isUndefined(xdashFileSerialized))
                    saveFileManager(fileType, inputValue, xdashFileSerialized);
                else
                    saveFileManager(fileType, inputValue);
            }
        }
    }

    /*--------writexMAASFileCallback--------*/
    function writexMAASFileCallback(msg1, msg2, type, inputValue, file) {
        if (type == "error") {
            swal(msg1, msg2, type);
        } else if (type == "success") {
            var data = msg1;
            var fileType = msg2;
            var FileMngrInst = new FileMngrFct();
            var fileExtension = FileMngrInst.GetFileExt(fileType);
            var titleText = "file";

            if (fileType == "project") {
                titleText = "project";
            } else if (fileType == "datanode") {
                titleText = "xdsjson";
            } else if (fileType == "settings") {
                titleText = "User settings";
            } else if (fileType == "fmi") {
                titleText = "FMI";
            } else if (fileType == "spaas") {
                titleText = "Python script";
            } else if (fileType == "exe") {
                titleText = "EXE file";
            }

            var bFound = isFileNameExist(data, inputValue);
            var doWrite = !bFound;
            if (bFound) {
                swal({
                    title: "Are you sure?",
                    text: "'" + inputValue + fileExtension + "' " + titleText + " already exist! Rename or Overwrite?",
                    type: "warning",
                    showCancelButton: true,
                    showConfirmButton: false,
                    showConfirmButton1: true,
                    confirmButtonText: "Overwrite",
                    cancelButtonText: "Rename",
                    closeOnConfirm: true,
                    closeOnConfirm1: true,
                    closeOnCancel: false
                },
                    function (isConfirm) {
                        if (isConfirm) {
                            writexMAASFile(fileType, file, sendTextCallback);
                        } else
                            swal.close();
                    });
            }

            if (doWrite) {
                writexMAASFile(fileType, file, sendTextCallback);
            }
        }
    }

    /*--------writexMAASFile--------*/
    function writexMAASFile(fileType, file, callback) {
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.SendFile(fileType, file, callback);
        swal.close();
    }

    /*--------isFileNameExist--------*/
    function isFileNameExist(data, inputValue) {
        var bFound = false;
        if (!_.isUndefined(data.FileList)) {
            for (var i = 0; i < data.FileList.length; i++) {
                if (!_.isUndefined(data.FileList[i].Name)) {
                    if (data.FileList[i].Name.localeCompare(inputValue) == 0) { //file name exist
                        bFound = true;
                        break;
                    }
                }
            }
        }
        return bFound;
    }

    /*--------saveFileManager--------*/
    function saveFileManager(fileType, inputValue, xdashFileSerialized) {
        var xdashFile = "";
        var FileMngrInst = new FileMngrFct();
        var fileExtension = FileMngrInst.GetFileExt(fileType);
        if (!_.isUndefined(xdashFileSerialized))
            xdashFile = xdashFileSerialized;
        else {
            var temp = xdash.serialize();
            xdashFile = JSON.stringify(temp, null, '\t');
        }
        const $rootScope = angular.element(document.body).scope().$root;

        // Needed to rename the file
        // The new name is taken from xdashFile
        if (!$rootScope.xDashFullVersion) {
            inputValue = $rootScope.oldFileName;
        }
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.SendText(fileType, inputValue + fileExtension, xdashFile, sendTextCallback);
        swal.close();
    }

    /*--------sendTextCallback--------*/
    function sendTextCallback(msg1, msg2, type) {
        let text = msg1;
        if (type === "success" || type === "warning") {
            if (type === "warning")
                new PNotify({
                    title: "Capture failed",
                    text: msg1 + "\n" + msg2,
                    type: type,
                    styling: "bootstrap3",
                });

            var $body = angular.element(document.body);
            var $rootScope = $body.scope().$root;
            switch ($rootScope.origin) {
                case 'importProject':
                    text = "Your project has been successfully imported!";
                    break;
                case 'newProject':
                    text = "Your project has been successfully created!";
                    $rootScope.origin = "projectEdition";
                    break;
                case 'projectEdition':
                case 'openProject':
                case 'backToEditor':
                    text = "Your project has been successfully saved!";
                    break;
                default:
                    text = msg1;
            }
            let notice = new PNotify({
                title: "Info project",
                text: text,
                type: "success",
                styling: "bootstrap3",
            });
            $('.ui-pnotify-container').on('click', function () {
                notice.remove();
            });
            if (!_.isUndefined(endAction)) {
                endAction();
                endAction = undefined;
            }
            if (!$rootScope.xDashFullVersion && !_.isUndefined(openProjectCallback) && _.isFunction(openProjectCallback)) {
                openProjectCallback();
                openProjectCallback = null;
            }
            ///////
            var fileType = msg2;
            var FileMngrInst = new FileMngrFct();
            FileMngrInst.GetFileList(fileType, updateFileListCallback, false, null, null);
        } else if (type == "error") {
            swal(msg1, msg2, type);
            if (is_xDash)
                datanodesManager.showLoadingIndicator(false);
            endAction = undefined;
        }
    }

    /*--------saveOnServer--------*/
    function saveOnServer(fileType, inputValue, xdashFileSerialized, is_defaultOverwriteArg, openProjectCallbackArg) {
        openProjectCallback = openProjectCallbackArg;
        is_defaultOverwrite = is_defaultOverwriteArg;
        var inputValueParam = $('#projectName')[0].value;
        var titleText1 = "File";
        var titleText2 = "file";
        var xdashFileParam = null;

        if (fileType == "project") {
            titleText1 = "Project";
            titleText2 = "project";
            if (!_.isUndefined(xdashFileSerialized))
                xdashFileParam = xdashFileSerialized;
        } else if (fileType == "datanode") {
            titleText1 = "xdsjson file";
            titleText2 = "xdsjson file";
            if (!_.isNull(inputValue)) {
                xdashFileParam = xdashFileSerialized;
            } else {
                xdashFileParam = JSON.stringify(xdashFileSerialized, null, '\t'); //.serialize())
            }
        } else if (fileType == "settings") {
            titleText1 = "User settings";
            titleText2 = "User settings";
            if (!_.isNull(inputValue)) {
                xdashFileParam = xdashFileSerialized;
            } else {
                xdashFileParam = JSON.stringify(xdashFileSerialized, null, '\t'); //.serialize())
            }
        }

        var text = "Save as";
        var confirmButtonText = "Save";
        var title = titleText1 + " name";

        if (!_.isUndefined(inputValue) && !_.isNull(inputValue)) {
            inputValueParam = inputValue;
            FileName = inputValue;
            //titleText = "New " + titleText + " name";
            text = "Choose another " + fileType + " name: ";
            confirmButtonText = "Rename";
        }
        //AEF
        if (is_defaultOverwrite && inputValue != "Untitled") {
            text = "Your current " + titleText2 + " will be updated!";
            title = "Save " + titleText1;
            swal({
                title: title,
                text: text,
                type: "info",
                showConfirmButton: false,
                showConfirmButton1: true,
                showCancelButton: true,
                closeOnConfirm1: true,
                closeOnCancel: true,
                confirmButtonText: "Save"
            },
                function (isConfirm) {
                    //AEF
                    var $body = angular.element(document.body);
                    var $rootScope = $body.scope().$root;
                    var $state = $body.scope().$state;
                    //
                    if (isConfirm) {
                        //AEF
                        $("#projectName")[0].value = inputValue;
                        $rootScope.currentProject.name = inputValue;
                        //
                        getFileListExtended(fileType, inputValue, xdashFileParam, endAction, is_defaultOverwrite);
                    } else {
                        if (is_xDash)
                            datanodesManager.showLoadingIndicator(false);

                        return false; //cancel button
                    }
                });
        } else {
            swal({
                title: title,
                text: text,
                type: "input",
                showConfirmButton: false,
                showConfirmButton1: true,
                showCancelButton: true,
                closeOnConfirm: false,
                closeOnConfirm1: false,
                confirmButtonText: confirmButtonText,
                inputPlaceholder: "please write " + titleText2 + " name here ...",
                inputValue: inputValueParam
            },
                function (inputValue) {
                    //AEF
                    var $body = angular.element(document.body);
                    var $rootScope = $body.scope().$root;
                    var $state = $body.scope().$state;
                    //
                    if (inputValue === false) {
                        if (is_xDash)
                            datanodesManager.showLoadingIndicator(false);
                        //AEF
                        // if (FileName != "Untitled") {
                        //     $rootScope.toggleMenuOptionDisplay('cards');
                        //     $state.go("modules.cards.layout", { action: 'myProjects' });
                        // }
                        //
                        swal.close();
                        return false; //cancel button
                    }
                    if (inputValue === "") { //empty input then ok button 
                        swal.showInputError(titleText2 + " name is required!");
                        return false;
                    }
                    if (inputValue === "Untitled") { //Untitled not allowed when updating project
                        swal.showInputError("'Untiled' " + titleText2 + " name is not allowed!");
                        return false;
                    }

                    //here when input is not empty then ok button
                    if (inputValue != null) {
                        //AEF
                        // $("#projectName")[0].value = inputValue;
                        // $rootScope.currentProject.name = inputValue;
                        //
                        getFileListExtended(fileType, inputValue, xdashFileParam, endAction, is_defaultOverwrite);
                        swal.close();
                    }

                }
            );
        }
    }

    /*--------getFileListExtended--------*/
    function getFileListExtended(fileType, name, data, endActionArg, is_defaultOverwriteArg) {
        if (is_xDash)
            datanodesManager.showLoadingIndicator(true);
        endAction = endActionArg;
        is_defaultOverwrite = is_defaultOverwriteArg;
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.GetFileList(fileType, writeFileCallback, false, name, data);
    }

    /*--------renameFile--------*/
    function renameFile(fileType, name, newName, endActionArg, flag) {
        if (is_xDash)
            datanodesManager.showLoadingIndicator(true);
        endAction = endActionArg;
        let FileMngrInst = new FileMngrFct();
        FileMngrInst.CheckNewProjectName(name, newName, fileType, "", function (msg1, msg2, type) {
            //swal.close();
            if (is_xDash)
                datanodesManager.showLoadingIndicator(false);
            if (type == "error") {
                swal("error", msg2, type);
            } else if (type == "warning") {
                let text = "Choose another name for your " + fileType + "!";
                const notice = new PNotify({
                    title: name,
                    text: msg1,
                    type: "warning",
                    styling: "bootstrap3",
                });
                $('.ui-pnotify-container').on('click', function () {
                    notice.remove();
                });
                // setTimeout(function() {
                //     const $rootScope = angular.element(document.body).scope().$root;
                //     const controllerId = $rootScope.xDashFullVersion ? 'cards-ctrl': 'dash-content-top-ctrl';
                //     const $scopeController = angular.element(document.getElementById(controllerId)).scope();
                //     $scopeController.renameProject(name, flag, text);
                // }, 500);
            } else if (type == "success") {
                let FileMngrInst = new FileMngrFct();
                FileMngrInst.RenameFile(fileType, name, newName, endAction);
            }
        });
    }


    //-------------------------------------------------------------------------------------------------------------------
    /*--------downloadFileCallback--------*/
    function downloadFileCallback(fileType) {
        if (!_.isUndefined($("#selectFile")[0])) {
            var selectId = $("#selectFile")[0];
            if (selectId.selectedIndex != -1) {
                if (is_xDash)
                    datanodesManager.showLoadingIndicator(true);
                var strUsr = selectId.options[selectId.selectedIndex].value;
                var FileMngrInst = new FileMngrFct();
                FileMngrInst.ReadFile(fileType, strUsr, readFileCallback, true);
                if (is_xDash)
                    datanodesManager.showLoadingIndicator(false); //should be in readFileCallback
            }
        }
    }

    /*--------readFileCallback--------*/
    function readFileCallback(msg1, msg2, type) {
        if (type == "error") {
            swal(msg1, msg2, type);
        } else if (type == "success") {
            swal(msg1, "", type);
        }
        if (is_xDash)
            datanodesManager.showLoadingIndicator(false);
    }

    //-------------------------------------------------------------------------------------------------------------------


    /*--------updateFileListCallback--------*/
    function updateFileListCallback(msg1, msg2, type) {
        // swal(msg1, msg2, type);    
        if (is_xDash)
            datanodesManager.showLoadingIndicator(false);
    }

    //-------------------------------------------------------------------------------------------------------------------
    /*--------manageFileCallback--------*/
    function setManagerCallback(callback) {
        managerCallback = callback;
    }

    /*--------manageFileCallback--------*/
    function manageFileCallback(fileType) {
        if (managerCallback)
            managerCallback();
    }

    /*--------viewFileCallback--------*/
    function viewFileCallback(fileType) {
        if (fileType == "page") {
            if (!_.isUndefined($("#selectFile")[0])) {
                var selectId = $("#selectFile")[0];
                if (selectId.selectedIndex != -1) {
                    var strName = selectId.options[selectId.selectedIndex].value;
                    var FileMngrInst = new FileMngrFct();
                    FileMngrInst.ViewPage(fileType, strName, viewHtmlPageCallback);
                }
            }
        }
    }

    /*--------viewHtmlPageCallback--------*/
    function viewHtmlPageCallback(msg1, msg2, type) {
        if ((type === "success") && msg1) {
            openInNewTab(msg1.Msg, msg2);
        } else
            swal(msg1, msg2, type);

    }

    /*--------openInNewTab--------*/
    function openInNewTab(url, title) {
        setTimeout(function () {
            var win = window.open(url, "_blank");
            win.document.title = title;
        }, 300);
        //var a = document.createElement("a");
        //a.target = "_blank";
        //a.href = url;
        //a.click();
    }

    /*--------DialogBoxCheckFile--------*/
    //-------------------------------------------------------------------------------------------------------------------
    function DialogBoxCheckFile(contentElement, title, okTitle, cancelTitle, okCallback) {
        if (is_xDash) {
            DialogBox(contentElement, title, okTitle, cancelTitle, okCallback);
        } else {
            // Initialize our modal overlay
            var overlay = $('<div class="modalDialog modalDialogOpen" style="z-index:1000"></div>');
            if (!_.isUndefined($('.showSweetAlert')[0])) {
                $(overlay)[0].style.zIndex = 99999;
            }
            var modalDialog = $('<div class="modalDialog__wrapper"></div>');

            function closeModal() {
                overlay.fadeOut(200, function () {
                    $(this).remove();
                });
            }

            // Create our header
            modalDialog.append('<div class="modalDialog__header"><h2>' + title + '</h2></div>');
            var content = $('<div class="modalDialog__content"></div>').appendTo(modalDialog);
            content.append(contentElement);
            // Create our footer
            var footer = $('<div class="modalDialog__footer"></div>').appendTo(modalDialog);

            if (okTitle) {
                $('<input id="dialog-ok" type="button" class="bouton" value="' + okTitle + '"></input>').appendTo(footer).click(function () {
                    var hold = false;

                    if (_.isFunction(okCallback)) {
                        hold = okCallback();
                    }

                    if (!hold) {
                        closeModal();
                    }
                });
            }

            if (cancelTitle) {
                $('<input id="dialog-cancel" type="button" class="bouton" value="' + cancelTitle + '"></input>').appendTo(footer).click(function () {
                    closeModal();
                });
            }

            overlay.append(modalDialog);
            $("body").append(overlay);

            overlay.fadeIn(200);
        }
    }

    /*--------dialogBoxFileUpload--------*/
    function dialogBoxFileUpload(fileType, endAction) {
        uploadFileCallback(fileType, endAction);
    }

    /*--------DialogBoxFileManagement--------*/
    function DialogBoxFileManagement(contentElement, title, btn1Title, btn2Title, btn3Title, btn4Title, btn1Callback, btn2Callback, btn3Callback, btn4Callback, fileType) {

        // Initialize our modal overlay
        var overlay = $('<div class="modalDialog modalDialogOpen" style="z-index:1000"></div>');
        var modalDialog = $('<div></div>');

        // Create our header
        modalDialog.append('<h3 style="text-transform: uppercase;">' + title + '</h3>');
        modalDialog.append(contentElement);

        // Create our footer
        var footer = $('<div></div>').appendTo(modalDialog);

        function closeModal() {
            overlay.fadeOut(200, function () {
                $(this).remove();
            });
        }

        if (btn1Title) { //upload
            $('<input id="dialog-ok1" type="button" class="bouton" value="' + btn1Title + '"></input>').appendTo(footer).click(function () {
                if (_.isFunction(btn1Callback)) {
                    btn1Callback(fileType);
                }
            });
            $('<input class="inputFile" type="file" id="inputSelect" accept=".xprjson" style="display: none;"/> ').appendTo(footer);
        }

        if (btn2Title) { //download
            $('<input id="dialog-ok2" type="button" class="bouton disabled" disabled value="' + btn2Title + '"></input>').appendTo(footer).click(function () {
                if (_.isFunction(btn2Callback)) {
                    btn2Callback(fileType);
                }
            });
        }

        if (btn3Title) { //delete
            $('<input id="dialog-ok3" type="button" class="bouton disabled" disabled value="' + btn3Title + '"></input>').appendTo(footer).click(function () {
                if (_.isFunction(btn3Callback)) {
                    btn3Callback(fileType);
                }
            });
        }

        if (btn4Title) { //manage
            $('<input id="dialog-ok4" type="button" class="bouton disabled" disabled value="' + btn4Title + '"></input>').appendTo(footer).click(function () {
                var hold = true;

                if (_.isFunction(btn4Callback)) {
                    hold = btn4Callback(fileType);
                }

                if (!hold) {
                    closeModal();
                }
            });
        }

        //close
        var btn5Title = "Close";
        if (btn5Title) {
            $('<input id="dialog-cancel" type="button" class="bouton" style="float:right" value="' + btn5Title + '"></input>').appendTo(footer).click(function () {
                closeModal();
            });
        }

        overlay.append(modalDialog);
        $("body").append(overlay);

        $("select[name=select-file]").on('change', function (e) {
            var selectId = $("#selectFile")[0];
            if (selectId.selectedIndex != -1) {
                if (btn2Title) {
                    if ($("#dialog-ok2").hasClass("disabled")) {
                        $("#dialog-ok2").removeClass("disabled");
                        $("#dialog-ok2")[0].removeAttribute("disabled");
                    }
                }
                if (btn3Title) {
                    if ($("#dialog-ok3").hasClass("disabled")) {
                        $("#dialog-ok3").removeClass("disabled");
                        $("#dialog-ok3")[0].removeAttribute("disabled");
                    }
                }
                if (btn4Title) {
                    if ($("#dialog-ok4").hasClass('disabled')) {
                        $("#dialog-ok4").removeClass('disabled');
                        $("#dialog-ok4")[0].removeAttribute("disabled");
                    }
                }
            } else {
                if (btn2Title) {
                    if (!$("#dialog-ok2").hasClass('disabled')) {
                        $("#dialog-ok2").addClass('disabled');
                        $("#dialog-ok2")[0].setAttribute("disabled", "disabled");
                    }
                }
                if (btn3Title) {
                    if (!$("#dialog-ok3").hasClass('disabled')) {
                        $("#dialog-ok3").addClass('disabled');
                        $("#dialog-ok3")[0].setAttribute("disabled", "disabled");
                    }
                }
                if (btn4Title) {
                    if (!$("#dialog-ok4").hasClass('disabled')) {
                        $("#dialog-ok4").addClass('disabled');
                        $("#dialog-ok4")[0].setAttribute("disabled", "disabled");
                    }
                }
            }
        });
        overlay.fadeIn(200);
    }

    // public functions
    return {
        setManagerCallback: setManagerCallback,
        getFileList: getFileList,
        saveOnServer: saveOnServer,
        getFileListExtended: getFileListExtended,
        dialogBoxFileUpload: dialogBoxFileUpload,
        renameFile: renameFile
    };

}());