// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard load for page view                                       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import _ from 'lodash';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { modelsHiddenParams, modelsParameters, modelsTempParams } from 'kernel/base/widgets-states';
import { widgetViewer } from 'kernel/dashboard/rendering/widget-viewer';
import { pyodideLib } from 'kernel/base/pyodide-project';
import { inputHandler } from 'kernel/general/interfaces/input-params';
import {
  DASHBOARD_DATA_ID,
  DASHBOARD_DATA_TYPE,
  DASHBOARD_CONFIG_ID,
  DASHBOARD_CONFIG_TYPE,
  DASHBOARD_URL_PARAMETER,
  PAGE_MODE_PAGES,
} from 'kernel/general/export/export-constants';

// Runtime only

function initPageRuntime(pages) {
  const $rootScope = angular.element(document.body).scope().$root;
  const initialPage = pages.initialPage ?? 0;
  $rootScope.safeApply(() => {
    $rootScope.pageNames = pages.pageNames;
    $rootScope.pageNumber = initialPage;
    $rootScope.changePage = function (page) {
      if (page >= 0 && page < $rootScope.pageNames.length) {
        $rootScope.pageNumber = page;
        widgetViewer.setCurrentPage(page);
      }
    };

    $rootScope.pageMode = pages.pageMode ?? PAGE_MODE_PAGES;
    $rootScope.showPagination;
  });
}

function getInlineDashboardData() {
  const dataElement = document.getElementById(DASHBOARD_DATA_ID);
  if (!dataElement) return undefined;

  if (!(dataElement instanceof HTMLScriptElement)) {
    console.warn(`Found an element with id=${DASHBOARD_DATA_ID} but it is not a <script>; Got ${typeof dataElement}.`);
    return undefined;
  }

  if (dataElement.type !== DASHBOARD_DATA_TYPE) {
    console.warn(
      `Found an element with id=${DASHBOARD_DATA_ID} but it's type is not "${DASHBOARD_DATA_TYPE}"; Got ${dataElement.type}.`
    );
    return undefined;
  }

  return JSON.parse(dataElement.text);
}

function getParameterDashboardUrl() {
  const queryString = window?.location?.search;
  if (queryString) {
    const urlParams = new URLSearchParams(queryString);
    const url = urlParams.get(DASHBOARD_URL_PARAMETER);
    return url;
  }

  return undefined;
}

async function getParameterDashboardData() {
  const url = getParameterDashboardUrl();
  if (url) {
    const reponse = await fetch(url);
    return reponse.json();
  }
  return undefined;
}

export async function getDashboardData() {
  const dataElement = getInlineDashboardData();
  if (dataElement) return dataElement;

  return getParameterDashboardData();
}

function getInlineDashboardConfig() {
  const configElement = document.getElementById(DASHBOARD_CONFIG_ID);
  if (!configElement) return {};

  if (!(configElement instanceof HTMLScriptElement)) {
    console.warn(
      `Found an element with id=${DASHBOARD_CONFIG_ID} but it is not a <script>; Got ${typeof configElement}.`
    );
    return {};
  }

  if (configElement.type !== DASHBOARD_CONFIG_TYPE) {
    console.warn(
      `Found an element with id=${DASHBOARD_CONFIG_ID} but it's type is not "${DASHBOARD_CONFIG_TYPE}"; Got ${configElement.type}.`
    );
    return {};
  }

  return JSON.parse(configElement.text);
}

function getDashboardConfig() {
  let config = getInlineDashboardConfig();
  const queryString = window?.location?.search;
  if (queryString) {
    // TODO exact params & types
    const urlParams = new URLSearchParams(queryString);
    config = { ...config, ...urlParams };
  }

  return config;
}

// FIXME unused
(function ($) {
  $.fn.hasVScrollBar = function () {
    return this.get(0).scrollHeight > this.height();
  };
  $.fn.hasHScrollBar = function () {
    return this.get(0).scrollWidth > this.width();
  };
  $.fn.computeRatio = function () {
    return this.get(0).scrollWidth / this.width();
  };
})(jQuery);

export function loadDashboard(jsonContent) {
  const decodeHtmlEntities = (str) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };

  const escapeSpecialCharacters = (jsonString) => {
    return jsonString.replace(/[\u007F-\uFFFF]/g, (chr) => {
      return '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4);
    });
  };

  // Function to process the JSON content
  const processJsonContent = (jsonContent) => {
    try {
      // Escape special characters in the JSON string and decode the data safely
      const encodedData = escapeSpecialCharacters(JSON.stringify(jsonContent.data));
      const parsedData = JSON.parse(encodedData);
      const decodedData = decodeHtmlEntities(JSON.stringify(parsedData));

      return JSON.parse(decodedData);
    } catch (err) {
      swal('JSON Parse error', err.message, 'error');
      throw err;
    }
  };

  // Function to retrieve the dashboard configuration
  const getDashboardConfig = () => {
    const scriptTag = document.getElementById(DASHBOARD_CONFIG_ID);

    return scriptTag ? JSON.parse(scriptTag.textContent) : {};
  };

  // Deserialize and load data
  const loadDataNodesAndWidgets = (jsonContent, dataJson) => {
    pyodideLib.deserialize(jsonContent);
    datanodesManager.load(dataJson, true); // ABK

    // Load model parameters
    Object.keys(jsonContent.dashboard).forEach((key) => {
      const dashboardItem = jsonContent.dashboard[key];

      if (!_.isEmpty(dashboardItem.modelParameters)) {
        modelsParameters[key] = dashboardItem.modelParameters;
      }
      if (!_.isEmpty(dashboardItem.modelHiddenParams)) {
        modelsHiddenParams[key] = dashboardItem.modelHiddenParams;
      }
      if (_.isUndefined(modelsTempParams[key])) {
        const modelJsonIdStr = key.slice(0, -1); // Remove last character
        modelsTempParams[key] = jQuery.extend(true, {}, modelsTempParams[modelJsonIdStr]);
      }
    });

    widgetViewer.deserialize(jsonContent);

    datanodesManager.startScheduler();

    // Not done during deserialize as we need startScheduler to be done.
    // Specificaly, datanodes with "constant" values (en short, json variables) must be marked evaluated
    // so that widgets can read a value instead of setting a default one.
    widgetViewer.assignValueChangeHandlers();
  };

  // Main logic begins here
  try {
    const dataJson = processJsonContent(jsonContent);
    window.dashboardConfig = getDashboardConfig();
    const $rootScope = angular.element(document.body).scope().$root;
    $rootScope.navBarNotification = window.dashboardConfig?.navBarNotification == true;
    let container = document.getElementsByClassName("panel-body");

    const navBar = document.getElementById('nav_bar');
    const narBarHeight = navBar.offsetHeight;
    if ($rootScope.navBarNotification)
      container[0].style.minHeight = `calc(100vh - ${narBarHeight}px)`;

    if (jsonContent.pages?.pageNames?.length) {
      initPageRuntime(jsonContent.pages);
    }
    loadDataNodesAndWidgets(jsonContent, dataJson);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// chalkitLoadDashboard
const deferedLoadStatus = {
  angularReady: false,
  toLoad: null,
};

async function fullLoadDashboard(xprjson, parameters = {}) {
  if (parameters.inputParams) {
    const patchParams = inputHandler.decodeInputPars(parameters.inputParams);
    xprjson = inputHandler.patchInputVariables(xprjson, patchParams);
  }

  // TODO params

  if (xprjson?.meta?.name) {
    document.title = xprjson.meta.name;
  }

  loadDashboard(xprjson);
}

export async function onAngularReady() {
  const data = await getDashboardData();

  if (deferedLoadStatus.angularReady) {
    console.warn('angularReady is already set. "onAngularReady" should be called only once.');
  }
  deferedLoadStatus.angularReady = true;

  if (data && deferedLoadStatus.toLoad) {
    console.warn('chalkitLoadDashboard in conflict with included dashboard');
  }

  if (data) {
    fullLoadDashboard(data, getDashboardConfig());
  } else if (deferedLoadStatus.toLoad) {
    fullLoadDashboard(deferedLoadStatus.toLoad.xprjson, deferedLoadStatus.toLoad.parameters);
  }
}

export async function chalkitLoadDashboard(xprjson, parameters = {}) {
  if (deferedLoadStatus.angularReady) {
    fullLoadDashboard(xprjson, parameters);
  } else {
    if (deferedLoadStatus.toLoad) {
      console.warn('Replacing a dashboard that was already waiting to be loaded');
    }
    deferedLoadStatus.toLoad = { xprjson, parameters };
  }
}

window.isRuntime = true;
window.chalkitLoadDashboard = chalkitLoadDashboard;
