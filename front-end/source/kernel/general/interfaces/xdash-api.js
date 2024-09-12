// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xDashApi                                                           │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { chalkit } from 'kernel/general/interfaces/chalkit-api';

export const xDashApi = (function () {
  function setVariable(dataNodeName, varJsonValue) {
    const dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.notificationCallback('warning', dataNodeName, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    chalkit.setVariable(dataNodeName, varJsonValue);
  }

  function setVariables(dataNodeNames, varJsonValues) {
    const dN = datanodesManager.getDataNodeByName(dataNodeNames[0]);
    dN.notificationCallback('warning', dataNodeNames[0], "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    chalkit.setVariables(dataNodeNames, varJsonValues);
  }

  function setVariableProperty(dataNodeName, propertyPath, varJsonValue) {
    const dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.notificationCallback('warning', dataNodeName, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    chalkit.setVariableProperty(dataNodeName, propertyPath, varJsonValue);
  }

  function getVariable(dataNodeName) {
    const dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.notificationCallback('error', dataNodeName, "Deprecated feature: 'getVariable' feature is no longer supported");
    return undefined;
  }

  function executeDataNode(dataNodeName) {
    const dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.notificationCallback('warning', dataNodeName, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    chalkit.executeDataNode(dataNodeName);
  }

  function executeDataNodes(dataNodeNames) {
    const dN = datanodesManager.getDataNodeByName(dataNodeNames[0]);
    dN.notificationCallback('warning', dataNodeNames[0], "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    chalkit.executeDataNodes(dataNodeNames);
  }

  function viewPage(pageUrl, inputVals, bNewTab) {
    const currentDN = datanodesManager.getCurrentDataNode();
    const dN = datanodesManager.getDataNodeByName(currentDN);
    dN.notificationCallback('warning', currentDN, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    chalkit.viewPage(pageUrl, inputVals, bNewTab);
  }

  function viewProject(projectUrl, inputVals, bNewTab) {
    const currentDN = datanodesManager.getCurrentDataNode();
    const dN = datanodesManager.getDataNodeByName(currentDN);
    dN.notificationCallback('warning', currentDN, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    chalkit.viewProject(projectUrl, inputVals, bNewTab);
  }

  function goToPage(numPage) {
    const currentDN = datanodesManager.getCurrentDataNode();
    const dN = datanodesManager.getDataNodeByName(currentDN);
    dN.notificationCallback('warning', currentDN, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    chalkit.goToPage(numPage);
  }

  return {
    setVariable,
    setVariables,
    getVariable,
    setVariableProperty,
    executeDataNode,
    executeDataNodes,
    viewProject,
    viewPage,
    goToPage,
  };
})();
