// +--------------------------------------------------------------------+ \\
// ¦ xdash                                                              ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2023 IFPEN                                        ¦ \\
// ¦ Licensed under the Apache License, Version 2.0                     ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  ¦ \\
// +--------------------------------------------------------------------+ \\

var xdash = (function () {
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
    widgetEditor.clear();
    xdashNotifications.clearAllNotifications(); //AEF: put after clearDashbord (after disposing datanodes and abort)

    $rootScope.updateFlagDirty(false);
    $('#projectName')[0].value = prjName;
    pyodideManager.reset(true, false);

    layoutMgr.resetDashBgColor();
    layoutMgr.resetDashboardTheme();

    const $scopeDash = angular.element(document.getElementById('help__wrap')).scope();
    $scopeDash.initFrame();
  }

  /*--------initMeta--------*/
  function initMeta() {
    const meta = {
      version: version,
      [XdashDataUpdateEngine.VERSION_METADATA_KEY]: XdashDataUpdateEngine.CURRENT_VERSION,
      date: Date(),
      name: '',
      description: '',
      groupName: '',
      tags: [],
      schedulerLogOff: offSchedLogUser,
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
    let scale;
    if (
      !$rootScope.moduleOpened &&
      tabActive == 'widgets' &&
      modeActive == 'edit-dashboard' &&
      editorStatus == 'full'
    ) {
      scale = widgetEditor.getCurrentDashZoneDims();
    } else {
      scale = widgetEditor.getSnapshotDashZoneDims();
    }

    const dash = widgetEditor.serialize();
    const deviceCols = layoutMgr.serializeCols();
    const backgroundColor = layoutMgr.serializeDashBgColor();
    const theme = layoutMgr.serializeDashboardTheme();
    const conn = widgetConnector.serialize();
    const rowNames = layoutMgr.serializeRowNames();
    const defaultRow = layoutMgr.serializeDefaultRow();

    const exportOptions = layoutMgr.serializeExportOptions();
    navBarNotification = htmlExport.navBarNotification;

    const xdashPrj = {
      meta: meta,
      data: data,
      libraries: libraries,
      scaling: scale,
      device: { ...deviceCols, ...backgroundColor, ...theme },
      dashboard: dash,
      connections: conn,
      exportOptions: exportOptions,
      pages: { ...rowNames, ...defaultRow },
      checkExportOptions: true, //AEF //MBG 21/09/2021
      navBarNotification: navBarNotification,
    };
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

      if (!_.isUndefined(jsonObject.meta.schedulerLogOff)) offSchedLogUser = jsonObject.meta.schedulerLogOff;
      else offSchedLogUser = true; //AEF: can be set to xDashConfig.disableSchedulerLog by default.

      pyodideLib.deserialize(jsonObject);

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

      widgetEditor.deserialize(jsonObject.dashboard, jsonObject.scaling, jsonObject.device);
      widgetConnector.deserialize(jsonObject.connections);
      widgetPreview.clear();

      widgetEditor.unselectAllWidgets(); //AEF: deselect all widget at project load

      layoutMgr.deserializeDashBgColor(jsonObject.device);
      layoutMgr.deserializeDashboardTheme(jsonObject.device);

      if (!_.isUndefined(jsonObject.pages)) {
        layoutMgr.deserializeRowNames(jsonObject.pages);
        layoutMgr.deserializeDefaultRow(jsonObject.pages);
      }

      layoutMgr.deserializeExportOptions(jsonObject.exportOptions);

      if (!_.isUndefined(jsonObject.navBarNotification)) {
        // MBG 21/09/2021
        htmlExport.navBarNotification = jsonObject.navBarNotification;
      } else {
        htmlExport.navBarNotification = false; // when not existing assume it false
      }

      /*if (!_.isUndefined(jsonObject.checkExportOptions)) {
                      htmlExport.checkExportOptions = jsonObject.checkExportOptions;
                  }*/ // MBG 21/09/2021 : simplify export
      return true;
    } catch (ex) {
      console.log(ex);
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
    if (fileType == 'project') {
      fileText = 'project';
    } else if (fileType == 'datanode') {
      fileText = 'xdsjson';
    }
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

      contentElement = getFileList(data, 'Please select a ' + fileType + ': ');

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
          xdash.openProjectManager(msg1);
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
    let loadFn = function (e) {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      scopeDash.reset();
      clear(); // MBG 01/08/2018 : important to do
      bOk = deserialize(jsonObject);
      datanodesManager.showLoadingIndicator(false);
      document.removeEventListener('widgets-tab-loaded', loadFn);
      jsonObject = undefined; //ABK in case of  missed synchronization a second loadFn cannot be made
      if (!bOk) {
        //ABK
        swal('Unable to load your project', 'Project loading will be interrupted.', 'error');
        return false;
      }
    };
    document.addEventListener('widgets-tab-loaded', loadFn); //ABK:fix bug: put addEvent here before if/else condition (before the loadFn)
    if (tabActive == 'widgets') {
      loadFn();
    }
  }

  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------
  //  Save file json)
  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------

  function saveAndClosePrj() {
    let $body = angular.element(document.body);
    let $rootScope = $body.scope().$root;
    let forceClose = true;
    if ($rootScope.currentProject.name !== '') {
      // project is open
      let headerbarCtrl = angular.element(document.getElementById('headerbar-ctrl')).scope();

      if ($('.tab--active').hasClass('changed')) {
        //project is dirty
        var endAction = function () {
          headerbarCtrl.closeProject($rootScope.currentProject.name, forceClose);
          console.log('Your project is saved before closing');
        };
        fileManager.getFileListExtended('project', $rootScope.currentProject.name, undefined, endAction, true);

        // swal('Auto closing project', 'Your project is saved before closing.', 'info');
      } else {
        headerbarCtrl.closeProject($rootScope.currentProject.name);
        console.log('Your project was closed');
        // swal('Thanks for staying!', 'Your project was closed.', 'info');
      }

      // setTimeout(function() {
      //     //swal('Thanks for staying!', 'Your project was closed.', 'info');
      // }, 10000);
    }
  }

  /*--------manage leave/refresh page--------*/
  $(window).bind('beforeunload', function () {
    saveAndClosePrj();
    return 'Are you sure you want to leave the page ?';
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
})();
