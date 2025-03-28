// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DatanodeModel : fork from freeboard                                │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ + authors(s): Abir EL FEKI, Mongi BEN GAID                         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { xDashConfig } from 'config.js';
import _ from 'lodash';
import ko from 'knockout';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { offSchedLogUser, setDirtyFlagSafe } from 'kernel/base/main-common';
import { runtimeSingletons } from 'kernel/runtime-singletons';
import { FormulaInterpreter } from '../execution-engine/FormulaInterpreter';
import { DatanodeScheduler } from '../execution-engine/DatanodeScheduler';
import { loadJsScripts } from 'kernel/datanodes/plugins/thirdparty/utils';

export const DatanodeModel = function (datanodesListModel, datanodePlugins, datanodesDependency, timeManager) {
  var self = this;
  this.datanodeRefreshNotifications = {};
  this.calculatedSettingScripts = {};

  this.formulaInterpreter = new FormulaInterpreter(datanodesListModel, self, datanodePlugins, datanodesDependency);
  this.execInstance = ko.observable(null);

  function disposeDatanodeInstance() {
    if (!_.isUndefined(self.datanodeInstance)) {
      if (_.isFunction(self.datanodeInstance.onDispose)) {
        self.datanodeInstance.onDispose();
      }

      self.datanodeInstance = undefined;
    }
  }

  this.is_specific_exec = false;
  this.name = ko.observable();
  this.latestData = ko.observable();
  this.status = ko.observable('None');
  this.last_updated = ko.observable('never');
  this.last_error = ko.observable();
  this.last_error_msg = ko.observable('none'); // more detailed error message from datanode. like runtime error for JSON formulas
  this.error = ko.observable();
  this.isSchedulerStartSafe = ko.observable(false);
  this.sampleTime = ko.observable(0);
  this.statusForScheduler = ko.observable('Ready'); // Ready;Wait;NotReady;Stop
  this.schedulerStatus = ko.observable('Running'); // Running; Stop
  this.iconType = ko.observable();
  this.settings = ko.observable({});
  this.settings.subscribe(function (newValue) {
    if (!_.isUndefined(self.datanodeInstance) && _.isFunction(self.datanodeInstance.onSettingsChanged)) {
      if (!self.formulaInterpreter.updateCalculatedSettings(true, false, false)) {
        self.error(true);
        return;
      }

      if (self.datanodeInstance.onSettingsChanged(newValue, self.status())) self.error(false);
      else self.error(true);
    }
  });

  this.completeExecution = function (particularStatus) {
    const dsName = self.name();
    var schedulerResult = {};
    var statusForSched;

    if (_.isUndefined(datanodesManager.getDataNodeByName(dsName))) {
      return;
    }

    //AEF: test may be removed (abort fct is fixed)
    if (datanodesManager.getDataNodeByName(dsName).schedulerStatus() == 'Stop') {
      if (particularStatus !== 'NOP') return;
    }
    //

    if (_.isUndefined(particularStatus)) {
      statusForSched = self.status();
    } else {
      statusForSched = particularStatus; // "NOP";
    }
    if (self.execInstance() !== null) {
      schedulerResult = self.execInstance().operationCompleted(dsName, statusForSched);
    } else {
      if (statusForSched === 'Error') {
        if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
          console.log('scheduling is already terminated. ' + dsName + ' is ended with status = ' + self.status());
      } else {
        if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
          console.log(
            'statusCallback of ' + dsName + ' is called before scheduling instance created. Status = ' + self.status()
          );
        schedulerResult = { schedulingInstanceTerminated: false };
      }
    }

    if (schedulerResult.schedulingInstanceTerminated) {
      //AEF: add test on instance
      if (self.execInstance() == null) {
        if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
          console.log('scheduling is already terminated. ' + dsName + ' is ended with status = ' + self.status());
      } else {
        datanodesManager.getDataNodeByName(schedulerResult.initiatorNode).schedulerEnd();
      }
    }
  };

  // Status: None, Pending, Running, OK, Error
  this.statusCallback = function (newStatus, msg) {
    self.status(newStatus);
    if (newStatus == 'OK') {
      self.last_error_msg('No error message');
      $('[data-toggle="tooltip"]').tooltip('fixTitle');
    } else if (newStatus !== 'Pending' && newStatus !== 'None' && newStatus !== 'Running') {
      self.completeExecution();
    }
    if (!_.isUndefined(msg) && newStatus == 'Error') {
      //AEF: used for Error only
      self.last_error_msg(msg);
      $('[data-toggle="tooltip"]').tooltip('fixTitle');
    }
  };

  this.statusForSchedulerCallback = function (newStatus) {
    self.statusForScheduler(newStatus);
    if (newStatus === 'Ready') {
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) console.log(self.name() + ' is ready now.');
      self.schedulerStart([self.name()], self.name(), 'ReadyNow');
    } else if (newStatus === 'NotReady') {
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
        console.log('initialization of ' + self.name() + ' is interrupted due to error.');
      self.status('Error');
      self.updateCallback(undefined, 'Error');
    } else if (newStatus === 'Stop') {
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
        console.log('initialization of ' + self.name() + ' need to be redone due to stop.');
      self.status('None');
      self.updateCallback('', 'None');
    }
  };

  this.notificationCallback = function (notifType, dsSettingsName, msg, title, lastNotif) {
    if (runtimeSingletons.xdashNotifications) {
      runtimeSingletons.xdashNotifications.manageNotification(notifType, dsSettingsName, msg, lastNotif);
    } else {
      console.log('no notification lib was found. ');
      if (!_.isUndefined(title) && !_.isNull(title)) {
        swal(title, msg, notifType);
      }
    }
  };

  this.updateCallback = function (newData, status) {
    const dnName = self.name();
    const now = new Date();

    datanodesListModel.processDatanodeUpdate(dnName, newData);
    self.latestData(newData);
    self.last_updated(now.toLocaleTimeString());
    if (status !== 'Error' && status !== 'None' && status !== 'Running') self.completeExecution();

    // question to Ameur : why this code?
    const $body = angular.element(document.body);
    const $rootScope = $body.scope().$root;
    $rootScope.alldatanodes = datanodesManager.getAllDataNodes();
    $rootScope.safeApply(); // TODO ?

    widgetConnector.refreshDatanodeConsumers(newData, self.name(), self.status(), self.last_updated());
  };

  this.type = ko.observable();

  function finishLoad (datanodeType, bOK) {
    // MBG : Add dependency information
    const dsName = self.name();
    if (!datanodesDependency.isNode(dsName)) {
      datanodesDependency.addNode(dsName);
    }

    if (
      !datanodeType.newInstance(
        self.settings(),
        function (datanodeInstance) {
          self.datanodeInstance = datanodeInstance;
          if (!self.formulaInterpreter.updateCalculatedSettings(true, false, false)) {
            bOK = false;
            return false;
          }
        },
        self.updateCallback,
        self.statusCallback,
        self.notificationCallback,
        self.statusForSchedulerCallback
      )
    ) {
      bOK = false;
    }
    if (!bOK) return false;
    return true;
  }

  this.type.subscribe(function (newValue) {
    disposeDatanodeInstance();

    if (newValue in datanodePlugins && _.isFunction(datanodePlugins[newValue].newInstance)) {
      var datanodeType = datanodePlugins[newValue];
      var bOK = true;

      // Do we need to load any external scripts?
      if (datanodeType.external_scripts && datanodeType.external_scripts.length) {
        //AEF: here pb when external scripts: takes to long to load and it is not defined into callback --> pb of execution order
        loadJsScripts(datanodeType.external_scripts, finishLoad);
      } else {
        finishLoad(datanodeType, bOK);
      }
      if (!bOK) self.error(true);
    } else {
      swal(
        'DataNode Plugin Error',
        "The required '" + newValue + "' plugin does not exist in this Chalk'it version !",
        'error'
      );
      self.error(true);
    }
  });

  this.serialize = function () {
    return {
      name: self.name(),
      type: self.type(),
      settings: self.settings(),
    };
  };

  this.deserialize = function (object) {
    self.settings(object.settings);
    self.name(object.name);
    self.type(object.type);
    if (object.type === 'Memory_plugin') {
      self.is_specific_exec = true;
    }
    let iconName = 'icn-';
    if (_.isUndefined(datanodePlugins[object.type])) {
      iconName += 'json-variable';
    } else {
      iconName += datanodePlugins[object.type].icon_type.replace(/\.[^/.]+$/, '');
    }
    self.iconType(iconName);
    if (self.error()) return true; // avoid blocking end user if e.g a web-service does not respond
    else return true;
  };

  this.getDataRepresentation = function (dataPath) {
    var valueFunction = new Function('data', 'return ' + dataPath + ';');
    return valueFunction.call(undefined, self.latestData());
  };

  // instead of directly calling updateNow, the new approach consists in calling schedulerStart
  // it creates "a graph execution instance" (graog in SynDEx terminology)
  this.schedulerStart = function (sourceNodesArg, initiatorNodeArg, callOriginArg) {
    var sourceNodes;
    var initiatorNode;
    var dsName = self.name();

    if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
      console.log('schedulerStart with sourceNodesArg:', sourceNodesArg, ' and initiatorNodeArg:', initiatorNodeArg);
    if (_.isUndefined(sourceNodesArg)) {
      sourceNodes = [dsName];
      initiatorNode = dsName;
    } else {
      sourceNodes = sourceNodesArg;
      initiatorNode = initiatorNodeArg;
    }

    if (_.isUndefined(callOriginArg)) {
      callOriginArg = 'unidentified'; // from update buttons handled via Knockout.js (dataNode creation)
    }

    //get All disconnected graphs (no computation needed)
    let RunningList = _fillRunningList(sourceNodes);

    RunningList.disconSourceNodes.forEach(function (source, index) {
      datanodesDependency.addCurrentGraphList(RunningList.disconSourceNodes, index);
      if (datanodesManager.foundDatanode(source[0])) {
        if (datanodesManager.getDataNodeByName(source[0]).execInstance() == null) {
          let triggeredNodes = Object.assign({}, source); //needed for sourceNodes with explicitTrig flag
          sourceNodes = _updateSourceNodes(source, callOriginArg);
          initiatorNode = sourceNodes[0];
          if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
            console.log('new scheduler instance with sourceNodes:', sourceNodes, ' and initiator:', initiatorNode);

          //Create schedulers as much as disconnected graphs are.
          var dsSched = new DatanodeScheduler(
            datanodesDependency,
            sourceNodes,
            triggeredNodes,
            initiatorNode,
            callOriginArg
          );
          // propagate execution instance pointer only to datanodes that belong to same connected graph of sourcesNodes
          const currentGraph = RunningList.disconGraphs[index];
          // propagate execution instance pointer to all other datanodes that belong
          if (currentGraph != null) {
            currentGraph.forEach(function (name) {
              if (datanodesManager.foundDatanode(name)) {
                //AEF: process memory list here
                const memorydataNodeList = datanodesDependency.getMemorydataNodeList();
                if (memorydataNodeList.size) {
                  const param = Array.from(memorydataNodeList.keys()).filter((memName) => currentGraph.has(memName));

                  if (param.length > 0) {
                    if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
                      console.log('Start schedule from memory datanodes list: ' + param);
                    //const origin = memorydataNodeList.get(param[0]);
                    datanodesDependency.clearMemorydataNodeList(param);
                    datanodesManager.getDataNodeByName(param[0]).updateNow(true, true, true, 'memory');
                  }
                }
                //AEF END

                if (datanodesManager.getDataNodeByName(name).execInstance() != null) {
                  if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
                    console.log('Instance of ', name, ' is already running'); //AEF: NEEDED ONLY FOR DEBUG
                } else {
                  datanodesManager.getDataNodeByName(name).execInstance(dsSched);
                  datanodesManager.getDataNodeByName(name).schedulerStatus('Running');
                }
              } else {
                const text = "Datanode '" + name + "' does not exist but referenced in another datanode";
                if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) console.log(text);
                return;
              }
            });
          } else {
            if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
              console.log('error in building disconnected graphs');
          }

          if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) {
            console.log(
              'scheduling instance created, clkTick:' +
                timeManager.getCurrentTick() +
                ', clkTime(s):' +
                timeManager.getCurrentTime()
            );
            let initiatorNode = datanodesManager.getDataNodeByName(sourceNodes[0]).execInstance().getInitiatorNode();
            console.log('scheduling instance of started with ' + initiatorNode);
          }
          datanodesManager.getDataNodeByName(sourceNodes[0]).execInstance().launchSchedule();
        } else {
          // console.log('Problem : request for starting a new scheduling instance whereas another one is pending');
          if (callOriginArg === 'globalFirstUpdate' && timeManager.getCurrentTick() != 0) {
            // AEF: MAY BE NO NEEDED WITH DISCONNECTED GRAPHS
            for (var val in sourceNodesArg) {
              if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
                console.log(
                  'operation ' +
                    sourceNodesArg[val] +
                    ', called from ' +
                    callOriginArg +
                    ', is added to extraStartNodes list'
                );
              datanodesDependency.addExtraStartNodesList(sourceNodesArg[val], callOriginArg);
            }
          } else if (callOriginArg === 'timer' && timeManager.getCurrentTick() != 0) {
            //ignored and no added in the stack, next instance will be executed later
            if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) {
              console.log(
                'Execution of operation ' +
                  source[0] +
                  ' is ignored at clkTick:' +
                  timeManager.getCurrentTick() +
                  ' because scheduling instance is not terminated yet'
              );
              console.log('Try to increase sample time of operation ' + source[0]);
            }
          } else if (callOriginArg !== 'timer' && callOriginArg !== 'globalFirstUpdate') {
            //add in the stack to be executed later
            if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
              console.log(
                'operation ' + source[0] + ', called from ' + callOriginArg + ', is added to extraStartNodes list'
              );
            datanodesDependency.addExtraStartNodesList(source[0], callOriginArg);
          }
        }
      } else {
        if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) {
          const text = "Datanode '" + source[0] + "' does not exist but referenced in another datanode";
          //self.notificationCallback("error", self.name(), text, "Bad datanode reference");
          console.log(text);
        }
        return;
      }
    });
    //
  };

  // end of graph execution instance
  this.schedulerEnd = function () {
    if (self.name() !== self.execInstance().getInitiatorNode()) {
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
        console.log(
          'scheduling instance will not be terminated by the initiator ' + self.execInstance().getInitiatorNode()
        );
    }
    const callOrigin = self.execInstance().getSchedulerCallOrigin();
    if (self.execInstance() != null) {
      const allDisconnectedGraphs = datanodesDependency.getAllDisconnectedGraphs();
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
        console.log('get belonging disconnected graph (from schedulerEnd)');
      const graph = datanodesDependency.getBelongingDisconnectedGraph(self.name(), allDisconnectedGraphs);
      if (graph != null) {
        graph.forEach(function (name) {
          if (datanodesManager.foundDatanode(name)) {
            if (datanodesManager.getDataNodeByName(name).execInstance() == null) {
              if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
                console.log('Instance of ', name, ' is already terminated'); //AEF: NEEDED ONLY FOR DEBUG
            } else {
              datanodesManager.getDataNodeByName(name).execInstance(null);
              datanodesManager.getDataNodeByName(name).isSchedulerStartSafe(true);
            }
          } else {
            if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) {
              const text = "Datanode '" + name + "' does not exist but referenced in another datanode";
              //self.notificationCallback("error", self.name(), text, "Bad datanode reference");
              console.log(text);
            }
            return;
          }
        });
      }
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
        console.log('scheduling instance terminated by ' + self.name());
      // Now that the scheduling is terminated, we handle in the corresponding order:
      // memory update, then setVariables, then extraStartNodes

      // Memory update
      const memorydataNodeList = datanodesDependency.getMemorydataNodeList();
      // SetVariables
      const setvarList = datanodesDependency.getSetvarList();
      const processedSetvarList = datanodesDependency.getProcessedSetvarList();
      const filteredSetvarList = new Map(Array.from(setvarList).filter(([key]) => !processedSetvarList.has(key)));
      let proceed = true;
      const graphList = datanodesDependency.getCurrentGraphList();
      const RunningList = Array.from(graphList.keys());
      const currentIndex = graphList.get(RunningList[0]);
      if (graphList.size) {
        proceed = false;
        if (currentIndex === RunningList[0].length - 1) {
          proceed = true;
        }
      }

      if (proceed) {
        if (callOrigin !== 'timer') {
          datanodesDependency.clearCurrentGraphList();
        }
        if (filteredSetvarList.size) {
          if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) {
            console.log('Start schedule from setVariable list: ' + Array.from(filteredSetvarList.keys()));
            console.log('triggered by : ' + Array.from(filteredSetvarList.values()));
            //console.log('triggered by : ' + Array.from([...new Set(filteredSetvarList.values())]));
          }
          const param = Array.from(filteredSetvarList.keys());
          datanodesDependency.addProcessedSetvarList(filteredSetvarList);
          datanodesDependency.clearSetvarList();
          //clear same dn in memList
          if (memorydataNodeList.size) {
            const memList = Array.from(memorydataNodeList.keys()).filter((memName) => filteredSetvarList.has(memName));
            datanodesDependency.clearMemorydataNodeList(memList);
          }
          //
          self.schedulerStart(param, param[0], 'setVariable');
        } else {
          datanodesDependency.clearSetvarList();
          datanodesDependency.clearProcessedSetvarList();

          // extraStartNodes
          const extraStartNodesList = datanodesDependency.getExtraStartNodesList();
          if (extraStartNodesList.size) {
            if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) {
              console.log('Start schedule from extraStartNodesList:' + Array.from(extraStartNodesList.keys()));
            }
            //update operationsToExecute with extraStartNodesList
            const param = Array.from(extraStartNodesList.keys());
            const origin = extraStartNodesList.get(param[0]);
            datanodesDependency.clearExtraStartNodesList();
            self.schedulerStart(param, param[0], origin);
          }
        }
        //}
      } else {
        if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
          console.log('Problem : request for ending a scheduling instance whereas no instance exists');
      }
    }
  };

  function _passTriggers(bCalledFromOrchestrator, bForceAutoStart, callOrigin) {
    if (bCalledFromOrchestrator && self.settings().explicitTrig) {
      //if explicittrig is true, no execution when triggered by predecessor, except triggered by force
      self.completeExecution('NOP');
      if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
        console.log('Called from predecessor, but ExplicitTrigger of ', self.settings().name + ' is true');
      return false;
    }
    if (callOrigin === 'timer' && self.settings().explicitTrig) {
      //AEF: dataNode is not triggered
      self.completeExecution('NOP');
      if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
        console.log('Called from timer, but ExplicitTrigger of ', self.settings().name + ' is true');
      return false;
    }
    //test on autoStart because som plugin doesnt have it (but act if it is true)
    if (!_.isUndefined(self.settings().autoStart)) {
      //if autostart is false, no auto execution at creat/edit/load, except if triggered by predecessor or by force
      if (!self.settings().autoStart && !(bForceAutoStart || bCalledFromOrchestrator)) {
        //add test to let execute for timer when the past status is ok
        if (!(callOrigin === 'timer' && self.status() === 'OK')) {
          self.completeExecution('NOP');
          if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
            console.log('AutoStart of ', self.settings().name + ' is false');
          return false;
        }
      }
    }
    return true;
  }

  this.updateNow = function (bCalledFromOrchestrator, bForceAutoStart, bAllPredExecuted, callOrigin) {
    var bMultiple = false;

    if (self.sampleTime() < 1 && self.sampleTime() >= 0.1) {
      if (Math.floor(timeManager.getCurrentTime() * 10) % (self.sampleTime() * 10) == 0) {
        bMultiple = true;
      }
    } else if (self.sampleTime() >= 1) {
      if (timeManager.getCurrentTime() % self.sampleTime() == 0) {
        bMultiple = true;
      }
    } else if (self.sampleTime() != 0) {
      console.log('sampleTime cannot be lesser than 0.1s');
    }

    if (self.sampleTime() == 0 || bMultiple) {
      //AEF: put tests here and delete handling them inside datanodes plugins
      if (!_passTriggers(bCalledFromOrchestrator, bForceAutoStart, callOrigin)) return;

      if (!_.isUndefined(self.datanodeInstance) && _.isFunction(self.datanodeInstance.updateNow)) {
        if (!self.formulaInterpreter.updateCalculatedSettings(false, bAllPredExecuted, bForceAutoStart)) {
          self.error(true);
          return;
        }
        if (bAllPredExecuted) {
          if (self.formulaInterpreter.bCalculatedSettings) {
            let predsList = Array.from(datanodesDependency.getPredecessorsSet(self.name())); // MBG optim for Python 26/10/2021
            var bRet = self.datanodeInstance.updateNow(bForceAutoStart, predsList);
            if (!_.isUndefined(bRet)) {
              if (bRet.notTobeExecuted) {
                self.completeExecution('NOP');
              }
            }
          } else {
            //avant d'arriver ici forcement il y a eu statusCallback("Error") et donc  self.completeExecution();
            self.notificationCallback(
              'info',
              self.settings().name,
              'Scheduling of this operation is interrupted because of its last error',
              'Scheduler interruption'
            );
            self.updateCallback(undefined, 'Error'); //AEF instead of updateNow, we update just data display
          }
        } else {
          if (!self.settings().explicitTrig || self.settings().autoStart)
            swal(
              'Update is not available',
              'Predecessors of operation "' + self.settings().name + '" need to be executed first.',
              'info'
            );
          self.completeExecution('NOP');
          self.updateCallback(undefined, 'None');
        }
      }
    } else {
      //AEF
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
        console.log(
          self.name() +
            ' is not executed because currentTime: ' +
            timeManager.getCurrentTime() +
            ' is not multiple of sampleTime: ' +
            self.sampleTime()
        );

      self.completeExecution('NOP');
    }
  };

  this.dispose = function () {
    const dsName = self.name();
    datanodesDependency.removeNode(dsName);
    if (self.sampleTime()) {
      timeManager.unregisterDatanode(dsName);
    }
    //stop this operation
    if (self.execInstance() != null) {
      if (dsName !== self.execInstance().getInitiatorNode()) {
        self.execInstance().stopOperation(dsName);
      } else {
        self.notificationCallback(
          'info',
          dsName,
          'Scheduling is aborted because datanode ' + dsName + ' is part of scheduling operations',
          'Scheduler stop'
        );
        self.execInstance().stopAllOperations();
      }
    }
    //
    disposeDatanodeInstance();
  };

  this.canSetValue = function () {
    return self.datanodeInstance.canSetValue();
  };

  this.setValue = function (propertyName, val, fromApi) {
    // dirty flag handling
    if (_.isFunction(self.datanodeInstance.getValue)) {
      if (val != self.datanodeInstance.getValue(propertyName)) {
        setDirtyFlagSafe(true);
      }
    } else {
      setDirtyFlagSafe(true);
    }

    self.datanodeInstance.setValue(propertyName, val);

    if (!fromApi) {
      self.schedulerStart([self.name()], self.name(), 'setValue');
    }
  };

  // MBG 06/02/2021 : for Flairmap : set value and propagate to be visible in consuming formulas
  // when scheduler is in progress
  this.setValueSpec = function (propertyName, val) {
    const dnName = self.name();
    self.setValue(propertyName, val);

    let newData = JSON.parse(self.settings()['json_var']);
    const now = new Date();
    const formatRet = self.dataPreviewFormat.format(newData);
    newData = formatRet.newData;
    self.beautifulString(formatRet.previewData);
    datanodesListModel.processDatanodeUpdate(dnName, newData);
    self.latestData(newData);
    self.last_updated(now.toLocaleTimeString());
    setDirtyFlagSafe(true);
  };

  this.setFile = function (fileContent) {
    // MBG refactoring : to do the same thing as setValue
    if (self.datanodeInstance.setFile(fileContent)) {
      self.schedulerStart([self.name()], self.name(), 'setFile');
      setDirtyFlagSafe(true);
    }
  };

  this.isSettingNameChanged = function (settingName) {
    if (!_.isUndefined(self.datanodeInstance)) {
      return self.datanodeInstance.isSettingNameChanged(settingName);
    }
  };

  this.getSavedSettings = function () {
    if (!_.isUndefined(self.datanodeInstance)) {
      if (_.isFunction(self.datanodeInstance.getSavedSettings)) return self.datanodeInstance.getSavedSettings();
    }
  };

  this.isSettingSampleTimeChanged = function (sampleTime) {
    if (!_.isUndefined(self.datanodeInstance)) {
      if (_.isFunction(self.datanodeInstance.isSettingSampleTimeChanged))
        return self.datanodeInstance.isSettingSampleTimeChanged(sampleTime);
    }
  };

  this.getXHR = function () {
    if (!_.isUndefined(self.datanodeInstance)) {
      if (_.isFunction(self.datanodeInstance.getXHR)) return self.datanodeInstance.getXHR();
    }
  };

  function _fillRunningList(sourceNodes) {
    let list = {
      disconSourceNodes: [], // create a separeted list of sourcesNodes according to their belonging disconneted graph
      disconGraphs: [], // involved disconnected graphs according to sourcesNodes
      indicesDisconGraphs: [], // indices of involved disconnected graphs according to sourcesNodes
    };

    const allDisconnectedGraphs = datanodesDependency.getAllDisconnectedGraphs();
    sourceNodes.forEach(function (source) {
      //get the disconnected graph to which this sourceNode belongs
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
        console.log('get belonging disconnected graph (from schedulerStart)');
      const graph = datanodesDependency.getBelongingDisconnectedGraph(source, allDisconnectedGraphs);
      if (graph != null) {
        if (!list.indicesDisconGraphs.includes(graph.index)) {
          // verify if this graph is already added into the RunningList
          list.indicesDisconGraphs.push(graph.index);
          list.disconSourceNodes.push([source]);
          list.disconGraphs.push(graph);
        } else {
          list.disconSourceNodes[list.indicesDisconGraphs.indexOf(graph.index)].push(source); // add the sourceNode to the right place
        }
      } else {
        if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
          console.log('error in building disconnected graphs');
      }
    });
    datanodesDependency.addCurrentGraphList(list.disconSourceNodes, 0);
    return list;
  }

  function _updateSourceNodes(sourceNodes, callOriginArg) {
    let startNodes = new Set(sourceNodes);

    const descendants = datanodesDependency.getDescendants(sourceNodes);
    // AEF: remove memory datanodes from desendant (to keep them in startNodes)
    descendants.forEach((desc) => {
      if (desc.indexOf('pastValue_') !== -1) {
        descendants.delete(desc);
      }
    });

    if (callOriginArg === 'setVariable') {
      let names = new Set();
      let nodesToKeep = new Set();

      startNodes.forEach((node) => {
        if (!node.startsWith('pastValue_')) {
          names.add(node);
        }
      });
      startNodes.forEach((node) => {
        if (node.startsWith('pastValue_')) {
          let name = node.substring(10);
          if (names.has(name)) {
            nodesToKeep.add(node); // 'pastValue_name'
            nodesToKeep.add(name); // the corresponding 'name'
          }
        }
      });
      // remove ('pastValue_name' and the corresponding 'name') datanodes from desendant (to keep them in startNodes)
      nodesToKeep.forEach((node) => {
        descendants.delete(node);
      });
    }

    let commonNodes = new Set(Array.from(descendants).filter((element) => startNodes.has(element)));
    //remove startnodes if they belong to other starnodes descendants
    commonNodes.forEach(function (node) {
      sourceNodes.splice(sourceNodes.indexOf(node), 1);
    });

    let sortedSourceNodes = sourceNodes.sort((a, b) => {
      const meetsCondition_a = a.indexOf('pastValue_') !== -1;
      const meetsCondition_b = b.indexOf('pastValue_') !== -1;
      if (meetsCondition_a && !meetsCondition_b) {
        return -1;
      } else if (!meetsCondition_a && meetsCondition_b) {
        return 1;
      }
      return 0;
    });
    return sortedSourceNodes;
  }
};
