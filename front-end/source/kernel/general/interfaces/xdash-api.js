// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xDashApi                                                           │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var xDashApi = (function () {
  function setVariable(varDateNodeName, varJsonValue, explicitTrig) {
    //AEF: add explicit trig
    var dN = datanodesManager.getDataNodeByName(varDateNodeName);
    dN.setValue([], varJsonValue, false, explicitTrig);
  }

  function setVariables(dataNodeNames, varJsonValues) {
    let dN0 = datanodesManager.getDataNodeByName(dataNodeNames[0]);
    for (let i = 0; i < dataNodeNames.length; i++) {
      let dN = datanodesManager.getDataNodeByName(dataNodeNames[i]);
      let varJsonValue = varJsonValues[i];
      dN.setValue([], varJsonValue, false, true); //don't start schedule here
    }
    dN0.schedulerStart(dataNodeNames, dataNodeNames[0], 'setValue');
  }

  function setVariableProperty(varDateNodeName, propertyPath, varJsonValue) {
    var dN = datanodesManager.getDataNodeByName(varDateNodeName);
    dN.setValue(propertyPath, varJsonValue);
  }

  function getVariable(varDateNodeName) {
    var dN = datanodesManager.getDataNodeByName(varDateNodeName);
    if (!_.isUndefined(dN)) {
      return dN.latestData();
    } else return undefined;
  }

  function executeDataNode(dataNodeName) {
    datanodesManager.getDataNodeByName(dataNodeName).schedulerStart(undefined, undefined, 'vignette');
  }

  function executeDataNodes(dataNodeNames) {
    let dN = [];
    for (let i = 0; i < dataNodeNames.length; i++) {
      dN.push(datanodesManager.getDataNodeByName(dataNodeNames[i]));
    }
    datanodesManager.getDataNodeByName(dataNodeNames[0]).schedulerStart(dataNodeNames, dataNodeNames[0], 'vignette');
  }

  function viewPage(pageUrl, inputVals, bNewTab) {
    var queryParams = 'inputParams=' + inputHandler.encodeInputPars(inputVals);
    var query = pageUrl + '?' + queryParams;
    if (bNewTab) {
      window.open(query, '_blank');
    } else {
      window.location = query;
    }
  }

  function viewProject(projectUrl, inputVals, bNewTab) {
    var xDashRuntime = xDashConfig.urlBaseForExport;
    var bIsDevVersion = false;
    if (xDashConfig.version.minor == '999') {
      bIsDevVersion = true;
    }
    var versionSuffix = '';
    if (!bIsDevVersion) {
      versionSuffix = '-' + xDashConfig.version.fullVersion;
    }
    var xDashViewer = xDashRuntime + 'index-view' + versionSuffix + '.html';
    var queryProject = 'projectUrl=' + projectUrl;
    var queryParams = 'inputParams=' + inputHandler.encodeInputPars(inputVals);
    var query = xDashViewer + '?' + queryProject + '&' + queryParams;
    if (bNewTab) {
      window.open(query, '_blank');
    } else {
      window.location = query;
    }
  }

  function goToPage(numPage) {
    customNavigationRuntime.goToPage(numPage);
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
