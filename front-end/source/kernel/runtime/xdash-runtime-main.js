// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard load for page view                                       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import _ from 'underscore';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { modelsHiddenParams, modelsParameters, modelsTempParams } from 'kernel/base/widgets-states';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { pyodideLib } from 'kernel/base/pyodide-project';
import { reconstructFoundations } from 'kernel/dashboard/rendering/reconstruct-foundations';
import { customNavigationRuntime } from 'kernel/runtime/custom-navigation-runtime';
import { inputHandler } from 'kernel/general/interfaces/input-params';

export const DASHBOARD_URL_PARAMETER = 'projectUrl';
export const DASHBOARD_DATA_ID = 'dashboard_data';
export const DASHBOARD_CONFIG_ID = 'dashboard_config';

export const DASHBOARD_DATA_TYPE = 'application/json';
export const DASHBOARD_CONFIG_TYPE = DASHBOARD_DATA_TYPE;

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

function initContainers(jsonContent, exportOptions) {
  const scalingSrc = jQuery.extend(true, {}, jsonContent.scaling); // MBG fix load order

  var navMenuHeightPx = 0;

  if ($('#nav-menu')[0]) {
    navMenuHeightPx = parseInt($('#nav-menu')[0].style.height);
    if (isNaN(navMenuHeightPx)) navMenuHeightPx = 0; // MBG 18/05/2021 : piste pour pb NG ??
  }
  switch (exportOptions) {
    case 'keepOriginalWidth':
      $('#dashboard-zone')[0].style.width = scalingSrc.scrollWidthPx + 'px';
      $('#dashboard-zone')[0].style.height = scalingSrc.scrollHeightPx + navMenuHeightPx + 'px';
      scalingSrc.scalingMethod = 'scaleTwSp';
      break;
    case 'adjustToFullWidth':
      $('#dashboard-zone')[0].style.width = '100%';
      $('#dashboard-zone')[0].style.height = document.body.clientHeight - navMenuHeightPx + 'px';
      scalingSrc.scalingMethod = 'scaleTwSpWS';
      break;
    case 'ajustToTargetWindow':
      $('#dashboard-zone')[0].style.width = '100%';
      $('#dashboard-zone')[0].style.height = document.body.clientHeight - navMenuHeightPx + 'px';
      scalingSrc.scalingMethod = 'scaleTwh';
      break;
    case 'projectToTargetWindow':
    case 'customNavigation':
    case 'rowToTab':
    case 'rowToPage':
      $('#dashboard-zone')[0].style.width = '100%';
      $('#dashboard-zone')[0].style.height = document.body.clientHeight - navMenuHeightPx - 1 + 'px';
      scalingSrc.scalingMethod = 'scaleTwhS';
      break;
    default:
      $('#dashboard-zone')[0].style.width = '100%';
      $('#dashboard-zone')[0].style.height = '100%';
  }

  $('#dashboard-zone')[0].style.margin = 'auto';
  $('#dashboard-zone')[0].style['overflow-x'] = 'hidden';
  $('#dashboard-zone')[0].style['overflow-y'] = 'hidden';

  $('#DropperDroitec')[0].style.height = '100%';
  $('#DropperDroitec')[0].style.width = '100%';

  $('#DropperDroitec')[0].style['overflow-y'] = 'auto';

  const cols = jsonContent.device.cols.maxCols;
  const maxCells = jsonContent.device.cols.maxCells;
  const rows = maxCells / (cols ? cols : 1);

  var projectedScalingObj = jQuery.extend(true, {}, scalingSrc);
  var projectedPreviewDimensions = widgetPreview.getCurrentDashZoneDims();
  widgetPreview.setScalingInformation(projectedScalingObj, scalingSrc.scalingMethod, rows, cols);
  widgetPreview.resizeDashboardCols();

  var mediaChangeProj = widgetPreview.mediaChangeProjection(projectedScalingObj, projectedPreviewDimensions, rows);

  projectedScalingObj = mediaChangeProj.referenceFrame;
  projectedPreviewDimensions = mediaChangeProj.targetFrame;

  widgetPreview.setScalingInformation(projectedScalingObj, scalingSrc.scalingMethod, rows, cols);

  widgetPreview.resizeDashboard(projectedPreviewDimensions);
}

export async function loadDashboard(jsonContent, exportOptions) {
  await pyodideLib.deserialize(jsonContent); // GHI issue #193

  datanodesManager.load(jsonContent.data, true); //ABK

  initContainers(jsonContent, exportOptions);

  for (var key in jsonContent.dashboard) {
    if (!_.isEmpty(jsonContent.dashboard[key].modelParameters)) {
      modelsParameters[key] = jsonContent.dashboard[key].modelParameters;
    }
    if (!_.isEmpty(jsonContent.dashboard[key].modelHiddenParams)) {
      modelsHiddenParams[key] = jsonContent.dashboard[key].modelHiddenParams;
    }
    if (_.isUndefined(modelsTempParams[key])) {
      var modelJsonIdStr = key.substring(0, key.length - 1);
      modelsTempParams[key] = jQuery.extend(true, {}, modelsTempParams[modelJsonIdStr]);
    }
  }

  // Add theme attribute before loading widgets
  $('html').attr('data-theme', jsonContent.device.theme);

  widgetPreview.deserialize(jsonContent.connections);
  widgetPreview.renderDashboardWidgets(jsonContent, true);

  $('.dropperR').css('background-color', jsonContent.device.backgroundColor);

  switch (jsonContent.exportOptions) {
    case 'rowToPage':
      rowToPageRuntime.rowToPageModeInit(jsonContent);
      break;
    case 'rowToTab':
      rowToTabRuntime.rowToTabModeInit(jsonContent);
      break;
    case 'customNavigation':
      customNavigationRuntime.customNavigationModeInit(jsonContent);
      break;
    case 'projectToTargetWindow':
      customNavigationRuntime.setJsonContent(jsonContent);
      break;
  }

  setTimeout(() => {
    widgetPreview.assignValueChangeHandlers();
  }, 2000);
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

  reconstructFoundations.buildDivsFromXprjson(xprjson);
  loadDashboard(xprjson, xprjson.exportOptions);
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
window.chalkitLoadDashboard = chalkitLoadDashboard;
