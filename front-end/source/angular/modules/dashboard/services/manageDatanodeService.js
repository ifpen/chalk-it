// ┌─────────────────────────────────────────────────────────────────────────────────┐ \\
// │ manageDatanodeService                                                           │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                     │ \\
// | Licensed under the Apache License, Version 2.0                                  │ \\
// ├─────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                               │ \\
// └─────────────────────────────────────────────────────────────────────────────────┘ \\

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
          inputValue: dnName + '_copy', //new default dataNode name
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
      xdash.openFile('datanode', target);
    };

    /*---------- filter By Connection btn----------------*/
    self.filterByConnection = function (singleton, element) {
      setTimeout(function () {
        for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
          $rootScope.alldatanodes[i]._serializedData = $rootScope.alldatanodes[i].serialize();

          if ($rootScope.filtredList.indexOf($rootScope.alldatanodes[i]) === -1) {
            $rootScope.alldatanodes[i].hide = true;
          }

          if (singleton && datanodesManager.isSingletonNode($rootScope.alldatanodes[i]._serializedData.name)) {
            if (element.className.includes('active')) {
              _filterNodes($rootScope.alldatanodes[i], 'push');
            } else {
              _filterNodes($rootScope.alldatanodes[i], 'splice');
            }
          } else if (!singleton && !datanodesManager.isSingletonNode($rootScope.alldatanodes[i]._serializedData.name)) {
            if (element.className.includes('active')) {
              _filterNodes($rootScope.alldatanodes[i], 'push');
            } else {
              _filterNodes($rootScope.alldatanodes[i], 'splice');
            }
          }
        }

        if ($rootScope.filtredList.length === 0) {
          self.resetNodesFilters();
        }
        self.updateNodesCountAndFontColor();
        $rootScope.$apply();
      }, 700);
    };

    function _filterNodes(node, action) {
      if (action === 'push') {
        if ($rootScope.filtredList.indexOf(node) === -1) {
          $rootScope.filtredList.push(node);
          node.hide = false;
        }
      }
      if (action === 'splice') {
        if ($rootScope.filtredList.indexOf(node) >= 0) {
          $rootScope.filtredList.splice($rootScope.filtredList.indexOf(node), 1);
          node.hide = true;
        }
      }
    }

    /*---------- filter By Type button----------------*/
    self.filterByType = function (type, element) {
      setTimeout(function () {
        for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
          $rootScope.alldatanodes[i]._serializedData = $rootScope.alldatanodes[i].serialize();

          if ($rootScope.filtredList.indexOf($rootScope.alldatanodes[i]) === -1) {
            $rootScope.alldatanodes[i].hide = true;
          }

          if ($rootScope.alldatanodes[i]._serializedData.type === type) {
            if (element.className.includes('active')) {
              _filterNodes($rootScope.alldatanodes[i], 'push');
            } else {
              _filterNodes($rootScope.alldatanodes[i], 'splice');
            }
          }
        }
        if ($rootScope.filtredList.length === 0) {
          self.resetNodesFilters();
        }
        self.updateNodesCountAndFontColor();
        $rootScope.$apply();
      }, 700);
    };

    /*---------- filter By Type btn  --> cancel ----------------*/
    self.resetNodesFilters = function () {
      $rootScope.filtredList = [];
      $rootScope.filtredNodes = $rootScope.alldatanodes.length;
      $('.datanode__wrap--info p').removeAttr('style');
      for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
        $rootScope.alldatanodes[i].hide = false;
      }
      self.applyDatanodeFilter();
    };

    /*---------- updateNodesCountAndFontColor----------------*/
    self.updateNodesCountAndFontColor = function () {
      $rootScope.filtredNodes = $rootScope.alldatanodes.filter((el) => !el.hide).length;
      if ($rootScope.filtredNodes !== $rootScope.alldatanodes.length)
        $('.datanode__wrap--info p')[0].style.setProperty('color', 'var(--danger-color)');
      else $('.datanode__wrap--info p').removeAttr('style');
    };

    /*---------- applyDatanodeFilter----------------*/
    self.applyDatanodeFilter = function () {
      let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
      let tmpStr = scopeDashDn.searchDatanodeByName;

      setTimeout(function () {
        for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
          $rootScope.alldatanodes[i]._serializedData = $rootScope.alldatanodes[i].serialize();

          if (
            !($rootScope.alldatanodes[i]._serializedData.settings.name.toLowerCase().indexOf(tmpStr.toLowerCase()) >= 0)
          ) {
            $rootScope.alldatanodes[i].hide = true;
          } else {
            if ($rootScope.filtredList.length === 0) $rootScope.alldatanodes[i].hide = false;
            if ($rootScope.filtredList.indexOf($rootScope.alldatanodes[i]) >= 0)
              $rootScope.alldatanodes[i].hide = false;
          }
        }

        self.updateNodesCountAndFontColor();
        $rootScope.$apply();
      }, 700);
    };
  },
]);
