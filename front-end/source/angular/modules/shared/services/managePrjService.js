// ┌─────────────────────────────────────────────────────────────────────────────────┐ \\
// │ ManagePrjService                                                                │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                     │ \\
// | Licensed under the Apache License, Version 2.0                                  │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI, Ghiles HIDEUR                │ \\
// └─────────────────────────────────────────────────────────────────────────────────┘ \\


angular
    .module('modules')
    .service('ManagePrjService', ['$rootScope', '$state', function($rootScope, $state) {

        const self = this;

        /*---------- openProject ----------*/
        self.openProject = function (projectName, fileType, projectVue, callback) {
            $rootScope.origin = "projectEdition";
            if ($rootScope.currentProject.name !== projectName) {
                const exp = !_.isUndefined($rootScope.currentPrjDirty) && $rootScope.currentPrjDirty !== "";
                const condition = $rootScope.xDashFullVersion ? exp : (exp && !$rootScope.isLiveDemo);
                if (condition) {
                    swal({
                            title: "Are you sure?",
                            text: "Your current project will be saved and closed before starting another project.",
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
                        function(isConfirm) {
                            if (isConfirm) {
                                var endAction = function() {
                                    _openProject(projectName, fileType, projectVue, callback);
                                };
                                //save current project  
                                if ($rootScope.xDashFullVersion) {
                                    fileManager.getFileListExtended("project", $rootScope.currentProject.name, undefined, endAction, true);
                                } else {
                                    const $scopeDashContentTopCtrl = angular.element(document.getElementById("dash-content-top-ctrl")).scope();
                                    $scopeDashContentTopCtrl.saveProjectToLocal(endAction);
                                }
                            } else {
                                //nothing
                            }
                        });
                } else {
                    _openProject(projectName, fileType, projectVue, callback);
                }
            } else {
                $rootScope.moduleOpenedFunction(true);
            }

        };

        function _openProject(projectName, fileType, projectVue, callback) {
            $rootScope.origin = "openProject";
            $rootScope.loadingBarStart();
            $rootScope.toggleMenuOptionDisplay('none');
            $state.go("modules", {});
            if (fileType === "xprjson") {
                $rootScope.moduleOpened = false;
                const FileMngrInst = new FileMngrFct();
                const fileTypeServer = self.translateExtension(fileType);
                if (projectVue === "gallery") {
                    fileTypeServer = "template";
                }
                FileMngrInst.ReadFile(
                    fileTypeServer,
                    projectName + "." + fileType,
                    async function(msg1, msg2, type) {
                        if (type === "success") {
                            if ($rootScope.xDashFullVersion && !_.isUndefined(callback)) {
                                callback(projectName);
                            }
                            await xdash.openProjectManager(msg1);
                            const notice = new PNotify({
                                title: projectName,
                                text: "Your project '" + projectName + "' is ready!",
                                type: "success",
                                delay: 1000,
                                styling: "bootstrap3"
                            });
                            $('.ui-pnotify-container').on('click', function() {
                                notice.remove();
                            });
                            $rootScope.loadingBarStop();
                            $rootScope.currentProject.name = projectName;
                            $rootScope.filtredList = [];
                            $rootScope.filtredNodes = $rootScope.alldatanodes.length;
                            if (!$rootScope.xDashFullVersion) {
                                $rootScope.isLiveDemo = false;
                            }
                        } else {
                            swal(msg1, msg2, type);
                        }
                    }
                );
            }
        }

        /*---------- translateExtension ----------------*/
        self.translateExtension = function(extension) {
            switch (extension) {
                case "xprjson":
                    return "project";
                case "html":
                    return "page";
                case "xdsjson":
                    return "datanode";
            }
        };

        /*---------- closeProject ----------------*/
        self.closeProject = function(name, forceClose) {
            $rootScope.origin = "closeProject";

            //
            if (forceClose) {
                _closePrj(name);
                return;
            }
            //
                
            if (!$(".tab--active").hasClass("changed")) {
                _closePrj(name);

            } else { // project dirty
                swal({
                    title: "Are you sure?",
                        text: "The project will be closed without saving!",
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
                    function(isConfirm) {
                        if (isConfirm) {
                            _closePrj(name);
                            //
                        } else {
                            //nothing
                        }
                    }
                );
            }
        };

        function _closePrj(name) {
            let FileMngrInst = new FileMngrFct();
            FileMngrInst.Close("project", name, function(msg1, msg2, type) {
                if (type == "error") {
                    swal(msg1, msg2, type);
                } else if (type == "success") {
                    let notice = new PNotify({
                        title: "Info project",
                        text: "'" + name + "' has been successfully closed!",
                        type: "success",
                        styling: "bootstrap3",
                    });
                    $('.ui-pnotify-container').on('click', function() {
                        notice.remove();
                    });

                    self.clearForNewProject();
                    $rootScope.toggleMenuOptionDisplay('recent');
                    $state.go("modules.cards.layout", { action: 'recent' });
                }
            });
        }

        /*---------- clearForNewProject ----------------*/
        self.clearForNewProject = function() {
            $rootScope.isLiveDemo = false;

            let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
            if (!_.isUndefined(scopeDashDn)) {
                scopeDashDn.searchDatanodeByName = "";
                scopeDashDn.applyDatanodeFilter();
            }
            $rootScope.currentPrjDirty = "";
            $rootScope.currentProject = {
                name: "",
                description: "",
                tags: [],
                groupName: ""
            };
            $rootScope.alldatanodes = [];
            $rootScope.safeApply();
            xdash.clear();
        };


        /*---------- downloadFile ----------------*/
        self.downloadFile = function(projectName, fType, projectView) {
            let fileTypeServer = "project";
            fileTypeServer = self.translateExtension(fType);
            if (projectView === "gallery") {
                fileTypeServer = "template";
            }

            $rootScope.loadingBarStart();
            let FileMngrInst = new FileMngrFct();
            FileMngrInst.ReadFile(
                fileTypeServer,
                projectName + "." + fType,
                function(msg1, msg2, type) {
                    if (type === "success") {
                        //AEF
                        let notice = new PNotify({
                            title: projectName,
                            text: "Your file '" + projectName + "' has been successfully downloaded!",
                            type: 'success',
                            styling: 'bootstrap3'
                        });
                        $('.ui-pnotify-container').on('click', function() {
                            notice.remove();
                        });
                        //
                    } else {
                        swal(msg1, msg2, type);
                    }
                },
                true
            );
        };

        /*---------- deleteFileInServer ----------------*/
        self.deleteFileInServer = function(projectName, fType) {
            let bCloseProject = false;
            let fileTypeServer = "DeleteProject";
            let fileType = "project";
            self.checkProjectStatus(projectName, "deleted", function() {
                switch (fType) {
                    case "xprjson":
                        fileTypeServer = "DeleteProject";
                        itemName = "ProjectName";
                        dataMsg = {
                            ProjectName: projectName,
                        };
                        if (projectName == $rootScope.currentProject.name) { // MBG for issues #93 and #88
                            bCloseProject = true;
                        }
                        break;
                    case "html":
                        fileTypeServer = "DeletePage";
                        dataMsg = {
                            FileName: projectName,
                        };
                        break;
                    case "xdsjson":
                        fileTypeServer = "DeleteData";
                        dataMsg = {
                            FileName: projectName,
                        };
                        break;
                }
                fileType = self.translateExtension(fType);
                swal({
                        title: "Are you sure?",
                        text: "The selected '" + projectName + "' file will be deleted!",
                        type: "warning",
                        showCancelButton: true,
                        showConfirmButton: false,
                        showConfirmButton1: true,
                        confirmButtonText: "Yes",
                        cancelButtonText: "Abandon",
                        closeOnConfirm: true,
                        closeOnConfirm1: true,
                        closeOnCancel: true,
                    },
                    function(isConfirm) {
                        $rootScope.loadingBarStart();
                        if (isConfirm) {
                            let FileMngrInst = new FileMngrFct();
                            FileMngrInst.DeleteFile(fileType, projectName + "." + fType, function(result) {
                                let notice;
                                if (result.Success) {
                                    if (bCloseProject) {
                                        $rootScope.origin = "closeProject"; //AEF
                                        self.closeProject(projectName);
                                    } // MBG for issue #93
                                    notice = new PNotify({
                                        title: projectName,
                                        text: "'" + projectName + "' has been successfully deleted!",
                                        type: "success",
                                        styling: "bootstrap3",
                                    });
                                } else {
                                    notice = new PNotify({
                                        title: projectName,
                                        text: result,
                                        type: "error",
                                        styling: "bootstrap3",
                                    });
                                }
                                $('.ui-pnotify-container').on('click', function() {
                                    notice.remove();
                                });
                                $rootScope.updateView();
                            });
                            $rootScope.loadingBarStop();
                        } else {
                            $rootScope.loadingBarStop();
                        }
                    }
                );
            });
        };

        /*---------- checkProjectStatus ----------------*/
        self.checkProjectStatus = function(fileName, text, callback) {
            // READONLY
            let FileMngrInst = new FileMngrFct();
            FileMngrInst.GetStatus(fileName, "project", function(msg1, msg2, type) {
                $rootScope.readOnly = false;
                if (type == "success") {
                    let msg = JSON.parse(msg1.Msg);
                    $rootScope.readOnly = (msg.OpenedBy.length > 0);
                    if ($rootScope.readOnly) {
                        let notice = new PNotify({
                            title: fileName,
                            text: "This project cannot be " + text + "!\n" +
                                "It is already opened by\n'" +
                                msg.OpenedBy + "'",
                            type: "warning",
                            delay: 4000,
                            styling: "bootstrap3",
                        });
                        $('.ui-pnotify-container').on('click', function() {
                            notice.remove();
                        });
                    }
                }
                if (!$rootScope.readOnly) { //authorize the rename
                    callback();
                }
            });
        };

        /*---------- renameProject ----------------*/
        self.renameProject = function(fileName, flag, msg, fType) {
            let text = msg;
            let fileType = self.translateExtension(fType);
            if (_.isUndefined(text))
                text = "Your current " + fileType + " will be renamed!";
            // READONLY
            self.checkProjectStatus(fileName, "renamed", function() {
                swal({
                        title: "Project name",
                        text: text,
                        type: "input",
                        showConfirmButton: false,
                        showConfirmButton1: true,
                        showCancelButton: true,
                        closeOnConfirm: false,
                        closeOnConfirm1: false,
                        confirmButtonText: "Rename",
                        inputPlaceholder: "please write " + fileType + " name here ...",
                        inputValue: fileName
                    },
                    function(inputValue) {
                        if (inputValue === false) {
                            swal.close();
                            return false; //cancel button
                        }
                        if (inputValue === "") { //empty input then ok button 
                            swal.showInputError("A " + fileType + " name is required!");
                            return false;
                        }
                        if (inputValue === "Untitled") { //Untitled not allowed when updating project
                            swal.showInputError("'Untitled' " + fileType + " name is not allowed!");
                            return false;
                        }

                        //here when input is not empty then ok button
                        if (inputValue != null) {
                            var endAction = function(msg1, msg2, type) {
                                renameFileCallback(type, fileName, inputValue, flag, fileType);
                            };
                            if ($rootScope.xDashFullVersion) {
                                fileManager.renameFile(fileType, fileName, inputValue, endAction, flag);
                            } else {
                                if (fileName === "Untitled" || fileName === "") {
                                    fileManager.saveOnServer('project', inputValue, null, true, null);
                                } else {
                                    fileManager.renameFile(fileType, fileName, inputValue, endAction, flag);
                                }
                            }
                        }
                    }
                );

            });
        };

        function renameFileCallback(type, name, newName, flag, fType, callback) {
            let fileType = self.translateExtension(fType);
            if (type === "success") {
                swal.close(); //
                let notice = new PNotify({
                    title: newName,
                    text: "'" + name + "' has been successfully renamed to " + newName + "'!",
                    type: type,
                    styling: "bootstrap3",
                });
                $('.ui-pnotify-container').on('click', function() {
                    notice.remove();
                });
                if (flag) { //cards view
                    $rootScope.updateView();
                    if (name == $rootScope.currentProject.name) {
                        $("#projectName")[0].value = newName;
                        $(".tab__name")[0].value = newName;
                        $rootScope.currentProject.name = newName;
                    }
                } else { //editor view
                    $("#projectName")[0].value = newName;
                    if ($rootScope.xDashFullVersion) {
                        $(".tab__name")[0].value = newName;
                    } else {
                        $rootScope.currentPrjDirty = "";
                    }
                    $rootScope.currentProject.name = newName;
                }
                if (callback)
                    callback(newName, fileType, $rootScope.shareProjectWithEmail);
                $rootScope.loadingBarStop(); //
            } else if (type === "error") {
                let notice = new PNotify({
                    title: newName,
                    text: "Fail to rename your " + fileType + " '" + name + "' to '" + newName + "'!",
                    type: type,
                    styling: "bootstrap3",
                });
                $('.ui-pnotify-container').on('click', function() {
                    notice.remove();
                });
            }
        }

        /*---------- duplicateProject ----------------*/
        getDataProject = function(projectName, fType, callback) {
            let fileTypeServer = "project";
            fileTypeServer = self.translateExtension(fType);
            $rootScope.loadingBarStart();
            //extract project data (xprjson)
            let FileMngrInst = new FileMngrFct();
            FileMngrInst.ReadFile(
                fileTypeServer,
                projectName + "." + fType,
                function(msg1, msg2, type) {
                    if (type === "success") {
                        callback(projectName, msg1); //save project in server
                    } else {
                        swal(msg1, msg2, type);
                    }
                },
                false //not write
            );
        };

        self.duplicateProject = function(projectName, fType) {
            if (projectName !== $rootScope.currentProject.name) {
                getDataProject(projectName, fType, self.dupli);
            } else {
                if ($rootScope.currentPrjDirty !== "") {
                    swal({
                            title: "Are you sure?",
                            text: "Your current project will be saved before duplication.",
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
                        function(isConfirm) {
                            if (isConfirm) {
                                var endAction = function() {
                                    getDataProject(projectName, fType, self.dupli);
                                };
                                //save current project then duplicate
                                fileManager.getFileListExtended("project", projectName, undefined, endAction, true);
                            } else {
                                //nothing
                            }
                        });
                } else {
                    getDataProject(projectName, fType, self.dupli);
                }
            }
        };

        self.dupli = function(projectName, msg1) {
            swal({
                    title: "Duplicate Project",
                    text: "You can write another name here:",
                    type: "input",
                    showConfirmButton: false,
                    showConfirmButton1: true,
                    showCancelButton: true,
                    confirmButtonText: "Duplicate",
                    closeOnConfirm: false,
                    closeOnConfirm1: false,
                    closeOnCancel: false,
                    inputPlaceholder: "please write project name here ...",
                    inputValue: projectName + "_copy", //new default project name
                },
                function(inputValue) {
                    $rootScope.loadingBarStart();
                    if (inputValue === false) {
                        swal.close();
                        $rootScope.loadingBarStop();
                        return false;
                    } else {
                        if (inputValue === "") { //empty input then ok button
                            swal.showInputError("Project name is required!");
                            return false;
                        }
                        var endAction = function() {
                            let notice = new PNotify({
                                title: projectName,
                                text: "'" + projectName + "' has been successfully duplicated!",
                                type: "success",
                                styling: "bootstrap3",
                            });
                            $('.ui-pnotify-container').on('click', function() {
                                notice.remove();
                            });
                            $rootScope.updateView();
                            $rootScope.loadingBarStop();
                        };
                        //save duplicate project
                        fileManager.getFileListExtended("project", inputValue, msg1, endAction);

                    }
                }
            );
        };

    }]);