// ┌────────────────────────────────────────────────────────────────────┐ \\
// │  reconstructFoundations : dashboard "backbone" construction        │ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { findGetParameter } from 'kernel/datanodes/plugins/thirdparty/utils';
import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';
import { loadDashboard } from 'kernel/runtime/xdash-runtime-main';
import { inputHandler } from 'kernel/general/interfaces/input-params';

export const reconstructFoundations = (function () {
  // base functions
  var idWC = 401;

  /*--------createCols--------*/
  // TODO : refactor with same function in toolbox-editor.js
  function createCols(xprjson) {
    var classType;
    var maxCells;
    var maxCols;

    if (_.isUndefined(xprjson.device)) {
      classType = '';
      maxCells = 0;
      maxCols = 0;
    } else {
      classType = xprjson.device.cols.classType;
      maxCells = xprjson.device.cols.maxCells;
      maxCols = xprjson.device.cols.maxCols;
    }

    if (maxCells != 0) {
      var drprD = document.getElementById('DropperDroitec');
      var maxRows = maxCells / maxCols; // MBG attention : 0/0
      for (var i = 1; i <= maxRows; i++) {
        for (var j = 1 + (i - 1) * maxCols; j <= i * maxCols; j++) {
          var dprCol = document.createElement('div');
          dprCol.setAttribute('class', classType + ' device-col'); // col-invisible
          dprCol.setAttribute('id', 'dpr' + j + 'c');
          dprCol.style.height = xprjson.scaling.colDims.heightVh + 'vh';
          drprD.appendChild(dprCol);
          // MBG from makeColsTrasparent
          if (!$('#dpr' + j + 'c').hasClass('col-invisible')) {
            $('#dpr' + j + 'c').addClass('col-invisible');
          }
        }
      }
    }
  }

  /*--------appendToContainingDropper--------*/
  function appendToContainingDropper(widget, containingDropper) {
    var divContainingDropper = document.getElementById(containingDropper);
    var divWidget = createWidgetDiv(widget);
    divContainingDropper.appendChild(divWidget);
  }

  /*--------createWidgetDiv--------*/
  function createWidgetDiv(widget) {
    var divWidget = document.createElement('div');
    divWidget.id = widget.container.instanceId + 'c';
    divWidget.style.top = widget.layout.top;
    divWidget.style.left = widget.layout.left;
    divWidget.style.width = widget.layout.width;
    divWidget.style.height = widget.layout.height;
    if (!_.isUndefined(widget.layout['z-index'])) {
      divWidget.style['z-index'] = widget.layout['z-index']; // MBG 04/10/2019
    }
    divWidget.style.position = 'absolute';
    divWidget.style.cursor = 'default';

    var divWidgetContainer = document.createElement('div');
    divWidgetContainer.id = 'WidgetContainer' + idWC + 'c';
    idWC++;
    divWidgetContainer.style.width =
      rmUnit(widget.layout.width) - 2 * (100 / document.documentElement.clientWidth) + 'vw';
    divWidgetContainer.style.height =
      rmUnit(widget.layout.height) - 2 * (100 / document.documentElement.clientHeight) + 'vh';
    divWidget.appendChild(divWidgetContainer);

    return divWidget;
  }

  /*--------constructWidgetsDivs--------*/
  function constructWidgetsDivs(xprjson) {
    const droppers = xprjson.device.droppers;
    Object.values(xprjson.dashboard).forEach((widget) => appendToContainingDropper(widget, 'DropperDroitec'));
  }

  /*--------buildDivsFromXprjson--------*/
  function buildDivsFromXprjson(xprjson) {
    constructColumns(xprjson);
    constructWidgetsDivs(xprjson);
  }

  return {
    buildDivsFromXprjson: buildDivsFromXprjson,
  };
})();
