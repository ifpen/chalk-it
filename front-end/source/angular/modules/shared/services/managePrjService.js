// ┌─────────────────────────────────────────────────────────────────────────────────┐ \\
// │ ManagePrjService                                                                │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                     │ \\
// | Licensed under the Apache License, Version 2.0                                  │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI, Ghiles HIDEUR                │ \\
// └─────────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'underscore';
import swal from 'sweetalert';
import PNotify from 'pnotify';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { singletons } from 'kernel/runtime/xdash-runtime-main';
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import { fileManager } from 'kernel/general/backend/file-management';

angular.module('modules').service('ManagePrjService', [
  '$rootScope',
  '$state',
  function ($rootScope, $state) {
    const self = this;

    /*---------- openProject ----------*/
    self.openProject = function (projectName, fileType, projectVue, callback) {
      const currentPrjDirty = $rootScope.currentPrjDirty || '';
      $rootScope.origin = 'projectEdition';
      if ($rootScope.currentProject.name !== projectName) {
        const condition = $rootScope.xDashFullVersion ? !!currentPrjDirty : !!currentPrjDirty && !$rootScope.isLiveDemo;
        if (condition) {
          swal(
            {
              title: 'Are you sure?',
              text: 'Your current project will be saved and closed before starting another project.',
              type: 'warning',
              showCancelButton: true,
              showConfirmButton: false,
              showConfirmButton1: true,
              confirmButtonText: 'Yes',
              cancelButtonText: 'Abandon',
              closeOnConfirm: true,
              closeOnConfirm1: true,
              closeOnCancel: true,
            },
            function (isConfirm) {
              if (isConfirm) {
                const endAction = function () {
                  openProjectCallback(projectName, fileType, projectVue, callback);
                };
                //save current project
                if ($rootScope.xDashFullVersion) {
                  fileManager.getFileListExtended(
                    'project',
                    $rootScope.currentProject.name,
                    undefined,
                    endAction,
                    true
                  );
                } else {
                  setTimeout(() => {
                    self.saveProjectToLocal(endAction);
                  }, 500);
                }
              } else {
                //nothing
              }
            }
          );
        } else {
          openProjectCallback(projectName, fileType, projectVue, callback);
        }
      } else {
        $rootScope.moduleOpenedFunction(true);
      }
    };

    function openProjectCallback(projectName, fileType, projectVue, callback) {
      $rootScope.origin = 'openProject';
      $rootScope.loadingBarStart();
      $rootScope.toggleMenuOptionDisplay('none');
      $state.go('modules', {});
      if (fileType === 'xprjson') {
        $rootScope.moduleOpened = false;
        const FileMngrInst = new FileMngrFct();
        let fileTypeServer = self.translateExtension(fileType);
        if (projectVue === 'gallery') {
          fileTypeServer = 'template';
        }
        FileMngrInst.ReadFile(fileTypeServer, projectName + '.' + fileType, async function (msg1, msg2, type) {
          if (type === 'success') {
            if ($rootScope.xDashFullVersion && !_.isUndefined(callback)) {
              callback(projectName);
            }
            await singletons.xdash.openProjectManager(msg1);
            const notice = new PNotify({
              title: projectName,
              text: "Your project '" + projectName + "' is ready!",
              type: 'success',
              delay: 1000,
              styling: 'bootstrap3',
            });
            $('.ui-pnotify-container').on('click', function () {
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
        });
      }
    }

    /*---------- translateExtension ----------------*/
    self.translateExtension = function (extension) {
      switch (extension) {
        case 'xprjson':
          return 'project';
        case 'html':
          return 'page';
        case 'xdsjson':
          return 'datanode';
      }
    };

    /*---------- closeProject ----------------*/
    self.closeProject = function (name, forceClose) {
      $rootScope.origin = 'closeProject';

      //
      if (forceClose) {
        _closePrj(name);
        return;
      }
      //

      if (!$('.tab--active').hasClass('changed')) {
        _closePrj(name);
      } else {
        // project dirty
        swal(
          {
            title: 'Are you sure?',
            text: 'The project will be closed without saving!',
            type: 'warning',
            showCancelButton: true,
            showConfirmButton: false,
            showConfirmButton1: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Abandon',
            closeOnConfirm: true,
            closeOnConfirm1: true,
            closeOnCancel: true,
          },
          function (isConfirm) {
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
      FileMngrInst.Close('project', name, function (msg1, msg2, type) {
        if (type == 'error') {
          swal(msg1, msg2, type);
        } else if (type == 'success') {
          let notice = new PNotify({
            title: 'Info project',
            text: "'" + name + "' has been successfully closed!",
            type: 'success',
            styling: 'bootstrap3',
          });
          $('.ui-pnotify-container').on('click', function () {
            notice.remove();
          });

          self.clearForNewProject();
          $rootScope.toggleMenuOptionDisplay('recent');
          $state.go('modules.cards.layout', { action: 'recent' });
        }
      });
    }

    /*---------- clearForNewProject ----------------*/
    self.clearForNewProject = function () {
      $rootScope.isLiveDemo = false;

      let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
      if (!_.isUndefined(scopeDashDn)) {
        scopeDashDn.searchDatanodeByName = '';
        scopeDashDn.applyDatanodeFilter();
      }
      $rootScope.currentPrjDirty = '';
      $rootScope.currentProject = {
        name: '',
        description: '',
        tags: [],
        groupName: '',
      };
      $rootScope.alldatanodes = [];
      $rootScope.safeApply();
      singletons.xdash.clear();
    };

    /*---------- downloadFile ----------------*/
    self.downloadFile = function (projectName, fType, projectView) {
      let fileTypeServer = 'project';
      fileTypeServer = self.translateExtension(fType);
      if (projectView === 'gallery') {
        fileTypeServer = 'template';
      }

      $rootScope.loadingBarStart();
      let FileMngrInst = new FileMngrFct();
      FileMngrInst.ReadFile(
        fileTypeServer,
        projectName + '.' + fType,
        function (msg1, msg2, type) {
          if (type === 'success') {
            //AEF
            let notice = new PNotify({
              title: projectName,
              text: "Your file '" + projectName + "' has been successfully downloaded!",
              type: 'success',
              styling: 'bootstrap3',
            });
            $('.ui-pnotify-container').on('click', function () {
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
    self.deleteFileInServer = function (projectName, fType) {
      let bCloseProject = false;
      let fileTypeServer = 'DeleteProject';
      let fileType = 'project';
      self.checkProjectStatus(projectName, 'deleted', function () {
        switch (fType) {
          case 'xprjson':
            fileTypeServer = 'DeleteProject';
            itemName = 'ProjectName';
            dataMsg = {
              ProjectName: projectName,
            };
            if (projectName == $rootScope.currentProject.name) {
              // MBG for issues #93 and #88
              bCloseProject = true;
            }
            break;
          case 'html':
            fileTypeServer = 'DeletePage';
            dataMsg = {
              FileName: projectName,
            };
            break;
          case 'xdsjson':
            fileTypeServer = 'DeleteData';
            dataMsg = {
              FileName: projectName,
            };
            break;
        }
        fileType = self.translateExtension(fType);
        swal(
          {
            title: 'Are you sure?',
            text: "The selected '" + projectName + "' file will be deleted!",
            type: 'warning',
            showCancelButton: true,
            showConfirmButton: false,
            showConfirmButton1: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Abandon',
            closeOnConfirm: true,
            closeOnConfirm1: true,
            closeOnCancel: true,
          },
          function (isConfirm) {
            $rootScope.loadingBarStart();
            if (isConfirm) {
              let FileMngrInst = new FileMngrFct();
              FileMngrInst.DeleteFile(fileType, projectName + '.' + fType, function (result) {
                let notice;
                if (result.Success) {
                  if (bCloseProject) {
                    $rootScope.origin = 'closeProject'; //AEF
                    self.closeProject(projectName);
                  } // MBG for issue #93
                  notice = new PNotify({
                    title: projectName,
                    text: "'" + projectName + "' has been successfully deleted!",
                    type: 'success',
                    styling: 'bootstrap3',
                  });
                } else {
                  notice = new PNotify({
                    title: projectName,
                    text: result,
                    type: 'error',
                    styling: 'bootstrap3',
                  });
                }
                $('.ui-pnotify-container').on('click', function () {
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
    self.checkProjectStatus = function (fileName, text, callback) {
      // READONLY
      const FileMngrInst = new FileMngrFct();
      FileMngrInst.GetStatus(fileName, 'project', function (msg1, msg2, type) {
        $rootScope.readOnly = false;
        if (type == 'success') {
          const msg = JSON.parse(msg1.Msg);
          $rootScope.readOnly = msg.OpenedBy.length > 0;
          if ($rootScope.readOnly) {
            const notice = new PNotify({
              title: fileName,
              text: 'This project cannot be ' + text + '!\n' + "It is already opened by\n'" + msg.OpenedBy + "'",
              type: 'warning',
              delay: 4000,
              styling: 'bootstrap3',
            });
            $('.ui-pnotify-container').on('click', function () {
              notice.remove();
            });
          }
        }
        if (!$rootScope.readOnly) {
          //authorize the rename
          callback();
        }
      });
    };

    /*---------- renameProject ----------------*/
    self.renameProject = function (fileName, flag, msg, fType) {
      const fileType = self.translateExtension(fType);
      let text = msg;
      if (_.isUndefined(text)) {
        text = 'Your current ' + fileType + ' will be renamed!';
      }
      // READONLY
      self.checkProjectStatus(fileName, 'renamed', function () {
        swal(
          {
            title: 'Project name',
            text: text,
            type: 'input',
            showConfirmButton: false,
            showConfirmButton1: true,
            showCancelButton: true,
            closeOnConfirm: false,
            closeOnConfirm1: false,
            confirmButtonText: 'Rename',
            inputPlaceholder: 'please write ' + fileType + ' name here ...',
            inputValue: fileName,
          },
          function (inputValue) {
            if (inputValue === false) {
              swal.close();
              return false; //cancel button
            }
            if (inputValue === '') {
              //empty input then ok button
              swal.showInputError('A ' + fileType + ' name is required!');
              return false;
            }
            if (inputValue === 'Untitled') {
              //Untitled not allowed when updating project
              swal.showInputError("'Untitled' " + fileType + ' name is not allowed!');
              return false;
            }

            //here when input is not empty then ok button
            if (inputValue != null) {
              const endAction = function (msg1, msg2, type) {
                renameFileCallback(type, fileName, inputValue, flag, fileType);
              };
              fileManager.renameFile(fileType, fileName, inputValue, endAction, flag);
            }
          }
        );
      });
    };

    function renameFileCallback(type, name, newName, flag, fType, callback) {
      const fileType = self.translateExtension(fType);
      if (type === 'success') {
        swal.close(); //
        const notice = new PNotify({
          title: newName,
          text: "'" + name + "' has been successfully renamed to " + newName + "'!",
          type: type,
          styling: 'bootstrap3',
        });
        $('.ui-pnotify-container').on('click', function () {
          notice.remove();
        });
        if (flag) {
          //cards view
          $rootScope.updateView();
          if (name == $rootScope.currentProject.name) {
            $('#projectName')[0].value = newName;
            $('.tab__name')[0].value = newName;
            $rootScope.currentProject.name = newName;
          }
        } else {
          //editor view
          $('#projectName')[0].value = newName;
          $('.tab__name')[0].value = newName;
          $rootScope.currentProject.name = newName;
        }
        if (callback) {
          callback(newName, fileType, $rootScope.shareProjectWithEmail);
        }
        $rootScope.loadingBarStop(); //
      } else if (type === 'error') {
        const notice = new PNotify({
          title: newName,
          text: 'Fail to rename your ' + fileType + " '" + name + "' to '" + newName + "'!",
          type: type,
          styling: 'bootstrap3',
        });
        $('.ui-pnotify-container').on('click', function () {
          notice.remove();
        });
      }
    }

    /*---------- duplicateProject ----------------*/
    const getDataProject = function (projectName, fType, callback) {
      const fileTypeServer = self.translateExtension(fType) || 'project';
      $rootScope.loadingBarStart();
      //extract project data (xprjson)
      let FileMngrInst = new FileMngrFct();
      FileMngrInst.ReadFile(
        fileTypeServer,
        projectName + '.' + fType,
        function (msg1, msg2, type) {
          if (type === 'success') {
            callback(projectName, msg1); //save project in server
          } else {
            swal(msg1, msg2, type);
          }
        },
        false //not write
      );
    };

    self.duplicateProject = function (projectName, fType) {
      if (projectName !== $rootScope.currentProject.name) {
        getDataProject(projectName, fType, self.dupli);
      } else {
        if ($rootScope.currentPrjDirty !== '') {
          swal(
            {
              title: 'Are you sure?',
              text: 'Your current project will be saved before duplication.',
              type: 'warning',
              showCancelButton: true,
              showConfirmButton: false,
              showConfirmButton1: true,
              confirmButtonText: 'Yes',
              cancelButtonText: 'Abandon',
              closeOnConfirm: true,
              closeOnConfirm1: true,
              closeOnCancel: true,
            },
            function (isConfirm) {
              if (isConfirm) {
                const endAction = function () {
                  getDataProject(projectName, fType, self.dupli);
                };
                //save current project then duplicate
                fileManager.getFileListExtended('project', projectName, undefined, endAction, true);
              } else {
                //nothing
              }
            }
          );
        } else {
          getDataProject(projectName, fType, self.dupli);
        }
      }
    };

    self.dupli = function (projectName, msg1) {
      swal(
        {
          title: 'Duplicate Project',
          text: 'You can write another name here:',
          type: 'input',
          showConfirmButton: false,
          showConfirmButton1: true,
          showCancelButton: true,
          confirmButtonText: 'Duplicate',
          closeOnConfirm: false,
          closeOnConfirm1: false,
          closeOnCancel: false,
          inputPlaceholder: 'please write project name here ...',
          inputValue: projectName + '_copy', //new default project name
        },
        function (inputValue) {
          $rootScope.loadingBarStart();
          if (inputValue === false) {
            swal.close();
            $rootScope.loadingBarStop();
            return false;
          } else {
            if (inputValue === '') {
              //empty input then ok button
              swal.showInputError('Project name is required!');
              return false;
            }
            const endAction = function () {
              const notice = new PNotify({
                title: projectName,
                text: "'" + projectName + "' has been successfully duplicated!",
                type: 'success',
                styling: 'bootstrap3',
              });
              $('.ui-pnotify-container').on('click', function () {
                notice.remove();
              });
              $rootScope.updateView();
              $rootScope.loadingBarStop();
            };
            //save duplicate project
            fileManager.getFileListExtended('project', inputValue, msg1, endAction);
          }
        }
      );
    };

    /**
     * @name saveProjectToLacal
     * @function
     * @description
     *  For opensource version
     *  Saves the current project to local storage and optionally triggers the callback function.
     *  This function also handles renaming projects and provides appropriate user notifications.
     *
     * @param {function} callback - Optional callback function to be triggered after the project is saved.
     * @returns {void}
     */
    self.saveProjectToLocal = function (callback) {
      const is_defaultOverwrite = true;
      const fileType = 'project';
      const inputProjectName = $('#projectName').val();
      const currentProjectName = $rootScope.currentProject.name;
      $rootScope.oldFileName = currentProjectName;

      const saveProjectOnServer = function (projectName) {
        fileManager.saveOnServer('project', inputProjectName, undefined, is_defaultOverwrite, callback);
      };

      const renameAndSaveProject = function () {
        const renameProjectCallback = function () {
          const FileMngrInst = new FileMngrFct();
          FileMngrInst.RenameFile(fileType, currentProjectName, inputProjectName, function (msg1, msg2, type) {
            renameLocalPrjCallBack(currentProjectName, inputProjectName, is_defaultOverwrite, type, callback);
          });
        };
        self.checkProjectName(inputProjectName, renameProjectCallback);
      };

      if (inputProjectName === '') {
        self.renameLocalProject(currentProjectName, is_defaultOverwrite, callback);
      } else if (currentProjectName === '') {
        // if the project has never been saved
        // Check the project name if it does not already exist and save
        self.checkProjectName(inputProjectName, function () {
          saveProjectOnServer(inputProjectName);
        });
      } else if (inputProjectName === currentProjectName) {
        saveProjectOnServer(inputProjectName);
      } else {
        // Rename and save the project
        renameAndSaveProject();
      }
    };

    /**
     * @name checkProjectName
     * @function
     * @description
     *  For opensource version
     *  Checks the availability of a project name.
     *
     * @param {string} projectName - The name of the project to be checked.
     * @param {function} callback - A callback function to be executed after the check.
     * @returns {void}
     */
    self.checkProjectName = function (projectName, callback) {
      datanodesManager.showLoadingIndicator(true);
      const FileMngrInst = new FileMngrFct();
      FileMngrInst.CheckNewProjectName('', projectName, 'project', '', function (msg1, msg2, type) {
        datanodesManager.showLoadingIndicator(false);
        switch (type) {
          case 'error':
            swal('error', msg2, type);
            break;
          case 'warning':
            {
              const notice = new PNotify({
                title: 'Info project',
                text: msg1,
                type: 'warning',
                styling: 'bootstrap3',
              });
              $('.ui-pnotify-container').on('click', function () {
                notice.remove();
              });
            }
            break;
          case 'success':
            callback();
            break;
        }
      });
    };

    /**
     * @name renameLocalProject
     * @function
     * @description
     *  For opensource version
     *  Renames a local project after confirming with the user.
     *
     * @param {string} currentProjectName - The current name of the project.
     * @param {boolean} is_defaultOverwrite - Flag indicating if the project should be overwritten by default.
     * @param {boolean} flag - Additional flag parameter for further customization.
     * @param {function} callback - Optional callback function to be triggered after the project is saved.
     * @returns {void}
     */
    self.renameLocalProject = function (currentProjectName, is_defaultOverwrite, callback) {
      swal(
        {
          title: 'Project name',
          text: 'A project name is required!',
          type: 'input',
          showConfirmButton: false,
          showConfirmButton1: true,
          showCancelButton: true,
          closeOnConfirm: false,
          closeOnConfirm1: false,
          confirmButtonText: 'Rename',
          inputPlaceholder: 'please write project name here ...',
          inputValue: currentProjectName,
        },
        function (inputValue) {
          if (inputValue === false) {
            swal.close();
            return false; //cancel button
          }
          if (inputValue === '') {
            //empty input then ok button
            swal.showInputError('A project name is required!');
            return false;
          }

          //here when input is not empty then ok button
          const saveProjectOnServer = function (projectName) {
            fileManager.saveOnServer('project', projectName, undefined, is_defaultOverwrite, callback);
          };

          const renameProjectCallback = function () {
            const FileMngrInst = new FileMngrFct();
            FileMngrInst.RenameFile('project', currentProjectName, inputValue, function (msg1, msg2, type) {
              renameLocalPrjCallBack(currentProjectName, inputValue, is_defaultOverwrite, type, callback);
            });
          };

          if (currentProjectName === '') {
            // If the project is not yet saved
            // Check the project name if it does not already exist and save
            self.checkProjectName(inputValue, function () {
              saveProjectOnServer(inputValue);
            });
          } else if (inputValue === currentProjectName) {
            // Keep the same project name if it already exists
            saveProjectOnServer(inputValue);
          } else {
            // Rename and save the project
            self.checkProjectName(inputValue, renameProjectCallback);
          }
        }
      );
    };

    /**
     * @name renameLocalPrjCallBack
     * @function
     * @description
     *  For opensource version
     *  Renames a project and shows a notification based on the rename status.
     *
     * @param {string} currentProjectName - The current name of the project.
     * @param {string} inputProjectName - The new name to be assigned to the project.
     * @param {boolean} is_defaultOverwrite -  Flag indicating if the project should be overwritten by default.
     * @param {string} type - The type of notification ("success" or "error").
     * @param {function} callback - Optional callback function to be triggered after the project is saved.
     * @returns {void}
     */
    function renameLocalPrjCallBack(currentProjectName, inputProjectName, is_defaultOverwrite, type, callback) {
      const noticeConfig = {
        title: inputProjectName,
        type: type,
        styling: 'bootstrap3',
      };

      if (type === 'success') {
        noticeConfig.text = `'${currentProjectName}' has been successfully renamed to '${inputProjectName}'!`;
        $('#projectName')[0].value = inputProjectName;
        $rootScope.currentProject.name = inputProjectName;
        $rootScope.loadingBarStop();

        fileManager.saveOnServer('project', inputProjectName, undefined, is_defaultOverwrite, callback);
      } else if (type === 'error') {
        noticeConfig.text = `Fail to rename your project '${currentProjectName}' to '${inputProjectName}'!`;
      }

      if (noticeConfig.hasOwnProperty('text')) {
        const notice = new PNotify(noticeConfig);
        $('.ui-pnotify-container').on('click', function () {
          notice.remove();
        });
      }
    }
  },
]);
