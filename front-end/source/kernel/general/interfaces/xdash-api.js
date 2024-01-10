// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ xDashApi                                                           │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var xDashApi = (function () {
  function setVariable(varDateNodeName, varJsonValue, explicitTrig) {
    let dN = datanodesManager.getDataNodeByName(varDateNodeName);
    dN.setValue([], varJsonValue, false, true); //don't start schedule here
  }

  function setVariables(dataNodeNames, varJsonValues) {
    for (let i = 0; i < dataNodeNames.length; i++) {
      let dN = datanodesManager.getDataNodeByName(dataNodeNames[i]);
      let varJsonValue = varJsonValues[i];
      dN.setValue([], varJsonValue, true); //don't start schedule here
    }
  }

  function setVariableProperty(varDateNodeName, propertyPath, varJsonValue) {
    let dN = datanodesManager.getDataNodeByName(varDateNodeName);
    dN.setValue(propertyPath, varJsonValue, false, true); //don't start schedule here
  }

  function getVariable(varDateNodeName) {
    //swal('Deprecated feature ', "'getVariable' feature is no longer supported", 'error');
    let dN = datanodesManager.getDataNodeByName(varDateNodeName);
    dN.notificationCallback(
      'error',
      varDateNodeName,
      "Deprecated feature: 'getVariable' feature is no longer supported"
    );
    return undefined;
  }

  function executeDataNode(dataNodeName) {}

  function executeDataNodes(dataNodeNames) {}

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
