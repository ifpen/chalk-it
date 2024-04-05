﻿// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ chalkit API                                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var chalkit = (function () {
  function setVariable(dataNodeName, varJsonValue) {
    let dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.setValue([], varJsonValue, false, true); //don't start schedule here
  }

  function setVariables(dataNodeNames, varJsonValues) {
    for (let i = 0; i < dataNodeNames.length; i++) {
      let dN = datanodesManager.getDataNodeByName(dataNodeNames[i]);
      let varJsonValue = varJsonValues[i];
      dN.setValue([], varJsonValue, false, true); //don't start schedule here
    }
  }

  function setVariableProperty(dataNodeName, propertyPath, varJsonValue) {
    let dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.setValue(propertyPath, varJsonValue, false, true); //don't start schedule here
  }

  function executeDataNode(dataNodeName) {}

  function executeDataNodes(dataNodeNames) {}

  function viewPage(pageUrl, inputVals, bNewTab) {
    const queryParams = 'inputParams=' + inputHandler.encodeInputPars(inputVals);
    const query = pageUrl + '?' + queryParams;
    if (bNewTab) {
      window.open(query, '_blank');
    } else {
      window.location = query;
    }
  }

  function viewProject(projectUrl, inputVals, bNewTab) {
    const xDashRuntime = xDashConfig.urlBaseForExport;
    let bIsDevVersion = false;
    if (xDashConfig.version.minor == '999') {
      bIsDevVersion = true;
    }
    let versionSuffix = '';
    if (!bIsDevVersion) {
      versionSuffix = '-' + xDashConfig.version.fullVersion;
    }
    const xDashViewer = xDashRuntime + 'index-view' + versionSuffix + '.html';
    const queryProject = 'projectUrl=' + projectUrl;
    const queryParams = 'inputParams=' + inputHandler.encodeInputPars(inputVals);
    const query = xDashViewer + '?' + queryProject + '&' + queryParams;
    if (bNewTab) {
      window.open(query, '_blank');
    } else {
      window.location = query;
    }
  }

  function goToPage(numPage) {
    customNavigationRuntime.customNavigationGoToPage(numPage);
  }

  return {
    setVariable,
    setVariables,
    setVariableProperty,
    executeDataNode,
    executeDataNodes,
    viewProject,
    viewPage,
    goToPage,
  };
})();
