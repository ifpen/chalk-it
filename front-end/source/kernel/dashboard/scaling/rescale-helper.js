// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ rescaleHelper                                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';

import { editorSingletons } from 'kernel/editor-singletons';
import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';
import { isMediaChanged, unitW, unitH } from 'kernel/dashboard/scaling/scaling-utils';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { scalingManager } from 'kernel/dashboard/scaling/scaling-manager';

export function rescaleHelper(dashboardDimensionsArg, scalingMethodArg, modeArg) {
  var self = this;

  self.dashboardDimensions = dashboardDimensionsArg; // memory
  self.scalingMethod = scalingMethodArg;
  self.mode = modeArg;
  self.cellProportion = 1; // scalar (when rows=="none" or "1") or array (otherwise)

  self.rows = 0;
  self.cols = 1;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                    private utility functions                       | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  /*--------getCurrentDashZoneDims--------*/
  function getCurrentDashZoneDims() {
    //console.log("rescale-helper : getCurrentDashZoneDims");
    switch (self.mode) {
      case 'edit':
        return editorSingletons.widgetEditor.getCurrentDashZoneDims();
      case 'preview':
        return widgetPreview.getCurrentDashZoneDims();
    }
  }

  /*--------getSuffix--------*/
  function getSuffix() {
    switch (self.mode) {
      case 'edit':
        return '';
      case 'preview':
        return 'c';
    }
  }

  /*--------getTopLevelDiv--------*/
  function getTopLevelDiv() {
    switch (self.mode) {
      case 'edit':
        return document.getElementById('drop-zone');
      case 'preview':
        return document.getElementById('dashboard-zone');
    }
  }

  /*--------getAllDashDivs--------*/
  function getAllDashDivs() {
    switch (self.mode) {
      case 'edit':
        return $('#drop-zone')[0].getElementsByTagName('div');
      case 'preview':
        return $('#dashboard-zone')[0].getElementsByTagName('div');
    }
  }

  /*--------getRelativeWidgetsWidth--------*/
  function getRelativeWidgetsWidth() {
    switch (self.mode) {
      case 'edit':
        return editorSingletons.widgetEditor.getWidgetsRelativeDims().width;
      case 'preview':
        return widgetPreview.getWidgetsRelativeDims().width;
    }
  }

  /*--------getRelativeWidgetsHeight--------*/
  function getRelativeWidgetsHeight() {
    switch (self.mode) {
      case 'edit':
        return editorSingletons.widgetEditor.getWidgetsRelativeDims().height;
      case 'preview':
        return widgetPreview.getWidgetsRelativeDims().height;
    }
  }

  /*--------getRelativeWidgetsLeft--------*/
  function getRelativeWidgetsLeft() {
    switch (self.mode) {
      case 'edit':
        return editorSingletons.widgetEditor.getWidgetsRelativeDims().left;
      case 'preview':
        return widgetPreview.getWidgetsRelativeDims().left;
    }
  }

  /*--------getRelativeWidgettsTop--------*/
  function getRelativeWidgetsTop() {
    switch (self.mode) {
      case 'edit':
        return editorSingletons.widgetEditor.getWidgetsRelativeDims().top;
      case 'preview':
        return widgetPreview.getWidgetsRelativeDims().top;
    }
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         public functions                           | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  /*--------setDimensions--------*/
  function setDimensions(dims) {
    self.dashboardDimensions = dims; // memory
  }

  /*--------setScalingMethod--------*/
  function setScalingMethod(method) {
    self.scalingMethod = method; // memory
  }

  /*--------setCellProportion--------*/
  function setCellProportion(cellProp) {
    self.cellProportion = cellProp;
  }

  /*--------setRows--------*/
  function setRows(rowsArg) {
    self.rows = rowsArg;
  }

  /*--------setCols--------*/
  function setCols(colsArg) {
    self.cols = colsArg;
  }

  /*--------getCols--------*/
  function getCols() {
    return self.cols;
  }

  /*--------resizeDashboardCols--------*/
  // travels accross macro columns and applies scaling algorithms
  // TODO complete according to scaling method
  function resizeDashboardCols() {
    var suffix = '';
    switch (self.mode) {
      case 'edit':
        break;
      case 'preview':
        suffix = 'c';
        break;
    }

    if (self.rows) {
      const maxCells = self.cols * self.rows;
      switch (self.scalingMethod) {
        case 'scaleTwhS':
          for (let i = 1; i <= maxCells; i++) {
            $('#dpr' + i + suffix)[0].style.height = '100%';
          }
          break;

        case 'scaleTwSp':
          for (let i = 1; i <= self.rows; i++) {
            const curCellProp = self.cellProportion[i];
            const firstColInRow = (i - 1) * self.cols + 1;
            const drpWidth = $('#dpr' + firstColInRow + suffix).width();
            const dprHeight = Math.floor(curCellProp * drpWidth) + 2;
            for (let j = 0; j < self.cols; j++) {
              $('#dpr' + (firstColInRow + j) + suffix)[0].style.height = dprHeight + 'px';
            }
          }
          break;
        case 'scaleTwh':
        case 'scaleIdent':
          for (let i = 1; i <= self.rows; i++) {
            const firstRowInCol = (i - 1) * self.cols + 1;
            for (let j = 0; j < self.cols; j++) {}
          }
          break;
        default:
      }

      switch (self.mode) {
        case 'edit':
          editorSingletons.layoutMgr.updateMaxTopAndLeft();
        case 'preview':
          break;
      }
    }
  }

  /*--------resizeDashboard--------*/
  // travels accross widgets divs and applies scaling algorithms
  // caller needs to call rescale() afterwards
  function resizeDashboard(target) {
    // First, resize columns
    resizeDashboardCols();

    var htmlTargetDims = getCurrentDashZoneDims(self.mode);
    if (!_.isUndefined(target)) htmlTargetDims = target; // used at dashboard load

    var hmtlScaling = new scalingManager(self.dashboardDimensions, htmlTargetDims, self.scalingMethod);
    self.dashboardDimensions = htmlTargetDims;

    const rescaledHTML = getTopLevelDiv(self.mode);

    // rescale exported html to target
    for (let i = 0; i < rescaledHTML.childNodes.length; i++) {
      const childI = rescaledHTML.childNodes[i];
      if (childI.id == 'DropperDroite' + getSuffix(self.mode)) {
        for (let j = 0; j < childI.childNodes.length; j++) {
          const wc = childI.childNodes[j];
          if (wc.id === '') return; //AEF: safety if this case is generated after error
          if ($('#' + wc.id).hasClass('device-col')) {
            for (let k = 0; k < wc.childNodes.length; k++) {
              let wcc;
              if (self.mode == 'edit') {
                wcc = wc.childNodes[k].childNodes[0]; // skip <a> node
              } else {
                wcc = wc.childNodes[k];
              }
              hmtlScaling.applyRescale(wcc);
            }
          } else {
            let wcc;
            if (self.mode == 'edit') {
              wcc = wc.childNodes[0]; // skip <a> node
            } else {
              wcc = wc;
            }
            hmtlScaling.applyRescale(wcc);
          }
        }
      }
    }
  }

  /*--------resizeOnMediaChange--------*/
  function resizeWidgetOnMediaChange(instanceId, id) {
    const widthRatioModels = getRelativeWidgetsWidth(); // MBG TODO : optimize
    const heightRatioModels = getRelativeWidgetsHeight(); // MBG TODO : optimize
    const leftRatioModels = getRelativeWidgetsLeft(); // MBG TODO : optimize
    const topRatioModels = getRelativeWidgetsTop(); // MBG TODO : optimize

    const widget = $('#' + id)[0];

    let widthCurrentPx = 0;
    let heightCurrentPx = 0;
    let leftCurrentPx = 0;
    let topCurrentPx = 0;
    switch (self.mode) {
      case 'edit':
        widthCurrentPx = $(widget.parentNode.parentNode).width() * widthRatioModels[instanceId] + 2;
        heightCurrentPx = $(widget.parentNode.parentNode).height() * heightRatioModels[instanceId] + 2;
        leftCurrentPx = $(widget.parentNode.parentNode).width() * leftRatioModels[instanceId];
        topCurrentPx = $(widget.parentNode.parentNode).height() * topRatioModels[instanceId];
        break;
      case 'preview':
        widthCurrentPx = $(widget.parentNode).width() * widthRatioModels[instanceId] + 2;
        heightCurrentPx = $(widget.parentNode).height() * heightRatioModels[instanceId] + 2;
        leftCurrentPx = $(widget.parentNode).width() * leftRatioModels[instanceId];
        topCurrentPx = $(widget.parentNode).height() * topRatioModels[instanceId];
        break;
    }

    const widthCurrentVw = rmUnit(unitW(widthCurrentPx));
    const heightCurrentVh = rmUnit(unitH(heightCurrentPx));
    const leftCurrentVw = rmUnit(unitW(leftCurrentPx));
    const topCurrentVh = rmUnit(unitH(topCurrentPx));

    widget.style.left = leftCurrentVw + 'vw';
    widget.style.top = topCurrentVh + 'vh';
    widget.style.width = widthCurrentVw + 'vw';
    widget.style.height = heightCurrentVh + 'vh';
  }

  /*--------mediaChangeProjection--------*/
  // since
  // 1- Widget coordinates are currently in the vw/vh frame, absolute
  // 2- Structure information is not explicit
  // => a reference coordinate change is needed when media is changed
  //
  function mediaChangeProjection(scalingObj, targetFrame, rows) {
    var bChanged = false;
    var lastMedia;
    var referenceFrame = scalingObj;
    var mediaChangeObj = isMediaChanged(scalingObj.media);
    bChanged = mediaChangeObj.bChanged;
    lastMedia = mediaChangeObj.lastMedia;

    if (!rows) {
      return { lastMedia: lastMedia, referenceFrame: referenceFrame, targetFrame: targetFrame };
    }

    // Projection from reference to target frame
    referenceFrame.widthVw = scalingObj.colDims.widthVw; // TODO: check pixels
    referenceFrame.widthPx = scalingObj.colDims.widthPx;
    referenceFrame.scrollWidthVw = scalingObj.colDims.widthVw;
    referenceFrame.scrollWidthPx = scalingObj.colDims.widthPx;
    referenceFrame.heightVh = scalingObj.colDims.heightVh;
    referenceFrame.heightPx = scalingObj.colDims.heightPx;
    referenceFrame.scrollHeightVh = scalingObj.colDims.heightVh; // MBG since rows =! "none"
    referenceFrame.scrollHeightPx = scalingObj.colDims.heightPx; // MBG since rows =! "none"
    targetFrame = getCurrentDropperDims();

    return { lastMedia: lastMedia, referenceFrame: referenceFrame, targetFrame: targetFrame };
  }

  /*--------getCurrentDropperDims--------*/
  // return an array containing each drp dimensions, in px and vh/vw
  // assuming in each row that drp(s) have identical dimensions
  // value per array returned
  function getCurrentDropperDims() {
    let curDrpZone = null;
    const drpId = 'dpr' + 1;
    const cell = $('#' + drpId + getSuffix());
    switch (self.rows) {
      case 0:
        break;

      case 1:
        curDrpZone = {
          widthPx: cell.width() + 2,
          heightPx: cell.height() + 2,
          widthVw: (100 * (cell.width() + 2)) / document.documentElement.clientWidth,
          heightVh: (100 * (cell.height() + 2)) / document.documentElement.clientHeight,
        };
        if (editorSingletons.layoutMgr) {
          // TODO
          const heights = editorSingletons.layoutMgr.getHeightCols();
          curDrpZone['rowHeightPercent'] = heights.length ? heights[0] : 100;
        }
        break;
      default:
        curDrpZone = {
          widthPx: cell.width() + 16,
          heightPx: cell.height() + 2,
          widthVw: (100 * (cell.width() + 16)) / document.documentElement.clientWidth,
          heightVh: (100 * (cell.height() + 2)) / document.documentElement.clientHeight,
        };
        if (editorSingletons.layoutMgr) {
          // TODO
          const heights = editorSingletons.layoutMgr.getHeightCols();
          curDrpZone['rowHeightPercent'] = heights.length ? heights[0] : 100;
        }
    }
    return curDrpZone;
  }

  /*--------updateCellsProportions--------*/
  function updateCellsProportions() {
    switch (self.rows) {
      case 0:
        self.cellProportion = 1;
        break;
      default:
        self.cellProportion = [];
        for (let i = 1; i <= self.rows; i++) {
          const j = 1 + (i - 1) * self.cols;
          const cell = $('#dpr' + j + getSuffix());
          self.cellProportion[i] = cell.height() / cell.width();
        }
        break;
    }
  }

  /*--------deserialize--------*/
  function deserialize(scalingObj) {
    // sanity check
    if (_.isUndefined(scalingObj)) return;

    if (scalingObj.colDims) {
      switch (self.rows) {
        case 0:
          self.cellProportion = 1;
          break;
        default:
          self.cellProportion = [];
          for (let i = 1; i <= self.rows; i++) {
            self.cellProportion[i] = scalingObj.colDims.heightPx / scalingObj.colDims.widthPx;
          }
          break;
      }
    }
    switch (scalingObj.scalingMethod) {
      case 'scaleTwSp': // will be handled next thanks to cellProportion information
        break;
      case 'scaleTwh':
      case 'scaleIdent':
        for (var i = 1; i <= self.rows; i++) {
          var firstRowInCol = (i - 1) * self.cols + 1;
          for (var j = 0; j < self.cols; j++) {
            $('#dpr' + (firstRowInCol + j) + getSuffix())[0].style.height = scalingObj.colDims.heightVh + 'vh';
          }
        }
        updateCellsProportions();
        break;
      default:
    }
  }

  /*--------computeRelativeColHeigth--------*/
  function computeRelativeColHeigth(scalingObj) {
    var dprHeight = 100;
    var windowHeight = scalingObj.heightPx;
    if (!_.isUndefined(scalingObj.colDims.heightPx)) {
      dprHeight = scalingObj.colDims.heightPx;
    } else {
      return 100;
    }

    switch (self.scalingMethod) {
      case 'scaleTwhS':
        return 100;

      case 'scaleTwSp':
        return Math.ceil(((dprHeight + 2) / windowHeight) * 100);

      case 'scaleTwh':
      case 'scaleIdent':
        return Math.ceil(((dprHeight + 2) / windowHeight) * 100);

      default:
    }
  }

  return {
    setDimensions: setDimensions,
    setScalingMethod: setScalingMethod,
    setRows: setRows,
    setCols: setCols,
    getCols: getCols,
    resizeDashboard: resizeDashboard,
    resizeWidgetOnMediaChange: resizeWidgetOnMediaChange,
    getCurrentDropperDims: getCurrentDropperDims,
    resizeDashboardCols: resizeDashboardCols,
    mediaChangeProjection: mediaChangeProjection,
    setCellProportion: setCellProportion,
    updateCellsProportions: updateCellsProportions,
    computeRelativeColHeigth: computeRelativeColHeigth,
    deserialize: deserialize,
  };
}
