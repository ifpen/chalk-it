// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DatanodesManager : fork from FREEBOARD                             │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)         │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ + authors(s): Abir EL FEKI, Mongi BEN GAID                         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var datanodesManager = (function () {
  var datanodePlugins = {};
  var datanodesDependency = new DatanodeDependency(); // new instance from DatanodeDependency

  var graphVisu;
  if (typeof execOutsideEditor === 'undefined') {
    this.execOutsideEditor = false;
  } else if (execOutsideEditor) {
    this.execOutsideEditor = true;
  } else {
    this.execOutsideEditor = false;
  }
  if (!this.execOutsideEditor) {
    graphVisu = new GraphVisu(datanodesDependency); // new instance from GraphVisu
  }
  var timeManager = new TimeManager();

  var freeboardUI = new FreeboardUI();
  var datanodesListModel = new DatanodesListModel(datanodePlugins, freeboardUI, datanodesDependency, timeManager);

  var jsonEdit = new JSONEdit();
  var jsonEdContainer = {};

  var jsEditor = new JSEditor();
  var pluginEditor = new PluginEditor(jsEditor);

  let eventCenter = null;
  const injector = angular.element(document.body).injector();
  if (injector?.has('EventCenterService')) {
    injector.invoke([
      'EventCenterService',
      (eventCenterService) => {
        eventCenter = eventCenterService;
      },
    ]);
  }

  var currentDataNode;

  // deleteDn: delete a datanode
  function deleteDn(viewModel) {
    const dnName = viewModel.name();
    //AEF
    if (viewModel.sampleTime()) {
      timeManager.unregisterDatanode(dnName);
    }
    //
    if (datanodesDependency.hasSuccessors(dnName)) {
      let successors = Array.from(datanodesDependency.getSuccessors(dnName));
      let str = successors.toString();
      str = str.replaceAll(',', ', ');
      // warning the user to set modification in formula for example
      swal(
        'Deleting dataNode side effects',
        'This dataNode "' + dnName + '" is still used in dataNode(s) "' + str + '".\n It must be changed.',
        'warning'
      );
    }

    var $body = angular.element(document.body);
    var $rootScope = $body.scope().$root;
    datanodesListModel.deleteDatanode(viewModel);
    datanodesListModel.datanodes.remove(viewModel);
    $rootScope.alldatanodes = datanodesManager.getAllDataNodes();
    $rootScope.filtredNodes = $rootScope.alldatanodes.length;

    $rootScope.updateFlagDirty(true);
    $rootScope.safeApply();

    //AEF: recompute graphs after deleting a datanode
    datanodesDependency.updateDisconnectedGraphsList(dnName, 'delete');

    if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
      console.log('All disconnected Graphs after delete: ', datanodesDependency.getAllDisconnectedGraphs());
    //

    if (eventCenter) {
      eventCenter.sendEvent(EVENTS_EDITOR_DATANODE_DELETED, [dnName]);
    }
  }

  // isConnected: returns info if datanode is connected, and if true it returns also the corresponding widgetName
  // MBG modif on 24/03/2021 : find connection with all widgets
  function isConnectedWithWidgt(DSname) {
    var bFoundConnection = false;
    var props = [];
    for (var prop in widgetConnector.widgetsConnection) {
      for (var i in widgetConnector.widgetsConnection[prop].sliders) {
        if (widgetConnector.widgetsConnection[prop].sliders[i].name != 'None') {
          if (widgetConnector.widgetsConnection[prop].sliders[i].dataNode === DSname) {
            bFoundConnection = true;
            props.push(prop);
          }
        }
      }
    }
    if (!bFoundConnection) props = [];
    return [bFoundConnection, _.uniq(props)];
  }

  function deleteDataNode(viewModel, type, title) {
    [bFoundConnection, prop] = isConnectedWithWidgt(viewModel.name());
    if (type == 'datanode' && bFoundConnection) {
      let wdList = [];
      for (let i = 0; i < prop.length; i++) {
        wdList.push(widgetConnector.widgetsConnection[prop[i]].instanceId);
      }

      swal(
        {
          title: 'Are you sure?',
          text:
            "This dataNode will be deleted and connections with widget(s) '" + wdList.join('\n') + "' may be removed!",
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
            deleteDn(viewModel);
            let $body = angular.element(document.body);
            let $rootScope = $body.scope().$root;
            if ($rootScope.bIsPlayMode) {
              for (key in widgetConnector.widgetsConnection) {
                widgetPreview.plotConstantData(key, false);
              }
            }
          }
        }
      );
    } else {
      var $body = angular.element(document.body); // 1
      var $rootScope = $body.scope().$root;
      $rootScope.isPopupWindow = true;
      $rootScope.popupTitle = 'Confirm Delete';
      $rootScope.popupText = 'Are you sure you want to delete this ' + title;
      $rootScope.popupAction = function () {
        if (type == 'datanode') {
          deleteDn(viewModel);
        }
      };
    }
  }

  function createDatanode(newSettings) {
    if (datanodesManager.foundDatanode(newSettings.settings.name)) {
      swal(
        "A dataNode with name '" + newSettings.settings.name + "' adready exists.",
        'Please specify a different name',
        'error'
      );
      //DialogBox('A datanode with name "' + newSettings.settings.name + '" adready exists. Please specify a different name', 'Already exists', "Ok", "Cancel", null);
      return true; //ABK
    }
    const newViewModel = new DatanodeModel(datanodesListModel, datanodePlugins, datanodesDependency, timeManager);
    newViewModel.name(newSettings.settings.name);

    //delete newSettings.settings.name;//ABK fix bug of error on name is required and not empty

    newViewModel.settings(newSettings.settings);
    newViewModel.type(newSettings.type);
    const iconName = 'icn-' + newSettings.iconType.replace(/\.[^/.]+$/, '');
    newViewModel.iconType(iconName);
    if (newViewModel.error()) {
      //ABK
      //swal("DataNode creation failure", "Error on some dataNode fields.", "error");
      return true;
    }
    newViewModel.isSchedulerStartSafe(true); //AEF
    datanodesListModel.addDatanode(newViewModel); //ABK put here if error, we don't add data

    //AEF: recompute graphs after adding a new datanode
    datanodesDependency.updateDisconnectedGraphsList(newViewModel.name(), 'add');
    if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
      console.log('All disconnected Graphs after add: ', datanodesDependency.getAllDisconnectedGraphs());
    //

    //AEF
    if (_.isUndefined(newSettings.settings.sampleTime) || newSettings.settings.sampleTime == 0) {
      newViewModel.schedulerStart(undefined, undefined, 'unidentified');
    } else {
      newViewModel.sampleTime(newSettings.settings.sampleTime);
      timeManager.registerDatanode(newViewModel.sampleTime(), newViewModel.name(), 'unidentified');
    }
    //datanodesListModel.launchFirstUpdate(newViewModel); //AEF // AEF & MBG réunion du 11/04/2019

    if (eventCenter) {
      eventCenter.sendEvent(EVENTS_EDITOR_DATANODE_CREATED, [newViewModel.name()]);
    }

    angular
      .element(document.body)
      .injector()
      .invoke(['$rootScope', function ($rootScope) {}]);

    var $body = angular.element(document.body); // 1
    var $rootScope = $body.scope().$root;
    $rootScope.alldatanodes = datanodesManager.getAllDataNodes();
    $rootScope.safeApply();
  }

  function updateDatanode(viewModel, newSettings) {
    const oldName = viewModel.name();
    const newName = newSettings.settings.name;

    if (viewModel.isSettingNameChanged(newName)) {
      //avoid to compare with the same datanode if the name wasn't changed
      if (datanodesManager.foundDatanode(newName)) {
        swal(`A dataNode with name '${newName}' adready exists.`, 'Please specify a different name', 'error');
        return true;
      }
      // handle dependencies
      if (datanodesDependency.hasSuccessors(viewModel.name())) {
        var successors = Array.from(datanodesDependency.getSuccessors(viewModel.name()));
        xdashNotifications.manageNotification(
          'info',
          viewModel.name(),
          'Update new name "' + newSettings.settings.name + '" in script of "' + successors + '"'
        );
        for (let prop in successors) {
          const oldName = viewModel.name();
          const newName = newSettings.settings.name;
          script = datanodesManager.getDataNodeByName(successors[prop]).settings().json_var_formula;
          replacedScript = script
            .replace(new RegExp('dataNodes\\["' + oldName + '"\\]', 'g'), 'dataNodes["' + newName + '"]')
            .replace(new RegExp('dataNodes\\.' + oldName, 'g'), 'dataNodes.' + newName);

          datanodesManager.getDataNodeByName(successors[prop]).settings().json_var_formula = replacedScript;
        }
      }
      // handle widget connection
      [bFoundConnection, prop] = isConnectedWithWidgt(viewModel.name());
      if (bFoundConnection) {
        let wdList = [];
        for (let prop in widgetConnector.widgetsConnection) {
          for (let i in widgetConnector.widgetsConnection[prop].sliders) {
            wdList.push(widgetConnector.widgetsConnection[prop].instanceId);
            widgetConnector.widgetsConnection[prop].sliders[i].dataNode = newSettings.settings.name;
          }
        }
        xdashNotifications.manageNotification(
          'info',
          viewModel.name(),
          'Update new name "' + newSettings.settings.name + '" in connected widgets "' + wdList.join('\n') + '"'
        );
      }

      //AEF: before renaming datanode, must stop its scheduling before it disappears
      if (viewModel.execInstance() != null) {
        // scheduling is in progress
        viewModel.execInstance().stopOperation(oldName);
      }
      //
      datanodesListModel.renameDatanodeData(oldName, newName);
    }

    datanodesDependency.renameNode(oldName, newName);
    viewModel.name(newName);
    //delete newSettings.settings.name;//ABK fix bug of error on name is required and not empty
    if (!_.isUndefined(newSettings.settings.sampleTime)) {
      if (viewModel.isSettingSampleTimeChanged(newSettings.settings.sampleTime)) {
        viewModel.sampleTime(newSettings.settings.sampleTime);
      }
    }

    viewModel.type(newSettings.type);
    viewModel.settings(newSettings.settings);
    const iconName = 'icn-' + newSettings.iconType.replace(/\.[^/.]+$/, '');
    viewModel.iconType(iconName);

    if (eventCenter) {
      eventCenter.sendEvent(EVENTS_EDITOR_DATANODE_UPDATED, { oldName, newName });
    }

    if (viewModel.error()) {
      //ABK
      //swal("DataNode edition failure", "Error on some dataNode fields.", "error");
      return true;
    }

    //AEF: recompute graphs after renaming and/or editing datanode
    datanodesDependency.computeAllDisconnectedGraphs();
    if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
      console.log('All disconnected Graphs after rename: ', datanodesDependency.getAllDisconnectedGraphs()); //To optimize after
    //
    if (!_.isUndefined(newSettings.settings.sampleTime)) {
      if (viewModel.sampleTime() != 0) {
        //new periodic or still periodic
        timeManager.registerDatanode(viewModel.sampleTime(), viewModel.name(), 'edit');
      } else if (timeManager.isRegisteredDatanode(viewModel.name())) {
        //from periodic to no periodic
        timeManager.unregisterDatanode(viewModel.name());
        viewModel.schedulerStart(undefined, undefined, 'edit');
      }
    } // No period
    else viewModel.schedulerStart(undefined, undefined, 'edit');
  }

  function getOldSettingsCallback(viewModel) {
    if (_.isFunction(viewModel.getSavedSettings)) {
      var oldSettings = viewModel.getSavedSettings();
      if (!_.isUndefined(oldSettings)) {
        viewModel.settings(oldSettings[1]); // get back last settings
        viewModel.statusCallback(oldSettings[0]); //get back last status
        // get back last name
        if (viewModel.name() !== oldSettings[1].name) {
          datanodesListModel.renameDatanodeData(viewModel.name(), oldSettings[1].name);
          datanodesDependency.renameNode(viewModel.name(), oldSettings[1].name);
        }

        viewModel.name(oldSettings[1].name);

        return oldSettings[1];
      }
    }
  }

  function createPluginEditor(types, instanceType, settings, flag) {
    pluginEditor.createPluginEditor(types, instanceType, settings, flag);
  }

  ko.bindingHandlers.pluginEditor = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      var options = ko.unwrap(valueAccessor());

      var types = {};
      var settings = undefined;
      var title = '';

      if (options.type == 'datanode') {
        types = datanodePlugins;
        title = 'DataNode';
      }

      $(element).click(function (event) {
        if (options.operation == 'delete') {
          deleteDataNode(viewModel, options.type, title);
        } else if (options.operation == 'refresh') {
          viewModel.schedulerStart(undefined, undefined, 'refresh');
        } else if (options.operation == 'stop') {
          if (viewModel.execInstance() != null) {
            // scheduling is in progress
            viewModel.execInstance().stopOperation(viewModel.name());
          }
        } else if (options.operation == 'showTooltip') {
          if (options.type == 'datanode') {
            $(element).tooltip('fixTitle');
            $(element).tooltip('show');
          }
        } else if (options.operation == 'hide') {
          if (options.type == 'data-preview') {
            $(element).parent().parent().parent().remove();
          }
        } else {
          var instanceType = undefined;
          if (options.type == 'datanode') {
            if (options.operation == 'add') {
              settings = {};
            } else {
              instanceType = viewModel.type();
              settings = viewModel.settings();
              settings.name = viewModel.name();
            }
          }
        }
      });
    },
  };

  ko.virtualElements.allowedBindings.datanodeTypeSettings = true;
  ko.bindingHandlers.datanodeTypeSettings = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
      processPluginSettings(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    },
  };

  // PUBLIC FUNCTIONS
  return {
    initialize: function (isHtmlLoad) {
      ko.applyBindings(datanodesListModel);
      freeboardUI.showLoadingIndicator(false);

      var matches = document.querySelectorAll('.docsLink');
      matches.forEach(function (item) {
        item.href = xDashConfig.urlDoc + 'index.html';
      });
      urlQueryEntry.process(isHtmlLoad);
    },

    load: function (configuration, bool, callback) {
      const oldDnNames = datanodesListModel.datanodes().map((_) => _.name());

      datanodesListModel.load(configuration, bool, callback);

      if (datanodesListModel.error()) {
        return false;
      } else {
        if (eventCenter) {
          const newDnNames = datanodesListModel.datanodes().map((_) => _.name());
          if (bool) {
            if (oldDnNames.length) {
              eventCenter.sendEvent(EVENTS_EDITOR_DATANODE_DELETED, oldDnNames);
            }
            if (newDnNames.length) {
              eventCenter.sendEvent(EVENTS_EDITOR_DATANODE_CREATED, newDnNames);
            }
          } else {
            // TODO name conflicts
            const newDnNames = configuration.datanodes.map((_) => _.name);
            if (newDnNames.length) {
              eventCenter.sendEvent(EVENTS_EDITOR_DATANODE_CREATED, newDnNames);
            }
          }
        }

        return true;
      }
    },
    serialize: function () {
      return datanodesListModel.serialize();
    },
    loadDatanodePlugin: function (plugin) {
      if (_.isUndefined(plugin.display_name)) {
        plugin.display_name = plugin.type_name;
      }
      // Add a required setting called name to the beginning
      if (plugin.type_name !== 'Memory_plugin') {
        plugin.settings.unshift({
          name: 'name',
          display_name: 'Name',
          type: 'text',
          required: true,
        });
      } else {
        plugin.settings.unshift({
          name: 'name',
          display_name: 'Generated memory name', //do not change
          type: 'text',
          disabled: true,
        });
      }

      datanodePlugins[plugin.type_name] = plugin;
      datanodesListModel._datanodeTypes.valueHasMutated();
    },
    getDataNodePluginTypes: function () {
      return datanodePlugins;
    },
    // To be used if datanodesManager is going to load dynamic assets from a different root URL
    setAssetRoot: function (assetRoot) {
      jsEditor.setAssetRoot(assetRoot);
    },
    showLoadingIndicator: function (show) {
      freeboardUI.showLoadingIndicator(show);
    },
    foundDatanode: function (datanodeName) {
      var datanodes = datanodesListModel.datanodes();

      // Find the datanode with the name specified
      datanode = _.find(datanodes, function (datanodeModel) {
        return datanodeModel.name() === datanodeName;
      });

      if (datanode) {
        return true;
      } else {
        return false;
      }
    },
    getDataNodeByName: function (datanodeName) {
      const datanodes = datanodesListModel.datanodes();

      // Find the datanode with the name specified
      return _.find(datanodes, (datanodeModel) => datanodeModel.name() === datanodeName);
    },
    getAllDataNodes: function () {
      return datanodesListModel.datanodes();
    },
    clear: function () {
      schedulerProfiling = {}; // GHI for issue #188

      const allDnNames = datanodesListModel.datanodes().map((_) => _.name());
      datanodesListModel.clear();

      if (self.eventCenter && allDnNames.length) {
        self.eventCenter.sendEvent(EVENTS_EDITOR_DATANODE_DELETED, allDnNames);
      }
    },
    showDepGraph: function (name) {
      graphVisu.showDepGraph(name);
      let scopeDepGraph = angular.element(document.getElementById('dependency__graph--container')).scope();
      scopeDepGraph.getUniqTypes();
    },
    editNodeFromGraph: function (dataNode) {
      let scopeDepGraph = angular.element(document.getElementById('dependency__graph--container')).scope();
      scopeDepGraph.editNodeFromGraph(dataNode);
    },
    selectNodeFromTagList: function (type) {
      graphVisu.selectNodeFromTagList(type);
    },
    selectConnectedWithWidget: function (tag) {
      graphVisu.selectConnectedWithWidget(tag);
    },
    closeGraph: function () {
      graphVisu.closeGraph();
    },
    isSingletonNode: function (name) {
      var isSingle = datanodesDependency.isSingletonNode(name);
      return isSingle;
    },
    RemoveUnusedDatanodes: function () {
      var zombieDatanodeList = [];
      var SingletonNodeList = datanodesDependency.getAllsingletonNodes();
      for (let i in SingletonNodeList) {
        [bFoundConnection, prop] = isConnectedWithWidgt(SingletonNodeList[i]);
        if (!bFoundConnection) {
          zombieDatanodeList.push(SingletonNodeList[i]);
        }
      }
      if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) console.log('zombie: ', zombieDatanodeList);

      var dataToDelete = [];
      var bFound = false;
      var contentElement = xdsjson.getDataList(
        zombieDatanodeList,
        'Unused data is a singleton node that is not connected to any widget.<br>Please check data to be deleted : '
      );
      new DialogBoxForData(contentElement, 'List of unused data', 'Delete', 'Cancel', function () {
        for (var i = 0; i < zombieDatanodeList.length; i++) {
          if ($('#data-checkbox-' + i).is(':checked')) {
            dataToDelete[i] = zombieDatanodeList[i];
            deleteDn(datanodesManager.getDataNodeByName(zombieDatanodeList[i]));
            bFound = true;
          }
        }
      });
    },
    stopSchedule: function () {
      var datanodes = datanodesListModel.datanodes();

      datanodesDependency.clearExtraStartNodesList();
      datanodesDependency.clearSetvarList();
      datanodesDependency.clearProcessedSetvarList();
      datanodesDependency.clearCurrentGraphList();

      //stop all current operations
      for (var index in datanodes) {
        if (datanodes[index].execInstance() != null) {
          datanodes[index].execInstance().stopAllOperations();
          swal('Scheduler progress', 'scheduler is stopped!', 'success');
          break;
        }
      }
    },
    isConnectedWithWidgt,
    previewWidget: function (instanceId) {
      var childPrev = [];
      $('#widgets-preview-top > div').each((index, elem) => {
        childPrev.push(elem.id);
        $('#' + elem.id).hide();
      });
      $('#widget-preview-zone-' + instanceId).show();
    },
    deleteDataNode: function (viewModel, type, title) {
      deleteDataNode(viewModel, type, title);
    },
    createPluginEditor: function (types, instanceType, settings, flag) {
      createPluginEditor(types, instanceType, settings, flag);
    },
    settingsSavedCallback: function (viewModel, newSettings, selectedType) {
      return pluginEditor.saveSettings(
        selectedType,
        newSettings,
        () => !!(viewModel ? updateDatanode(viewModel, newSettings) : createDatanode(newSettings))
      );
    },
    updateDatanode,
    getOldSettingsCallback: function (viewModel) {
      getOldSettingsCallback(viewModel);
    },
    getDataNodeNewSettings: function () {
      return pluginEditor.getNewSettings();
    },
    getJsonEd: function () {
      return jsonEdit;
    },
    setJsonEditor: function (jsonContainer) {
      jsonEdContainer = jsonContainer;
    },
    getJsonEditor: function () {
      return jsonEdContainer;
    },
    datanodesDependency: function () {
      //need this for chalkit api
      return datanodesDependency;
    },
    setCurrentDataNode: function (datanodeName) {
      currentDataNode = datanodeName;
    },
    getCurrentDataNode: function () {
      //need this for chalkit api
      return currentDataNode;
    },
  };
})();
