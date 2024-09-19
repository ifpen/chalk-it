// +--------------------------------------------------------------------+ \\
// ¦ xdash                                                              ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2024 IFPEN                                        ¦ \\
// ¦ Licensed under the Apache License, Version 2.0                     ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Mongi BEN GAID; Abir EL FEKI                  ¦ \\
// +--------------------------------------------------------------------+ \\
import _ from 'lodash';

import { fileManager } from 'kernel/general/backend/file-management';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { XdashDataUpdateEngine } from 'kernel/base/xdash-data-updates';
import { DialogBoxForData } from 'kernel/datanodes/gui/DialogBox';
import { xdashUpdateEngine } from 'kernel/base/xdash-data-updates';

export const xdsjson = (function () {
  //--------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------
  // Load (open) existing xdsjsonsources (specific functions)
  //-------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------

  /*--------openJsonManager--------*/
  function openJsonManager(data) {
    let jsonObject;
    try {
      jsonObject = JSON.parse(data);
    } catch (err) {
      console.error(err);
      swal('Unable to load file', 'Project loading will be interrupted.', 'error');
      return;
    }

    const forUpdate = jsonObject.meta ? jsonObject : { meta: {}, data: { datanodes: jsonObject.datanodes } };
    if (!xdashUpdateEngine.hasCurrentVersion(forUpdate)) {
      try {
        const notifications = xdashUpdateEngine.update(forUpdate, false);
        xdashUpdateEngine.displayNotifications(notifications, false);
      } catch (ex) {
        console.error(ex);
        swal({
          title: `Import failed`,
          icon: 'warning',
          text: ex?.message ?? 'The data could not be updated and may be invalid.',
        });
        return;
      }
    }
    const refresh = () => {
      const $body = angular.element(document.body);
      const $rootScope = $body.scope().$root;
      $rootScope.alldatanodes = datanodesManager.getAllDataNodes();
      $rootScope.filtredNodes = $rootScope.alldatanodes.length;
      $rootScope.safeApply();
      $rootScope.updateFlagDirty(true);
    };
    if (datanodesManager.getAllDataNodes().length === 0) {
      datanodesManager.load(forUpdate.data, true, refresh);
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
          const bClear = !isConfirm;
          datanodesManager.load(forUpdate.data, bClear, refresh);
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
    selectDataToSave((dataToSave) => {
      const saveDatanodes = datanodesManager.serialize();
      saveDatanodes.datanodes = saveDatanodes.datanodes
        .filter((node) => dataToSave.includes(node.name))
        .sort((a, b) => a.name.localeCompare(b.name));

      const meta = {
        [XdashDataUpdateEngine.VERSION_METADATA_KEY]: XdashDataUpdateEngine.CURRENT_VERSION,
        date: Date(),
        name: '',
        description: '',
        groupName: '',
        tags: [],
      };
      const json = { meta, data: saveDatanodes };
      const $rootScope = angular.element(document.body).scope().$root;
      if ($rootScope.xDashFullVersion) {
        fileManager.saveOnServer('datanode', null, json);
      } else {
        fileManager.saveOnLocal(json);
      }
    });
  }

  /*--------selectDataToSave--------*/
  function selectDataToSave(callback) {
    const data = datanodesManager.getAllDataNodes();
    const sortedData = data.sort((a, b) => a.name().localeCompare(b.name()));
    const contentElement = getDataList(sortedData, 'Please check data to be saved in the xdsjson file: ');
    new DialogBoxForData(contentElement, 'List of data', 'Save', 'Cancel', function () {
      const dataToSave = sortedData
        .filter((_, i) => $('#data-checkbox-' + i).is(':checked'))
        .map((node) => node.name());
      if (dataToSave.length) {
        callback(dataToSave);
      } else {
        // do not close modal
        return true;
      }
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
          $rootScope.showOneDatasource = false;
          $rootScope.updateFlagDirty(true);
          $rootScope.safeApply();
        } else {
          //nothing
        }
      }
    );
  }

  //-------------------------------------------------------------------------------------------------------------------

  // public functions
  return {
    saveJson,
    clearAllData,
    getDuplicateDataList,
    getDataList,
    openJsonManager,
  };
})();
