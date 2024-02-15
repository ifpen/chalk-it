// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xDashApi                                                           │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var xDashApi = (function () {
  function setVariable(dataNodeName, varJsonValue) {
    const val = JSON.parse(JSON.stringify(varJsonValue));
    let dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.notificationCallback('warning', dataNodeName, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");

    dN.setValue([], val, false, true); //don't start schedule here
  }

  function setVariables(dataNodeNames, varJsonValues) {
    for (let i = 0; i < dataNodeNames.length; i++) {
      let dN = datanodesManager.getDataNodeByName(dataNodeNames[i]);
      if (i == 0)
        dN.notificationCallback(
          'warning',
          dataNodeNames[0],
          "Deprecated feature: please rename 'xDashApi' by 'chalkit'"
        );
      const varJsonValue = JSON.parse(JSON.stringify(varJsonValues[i]));
      dN.setValue([], varJsonValue, false, true); //don't start schedule here
    }
  }

  function setVariableProperty(dataNodeName, propertyPath, varJsonValue) {
    const val = JSON.parse(JSON.stringify(varJsonValue));
    let dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.notificationCallback('warning', dataNodeName, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
    dN.setValue(propertyPath, val, false, true); //don't start schedule here
  }

  function getVariable(dataNodeName) {
    //swal('Deprecated feature ', "'getVariable' feature is no longer supported", 'error');
    let dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.notificationCallback('error', dataNodeName, "Deprecated feature: 'getVariable' feature is no longer supported");
    return undefined;
  }

  function executeDataNode(dataNodeName) {
    let dN = datanodesManager.getDataNodeByName(dataNodeName);
    dN.notificationCallback('warning', dataNodeName, "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
  }

  function executeDataNodes(dataNodeNames) {
    let dN = datanodesManager.getDataNodeByName(dataNodeNames[0]);
    dN.notificationCallback('warning', dataNodeNames[0], "Deprecated feature: please rename 'xDashApi' by 'chalkit'");
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
    customNavigationRuntime.customNavigationGoToPage(numPage);
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
