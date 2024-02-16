// ┌────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ ManagePrjSharingService                                                            │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                        │ \\
// | Licensed under the Apache License, Version 2.0                                     │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                                  │ \\
// └────────────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'underscore';
import PNotify from 'pnotify';
import { fileManager } from 'kernel/general/backend/file-management';
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import { modalsModule } from '../modals';

modalsModule.service('ManagePrjSharingService', [
  '$rootScope',
  function ($rootScope) {
    const self = this;

    /***********************************************************************************/
    /************************************ sharing modal ********************************/
    /***********************************************************************************/

    /*---------- shareProject ----------------*/
    self.shareProject = function (fileName, fileType) {
      //')).scope();

      if (_.isUndefined(fileType)) $rootScope.sharedUserEmail.fileType = _translateExtension('xprjson');
      else $rootScope.sharedUserEmail.fileType = _translateExtension(fileType);
      _initShareProject(fileName, $rootScope.sharedUserEmail.fileType);
      $rootScope.isSharePrjOpen = true;
    };

    /*---------- _translateExtension ----------------*/
    function _translateExtension(extension) {
      switch (extension) {
        case 'xprjson':
          return 'project';
        case 'html':
          return 'page';
        case 'xdsjson':
          return 'datanode';
      }
    }

    /*---------- _initShareProject ----------------*/
    function _initShareProject(fileName, fileType, callback) {
      if ($rootScope.sharedUserEmail.fileType === 'project') {
        if (_.isUndefined($rootScope.currentInfoProject)) $rootScope.currentInfoProject = {};
        $rootScope.currentInfoProject.name = fileName;
      }
      //get the shared emails with project
      $rootScope.loadingBarStart();
      $rootScope.sharedEmails = []; //[{ id: 0, name: 'User email' }];
      let name = fileName;
      let FileMngrInst = new FileMngrFct();
      FileMngrInst.GetSharing(name, fileType, function (msg1, msg2, type) {
        let notice;
        if (type == 'error') {
          notice = new PNotify({
            title: name,
            text: msg1,
            type: 'error',
            styling: 'bootstrap3',
          });
          $rootScope.loadingBarStop();
          $('.ui-pnotify-container').on('click', function () {
            notice.remove();
          });
        } else if (type == 'success') {
          try {
            ReceivedList = JSON.parse(msg1.Msg);
            for (var i in ReceivedList.List) {
              $rootScope.sharedEmails.push({
                id: parseInt(i) + 1,
                name: ReceivedList.List[i],
              });
            }
            $rootScope.ownerEmail = ReceivedList.Owner;
            if (!callback) {
              $rootScope.sharedUserEmail.selected = undefined; //$rootScope.sharedEmails.length > 0 ? $rootScope.sharedEmails[0] : undefined,
              $rootScope.sharedUserEmail.typed = ''; //$rootScope.sharedEmails.length > 0 ? $rootScope.sharedEmails[0].name : '',
              $rootScope.sharedUserEmail.fileName = _checkExtension(fileName, $rootScope.sharedUserEmail.fileType);
              $rootScope.loadingBarStop();
            } else {
              $rootScope.sharedUserEmail.fileName = fileName;
              callback();
            }
          } catch (error) {
            console.log(error);
          }
        }
      });
    }

    /*---------- _CheckExtension ----------------*/
    function _checkExtension(name, type) {
      var fileName = name;
      if (!_.isNull(fileName) && fileName !== '') {
        var ext = _getFileExtension(type);
        if (!name.endsWith(ext)) fileName = fileName + ext;
      }
      return fileName;
    }

    /*---------- _getFileExtension ----------------*/
    function _getFileExtension(type) {
      var res = '';

      if (type === 'project') res = '.xprjson';
      else if (type === 'datanode') res = '.xdsjson';
      else if (type === 'page') res = '.html';

      return res;
    }

    /*---------- closeShareProject ----------------*/
    self.closeShareProject = function (flag) {
      $rootScope.isSharePrjOpen = false;
      $rootScope.isCardView = flag;
      if (flag) $rootScope.updateView();
    };

    /*---------- updateTypedEmail ----------------*/
    self.updateTypedEmail = function () {
      if (!_.isNull($rootScope.sharedUserEmail.selected) && $rootScope.sharedUserEmail.selected.id != 0)
        $rootScope.sharedUserEmail.typed = $rootScope.sharedUserEmail.selected.name;
      else $rootScope.sharedUserEmail.typed = '';
    };

    /***********************************************************************************/
    /************************************ share action *********************************/
    /***********************************************************************************/

    /*---------- shareProjectWithEmail ----------------*/
    self.shareProjectWithEmail = function () {
      $rootScope.loadingBarStart();
      let name = $rootScope.sharedUserEmail.fileName;
      let email = $rootScope.sharedUserEmail.typed;
      let fileType = $rootScope.sharedUserEmail.fileType;
      let FileMngrInst = new FileMngrFct();
      FileMngrInst.ShareProject(name, fileType, email, 'true', _shareProjectCallback);
    };

    function _shareProjectCallback(msg1, msg2, type) {
      let name = $rootScope.sharedUserEmail.fileName;
      let email = $rootScope.sharedUserEmail.typed;
      let fileType = $rootScope.sharedUserEmail.fileType;
      let notice;
      if (type == 'error') {
        notice = new PNotify({
          title: name,
          text: msg1,
          type: 'error',
          styling: 'bootstrap3',
        });
        $rootScope.loadingBarStop();
      } else if (type == 'success') {
        notice = new PNotify({
          title: name,
          text: "'" + name + "' has been successfully shared!",
          type: 'success',
          styling: 'bootstrap3',
        });

        _initShareProject(name, fileType);
      } else if (type == 'warning') {
        //warning
        notice = new PNotify({
          title: name,
          text: msg1,
          type: 'warning',
          styling: 'bootstrap3',
        });
        swal(
          {
            title: 'Rename then share',
            text: 'Choose another name for your ' + fileType,
            type: 'input',
            showConfirmButton: false,
            showConfirmButton1: true,
            showCancelButton: true,
            closeOnConfirm: false,
            closeOnConfirm1: false,
            confirmButtonText: 'Rename',
            inputPlaceholder: 'please write a new ' + fileType + ' name here ...',
            inputValue: '',
          },
          function (inputValue) {
            if (inputValue === false) {
              swal.close();
              return false; //cancel button
            }
            if (inputValue === '') {
              //empty input then ok button
              swal.showInputError(fileType + ' name is required!');
              return false;
            }
            //here when input is not empty then ok button
            if (inputValue != null) {
              let FileMngrInst = new FileMngrFct();
              setTimeout(function () {
                FileMngrInst.CheckNewProjectName(name, inputValue, fileType, email, _renameAndShareProjectCallback);
              }, 500);

              swal.close();
            }
          }
        );
      }
      $('.ui-pnotify-container').on('click', function () {
        notice.remove();
      });
    }

    function _renameAndShareProjectCallback(msg1, msg2, type) {
      let name = $rootScope.sharedUserEmail.fileName;
      let newName = msg2;
      let email = $rootScope.sharedUserEmail.typed;
      let flag = $rootScope.isCardView;
      let fileType = $rootScope.sharedUserEmail.fileType;
      let notice;
      if (type == 'error') {
        notice = new PNotify({
          title: name,
          text: msg1,
          type: 'error',
          styling: 'bootstrap3',
        });
        $rootScope.loadingBarStop();
      } else if (type == 'success') {
        //rename and share here
        var endAction = function (msg1, msg2, type) {
          renameFileCallback(type, name, newName, flag, _initShareProject);
        };
        fileManager.renameFile(fileType, name, newName, endAction, flag);
      } else if (type == 'warning') {
        notice = new PNotify({
          title: name,
          text: msg1,
          type: 'warning',
          styling: 'bootstrap3',
        });
        swal(
          {
            title: 'Rename then share',
            text: 'Choose another name for your ' + fileType,
            type: 'input',
            showConfirmButton: false,
            showConfirmButton1: true,
            showCancelButton: true,
            closeOnConfirm: false,
            closeOnConfirm1: false,
            confirmButtonText: 'Rename',
            inputPlaceholder: 'please write a new ' + fileType + ' name here ...',
            inputValue: '',
          },
          function (inputValue) {
            if (inputValue === false) {
              swal.close();
              return false; //cancel button
            }
            if (inputValue === '') {
              //empty input then ok button
              swal.showInputError(fileType + ' name is required!');
              return false;
            }
            //here when input is not empty then ok button
            if (inputValue != null) {
              let FileMngrInst = new FileMngrFct();
              FileMngrInst.CheckNewProjectName(name, inputValue, fileType, email, _renameAndShareProjectCallback);
              swal.close();
            }
          }
        );
      }
      $('.ui-pnotify-container').on('click', function () {
        notice.remove();
      });
    }

    /***********************************************************************************/
    /********************************** unshare action *********************************/
    /***********************************************************************************/

    /*---------- shareProjectWithEmail ----------------*/
    self.unshareProjectWithEmail = function () {
      $rootScope.loadingBarStart();
      let name = $rootScope.sharedUserEmail.fileName;
      let email = $rootScope.sharedUserEmail.typed;
      let fileType = $rootScope.sharedUserEmail.fileType;
      let FileMngrInst = new FileMngrFct();
      FileMngrInst.ShareProject(name, fileType, email, 'false', _unshareProjectCallback);
    };

    function _unshareProjectCallback(msg1, msg2, type) {
      let name = $rootScope.sharedUserEmail.fileName;
      let fileType = $rootScope.sharedUserEmail.fileType;
      let notice;
      if (type == 'error') {
        notice = new PNotify({
          title: name,
          text: msg1,
          type: 'error',
          styling: 'bootstrap3',
        });
        $rootScope.loadingBarStop();
      } else if (type == 'success') {
        notice = new PNotify({
          title: name,
          text: "'" + name + "' has been successfully unshared!",
          type: 'success',
          styling: 'bootstrap3',
        });

        _initShareProject(name, fileType);
      }

      $('.ui-pnotify-container').on('click', function () {
        notice.remove();
      });
    }
  },
]);
