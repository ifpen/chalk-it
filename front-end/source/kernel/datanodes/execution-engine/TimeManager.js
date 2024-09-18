// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ TimeManager                                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { xDashConfig } from 'config.js';
import _ from 'lodash';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { offSchedLogUser } from 'kernel/base/main-common';

export function TimeManager() {
  var periodsMap = [];
  var refreshTimer;
  var currentTick = 0;
  var basePeriod = 0; // PGCD (si on pousse l'optimisation) ou 0.1 secondes (si on pousse la simplicité du code)
  var hyperPeriod;
  var initiatorDatanode;
  var startNodes = []; // première approche : initialiser aux noeuds source (sans prédécesseurs)
  /*-----------------pgcd-----------------*/
  function pgcd(a, b) {
    if (_.isUndefined(b)) {
      b = a;
    }
    var r = 0;
    // swap if a > b
    if (a < b) {
      var temp = a;
      a = b;
      b = temp;
    }

    if ((r = a % b) == 0) return b;
    else return pgcd(b, r);
  }

  /*-----------------computeBasePeriod-----------------*/
  function computeBasePeriod(sampleTime) {
    var baseP = sampleTime;
    for (var prop in periodsMap) {
      baseP = pgcd(periodsMap[prop], baseP);
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) console.log(basePeriod);
    }
    return baseP;
  }

  /*-----------------getCurrentTick-----------------*/
  function getCurrentTick() {
    return currentTick;
  }

  /*-----------------getCurrentTime-----------------*/
  function getCurrentTime() {
    return currentTick * basePeriod;
  }

  /*-----------------isRegisteredDatanode-----------------*/
  function isRegisteredDatanode(dsName) {
    if (!_.isUndefined(periodsMap[dsName])) return true;
    else return false;
  }
  /*-----------------registerDatanode-----------------*/
  function registerDatanode(sampleTime, dsName, callOriginArg) {
    // add periodsMap
    periodsMap[dsName] = sampleTime;
    // add startNodes (periodic)
    if (startNodes.indexOf(dsName) == -1) {
      //dsName does not already exist in startNodes
      startNodes.push(dsName);
    }
    // update initiatorDatanode
    initiatorDatanode = startNodes[0];
    // recompute BasePeriod
    basePeriod = computeBasePeriod(sampleTime);
    // optional: reset tick
    currentTick = 0;
    if (callOriginArg != 'globalFirstUpdate') {
      // update timer
      createRefreshTimer(basePeriod * 1000);
    }
  }

  /*-----------------unregisterDatanode-----------------*/
  function unregisterDatanode(dsName) {
    // remove periodsMap
    delete periodsMap[dsName];
    // remove startNodes
    var index = startNodes.indexOf(dsName);
    if (index != -1) {
      //dsName exist in startNodes
      startNodes.splice(index, 1);
    } else {
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog) console.log('error in datanode ' + dsName);
      return;
    }
    // optional: reset tick
    currentTick = 0;
    if (Object.keys(periodsMap).length == 0) {
      // clear timer when all periodic datanodes are deleted
      // delete initiatorDatanode
      initiatorDatanode = undefined;
      clearInterval(refreshTimer);
      refreshTimer = undefined;
      basePeriod = 0;
      // currentTick = 0;
    } else {
      // update initiatorDatanode
      initiatorDatanode = startNodes[0];
      // recompute BasePeriod
      //basePeriod = computeBasePeriod(periodsMap[initiatorDatanode]);
      basePeriod = computeBasePeriod();
      // optional: reset tick
      // currentTick = 0;
      // update timer
      createRefreshTimer(basePeriod * 1000);
    }
  }

  function createRefreshTimer(interval) {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(function () {
      oneStep(false); // launched after interval
    }, interval);
    oneStep(true); // first oneStep for init only
  }

  function oneStep(firstStep) {
    //modif AEF 23/11/20: first step do nothing
    if (!firstStep) {
      // call schedulerStart avec un mode timer, en transmettant le currentTick
      if (initiatorDatanode) {
        var initiatorDatanodeModel = datanodesManager.getDataNodeByName(initiatorDatanode);
        if (initiatorDatanodeModel) {
          initiatorDatanodeModel.schedulerStart(startNodes, initiatorDatanode, 'timer');
        } else {
          clearInterval(refreshTimer);
          console.log('initiatorDatanodeModel is undefined');
        }
      } else {
        clearInterval(refreshTimer);
        console.log('initiatorDatanode is undefined');
      }
      //advance time after first exec
      currentTick = currentTick + 1;
    } else {
      if (!offSchedLogUser.value && !xDashConfig.disableSchedulerLog)
        console.log(initiatorDatanode, ' timer initialization');
    }
  }

  function getBasePeriod() {
    return basePeriod;
  }

  function getHyperPeriod() {
    return hyperPeriod;
  }

  // public methods
  return {
    registerDatanode,
    unregisterDatanode, // appeler au delete datanode  ,
    isRegisteredDatanode,
    getBasePeriod,
    getHyperPeriod,
    getCurrentTick,
    getCurrentTime,
  };
}
