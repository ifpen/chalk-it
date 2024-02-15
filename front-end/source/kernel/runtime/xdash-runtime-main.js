// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard load for page view                                       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import _ from 'underscore';
import swal from 'sweetalert';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { LayoutMgrClass } from '../dashboard/scaling/layout-mgr';
import { initEditWidget } from '../dashboard/edition/edit-widgets';
import { Xdash } from '../base/xdash-main';
import { widgetToolboxClass } from '../dashboard/toolbox-mgr';
import { XdashNotifications } from 'angular/modules/libs/notification/notification';
import { modelsHiddenParams, modelsParameters, modelsTempParams } from 'kernel/base/widgets-states';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { pyodideLib } from 'kernel/base/pyodide-project';
import { onResize, onOrientationChange, isAndroid, isTouchDevice } from 'kernel/base/main-common';

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

export const RuntimeDashboard = (function () {
  var scalingSrc;

  function initContainers(jsonContent, exportOptions) {
    scalingSrc = jQuery.extend(true, {}, jsonContent.scaling); // MBG fix load order

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

  async function loadDashboard(jsonContent, exportOptions) {
    var decodedData = $('<textarea />').html(JSON.stringify(jsonContent.data)).text(); // MBG : find a better method
    var data_json = '';
    try {
      data_json = JSON.parse(decodedData);
    } catch (err) {
      swal('JSON Parse error', err.message, 'error');
      return;
    }
    await pyodideLib.deserialize(jsonContent); // GHI issue #193

    datanodesManager.load(data_json, true); //ABK

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
})();

export const singletons = {
  widgetEditor: null,
  xdash: null,
  WTBC: null,
  xdashNotifications: null,
  layoutMgr: null,
};

export function startXdash() {
  singletons.layoutMgr = new LayoutMgrClass();
  window.layoutMgr = singletons.layoutMgr;

  singletons.widgetEditor = initEditWidget(); // edit
  window.widgetEditor = singletons.widgetEditor;

  // FIXME
  /*--------event on device rows--------*/
  $('select[name=select-rows]').on('change', function (e) {
    singletons.layoutMgr.updateButtonState();
  });

  /*--------event on device columns--------*/
  $('select[name=select-cols]').on('change', function (e) {
    singletons.layoutMgr.updateButtonState();
  });

  /*--------On resize event--------*/
  $(window).on('resize', onResize);
  if (!(isAndroid || isTouchDevice)) {
    $(window).on('orientationchange', onOrientationChange);
  }

  singletons.xdash = new Xdash();
  singletons.WTBC = new widgetToolboxClass(); // edit ?
  singletons.xdashNotifications = new XdashNotifications(); // edit ?
}
