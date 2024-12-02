// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DatanodesListModel : fork from freeboard                           │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ + authors(s): Abir EL FEKI, Mongi BEN GAID                         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import ko from 'knockout';
import { DialogBoxForDuplicateData } from 'kernel/datanodes/gui/DialogBox';
import { xdsjson } from 'kernel/datanodes/export/xdsjson';
import { DatanodeModel } from 'kernel/datanodes/base/DatanodeModel';

export function DatanodesListModel(datanodePlugins, freeboardUI, datanodesDependency, timeManager) {
  var self = this;

  this.datanodes = ko.observableArray();
  this.datasourceData = {};

  this.processDatanodeUpdate = function (datanodeName, newData) {
    self.datasourceData[datanodeName] = newData;
  };

  this.renameDatanodeData = function (oldName, newName) {
    self.datasourceData[newName] = self.datasourceData[oldName];
    delete self.datasourceData[oldName];
  };

  this._datanodeTypes = ko.observable();
  this.datanodeTypes = ko.computed({
    read: function () {
      self._datanodeTypes();

      var returnTypes = [];

      _.each(datanodePlugins, function (datanodePluginType) {
        var typeName = datanodePluginType.type_name;
        var displayName = typeName;

        if (!_.isUndefined(datanodePluginType.display_name)) {
          displayName = datanodePluginType.display_name;
        }

        returnTypes.push({
          name: typeName,
          display_name: displayName,
        });
      });

      return returnTypes;
    },
  });

  this.serialize = function () {
    const datanodes = self
      .datanodes()
      .map((datanode) => datanode.serialize())
      .sort((a, b) => a.name.localeCompare(b.name));

    return { datanodes };
  };

  this.deserialize = function (object, bClear, finishedCallback) {
    if (bClear) {
      self.clear();
    }

    self.error = ko.observable(false); // MBG 09/07/2018. error better as ko observable

    const newDatanodes = object.datanodes;

    //AEF: put "Memory plugin at the end"
    newDatanodes.sort(function (a, b) {
      if (a.type === 'Memory_plugin' && b.type !== 'Memory_plugin') {
        return 1;
      } else if (a.type !== 'Memory_plugin' && b.type === 'Memory_plugin') {
        return -1;
      }
    });

    const duplicates = [];

    newDatanodes.forEach((datanodeConfig) => {
      if (_checkDatanodeExistance(datanodeConfig.name)) {
        duplicates.push(datanodeConfig);
      } else if (!_createDatanodeInstance(datanodeConfig)) {
        throw new Error(`Datanode "${datanodeConfig.name}" is invalid.`);
      }
    });

    if (duplicates.length !== 0) {
      displayDuplicateDataList(duplicates);
    }

    // MBG scheduler refactoring
    // AEF: case of dependencyStructure has nodes not defined as datanodes
    // this case is possible when in formula for example user define a datanodes that doesn't exist
    // and forget to create it later
    const missing = {};
    for (const prop in datanodesDependency.dependencyStructure) {
      if (!self.datanodes().find((node) => prop === node.name())) {
        const successors = Array.from(datanodesDependency.getSuccessors(prop));
        missing[prop] = successors;
      }
    }
    if (Object.keys(missing).length) {
      const text = Object.entries(missing)
        .map(
          ([prop, successors]) =>
            `'${prop}' is referenced in formula of '${successors}' but doesn't exist in list of datanodes.`
        )
        .join('\n');
      swal('Missing dataNodes!', text, 'error');
    }

    // compute graphs after loading datanodes
    datanodesDependency.computeAllDisconnectedGraphs();

    // launch scheduler
    let periodicNode = null;
    let nonPeriodicNode = null;
    self.datanodes().forEach((datanode) => {
      if (!_.isUndefined(datanode.settings().sampleTime) && datanode.settings().sampleTime != 0) {
        periodicNode = datanode;
        datanode.sampleTime(datanode.settings().sampleTime);
        timeManager.registerDatanode(datanode.sampleTime(), datanode.name(), 'globalFirstUpdate'); //to compute basePeriod
      } else {
        nonPeriodicNode = datanode;
      }
    });

    if (periodicNode) {
      timeManager.registerDatanode(periodicNode.sampleTime(), periodicNode.name()); //to launch Timer
    }
    if (nonPeriodicNode) {
      self.launchGlobalFirstUpdate(nonPeriodicNode); //launch all datanodes P and NP (see modif AEF 23/11/20)
    }

    if (finishedCallback) {
      finishedCallback();
    }

    return !self.error();
  };

  function _createDatanodeInstance(datanodeConfig) {
    var datanodes = new DatanodeModel(self, datanodePlugins, datanodesDependency, timeManager);
    if (!datanodes.deserialize(datanodeConfig)) {
      self.error(true);
      return false;
    }
    self.addDatanode(datanodes);
    return true;
  }

  function displayDuplicateDataList(storeData) {
    var contentElement = xdsjson.getDuplicateDataList(
      storeData,
      'Please check data to be loaded after choosing rename or overwite option'
    );

    new DialogBoxForDuplicateData(contentElement, 'List of duplicate data name', 'Load', 'Close', function () {
      for (let i = 0; i < storeData.length; i++) {
        if ($('#data-checkbox-' + i).is(':checked')) {
          storeData[i].name = $('#data-check-' + i)[0].value;
          if ($('#data-rename-' + i).is(':checked')) {
            // add new one
            _createDatanodeInstance(storeData[i]);
          } else {
            // overwrite
            const datanodes = self.datanodes();
            const oldNode = datanodes.find((it) => it.name() === storeData[i].name);
            if (oldNode) {
              self.deleteDatanode(oldNode);
              self.datanodes.remove(oldNode);
            }
            _createDatanodeInstance(storeData[i]);
          }
        }
      }
    });
  }

  this.launchGlobalFirstUpdate = function (datanode) {
    var sourceNodes = datanodesDependency.getSourceNodesWithMemory();
    if (sourceNodes.length != 0) {
      //AEF: only if no-periodic datanodes exist as a startnodes
      datanode.schedulerStart(sourceNodes, sourceNodes[0], 'globalFirstUpdate');
    }
  };

  this.clear = function () {
    datanodesDependency.clearExtraStartNodesList();
    datanodesDependency.clearSetvarList();
    datanodesDependency.clearProcessedSetvarList();
    datanodesDependency.clearCurrentGraphList();

    _.each(self.datanodes(), function (datanode) {
      self.deleteDatanode(datanode);
    });
    //AEF: case of dependencyStructure has nodes not defined as datanodes
    // this case is possible when in formula for example user define a datanode that doesn't exist
    // and forget to create it later
    if (Object.keys(datanodesDependency.dependencyStructure).length) {
      for (var prop in datanodesDependency.dependencyStructure) {
        datanodesDependency.removeNode(prop);
        console.log('extra nodes are deleted');
      }
    }
    datanodesDependency.resetGraphList();
    self.datanodes.removeAll();
  };

  this.load = function (dashboardData, bClear, callback) {
    freeboardUI.showLoadingIndicator(true);
    self.deserialize(dashboardData, bClear, function () {
      freeboardUI.showLoadingIndicator(false);

      if (_.isFunction(callback)) {
        callback();
      }

      return !self.error();
    });
  };

  function _checkDatanodeExistance(datanodeName) {
    var bFound = false;
    for (var i = 0; i < self.datanodes().length; i++) {
      bFound = false;
      if (self.datanodes()[i].name() == datanodeName) {
        bFound = true;
        break;
      }
    }
    return bFound;
  }

  this.addDatanode = function (datanodes) {
    //AEF: add verification of data existance
    var bFound = false;
    for (var i = 0; i < self.datanodes().length; i++) {
      bFound = false;
      if (self.datanodes()[i].name() == datanodes.name()) {
        bFound = true;
        break;
      }
    }
    if (!bFound) {
      self.datanodes.unshift(datanodes); //AEF: Add items to the beginning of array
    }
  };

  this.deleteDatanode = function (datanodes) {
    var dsName = datanodes.name();
    delete self.datasourceData[dsName];
    datanodes.dispose();
  };
}
