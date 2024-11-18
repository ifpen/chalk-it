// +--------------------------------------------------------------------+ \\
// ¦ xdash                                                              ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2024 IFPEN                                        ¦ \\
// ¦ Licensed under the Apache License, Version 2.0                     ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  ¦ \\
// +--------------------------------------------------------------------+ \\

import { xDashConfig } from 'config.js';

import _ from 'lodash';
import PNotify from 'pnotify';

import { fileManager } from 'kernel/general/backend/file-management';
import { FileMngr, FileMngrFct } from 'kernel/general/backend/FileMngr';
import { pyodideManager } from 'kernel/base/pyodide-loader';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { runtimeSingletons } from 'kernel/runtime-singletons';
import { editorSingletons } from 'kernel/editor-singletons';
import { XdashDataUpdateEngine } from './xdash-data-updates';
import { offSchedLogUser } from 'kernel/base/main-common';
import { DialogBox } from 'kernel/datanodes/gui/DialogBox';
import { widgetViewer } from 'kernel/dashboard/rendering/widget-viewer';
import { xdsjson } from 'kernel/datanodes/export/xdsjson';
import { htmlExport } from 'kernel/general/export/html-export';
import { pyodideLib } from 'kernel/base/pyodide-project';
import { xdashUpdateEngine } from 'kernel/base/xdash-data-updates';

// Editor only

export const Xdash = function () {
  const version = xDashConfig.version.fullVersion;

  var prjName = ''; //AEF
  var pageLoad = true;

  const $rootScope = angular.element(document.body).scope().$root;

  /*--------clear project--------*/
  function clear() {
    angular
      .element(document.body)
      .injector()
      .invoke([
        'UndoManagerService',
        (undoManagerService) => {
          undoManagerService.clear();
        },
      ]);

    datanodesManager.clear();
    editorSingletons.widgetEditor.clear();
    runtimeSingletons.xdashNotifications.clearAllNotifications(); //AEF: put after clearDashbord (after disposing datanodes and abort)

    $rootScope.updateFlagDirty(false);
    $('#projectName')[0].value = prjName;

    pyodideManager.reset(true, false);

    const layoutMgr = editorSingletons.layoutMgr;
    layoutMgr.resetDashboardTheme();
    layoutMgr.resetDashBgColor();

    const $scopeDash = angular.element(document.getElementById('help__wrap')).scope();
    $scopeDash.initFrame();
  }

  /*--------initMeta--------*/
  function initMeta() {
    let isoDate = new Date().toISOString();
    const meta = {
      version: version,
      [XdashDataUpdateEngine.VERSION_METADATA_KEY]: XdashDataUpdateEngine.CURRENT_VERSION,
      date: isoDate,
      name: '',
      description: '',
      groupName: '',
      tags: [],
      schedulerLogOff: offSchedLogUser.value,
    };

    return meta;
  }
  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------
  //  Serialize/Deserialize project
  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------

  /*--------serialize--------*/
  function serialize() {
    const meta = initMeta();
    meta.name = $('#projectName')[0].value || 'Untitled';

    if ($rootScope.currentProject) {
      meta.description = $rootScope.currentProject.description;
      meta.tags = $rootScope.currentProject.tags;
      meta.groupName = $rootScope.currentProject.groupName;
    }

    const data = datanodesManager.serialize();
    const libraries = pyodideLib.serialize();

    const { dashboard, display, pages } = editorSingletons.widgetEditor.serialize();
    const connections = widgetConnector.serialize();
    const navBarNotification = htmlExport.navBarNotification;

    const xdashPrj = {
      meta,
      data,
      libraries,
      dashboard,
      connections,
      display,
      navBarNotification,
    };

    if (pages) {
      xdashPrj.pages = pages;
      pages.pageMode = htmlExport.pageMode;
      pages.initialPage = htmlExport.initialPage;
    }

    return xdashPrj;
  }

  /*--------deserialize--------*/
  function deserialize(jsonObject) {
    if (!xdashUpdateEngine.hasCurrentVersion(jsonObject)) {
      try {
        $rootScope.updateFlagDirty(true);

        const notifications = xdashUpdateEngine.update(jsonObject);
        xdashUpdateEngine.displayNotifications(notifications);
      } catch (ex) {
        console.error(ex);
        swal({
          title: `Update failed`,
          icon: 'warning',
          text: ex?.message ?? 'The update did not complete successfully',
        });
        return false;
      }
    }

    try {
      $('#projectName')[0].value = jsonObject.meta.name;
      if (!_.isUndefined(jsonObject.meta.description))
        $rootScope.currentProject.description = jsonObject.meta.description;
      if (!_.isUndefined(jsonObject.meta.tags)) $rootScope.currentProject.tags = jsonObject.meta.tags;
      if (!_.isUndefined(jsonObject.meta.groupName)) $rootScope.currentProject.groupName = jsonObject.meta.groupName;

      if (!_.isUndefined(jsonObject.meta.schedulerLogOff)) offSchedLogUser.value = jsonObject.meta.schedulerLogOff;
      else offSchedLogUser.value = true; //AEF: can be set to xDashConfig.disableSchedulerLog by default.

      pyodideLib.deserialize(jsonObject); // GHI  : load pyodide packages

      //AEF: save prj version for compatibility
      jsonObject.data.version = jsonObject.meta.version;
      if (datanodesManager.load(jsonObject.data, true)) {
        angular
          .element(document.body)
          .injector()
          .invoke([
            'UndoManagerService',
            (undoManagerService) => {
              undoManagerService.clear();
            },
          ]);
      } else {
        clear();
        return false;
      }

      widgetViewer.reset();

      editorSingletons.widgetEditor.deserialize(jsonObject);
      widgetConnector.deserialize(jsonObject.connections);

      if (jsonObject.pages) {
        htmlExport.initialPage = jsonObject.pages.initialPage;
        htmlExport.pageMode = jsonObject.pages.pageMode;
      } else {
        htmlExport.initialPage = undefined;
        htmlExport.pageMode = undefined;
      }

      htmlExport.navBarNotification = jsonObject.navBarNotification ?? false;

      return true;
    } catch (ex) {
      console.error(ex);
      return false;
    }
  }

  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------
  //  Load (open) existing file (project, xdsjson)
  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------

  /*--------openFile--------*/
  function openFile(fileType, target) {
    if (target === 'local') openFromLocal(fileType);
    else if (target === 'server') openFromServer(fileType, true);
  }

  /*--------openFromLocal--------*/
  function openFromLocal(fileType) {
    //this function replace datanodesManager.loadDashboardFromLocalFile for xdsjson and can be used for project
    let fileExtension = FileMngr.GetFileExt(fileType);

    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      let input = document.createElement('input');
      input.type = 'file';
      input.setAttribute('accept', fileExtension);

      $(input).on('change', function (event) {
        if (fileType == 'project') swal.close(); // close modal if file is chosen
        let files = event.target.files;
        if (files && files.length > 0) {
          let file = files[0];
          let reader = new FileReader();
          datanodesManager.showLoadingIndicator(true);
          reader.addEventListener('load', function (fileReaderEvent) {
            let textFile = fileReaderEvent.target;
            if (fileType == 'project') {
              openProjectManager(textFile.result);
            } else if (fileType == 'datanode') {
              xdsjson.openJsonManager(textFile.result);
            }
          });

          reader.readAsText(file);
        }
      });
      $(input).trigger('click');
    } else {
      swal('Unable to load a file in this browser.', '', 'error');
    }
  }

  /*--------openFromServer--------*/
  function openFromServer(fileType, bShow) {
    let textButton = 'Previous';
    if (!bShow || fileType == 'datanode') {
      textButton = 'Cancel';
    }
    let FileMngrInst = new FileMngrFct();
    FileMngrInst.GetFileList(fileType, manageFileListCallback, false, textButton, null);
  }

  /*--------manageFileList--------*/
  function manageFileListCallback(msg1, msg2, type, textButton) {
    if (type == 'error') {
      swal(msg1, msg2, type);
    } else if (type == 'success') {
      let data = msg1; // exple: data = '"FileList":[{"Name":"a","Description":"b"},{"Name":"c","Description":"d"}]';
      let fileType = msg2;
      let fileTypeText = 'files';

      if (fileType == 'project') {
        fileTypeText = 'projects';
      } else if (fileType == 'datanode') {
        fileTypeText = 'xdsjson';
      }

      const contentElement = getFileList(data, 'Please select a ' + fileType + ': ');

      new DialogBox(
        contentElement,
        'List of available ' + fileTypeText + ' on server',
        'Open',
        textButton,
        function () {
          let selectId = $('#selectFile')[0];
          if (selectId.selectedIndex != -1) {
            //nothing is selected
            datanodesManager.showLoadingIndicator(true);
            let strUser = selectId.options[selectId.selectedIndex].value;
            swal.close(); // close sweet alert if file is chosen
            let FileMngrInst = new FileMngrFct();
            FileMngrInst.ReadFile(fileType, strUser, readProjectFileCallback);
          } else return true; //do not close modal
        }
      );
    }
  }

  /*--------getFileList--------*/
  function getFileList(data, text) {
    var contentElement = document.createElement('div');
    contentElement.classList.add('dashboard-form');
    var divContent = '<label for="selectFile">' + text + '</label>';
    divContent = divContent + '<select class="multiple h-full" name="select-file" id="selectFile" size="10">';

    if (!_.isUndefined(data.FileList)) {
      for (let i = 0; i < data.FileList.length; i++) {
        if (!_.isUndefined(data.FileList[i].Name)) {
          if (i == 0)
            //AEF: force the first item to be selected by default. In that case if smartphone display only one case it will be not empty
            divContent =
              divContent +
              '<option selected value ="' +
              data.FileList[i].Name +
              '">' +
              data.FileList[i].Name +
              '</option>';
          else
            divContent =
              divContent + '<option value ="' + data.FileList[i].Name + '">' + data.FileList[i].Name + '</option>';
        }
      }
    }
    divContent = divContent + '</select>';
    contentElement.innerHTML = divContent;
    return contentElement;
  }

  /*--------readProjectFile--------*/
  function readProjectFileCallback(msg1, msg2, type) {
    if (type == 'error') {
      swal(msg1, msg2, type);
    } else {
      let data = msg1;
      let fileType = msg2;

      if (fileType == 'project') {
        openProjectManager(data);
      } else if (fileType == 'datanode') {
        xdsjson.openJsonManager(data);
      }
    }
    datanodesManager.showLoadingIndicator(false);
  }

  /*--------initRootScopeCurrentProjectObject--------*/
  function initRootScopeCurrentProjectObject(JsonObject) {
    angular
      .element(document.body)
      .injector()
      .invoke([
        '$rootScope',
        function ($rootScope) {
          $rootScope.currentProject = {
            name: JsonObject.meta.name,
          };
        },
      ]);
  }

  /*--------readFileFromServer--------*/
  function readFileFromServer(projectName, fileTypeServer) {
    let FileMngrInst = new FileMngrFct();
    // MBG 14/09/2021
    let $body = angular.element(document.body);
    let $rootScope = $body.scope().$root;
    let $state = $body.scope().$state;
    $rootScope.origin = 'openProject';

    $rootScope.toggleMenuOptionDisplay('none');
    $state.go('modules', {}).then(function () {
      $rootScope.moduleOpened = false;
      FileMngrInst.ReadFile(fileTypeServer, projectName + '.xprjson', function (msg1, msg2, type) {
        if ($rootScope.$state.current.controller != 'ModulesController') {
          //add test
          $state.go('modules', {});
          console.log('switch to modules controller...'); //watch if this case occurs
        }
        //AEF: fix bug add params and test on it
        if (type === 'success') {
          runtimeSingletons.xdash.openProjectManager(msg1);
          let notice = new PNotify({
            title: projectName,
            text: 'Your ' + fileTypeServer + ' ' + projectName + ' is ready!',
            type: 'success',
            delay: 1800,
            styling: 'bootstrap3',
          });
          $('.ui-pnotify-container').on('click', function () {
            notice.remove();
          });
          $rootScope.loadingBarStop();
          $rootScope.currentProject.name = projectName;
        } else {
          swal(msg1, msg2, type);
        }
      });
    });
  }

  /*--------readFileFromUrl--------*/
  function readFileFromUrl(type, url) {
    let string;

    let jqxhr = $.get(url, function (data) {
      string = data;
    })
      .done(function () {
        // MBG 14/09/2021
        let $body = angular.element(document.body); // 1
        let $rootScope = $body.scope().$root;
        let $state = $body.scope().$state;
        $rootScope.origin = 'openProject';

        $rootScope.toggleMenuOptionDisplay('none');
        $state.go('modules', {});
        //
        readProjectFileCallback(string, type);
      })
      .fail(function (jqXHR, textStatus) {
        datanodesManager.showLoadingIndicator(false);
        swal('Error in loading xprjson from URL', 'Server response : ' + jqXHR.status, 'error');
      });
  }

  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------
  //  Load (open) existing project (specific functions)
  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------

  /*--------openProjectManager--------*/
  function openProjectManager(data) {
    let jsonObject;
    try {
      jsonObject = JSON.parse(data);
    } catch (err) {
      swal('Unable to load file', 'Project loading will be interrupted.', 'error');
      return;
    }

    initRootScopeCurrentProjectObject(jsonObject);
    let bOk = false;
    function loadFn(e) {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      scopeDash.reset();
      clear(); // MBG 01/08/2018 : important to do
      bOk = deserialize(jsonObject);
      datanodesManager.showLoadingIndicator(false);
      // TODO coords remove ?
      // document.removeEventListener('widgets-tab-loaded', loadFn);
      jsonObject = undefined; //ABK in case of  missed synchronization a second loadFn cannot be made
      if (!bOk) {
        //ABK
        swal('Unable to load your project', 'Project loading will be interrupted.', 'error');
        return false;
      }
    }
    // TODO coords remove ?
    // document.addEventListener('widgets-tab-loaded', loadFn); //ABK:fix bug: put addEvent here before if/else condition (before the loadFn)
    loadFn();
  }

  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------
  //  Save file json)
  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------

  async function saveAndClosePrj() {
    const $rootScope = angular.element(document.body).scope().$root;
    const forceClose = true;
    if ($rootScope.xDashFullVersion) {
      if ($rootScope.currentProject.name !== '') {
        // project is open
        const headerbarCtrl = angular.element(document.getElementById('headerbar-ctrl')).scope();

        if ($rootScope.currentPrjDirty == ' *') {
          //project is dirty
          const endAction = function () {
            headerbarCtrl.closeProject($rootScope.currentProject.name, forceClose);
            console.log('Your project is saved before closing');
          };
          fileManager.getFileListExtended('project', $rootScope.currentProject.name, undefined, endAction, true);
        } else {
          headerbarCtrl.closeProject($rootScope.currentProject.name);
          console.log('Your project was closed');
        }
      }
    } else if ($rootScope.currentPrjDirty == ' *') {
      const inputName = document.getElementById('projectName').value;
      const fileName = (inputName || 'untitled') + '-recovery';
      const temp = runtimeSingletons.xdash.serialize();
      temp.meta.name = fileName;
      const xdashFile = JSON.stringify(temp, null, '\t');

      const FileMngrInst = new FileMngrFct();
      FileMngrInst.SendText('project', fileName + '.xprjson', xdashFile, undefined);
    }
  }

  /*--------manage leave/refresh page--------*/
  $(window).bind('beforeunload', async function () {
    await saveAndClosePrj();
  });

  //-------------------------------------------------------------------------------------------------------------------

  // public functions
  return {
    openFile: openFile,
    openFromServer: openFromServer,
    serialize: serialize,
    initMeta: initMeta,
    openProjectManager: openProjectManager,
    deserialize: deserialize,
    clear: clear,
    pageLoad: pageLoad,
    readFileFromServer: readFileFromServer,
    readFileFromUrl: readFileFromUrl,
  };
};
