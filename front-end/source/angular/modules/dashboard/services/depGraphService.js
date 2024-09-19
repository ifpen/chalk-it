// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ depGraphService                                                                      │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                          │ \\
// | Licensed under the Apache License, Version 2.0                                       │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mondher AJIMI                                     │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import _ from 'lodash';

angular.module('modules.dashboard').service('DepGraphService', [
  '$rootScope',
  function ($rootScope) {
    const self = this;

    /*---------- showDepGraph ----------------*/
    self.showDepGraph = function (event, scopeDash) {
      datanodesManager.showDepGraph(event);
      scopeDash.editorView.showGraphPanel = true;
    };

    /*---------- seeInDepGraph ----------------*/
    self.seeInDepGraph = function (event, scopeDash) {
      datanodesManager.showDepGraph(event); //to be changed later
      scopeDash.editorView.showGraphPanel = true;
    };

    /*---------- selectNodeFromTagList ----------------*/
    self.selectNodeFromTagList = function (type) {
      datanodesManager.selectNodeFromTagList(type);
    };

    /*---------- selectConnectedWithWidget ----------------*/
    self.selectConnectedWithWidget = function (tag) {
      datanodesManager.selectConnectedWithWidget(tag);
    };

    /*---------- closeGraph ----------------*/
    self.closeGraph = function () {
      datanodesManager.closeGraph();
    };

    /*---------- editNodeFromGraph ----------------*/
    self.editNodeFromGraph = function (dataNode, scopeDash, scopeDashDn) {
      scopeDash.resetPanelStateR();
      scopeDash.editorView.showGraphPanel = false;
      self.closeGraph();
      scopeDashDn.openDataNode(dataNode);
    };

    /*---------- getUniqTypes ----------------*/
    self.getUniqTypes = function (scopeDash) {
      let allTypes = [];
      for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
        allTypes.push($rootScope.alldatanodes[i].type());
      }
      scopeDash.uniqGraphNodesTypes = _.uniq(allTypes);
    };
  },
]);
