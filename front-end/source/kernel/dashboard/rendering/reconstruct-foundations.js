// ┌────────────────────────────────────────────────────────────────────┐ \\
// │  reconstructFoundations : dashboard "backbone" construction        │ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var reconstructFoundations = (function () {
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

  /*--------constructColumns--------*/
  function constructColumns(xprjson) {
    var drprD = document.getElementById('DropperDroitec');
    if (_.isUndefined(xprjson.scaling)) {
      drprD.style.width = '100';
      drprD.style.height = '100';
    } else {
      drprD.style.width = xprjson.scaling.widthVw;
      drprD.style.height = xprjson.scaling.heightVh;
    }
    createCols(xprjson);
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
    const noCols = _.isEmpty(droppers);
    if (noCols) {
      Object.values(xprjson.dashboard).forEach((widget) => appendToContainingDropper(widget, 'DropperDroitec'));
    } else {
      Object.entries(droppers).forEach(([dprId, dprWidgets]) => {
        Object.values(dprWidgets).forEach((widgetId) =>
          appendToContainingDropper(xprjson.dashboard[widgetId], dprId + 'c')
        );
      });
    }
  }

  /*--------buildDivsFromXprjson--------*/
  function buildDivsFromXprjson(xprjson) {
    constructColumns(xprjson);
    constructWidgetsDivs(xprjson);
  }

  /*--------complete--------*/
  function complete(xprjson) {
    reconstructFoundations.buildDivsFromXprjson(xprjson);
    var exportOptions = xprjson.exportOptions;
    if (!_.isUndefined(xprjson)) {
      if (!_.isUndefined(xprjson.meta)) {
        document.title = xprjson.meta.name;
      }
    }
    RuntimeDashboard.loadDashboard(xprjson, exportOptions);
  }

  /*--------preprocessXprjson--------*/
  function preprocessXprjson(jsonContent) {
    var projectQueryParams = findGetParameter('inputParams');
    if (projectQueryParams != null) {
      var projectQueryParamsDecoded = inputHandler.decodeInputPars(projectQueryParams);
      jsonContent = inputHandler.patchInputVariables(jsonContent, projectQueryParamsDecoded);
    }
  }
  /*--------loadXprjson--------*/
  function loadXprjson(jsonContent) {
    var projectUrl = findGetParameter('projectUrl');

    if (projectUrl == null) {
      var xprjson = jsonContent;
      jsonContent = preprocessXprjson(jsonContent);
      complete(xprjson);
    } else {
      var jqxhr = $.get(projectUrl, function (data) {})
        .done(function (data) {
          var xprjson;
          try {
            xprjson = JSON.parse(data);
            jsonContent = preprocessXprjson(xprjson);
            complete(xprjson);
          } catch (exc) {
            swal('Unable to parse ' + projectUrl + ' project', exc, 'error');
            $('.wrapperloading').hide();
          }
        })
        .fail(function (jqXHR, textStatus) {
          datanodesManager.showLoadingIndicator(false);
          swal('Error in loading xprjson from URL', 'Server response : ' + jqXHR.status, 'error');
        });
    }
  }

  return {
    buildDivsFromXprjson: buildDivsFromXprjson,
    loadXprjson: loadXprjson,
  };
})();
