// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ chalkit API                                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var chalkit = (function () {
  function setVariable(dataNodeName, varJsonValue) {
    const val = JSON.parse(JSON.stringify(varJsonValue));
    const currentDN = datanodesManager.getCurrentDataNode();
    let dN = datanodesManager.getDataNodeByName(dataNodeName);
    if (!_.isUndefined(dN)) {
      datanodesManager.datanodesDependency().addSetvarList(dataNodeName, currentDN);
      dN.setValue([], val, true); //don't start schedule here
    } else {
      dN = datanodesManager.getDataNodeByName(currentDN);
      dN.notificationCallback(
        'error',
        currentDN,
        "The dataNode referenced in setVariable api doesn't exist. Please verify your parameters"
      );
    }
  }

  function setVariables(dataNodeNames, varJsonValues) {
    const currentDN = datanodesManager.getCurrentDataNode();
    for (let i = 0; i < dataNodeNames.length; i++) {
      let dN = datanodesManager.getDataNodeByName(dataNodeNames[i]);
      if (!_.isUndefined(dN)) {
        datanodesManager.datanodesDependency().addSetvarList(dataNodeNames[i], currentDN);
        const varJsonValue = JSON.parse(JSON.stringify(varJsonValues[i]));
        dN.setValue([], varJsonValue, true); //don't start schedule here
      } else {
        dN = datanodesManager.getDataNodeByName(currentDN);
        dN.notificationCallback(
          'error',
          currentDN,
          "The dataNode referenced in setVariables api doesn't exist. Please verify your parameters"
        );
      }
    }
  }

  function setVariableProperty(dataNodeName, propertyPath, varJsonValue) {
    const currentDN = datanodesManager.getCurrentDataNode();
    const val = JSON.parse(JSON.stringify(varJsonValue));
    let dN = datanodesManager.getDataNodeByName(dataNodeName);
    if (!_.isUndefined(dN)) {
      datanodesManager.datanodesDependency().addSetvarList(dataNodeName, currentDN);
      dN.setValue(propertyPath, val, true); //don't start schedule here
    } else {
      dN = datanodesManager.getDataNodeByName(currentDN);
      dN.notificationCallback(
        'error',
        currentDN,
        "The dataNode referenced in setVariableProperty api doesn't exist. Please verify your parameters"
      );
    }
  }

  function executeDataNode(dataNodeName) {
    const currentDN = datanodesManager.getCurrentDataNode();
    if (datanodesManager.foundDatanode(dataNodeName)) {
      datanodesManager.datanodesDependency().addSetvarList(dataNodeName, currentDN);
    } else {
      const dN = datanodesManager.getDataNodeByName(currentDN);
      dN.notificationCallback(
        'error',
        currentDN,
        "The dataNode referenced in executeDataNode api doesn't exist. Please verify your parameters"
      );
    }
  }

  function executeDataNodes(dataNodeNames) {
    const currentDN = datanodesManager.getCurrentDataNode();
    for (let i = 0; i < dataNodeNames.length; i++) {
      if (datanodesManager.foundDatanode(dataNodeNames[i])) {
        datanodesManager.datanodesDependency().addSetvarList(dataNodeNames[i], currentDN);
      } else {
        const dN = datanodesManager.getDataNodeByName(currentDN);
        dN.notificationCallback(
          'error',
          currentDN,
          "The dataNode referenced in executeDataNodes api doesn't exist. Please verify your parameters"
        );
      }
    }
  }

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
