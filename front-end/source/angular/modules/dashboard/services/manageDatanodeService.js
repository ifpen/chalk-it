// ┌─────────────────────────────────────────────────────────────────────────────────┐
// │ manageDatanodeService                                                           │
// ├─────────────────────────────────────────────────────────────────────────────────┤
// │ Copyright © 2016-2024 IFPEN                                                     │
// | Licensed under the Apache License, Version 2.0                                  │
// ├─────────────────────────────────────────────────────────────────────────────────┤
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                               │
// └─────────────────────────────────────────────────────────────────────────────────┘

import _ from 'lodash';
import PNotify from 'pnotify';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { runtimeSingletons } from 'kernel/runtime-singletons';

angular.module('modules.dashboard').service('ManageDatanodeService', [
  '$rootScope',
  function ($rootScope) {
    const self = this;

    /*---------- New button ----------------*/
    self.newDataNode = function (scopeDash) {
      let instanceType = undefined;
      let settings = {};
      $rootScope.dataNodeViewModel = {};
      let types = datanodesManager.getDataNodePluginTypes();
      scopeDash.editorView.newDatanodePanel.view = true;
      scopeDash.editorView.newDatanodePanel.list = true;
      scopeDash.editorView.newDatanodePanel.type = false;
      scopeDash.editorView.operationDataNode = 'add';
      datanodesManager.createPluginEditor(types, instanceType, settings);
    };

    /*---------- Duplicate button ----------------*/
    self.duplicateDataNode = function (data, scopeDash) {
      const dnName = data.name();
      swal(
        {
          title: 'Duplicate DataNode',
          text: 'You can write another name here:',
          type: 'input',
          showConfirmButton: false,
          showConfirmButton1: true,
          showCancelButton: true,
          confirmButtonText: 'Duplicate',
          closeOnConfirm: false,
          closeOnConfirm1: false,
          closeOnCancel: false,
          inputPlaceholder: 'please write dataNode name here ...',
          inputValue: dnName + '_copy', // new default dataNode name
        },
        function (inputValue) {
          $rootScope.loadingBarStart();
          if (inputValue === false) {
            swal.close();
            $rootScope.loadingBarStop();
            return false;
          } else {
            if (inputValue === '') {
              swal.showInputError('DataNode name is required!');
              return false;
            }

            const endAction = function (text) {
              const notice = new PNotify({
                title: dnName,
                text: text,
                type: 'success',
                styling: 'bootstrap3',
              });
              $('.ui-pnotify-container').on('click', function () {
                notice.remove();
              });
              $rootScope.loadingBarStop();
            };

            const type = data.type();
            const types = datanodesManager.getDataNodePluginTypes();
            const selectedType = types[type];
            const settings = { ...data.settings() };
            settings.name = inputValue;
            const newSettings = {
              type: type,
              iconType: selectedType.icon_type,
              settings: settings,
            };

            if (!datanodesManager.settingsSavedCallback(null, newSettings, selectedType)) {
              scopeDash.displayedShowIndex = 0;
              swal.close();
              $rootScope.updateFlagDirty(true);
              endAction("'" + dnName + "' has been successfully duplicated!");
            } else {
              endAction("A dataNode with name '" + inputValue + "' already exist!");
            }
            $rootScope.filtredNodes = $rootScope.alldatanodes.length;
          }
        }
      );
    };

    /*---------- dataNode type button ----------------*/
    self.openDataNodeTypePlugin = function (val, scopeDash) {
      let instanceType = undefined;
      let settings = {};
      let types = datanodesManager.getDataNodePluginTypes();
      scopeDash.editorView.newDatanodePanel.list = false;
      scopeDash.editorView.newDatanodePanel.type = true;
      datanodesManager.createPluginEditor(types, instanceType, settings, val);
    };

    /*---------- save datanode button ----------------*/
    self.saveDataNodeSettings = function (isFromJsEditor, scopeDash) {
      let types = datanodesManager.getDataNodePluginTypes();

      const isNewDatanode = _.isEmpty($rootScope.dataNodeViewModel);
      const viewModel = isNewDatanode ? null : $rootScope.dataNodeViewModel;

      let newSettings = datanodesManager.getDataNodeNewSettings();

      let selectedType = types[newSettings.type];
      if (!datanodesManager.settingsSavedCallback(viewModel, newSettings, selectedType)) {
        if (!isFromJsEditor) {
          scopeDash.editorView.newDatanodePanel.view = false;
          scopeDash.editorView.newDatanodePanel.list = false;
          scopeDash.editorView.newDatanodePanel.type = false;
        }
        if (isNewDatanode) scopeDash.displayedShowIndex = 0;
      }
      $rootScope.filtredNodes = $rootScope.alldatanodes.length;
      $rootScope.updateFlagDirty(true);
    };

    /*---------- cancel datanode button ----------------*/
    self.getOldDataNodeSettings = function (scopeDash) {
      let viewModel = $rootScope.dataNodeViewModel;
      datanodesManager.getOldSettingsCallback(viewModel);
      scopeDash.editorView.newDatanodePanel.view = false;
      scopeDash.editorView.newDatanodePanel.list = false;
      scopeDash.editorView.newDatanodePanel.type = false;
    };

    /*---------- open button /Load datanodes from xdjson----------------*/
    self.openFileData = function (target) {
      runtimeSingletons.xdash.openFile('datanode', target);
    };

    // >>>>> All filtering functions have been moved to FilterDatanodeService <<<<<
  },
]);
