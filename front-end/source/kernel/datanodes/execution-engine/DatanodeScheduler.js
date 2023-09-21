// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DatanodeScheduler                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

/*
Global idea
Instead of current decentralized approach, that has the advantage of simplicity, 
but the drawback of calling several times a given data source,
we propose a centralized scheduler

The scheduler is called by
- a widget updating a datanode
- an autostart of datanode
- a forced update of datanode
- a timer attached to datanode

may be here we need to introduce a tag associated with each update event, 
generalizing the "called from orchestrator" boolean introduced

*/

var schedulerProfiling = {};
var schedulerProfilingItem = {};

function DatanodeScheduler(datanodesDependency, startNodes, triggeredNodes, initiatorNode, callOrigin) {
  // safety
  if (_.isUndefined(datanodesManager)) return;

  var operationsToExecute = new Set(startNodes); // operations to be released, initialized at startNodes
  var operationsToWaitFor = new Set(); // operations to wait for, after release
  var operationsTerminated = new Set(); // terminated operations
  var operationsBlacklist = new Set(); // operations terminated with error, or their descendants
  var operationsNotReady = new Set(); // operations to ready to reinject operationsToExecute
  var operationsAll = new Set();
  datanodesManager.getAllDataNodes().forEach(function (datanode) {
    operationsAll.add(datanode.name());
    if (!xDashConfig.disableSchedulerProfiling) {
      schedulerProfiling[datanode.name()] = [];
    }
  });

  var OperationsIn = datanodesDependency.getDescendants(startNodes); // in of exec instance
  var OperationsOut = difference(operationsAll, OperationsIn); // out of exec instance
  var OperationsOutOK = new Set(); // out of exec instance with status OK
  var dsStatus;

  OperationsOut.forEach(function (elem) {
    dsStatus = datanodesManager.getDataNodeByName(elem).status();
    if (dsStatus == 'OK') {
      OperationsOutOK.add(elem);
    }
  });

  // Discussion with AEF : inform user when update cannot be executed because one predecessor has error (with notification)

  function isCalledFromOrchestrator(nodeName) {
    if (_.contains(triggeredNodes, nodeName)) {
      // MBG 10/05/2019 : more general condition
      switch (callOrigin) {
        case 'triggerButton':
        case 'vignette':
        case 'setValue':
        case 'setFile':
        case 'unidentified':
        case 'edit':
        case 'refresh':
        case 'globalFirstUpdate': //at load datanodes are not updated
          return false;
        default:
          return false;
      }
    } else {
      if (callOrigin === 'globalFirstUpdate') {
        //at load datanodes are not updated (case of data dependency)
        return false;
      }
      return true;
    }
  }

  // AEF temp function, to factorize for autostart and explicit use
  function isForceAutoStart(nodeName) {
    if (_.contains(triggeredNodes, nodeName)) {
      switch (callOrigin) {
        case 'triggerButton':
        case 'vignette':
        case 'setValue':
        case 'setFile':
        case 'refresh':
          return true;
        default:
          return false;
      }
    } else {
      return false;
    }
  }

  function launchSchedule() {
    runSchedule();
  }

  /*-----------------startSchedule-----------------*/
  // initiates schedule execution from startNodes
  function runSchedule() {
    var bCalledFromOrchestrator = true;
    var bForceAutoStart = false;
    operationsToExecute.forEach(function (op) {
      if (operationsToExecute.size == 0) {
        if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) console.log(op + ' is already treated');
        return;
      }
      if (_.isUndefined(datanodesManager.getDataNodeByName(op))) {
        if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
          console.log(op + ' is not treated because it does not exist');
        operationsToExecute.delete(op);
        operationsBlacklist.add(op);
        return;
      }
      switch (datanodesManager.getDataNodeByName(op).statusForScheduler()) {
        case 'Ready':
          if (datanodesManager.foundDatanode(op)) {
            var bAllPredExecuted = allPredecessorsExecuted(op);
            if (bAllPredExecuted) {
              operationsToExecute.delete(op);
              operationsToWaitFor.add(op);
              if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) {
                console.log('operation ' + op + ' released');
              }
              if (!xDashConfig.disableSchedulerProfiling) {
                schedulerProfilingItem = {
                  release: Date.now(),
                };
              }
              bCalledFromOrchestrator = isCalledFromOrchestrator(op);
              bForceAutoStart = isForceAutoStart(op); // temp use
              datanodesManager
                .getDataNodeByName(op)
                .updateNow(bCalledFromOrchestrator, bForceAutoStart, bAllPredExecuted);
            } else {
              operationsToExecute.delete(op);
              operationsNotReady.add(op);
              if (callOrigin == 'refresh' || callOrigin == 'triggerButton') {
                swal(
                  'Update is not available',
                  'Predecessors: ' +
                    notExecutedPredecessors(op) +
                    ' of operation "' +
                    op +
                    '" need to be executed first.',
                  'info'
                );
                datanodesManager.getDataNodeByName(op).completeExecution('NOP');
              } else {
                if (callOrigin == 'edit' || callOrigin == 'unidentified') {
                  //a la creation ou a l'edition, quand le user declare une datanode qui n'extste pas, il faut passer cette etape pour le voir
                  operationsNotReady.delete(op);
                  operationsToWaitFor.add(op);
                  if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) {
                    console.log('operation ' + op + ' released');
                  }
                  if (!xDashConfig.disableSchedulerProfiling) {
                    schedulerProfilingItem = {
                      release: Date.now(),
                    };
                  }
                  bCalledFromOrchestrator = isCalledFromOrchestrator(op);
                  bForceAutoStart = isForceAutoStart(op); // temp use

                  datanodesManager
                    .getDataNodeByName(op)
                    .updateNow(bCalledFromOrchestrator, bForceAutoStart, bAllPredExecuted);
                } else {
                  if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
                    console.log('operation ' + op + ' is ready but cannot be executed because of its predecessors.');
                  datanodesManager.getDataNodeByName(op).completeExecution('NOP');
                }
              }
            }
          } else {
            var successors = Array.from(datanodesDependency.getSuccessors(op));
            if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
              console.log(op + " is referenced in '" + successors + "' but not defined as a datanode.");
            datanodesManager.getDataNodeByName(op).completeExecution('NOP');
          }
          break;

        case 'Wait':
          operationsToExecute.delete(op);
          operationsNotReady.add(op);
          if (allPredecessorsExecuted(op)) {
            if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
              console.log('operation ' + op + ' is waiting for initialization to be done.');
          } else {
            if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
              console.log('operation ' + op + ' cannot be executed because of its predecessors.');
          }
          datanodesManager.getDataNodeByName(op).completeExecution('NOP');
          break;
        case 'NotReady': //error in init
        case 'Stop': // init is stopped, e.g. close a websocket without error
          operationsToExecute.delete(op);
          operationsBlacklist.add(op);
          if (!offSchedLogUser && !xDashConfig.disableSchedulerLog)
            console.log('operation ' + op + ' cannot not be scheduled because it needs initialization.');
          var dsNameDescendants = datanodesDependency.getDescendants([op]); //AEF: fix bug param of getDescendants must be an array
          dsNameDescendants.forEach(function (elem) {
            operationsBlacklist.add(elem);
          });
          operationsToExecute = difference(operationsToExecute, operationsBlacklist);
          datanodesManager.getDataNodeByName(op).completeExecution('Error');
          break;
        default:
          break;
      }
    });
  }

  /*-----------------allPredecessorsExecuted-----------------*/
  function allPredecessorsExecuted(node) {
    var pred = datanodesDependency.getPredecessorsSet(node);
    var operationsMarked = union(operationsTerminated, OperationsOutOK);
    if (isSuperset(operationsMarked, pred)) {
      return true;
    } else {
      return false;
    }
  }

  /*-----------------alreadyExecuted-----------------*/
  function alreadyExecuted(node) {
    var operationsMarked = union(operationsTerminated, OperationsOutOK);
    if (operationsMarked.has(node)) {
      return true;
    } else {
      return false;
    }
  }

  /*-----------------notExecutedPredecessors-----------------*/
  function notExecutedPredecessors(node) {
    var result = '[';
    var pred = datanodesDependency.getPredecessorsSet(node);
    var operationsMarked = union(operationsTerminated, OperationsOutOK);
    var opNotExecuted = difference(pred, operationsMarked);
    opNotExecuted.forEach((param) => {
      result = result + ' "' + param + '" ';
    });
    return result + ' ]';
  }
  /*-----------------operationCompleted-----------------*/
  // called when datanode execution completes
  // also called when datanode reports a status callback
  // is responsible of finishing graph execution instance
  function operationCompleted(dsName, status) {
    var bSchedTermination = true;
    var dsNameDescendants;
    switch (status) {
      case 'OK': {
        operationsTerminated.add(dsName);
        operationsToWaitFor.delete(dsName);
        datanodesDependency.dependencyStructure[dsName].forEach(function (successor) {
          if (allPredecessorsExecuted(successor)) {
            if (!alreadyExecuted(successor)) {
              operationsToExecute.add(successor);
            } else {
              if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) {
                console.log('operation ' + successor + ' not added because already executed');
              }
            }
          }
        });
        if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) {
          console.log('operation ' + dsName + ' completed with status ' + status);
        }
        if (!xDashConfig.disableSchedulerProfiling) {
          schedulerProfilingItem.completion = Date.now();
          schedulerProfilingItem.status = status;
          schedulerProfiling[dsName].push(schedulerProfilingItem);
        }
        if (operationsToExecute.size) {
          bSchedTermination = false;
          runSchedule(); //AEF: first OP that passes the break is the last one in scheduling, the others came after and test the same thing on termination
        }
        break;
      }
      case 'Error': {
        operationsBlacklist.add(dsName);
        operationsToWaitFor.delete(dsName);
        dsNameDescendants = datanodesDependency.getDescendants([dsName]); //AEF: fix bug param of getDescendants must be an array
        dsNameDescendants.forEach(function (elem) {
          operationsBlacklist.add(elem);
          datanodesManager.getDataNodeByName(elem).statusCallback('None');
          datanodesManager.getDataNodeByName(elem).updateCallback('', 'None'); // may be replace the value:'' by undefined or {} or null
        });
        operationsToExecute = difference(operationsToExecute, operationsBlacklist);
        if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) {
          console.log('operation ' + dsName + ' completed with status ' + status);
        }
        if (!xDashConfig.disableSchedulerProfiling) {
          schedulerProfilingItem.completion = Date.now();
          schedulerProfilingItem.status = status;
          schedulerProfiling[dsName].push(schedulerProfilingItem);
        }
        break;
      }
      case 'NOP': {
        // NOP is for handling explicit_trig case when called from scheduler (behave like in error)
        if (datanodesManager.getDataNodeByName(dsName).status() === 'OK') {
          // ds has already ok status, even it is not explicitly triggered, their successors can be computed
          operationsTerminated.add(dsName);
          operationsToWaitFor.delete(dsName);
          datanodesDependency.dependencyStructure[dsName].forEach(function (successor) {
            if (allPredecessorsExecuted(successor)) {
              if (!alreadyExecuted(successor)) {
                operationsToExecute.add(successor);
              } else {
                if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) {
                  console.log('operation ' + successor + ' not added because already executed');
                }
              }
            }
          });
          if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) {
            console.log('operation ' + dsName + ' completed with status ' + status);
          }
          if (!xDashConfig.disableSchedulerProfiling) {
            schedulerProfilingItem.completion = Date.now();
            schedulerProfilingItem.status = status;
            schedulerProfiling[dsName].push(schedulerProfilingItem);
          }
          if (operationsToExecute.size) {
            bSchedTermination = false;
            runSchedule(); //AEF: first OP that passes the break is the last one in scheduling, the others came after and test the same thing on termination
          }
          break;
        } else if (
          datanodesManager.getDataNodeByName(dsName).status() === 'None' ||
          datanodesManager.getDataNodeByName(dsName).status() === 'Error'
        ) {
          operationsBlacklist.add(dsName);
          operationsToWaitFor.delete(dsName);
          dsNameDescendants = datanodesDependency.getDescendants([dsName]); //AEF: fix bug param of getDescendants must be an array
          dsNameDescendants.forEach(function (elem) {
            operationsBlacklist.add(elem);
          });
          operationsToExecute = difference(operationsToExecute, operationsBlacklist);
          if (!offSchedLogUser && !xDashConfig.disableSchedulerLog) {
            console.log('operation ' + dsName + ' completed with status ' + status);
          }
          if (!xDashConfig.disableSchedulerProfiling) {
            schedulerProfilingItem.completion = Date.now();
            schedulerProfilingItem.status = status;
            schedulerProfiling[dsName].push(schedulerProfilingItem);
          }
        } // not sure this case exists
        else
          console.log(
            'datanode with explicitTrig ended with status ',
            datanodesManager.getDataNodeByName(dsName).status()
          );
        break;
      }
      default:
        return { initiatorNode: initiatorNode, schedulingInstanceTerminated: false };
    }

    if (operationsToWaitFor.size == 0 && operationsToExecute.size == 0 && bSchedTermination) {
      return { initiatorNode: initiatorNode, schedulingInstanceTerminated: true };
    }
    return { initiatorNode: initiatorNode, schedulingInstanceTerminated: false };
  }

  //AEF
  /*-----------------stopAllOperations-----------------*/
  function stopAllOperations() {
    // clear all operations to be executed
    operationsToExecute.forEach(function (op) {
      operationsToExecute.delete(op);
    });
    //complete and clear all operations already in execution
    operationsToWaitFor.forEach(function (op) {
      operationsToWaitFor.delete(op);
      datanodesManager.getDataNodeByName(op).completeExecution('NOP');
      //AEF: needed when no internet connection and webservices doesn't repond
      datanodesManager.getDataNodeByName(op).statusCallback('None'); // to prevet seeing "Pending"
      datanodesManager.getDataNodeByName(op).updateCallback(undefined, 'None');
    });
    //change schedulerStatus from Running to Stop ans store all the ajax requests that are already been sent
    var xhrPending = new Set();
    for (var i in datanodesManager.getAllDataNodes()) {
      datanodesManager.getAllDataNodes()[i].schedulerStatus('Stop');
      var xhr = datanodesManager.getAllDataNodes()[i].getXHR();
      if (!_.isUndefined(xhr)) xhrPending.add(xhr);
    }
    //and abort all current ajax requests
    xhrPending.forEach(function (op) {
      op.abort();
      xhrPending.delete(op);
    });
    //terminate scheduler in case of it is not already done
    if (datanodesManager.getDataNodeByName(initiatorNode).execInstance() != null) {
      datanodesManager.getDataNodeByName(initiatorNode).schedulerEnd();
    }
  }

  /*-----------------stopOperation-----------------*/
  function stopOperation(op) {
    //complete and clear if scheduling of operation is in progress
    if (operationsToWaitFor.has(op)) {
      operationsToWaitFor.delete(op);
      datanodesManager.getDataNodeByName(op).completeExecution('NOP');
      //AEF: needed when no internet connection and webservices doesn't repond
      //AEF: test may be removed (abort fct is fixed)
      datanodesManager.getDataNodeByName(op).statusCallback('None'); // to prevet seeing "Pending"
      datanodesManager.getDataNodeByName(op).updateCallback(undefined, 'None');
      datanodesManager.getDataNodeByName(op).schedulerStatus('Stop');
      //abort if op is an ajax request
      var xhr = datanodesManager.getDataNodeByName(op).getXHR();
      if (!_.isUndefined(xhr)) xhr.abort();
    }
  }

  /*-----------------getInitiatorNode-----------------*/
  function getInitiatorNode() {
    return initiatorNode;
  }

  /*-----------------getSchedulerCallOrigin-----------------*/
  function getSchedulerCallOrigin() {
    return callOrigin;
  }

  /*-----------------getSchedulerCallOrigin-----------------*/
  function clear() {}

  // public methods
  return {
    launchSchedule,
    operationCompleted,
    stopAllOperations,
    stopOperation,
    getInitiatorNode,
    getSchedulerCallOrigin,
    clear,
  };
}
