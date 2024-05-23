// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard load for page view                                       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

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

const RuntimeDashboard = (function () {
  let scalingSrc;

  function initContainers(jsonContent, exportOptions) {
    scalingSrc = jQuery.extend(true, {}, jsonContent.scaling); // MBG fix load order

    let navMenuHeightPx = 0;

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
    const rows = maxCells / (cols || 1);

    let projectedScalingObj = jQuery.extend(true, {}, scalingSrc);
    let projectedPreviewDimensions = widgetPreview.getCurrentDashZoneDims();
    widgetPreview.setScalingInformation(projectedScalingObj, scalingSrc.scalingMethod, rows, cols);
    widgetPreview.resizeDashboardCols();

    const mediaChangeProj = widgetPreview.mediaChangeProjection(projectedScalingObj, projectedPreviewDimensions, rows);

    projectedScalingObj = mediaChangeProj.referenceFrame;
    projectedPreviewDimensions = mediaChangeProj.targetFrame;

    widgetPreview.setScalingInformation(projectedScalingObj, scalingSrc.scalingMethod, rows, cols);

    widgetPreview.resizeDashboard(projectedPreviewDimensions);
  }

  function loadDashboard(jsonContent, exportOptions) {
    function decodeHtmlEntities(str) {
      var txt = document.createElement('textarea');
      txt.innerHTML = str;
      return txt.value;
    }
    function escapeSpecialCharacters(jsonString) {
      return jsonString.replace(/[\u007F-\uFFFF]/g, function (chr) {
        return '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4);
      });
    }

    let encodedData = JSON.stringify(jsonContent.data);
    // Escape special characters in the JSON string
    encodedData = escapeSpecialCharacters(encodedData);
    let parsedData = JSON.parse(encodedData);
    let decodedData = decodeHtmlEntities(JSON.stringify(parsedData));

    let data_json = '';
    try {
      data_json = JSON.parse(decodedData);
    } catch (err) {
      swal('JSON Parse error', err.message, 'error');
      return;
    }

    pyodideLib.deserialize(jsonContent);
    datanodesManager.load(data_json, true); //ABK
    initContainers(jsonContent, exportOptions);
    for (const key in jsonContent.dashboard) {
      if (!_.isEmpty(jsonContent.dashboard[key].modelParameters)) {
        modelsParameters[key] = jsonContent.dashboard[key].modelParameters;
      }
      if (!_.isEmpty(jsonContent.dashboard[key].modelHiddenParams)) {
        modelsHiddenParams[key] = jsonContent.dashboard[key].modelHiddenParams;
      }
      if (_.isUndefined(modelsTempParams[key])) {
        const modelJsonIdStr = key.substring(0, key.length - 1);
        modelsTempParams[key] = jQuery.extend(true, {}, modelsTempParams[modelJsonIdStr]);
      }
    }

    //AEF: issue#304
    const offSchedLogUser = jsonContent.meta?.schedulerLogOff ?? true; //AEF: can be set to xDashConfig.disableSchedulerLog by default.

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
        customNavigationRuntime.jsonContent = jsonContent;
        break;
    }

    setTimeout(() => {
      widgetPreview.assignValueChangeHandlers();
    }, 2000);
  }

  return {
    initContainers,
    loadDashboard,
  };
})();
