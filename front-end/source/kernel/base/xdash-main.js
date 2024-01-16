// +--------------------------------------------------------------------+ \\
// ¦ xdash                                                              ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2023 IFPEN                                        ¦ \\
// ¦ Licensed under the Apache License, Version 2.0                     ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  ¦ \\
// +--------------------------------------------------------------------+ \\

var xdash = (function () {
  var version = xDashConfig.version.fullVersion;

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

    $('#projectName')[0].value = prjName;
    $('.tab--active').removeClass('changed');

    $rootScope.currentPrjDirty = '';

    const $scopeLibs = angular.element(document.getElementById('library__wrap')).scope();
    $scopeLibs.resetPyodideLibs(); // GHI for issue #189
    layoutMgr.resetDashBgColor(); // GHI for issue #228
    layoutMgr.resetDashboardTheme();

    const $scopeDash = angular.element(document.getElementById('help__wrap')).scope();
    $scopeDash.initFrame();
  }

  /*--------initMeta--------*/
  function initMeta() {
    const meta = {
      version: version,
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
  async function deserialize(jsonObject) {
    // TODO : check for format first
    try {
      $('#projectName')[0].value = jsonObject.meta.name;
      if (!_.isUndefined(jsonObject.meta.description))
        $rootScope.currentProject.description = jsonObject.meta.description;
      if (!_.isUndefined(jsonObject.meta.tags)) $rootScope.currentProject.tags = jsonObject.meta.tags;
      if (!_.isUndefined(jsonObject.meta.groupName)) $rootScope.currentProject.groupName = jsonObject.meta.groupName;

      if (!_.isUndefined(jsonObject.meta.schedulerLogOff)) offSchedLogUser = jsonObject.meta.schedulerLogOff;
      else offSchedLogUser = true; //AEF: can be set to xDashConfig.disableSchedulerLog by default.

      await pyodideLib.deserialize(jsonObject); // GHI  : load pyodide packages

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

      // backward compatibility
      _backwardCompatibilityWdgValue(jsonObject.device, jsonObject.dashboard, jsonObject.connections, jsonObject.data);

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

  // /*--------_backwardCompatibilityWdgValue--------*/
  function _backwardCompatibilityWdgValue(deviceObj, dashObj, connectObj, dataObj) {
    const droppers = deviceObj.droppers;
    let datanodeNames = [];
    if ('datasources' in dataObj) {
      if (!_.isUndefined(dataObj.datasources)) {
        datanodeNames = dataObj.datasources.map((datasource) => datasource.name);
      }
    } else {
      if (!_.isUndefined(dataObj.datanodes)) {
        datanodeNames = dataObj.datanodes.map((datanode) => datanode.name);
      }
    }

    if (_.isEmpty(droppers)) {
      const widgets = _.keys(dashObj);
      _.each(widgets, (wdg) => {
        _upadateWidgetValue(wdg, dashObj, connectObj, dataObj, datanodeNames);
      });
    } else {
      const drprs = _.keys(droppers);
      _.each(drprs, (i) => {
        const dprWidgets = _.keys(droppers[i]);
        _.each(dprWidgets, (j) => {
          let wdg = droppers[i][j];
          droppers[i][j] = _upadateWidgetValue(wdg, dashObj, connectObj, dataObj, datanodeNames);
        });
      });
    }
  }

  function _upadateWidgetValue(wdg, dashObj, connectObj, dataObj, datanodeNames) {
    if (wdg.includes('flatUiValue') && !wdg.includes('flatUiValueDisplay')) {
      let widgetName = '';
      let dataNodeName = '';
      if ('datasources' in dataObj) {
        if (!_.isUndefined(connectObj[wdg].value.dataSource)) {
          dataNodeName = connectObj[wdg].value.dataSource;
        }
      } else {
        if (!_.isUndefined(connectObj[wdg].value.dataNode)) {
          dataNodeName = connectObj[wdg].value.dataNode;
        }
      }

      const isConnectObj = dataNodeName === '' || datanodeNames.includes(dataNodeName);
      if (isConnectObj && !_.isUndefined(dashObj[wdg].modelParameters.isNumber)) {
        if (dashObj[wdg].modelParameters.isNumber) {
          if (!_.isUndefined(dashObj[wdg].modelParameters.isPassword)) {
            delete dashObj[wdg].modelParameters.isPassword;
          }
          widgetName = 'flatUiNumericInput';
        } else {
          widgetName = 'flatUiTextInput';
        }
        delete dashObj[wdg].modelParameters.isNumber;
      } else {
        widgetName = 'flatUiValueDisplay';
      }

      if (!_.isUndefined(dashObj[wdg].container.id)) {
        dashObj[wdg].container.id = dashObj[wdg].container.id.replace('flatUiValue', widgetName);
      }
      if (!_.isUndefined(dashObj[wdg].container.instanceId)) {
        dashObj[wdg].container.instanceId = dashObj[wdg].container.instanceId.replace('flatUiValue', widgetName);
      }
      if (!_.isUndefined(dashObj[wdg].container.modelJsonId)) {
        dashObj[wdg].container.modelJsonId = dashObj[wdg].container.modelJsonId.replace('flatUiValue', widgetName);
      }
      if (!_.isUndefined(dashObj[wdg].container.widgetTypeName)) {
        dashObj[wdg].container.widgetTypeName = dashObj[wdg].container.widgetTypeName.replace(
          'flatUiValue',
          widgetName
        );
      }

      if (!_.isUndefined(dashObj[wdg].modelParameters.decimalDigits)) {
        delete dashObj[wdg].modelParameters.decimalDigits;
      }

      let oldwdg = wdg;
      wdg = wdg.replace('flatUiValue', widgetName);

      dashObj[wdg] = dashObj[oldwdg];
      delete dashObj[oldwdg];

      connectObj[wdg] = connectObj[oldwdg];
      delete connectObj[oldwdg];

      return wdg;
    } else {
      return wdg;
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

    $rootScope.showNotifications = false;
    $rootScope.toggleMenuOptionDisplay('none');
    $state.go('modules', {});
    $rootScope.moduleOpened = false;
    FileMngrInst.ReadFile(fileTypeServer, projectName + '.xprjson', function (msg1, msg2, type) {
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

        $rootScope.showNotifications = false;
        $rootScope.toggleMenuOptionDisplay('none');
        $state.go('modules', {});
        $rootScope.moduleOpened = false;
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
  async function openProjectManager(data) {
    let jsonObject;
    try {
      jsonObject = JSON.parse(data);
    } catch (err) {
      swal('Unable to load file', 'Project loading will be interrupted.', 'error');
      return;
    }

    initRootScopeCurrentProjectObject(jsonObject);
    let bOk = false;
    let loadFn = async function (e) {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      scopeDash.reset();
      bOk = await deserialize(jsonObject);
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
      await loadFn();
    }
  }

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
      swal('Unable to load file', 'Project loading will be interrupted.', 'error');
      return;
    }

    if (datanodesManager.getAllDataNodes().length == 0) {
      datanodesManager.load(jsonObject, true);
    } else {
      swal(
        {
          title: 'Loading dataNodes from xdsjson file',
          text: 'Do you want to append the xdsjson file to your existing list or overwrite it?',
          type: 'warning',
          showCancelButton1: true,
          showConfirmButton: false,
          showConfirmButton1: true,
          confirmButtonText: 'Append',
          cancelButtonText: 'Overwrite',
          closeOnConfirm: true,
          closeOnConfirm1: true,
          closeOnCancel1: true,
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
        }
      );
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
    selectDataToSave('server');
  }

  /*--------selectDataToSave--------*/
  function selectDataToSave(dest) {
    let data = datanodesManager.getAllDataNodes();
    let sortedData = data.sort((a, b) => a.name().localeCompare(b.name()));

    let dataToSave = [];
    let bFound = false;
    let contentElement = getDataList(sortedData, 'Please check data to be saved in the xdsjson file: ');
    let i, j;

    new DialogBoxForData(contentElement, 'List of data', 'Save', 'Cancel', function () {
      for (i = 0; i < data.length; i++) {
        if ($('#data-checkbox-' + i).is(':checked')) {
          dataToSave[i] = data[i].name();
          bFound = true;
        }
      }
      if (bFound) {
        let saveDatanodes = datanodesManager.serialize();
        let isDataFound = false;
        for (i = 0; i < saveDatanodes.datanodes.length; i++) {
          isDataFound = false;
          for (j = 0; j < dataToSave.length; j++) {
            if (saveDatanodes.datanodes[i].name == dataToSave[j]) {
              isDataFound = true;
              break;
            }
          }
          if (!isDataFound) {
            //delete unchecked data
            delete saveDatanodes.datanodes[i];
          }
        }
        let cleanData = [];
        let k = 0;
        for (i = 0; i < saveDatanodes.datanodes.length; i++) {
          if (!_.isUndefined(saveDatanodes.datanodes[i])) {
            cleanData[k] = saveDatanodes.datanodes[i];
            k++;
          }
        }
        saveDatanodes.datanodes = cleanData;

        if (dest == 'server') {
          fileManager.saveOnServer('datanode', null, saveDatanodes);
        }
      } else return true; //do not close modal
    });
  }

  /*--------getDataList--------*/
  function getDataList(data, text) {
    var contentElement = $('<div class="datalist"></div>');
    contentElement.append('<p>' + text + '</p>');

    var datalistItems = $('<ul class="datalist__elems list-unstyled"></ul>');
    if (!_.isUndefined(data)) {
      for (var i = 0; i < data.length; i++) {
        var name = '';
        if (_.isFunction(data[i].name)) {
          name = data[i].name();
        } else {
          name = data[i];
        }
        if (!_.isUndefined(name)) {
          datalistItems.append(
            '<li><label for="data-checkbox-' +
              i +
              '"><input type="checkbox" class="check-option1" id="data-checkbox-' +
              i +
              '">' +
              name +
              '</label></li>'
          );
        }
      }
    }
    contentElement.append(datalistItems);

    var datalistActions = $('<ul class="datalist__actions list-unstyled"></ul>');
    datalistActions.append(
      '<li><label for="check-all"><input type="checkbox" class="check-option2" id="check-all">Check all</label></li>'
    );
    datalistActions.append(
      '<li><label for="uncheck-all"><input type="checkbox" class="check-option2" id="uncheck-all">Uncheck all</label></li>'
    );
    contentElement.append(datalistActions);

    return contentElement;
  }

  /*--------getDuplicateDataList--------*/ //A long terme, il faudrait factoriser une partie de cette fonction avec getDataList
  function getDuplicateDataList(data, text) {
    var contentElement = document.createElement('div');
    var divContent = '<p style="margin-bottom:5px;">' + text + '</p>';
    divContent =
      divContent +
      '<div style="height:220px;overflow:auto;width:80%; max-width:80%; margin-bottom:15px;border: 1px solid white; background:var(--fill-background-color); color:black;float:left">';

    if (!_.isUndefined(data)) {
      for (var i = 0; i < data.length; i++) {
        if (!_.isUndefined(data[i].name)) {
          divContent =
            divContent +
            '<li style="list-style-type: none;padding: 5px 10px;"><input type="checkbox" class="check-option1" id=data-checkbox-' +
            i +
            '>';
          divContent =
            divContent +
            '<input type="text" style="width:70%" class="data-check-input" value="' +
            data[i].name +
            '" id="data-check-' +
            i +
            '">';
          divContent =
            divContent +
            '<input type="radio" class="data-radio" style="margin: 0px 0px 0px 5px;" name="data-radio-' +
            i +
            '" id="data-rename-' +
            i +
            '">';
          divContent = divContent + '<span class="data-radio-span">rename</span>';
          divContent =
            divContent +
            '<input type="radio" class="data-radio" name="data-radio-' +
            i +
            '" checked id="data-overwrite-' +
            i +
            '">';
          divContent = divContent + '<span class="data-radio-span" >overwrite</span>';
          divContent = divContent + '</li>';
        }
      }
    }
    divContent = divContent + '</div>';
    divContent = divContent + '<div style="width: 16%; float:right">';
    divContent =
      divContent +
      '<div style="list-style-type: none;padding-left: 8px;"><input type="checkbox" class="check-option2"  id="check-all"><span> Check all</span></div>';
    divContent =
      divContent +
      '<div style="list-style-type: none;padding-left: 8px;"><input type="checkbox" class="check-option2"  id="uncheck-all"><span> Uncheck all</span></div>';
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
    swal(
      {
        title: 'Are you sure?',
        text: 'All dataNodes will be deleted and their connections with widgets!',
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
          datanodesManager.clear();
          //AEF
          var $body = angular.element(document.body);
          var $rootScope = $body.scope().$root;
          $rootScope.alldatanodes = datanodesManager.getAllDataNodes();
          $rootScope.filtredNodes = $rootScope.alldatanodes.length;
          $rootScope.showNotifications = false;
          $rootScope.updateFlagDirty(true);
          $rootScope.safeApply();
        } else {
          //nothing
        }
      }
    );
  }

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
