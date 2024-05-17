// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ chalkit API                                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import { xDashConfig } from 'config.js';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { customNavigationRuntime } from 'kernel/runtime/custom-navigation-runtime';

export const chalkit = (function () {
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

  function enableWidget(widgetName) {
    //let divElement = document.querySelector('#' + widgetName + 'c');
    let divElement = $('#' + widgetName + 'c')[0];
    if (!_.isUndefined(divElement)) {
      divElement.style.pointerEvents = '';
      divElement.style.opacity = '';
    }
  }

  function disableWidget(widgetName) {
    //let divElement = document.querySelector('#' + widgetName + 'c');
    let divElement = $('#' + widgetName + 'c')[0];
    if (!_.isUndefined(divElement)) {
      divElement.style.pointerEvents = 'none';
      divElement.style.opacity = '0.5';
    }
  }

  function showWidget(widgetName) {
    let divElement = $('#' + widgetName + 'c');
    if (!_.isUndefined(divElement)) {
      divElement.show();
    }
  }

  function hideWidget(widgetName) {
    let divElement = $('#' + widgetName + 'c');
    if (!_.isUndefined(divElement)) {
      divElement.hide();
    }
  }

  const scheduler = (function () {
    function setVariable(dataNodeName, varJsonValue) {
      chalkit.setVariable(dataNodeName, varJsonValue);
    }
    function setVariables(dataNodeNames, varJsonValues) {
      chalkit.setVariables(dataNodeNames, varJsonValues);
    }
    function setVariableProperty(dataNodeName, propertyPath, varJsonValue) {
      chalkit.setVariableProperty(dataNodeName, propertyPath, varJsonValue);
    }
    function executeDataNode(dataNodeName) {
      chalkit.executeDataNode(dataNodeName);
    }
    function executeDataNodes(dataNodeNames) {
      chalkit.executeDataNodes(dataNodeNames);
    }
    return {
      setVariable,
      setVariables,
      setVariableProperty,
      executeDataNode,
      executeDataNodes,
    };
  })();

  const dashboard = (function () {
    function viewPage(pageUrl, inputVals, bNewTab) {
      chalkit.viewPage(pageUrl, inputVals, bNewTab);
    }
    function viewProject(projectUrl, inputVals, bNewTab) {
      chalkit.viewProject(projectUrl, inputVals, bNewTab);
    }
    function goToPage(numPage) {
      chalkit.goToPage(numPage);
    }
    function enableWidget(widgetName) {
      chalkit.enableWidget(widgetName);
    }
    function disableWidget(widgetName) {
      chalkit.disableWidget(widgetName);
    }
    function showWidget(widgetName) {
      chalkit.showWidget(widgetName);
    }
    function hideWidget(widgetName) {
      chalkit.hideWidget(widgetName);
    }
    return {
      viewPage,
      viewProject,
      goToPage,
      enableWidget,
      disableWidget,
      showWidget,
      hideWidget,
    };
  })();

  return {
    setVariable,
    setVariables,
    setVariableProperty,
    executeDataNode,
    executeDataNodes,
    viewProject,
    viewPage,
    goToPage,
    enableWidget,
    disableWidget,
    showWidget,
    hideWidget,
    scheduler,
    dashboard,
  };
})();
