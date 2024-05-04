// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ widgetPreview                                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var widgetPreview = (function () {
  var widget = [];
  var previewDimensionsSnapshot;
  var targetScalingMethod = 'scaleTwh';

  var targetRows = 0;
  var targetCols = 1;
  var scalingHelper = new rescaleHelper(previewDimensionsSnapshot, targetScalingMethod, 'preview');

  // relative widget's height and width : needed when browser's window size changes for rescale
  var widthRatioModels = [];
  var heightRatioModels = [];
  var leftRatioModels = [];
  var topRatioModels = [];

  var lastMediaInPreview = '';

  var widgetsErrorState = {}; // MBG for issue #92

  /**
   * Returns the current dimensions of 'DropperDroitec' div
   * */
  function getCurrentDashZoneDims() {
    //console.log("getCurrentDashZoneDims at player");

    var curDashZone = {
      widthPx: $('#dashboard-zone').width(),
      heightPx: $('#dashboard-zone').height(),
      scrollWidthPx: $('#dashboard-zone')[0].scrollWidth,
      scrollHeightPx: $('#dashboard-zone')[0].scrollHeight,
      widthVw: (100 * $('#dashboard-zone').width()) / document.documentElement.clientWidth,
      heightVh: (100 * $('#dashboard-zone').height()) / document.documentElement.clientHeight,
      scrollWidthVw: (100 * $('#dashboard-zone')[0].scrollWidth) / document.documentElement.clientWidth,
      scrollHeightVh: (100 * $('#dashboard-zone')[0].scrollHeight) / document.documentElement.clientHeight,
      scalingMethod: targetScalingMethod,
    };
    return curDashZone;
  }

  /**
   * Rebuilds Widget in Preview Mode
   * Uses widgets pluging's "copy" method instead of create
   * @param {any} instanceId
   */
  function rebuildWidgetInPreviewMode(instanceId) {
    let elementId = instanceId + 'c';
    var element = document.getElementById(elementId);
    var modelJsonIdStr = element.id.substring(0, element.id.length - 2);
    var instanceId = element.id.substring(0, element.id.length - 1);
    var widgetContainer = element.firstElementChild;
    //
    for (var ch = element.childNodes.length - 1; ch >= 0; ch--) element.removeChild(element.childNodes[ch]);

    var div = document.createElement('div');
    div.style.height = unitH(element.offsetHeight - 2);
    div.style.width = unitW(element.offsetWidth - 2);
    div.style.minWidth = parseFloat(element.style.minWidth) - 5 + 'px';
    div.style.minHeight = parseFloat(element.style.minHeight) - 5 + 'px';

    element.appendChild(div);
    div.id = widgetContainer.id; //wcId
    //
    var wcId = widgetContainer.id;
    widget[instanceId] = widgetsPluginsHandler.copyWidget(wcId, modelJsonIdStr, widget[instanceId], instanceId, true);
    widgetsErrorState[instanceId] = false;
    return instanceId;
  }

  /**
   * Prepares preview mode containers 'dashboard-zone' & 'DropperDroitec'
   * */
  function preparePreviewModeContainer() {
    var xprjson = xdash.serialize();
    xprjson.scaling = widgetEditor.getSnapshotDashZoneDims(); // patch
    var divDest = document.getElementById('dashboard-zone');
    var dprDc = document.createElement('div');
    dprDc.id = 'DropperDroitec';
    dprDc.className = 'dropperR';
    dprDc.style.zIndex = 0; //AEF
    dprDc.style.borderRadius = '10px'; //AEF
    divDest.appendChild(dprDc);
    reconstructFoundations.buildDivsFromXprjson(xprjson);

    return xprjson;
  }

  /**
   * LoadPlayMode is an editor only function, when preview (play) mode is requested
   * */
  function loadPlayMode() {
    // cleanup : here make a reset not a clear
    reset();
    // get preview dimensions for scaling
    previewDimensionsSnapshot = widgetEditor.getSnapshotDashZoneDims();

    // set scaling information
    scalingHelper.setDimensions(previewDimensionsSnapshot);
    scalingHelper.setScalingMethod(targetScalingMethod);
    scalingHelper.setRows(targetRows);
    scalingHelper.setCols(targetCols);

    // build Preview Mode Tab
    let xprjson = preparePreviewModeContainer();
    renderDashboardWidgets(xprjson, false);

    // in case different of size between edit and play
    //resizeDashboard(); // MBG 14/06/2021 No need right now

    // assign change value handlers
    if (datanodesManager.getAllDataNodes().length != 0) {
      assignValueChangeHandlers();
    }
  }

  /**
   * Assigns change value handlers to all widgets : which allows
   * each concerned widget to write on connected dataNodes
   * */
  function assignValueChangeHandlers() {
    for (let propName in widget) {
      for (let sliderName of widgetConnector.effectiveSliders()) {
        if (widget[propName] != null) {
          if (widget[propName].getByName(sliderName) != null) {
            //getting slider object
            slider = widget[propName].getByName(sliderName);
            slider.addValueChangedHandler(updateDataFromWidget);
          }
        }
      }
    }
  }

  /**
   * Draws preview mode widget's border
   * @param {any} instanceId
   */
  function handleWidgetBorder(instanceId) {
    $('#' + instanceId + 'c')[0].style.position = 'absolute';
    $('#' + instanceId + 'c')[0].style.border = '1px solid rgba(255, 255, 255, 0)'; // MBG 02/05/2020
  }

  /**
   * Main dashboard global rendering function. Works both for editor and runtime
   * @param {any} xprjson : xprjson definition to be rendered
   */
  function renderDashboardWidgets(xprjson, bCreate) {
    _.each(_.keys(xprjson.dashboard), (instanceId) => {
      let element = document.getElementById(instanceId + 'c');
      let modelJsonId = instanceId.substring(0, instanceId.length - 1);
      let wcId = element.firstElementChild.id;
      if (bCreate) {
        widget[instanceId] = widgetsPluginsHandler.createWidget(wcId, modelJsonId, instanceId, true);
      } else {
        widget[instanceId] = widgetsPluginsHandler.copyWidget(wcId, modelJsonId, null, instanceId, true);
      }
      handleWidgetBorder(instanceId);
      if (widgetConnector.widgetsConnection[instanceId] != null) {
        widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
        widgetConnector.widgetsConnection[instanceId].widgetObjConnect = widget[instanceId];
        plotConstantData(instanceId, false); //on preview mode
      }
    });

    scalingHelper.updateCellsProportions();

    _.each(_.keys(widget), (instanceId) => {
      computeWidgetsRatio(instanceId, instanceId + 'c');
    });
  }

  /**
   * Deserialisation of widget's connections at runtime mode
   * Only called from runtime mode (not editor mode)
   * @param {any} connectObj
   */
  // MBG : TODO refactor together with widget connection
  function deserialize(connectObj) {
    _.each(_.keys(connectObj), (instanceId) => {
      let modelJsonIdStr = instanceId.substring(0, instanceId.length - 1);
      let elementId = instanceId + 'c';

      if (widgetConnector.widgetsConnection[instanceId] == null) {
        //Add connection
        widgetConnector.widgetsConnection[instanceId] = {
          name: elementId,
          id: elementId,
          instanceId: instanceId,
          modelJsonId: modelJsonIdStr,
          sliders: [],
          widgetObjEdit: null,
          widgetObjConnect: null,
        };
      }
    });

    let key;
    for (key in widgetConnector.widgetsConnection) {
      for (var actuator in connectObj[key]) {
        widgetConnector.widgetsConnection[key].sliders[actuator] = connectObj[key][actuator];
      }
    }
    for (key in widgetConnector.widgetsConnection) {
      try {
        // MBG temporary fix to handle pb of long requests
        widgetPreview.plotConstantData(key, false);
        widgetConnector.widgetsConnection[key].widgetObjEdit = null;
      } catch (exc) {}
    }
  }

  /**
   * Plots the data on the specified widget
   * (necessary for constant value exp: data from csv reader or static json file)
   * @param {string} instanceId : widget's instanceId
   */
  function plotConstantData(instanceId, bCaptionManuallyChanged) {
    const widgetConnection = widgetConnector.widgetsConnection[instanceId];
    if (!_.isUndefined(widgetConnection)) {
      for (const actuatorName in widgetConnection.sliders) {
        const slider = widgetConnection.sliders[actuatorName];
        if (slider.name !== 'None') {
          let actuator = null;
          if (widgetConnection.widgetObjEdit != null) {
            actuator = widgetConnection.widgetObjEdit.getByName(slider.name);
          } else if (widgetConnection.widgetObjConnect != null) {
            actuator = widgetConnection.widgetObjConnect.getByName(slider.name);
          }

          if (actuator != null) {
            const dataNodeName = slider.dataNode;
            if (dataNodeName !== 'None') {
              const dataNode = datanodesManager.getDataNodeByName(dataNodeName);
              if (dataNode) {
                const newData = dataNode.latestData();
                const status = dataNode.status();
                const last_updated = dataNode.last_updated();
                setDataOnWidget(
                  instanceId,
                  actuatorName,
                  actuator,
                  newData,
                  status,
                  last_updated,
                  bCaptionManuallyChanged
                );
              } else {
                const msg = 'Invalid connection with data';
                displayErrorOnWidget(instanceId, actuatorName, msg);
              }
            } else if ($('#collapse-matching-box').hasClass('collapse in')) {
              widgetPreview.clearDataFromWidget(instanceId, i, actuator, true);
            }
          }
        }
      }
    } else {
      console.log('connection of ' + instanceId + ' is undefined');
    }
  }

  /**
   * Displays error message on widget
   * @param {string} instanceId
   * @param {number} i
   * @param {string} msg
   */
  function displayErrorOnWidget(instanceId, i, msg) {
    if (!widgetsErrorState[instanceId]) {
      var divId = widgetConnector.widgetsConnection[instanceId].instanceId + 'c';
      if (!_.isUndefined($('#' + divId)[0])) {
        if ($('#' + divId)[0].style.border != '3px groove #e40000') {
          w = parseFloat($('#' + divId)[0].style.width) + 1;
          h = parseFloat($('#' + divId)[0].style.height) + 1;
          $('#' + divId)[0].style.width = w + 'vw';
          $('#' + divId)[0].style.height = h + 'vh';
          $('#' + divId)[0].style.border = '3px groove #e40000';
          $('#' + divId)[0].style.borderRadius = '6px';
          $('#' + divId)[0].style.background = 'rgba(255, 0, 0, 0.26)';
          $('#' + divId).append(
            '<br/><span style="color:red">' +
              msg +
              ' "' +
              widgetConnector.widgetsConnection[instanceId].sliders[i].dataNode +
              '" !</span>'
          );
        }
      }
      widgetsErrorState[instanceId] = true;
    }
  }

  /**
   * Removes error display on widget
   * @param {string} instanceId
   */
  function removeDisplayErrorOnWidget(instanceId) {
    var divId = widgetConnector.widgetsConnection[instanceId].instanceId + 'c';
    if (!_.isUndefined($('#' + divId)[0])) {
      if ($('#' + divId)[0].style.border != '1px solid rgba(255, 255, 255, 0)') {
        //AEF: fix border
        w = parseFloat($('#' + divId)[0].style.width) - 1;
        h = parseFloat($('#' + divId)[0].style.height) - 1;
        $('#' + divId)[0].style.width = w + 'vw';
        $('#' + divId)[0].style.height = h + 'vh';
        $('#' + divId)[0].style.border = '1px solid rgba(255, 255, 255, 0)'; //AEF: fix border
        $('#' + divId)[0].style.borderRadius = '';
        $('#' + divId)[0].style.background = '';
        for (var j = 0; j < $('#' + divId)[0].childNodes.length; j++) {
          if ($('#' + divId)[0].childNodes[j].localName == 'span') $('#' + divId)[0].childNodes[j].remove();
        }
      }
    }
    widgetsErrorState[instanceId] = false;
  }

  /**
   * Sets data on widget
   * @param {string} instanceId
   * @param {number} i
   * @param {any} actuator
   * @param {any} newData
   * @param {any} status
   * @param {any} last_updated
   */
  function setDataOnWidget(instanceId, i, actuator, newData, status, last_updated, bCaptionManuallyChanged) {
    if ((_.isUndefined(newData) && last_updated != 'never') || status == 'Error') {
      // MBG
      msg = 'Invalid data';
      displayErrorOnWidget(instanceId, i, msg);
      return; // MBG : security. To invalidate widgets instead
    }

    removeDisplayErrorOnWidget(instanceId);

    if (!(_.isUndefined(newData) || _.isNull(newData))) {
      // ABK: fix bug after MBG modif of &&(status!="None") // MBG 30/10/2018 add check on isNull following test "Gecoair UserTripso no JWT (6).html"
      const slider = widgetConnector.widgetsConnection[instanceId].sliders[i];

      let varInter = newData;
      let varName = slider.dataNode;

      for (let deep = 0; deep < slider.dataFields.length; deep++) {
        const field = slider.dataFields[deep];
        const isRange = typeof field === 'string' && field.includes(' ... ');
        if (!isRange) {
          // pass through ranges
          varName = field;
          if (_.isNull(varInter) || _.isUndefined(varInter)) {
            // TODO ???
            varInter = newData[varName];
          } else {
            varInter = varInter[varName];
          }
        }
      }
      if (varInter === null) {
        // data parsing has changed
        // MBG TODO : invalidate widget
        widgetPreview.clearDataFromWidget(instanceId, i, actuator, true);
      } else {
        if (slider.name.substring(0, 1) === 'D') {
          //for Digits
          try {
            actuator.setText(varInter);
          } catch (e) {
            console.log("setText got exception with data '" + slider.dataNode + "'. " + e);
          }
        } else {
          if (!_.isUndefined(actuator.setCaption)) {
            try {
              actuator.setCaption(varName, bCaptionManuallyChanged);
            } catch (e) {
              console.log("setCaption got exception with data '" + slider.dataNode + "'. " + e);
            }
          }
          if (!_.isUndefined(actuator.setValue)) {
            try {
              actuator.setValue(varInter);
            } catch (e) {
              console.log("setValue got exception with data '" + slider.dataNode + "'. " + e);
            }
          }
        }
      }
    }
  }

  /**
   *
   * @param {string} instanceId
   * @param {number} i : slider index
   * @param {any} actuator
   * @param {any} bCaption : clear caption (true or false)
   */
  function clearDataFromWidget(instanceId, i, actuator, bCaption) {
    if (widgetConnector.widgetsConnection[instanceId].sliders[i].name.substring(0, 1) === 'D') {
      //for Digits
      actuator.setText('');
    } else {
      if (!_.isUndefined(actuator.clearCaption) && bCaption) {
        actuator.clearCaption();
      }
      if (!_.isUndefined(actuator.setValue)) {
        actuator.setValue(null); // MBG attention, set to null
      }
    }
  }

  /**
   * Finds a slider/binding from an actuator instance
   * @param {*} actuator
   * @returns
   */
  function findBindingFromActuator(actuator) {
    for (let widgetId in widgetConnector.widgetsConnection) {
      const widgetConnections = widgetConnector.widgetsConnection[widgetId];
      if (widgetConnections.widgetObjConnect) {
        const slider = Object.values(widgetConnections.sliders).find(
          (slider) => widgetConnections.widgetObjConnect.getByName(slider.name) === actuator
        );
        if (slider) {
          return slider;
        }
      }
    }

    return null;
  }

  /**
   * Update data from widget
   * @param {any} sender
   * @param {any} e
   */
  function updateDataFromWidget(sender, e) {
    let binding = findBindingFromActuator(sender);
    if (binding) {
      if (binding.dataNode !== 'None') {
        const dataNode = datanodesManager.getDataNodeByName(binding.dataNode);
        if (!_.isUndefined(dataNode)) {
          if (dataNode.canSetValue() && !_.isUndefined(sender.getValue)) {
            // MBG 12/05/2017
            try {
              dataNode.setValue(binding.dataFields, sender.getValue());
            } catch (exc) {
              console.log('setValue got exception with data: ' + dataNode.name() + '. ' + exc.message);
            }
          } else {
            console.log('setValue is not possible with data: ' + dataNode.name());
          }
        } else {
          console.log('data was removed or data index was modified!');
        }
      }
    }
  }

  /*--------computeWidgetsRatio--------*/
  function computeWidgetsRatio(instanceId, id) {
    widthRatioModels[instanceId] = $('#' + id).width() / $('#' + $('#' + id)[0].parentNode.id).width();
    heightRatioModels[instanceId] = $('#' + id).height() / $('#' + $('#' + id)[0].parentNode.id).height();
    leftRatioModels[instanceId] = $('#' + id).position().left / $('#' + $('#' + id)[0].parentNode.id).width();
    topRatioModels[instanceId] = $('#' + id).position().top / $('#' + $('#' + id)[0].parentNode.id).height();

    lastMediaInPreview = getMedia();
  }

  /**
   * Resize dashboard function
   * @param {any} target
   */
  function resizeDashboard(target) {
    // Prepare rescale for rowToPage mode
    if (typeof execOutsideEditor != 'undefined') {
      if (execOutsideEditor) {
        var navMenuHeightPx = 0;

        if ($('#nav-menu')[0]) {
          navMenuHeightPx = parseInt($('#nav-menu')[0].style.height);
          if (isNaN(navMenuHeightPx)) navMenuHeightPx = 0; // MBG 18/05/2021 : piste pour pb NG ??
        }

        switch (jsonContent.exportOptions) {
          case 'rowToPage':
            rowToPageRuntime.rowToPagePrepareRescale(targetRows, targetCols);
            break;
          case 'rowToTab':
            rowToTabRuntime.rowToTabPrepareRescale(targetRows, targetCols);
            break;
          case 'customNavigation':
            customNavigationRuntime.customNavigationPrepareRescale(targetRows, targetCols);
            break;
          case 'keepOriginalWidth':
            $('#dashboard-zone')[0].style.height = scalingSrc.scrollHeightPx + navMenuHeightPx + 'px';
            break;
          default:
            $('#dashboard-zone')[0].style.height = document.body.clientHeight - navMenuHeightPx + 'px';
            break;
        }
      }
    }

    scalingHelper.setScalingMethod(targetScalingMethod);
    scalingHelper.setRows(targetRows);
    scalingHelper.setCols(targetCols);
    scalingHelper.resizeDashboard(target);

    rescale();

    // Finish rescale for rowToPage
    if (typeof execOutsideEditor != 'undefined') {
      if (execOutsideEditor) {
        if (jsonContent.exportOptions == 'rowToPage')
          setTimeout(rowToPageRuntime.rowToPageFinishRescale, 500, targetRows, targetCols); // MBG temp hack
      }
    }
  }

  /*--------mediaChangeProjection--------*/
  function mediaChangeProjection(scalingObj, projectedDashDimensions, rows) {
    return scalingHelper.mediaChangeProjection(scalingObj, projectedDashDimensions, rows);
  }

  /*--------rescale--------*/
  function rescale() {
    previewDimensionsSnapshot = getCurrentDashZoneDims();
    scalingHelper.setDimensions(previewDimensionsSnapshot);

    var bChanged = false;

    var mediaChangeObj = isMediaChanged(lastMediaInPreview);
    bChanged = mediaChangeObj.bChanged;
    lastMediaInPreview = mediaChangeObj.lastMedia;

    if (bChanged) {
      _.each(_.keys(widget), (instanceId) => {
        let elementId = instanceId + 'c';
        scalingHelper.resizeWidgetOnMediaChange(instanceId, elementId);
        rebuildWidgetInPreviewMode(instanceId);
        if (widgetConnector.widgetsConnection[instanceId] != null) {
          widgetConnector.widgetsConnection[instanceId].widgetObjConnect = widget[instanceId];
          plotConstantData(instanceId);
        }
      });
    } else {
      _.each(_.keys(widget), (instanceId) => {
        rescaleWidget(widget, instanceId);
      });
    }
  }

  /*--------reset--------*/
  function reset() {
    for (var property in widget) {
      delete widget[property];
    }
    $('#dashboard-zone').html('');

    for (var property in widthRatioModels) {
      delete widthRatioModels[property];
    }
    for (var property in heightRatioModels) {
      delete heightRatioModels[property];
    }
    for (var property in leftRatioModels) {
      delete leftRatioModels[property];
    }
    for (var property in topRatioModels) {
      delete topRatioModels[property];
    }
    lastMediaInPreview = '';
  }

  /*--------clear--------*/
  function clear() {
    reset();
    htmlExport.exportOptions = 'ajustToTargetWindow';
  }

  /*--------getDashboardExtent--------*/
  function getDashboardExtent() {
    var right = 0;
    var bottom = 0;
    var offsetLeft = $('#dashboard-zone').offset().left;
    var offsetTop = $('#dashboard-zone').offset().top;
    var maxHeight = $('#dashboard-zone').height();
    var rightExtent;
    var bottomExtent;
    for (var propName in widget) {
      rightExtent = $('#' + propName + 'c').offset().left - offsetLeft + $('#' + propName + 'c').width();
      if (rightExtent > right) {
        right = rightExtent;
      }
      bottomExtent = $('#' + propName + 'c').offset().top - offsetTop + $('#' + propName + 'c').height();
      if (bottomExtent > bottom) {
        bottom = bottomExtent;
      }

      if (bottom > maxHeight) bottom = maxHeight; // saturation
    }

    return { right: right, bottom: bottom };
  }

  /**
   * Converts the 'dashboard-zone' to png
   * Currently unused
   * */
  function toPng() {
    var dashExt = getDashboardExtent();
    var originalHTML = document.getElementById('dashboard-zone');
    var origHeight = originalHTML.style.height;
    var origWidth = originalHTML.style.width;
    originalHTML.style.height = dashExt.bottom + 'px';
    originalHTML.style.width = dashExt.right + 'px';

    html2canvas(originalHTML, { allowTaint: false, useCORS: true }).then(function (canvas) {
      var png = Canvas2Image.convertToPNG(canvas, dashExt.right, dashExt.bottom);

      var link = document.createElement('a');
      link.setAttribute('download', $('#projectName')[0].value + '.png');
      link.setAttribute('href', png.src.replace('image/png', 'image/octet-stream'));
      link.click();

      originalHTML.style.height = origHeight;
      originalHTML.style.width = origWidth;
    });
  }

  /**
   * Sets the scaling information for the associated scalingHelper
   * @param {any} srcDims
   * @param {any} tgScalMethod
   * @param {any} tgRows
   * @param {any} tgCols
   */
  // when null is passed as argument, no corresponding update will be performed
  function setScalingInformation(srcDims, tgScalMethod, tgRows, tgCols) {
    if (srcDims != null) {
      scalingHelper.setDimensions(srcDims);
      if (srcDims.colDims != null) {
        scalingHelper.deserialize(srcDims);
      }
    }
    if (tgScalMethod != null) {
      targetScalingMethod = tgScalMethod;
      scalingHelper.setScalingMethod(targetScalingMethod);
    }
    if (tgRows != null) {
      targetRows = tgRows;
      scalingHelper.setRows(targetRows);
    }
    if (tgCols != null) {
      targetCols = tgCols;
      scalingHelper.setCols(targetCols);
    }
  }

  /*--------resizeDashboardCols--------*/
  function resizeDashboardCols() {
    scalingHelper.resizeDashboardCols();
  }

  /**
   * Put z-index of selected widget on top of all widgets
   * MBG from AEF work for autocomplete
   * @param {string} idInstance
   * @param {any} e
   */
  function elevateZIndex(idInstance, e) {
    var maxZIindex = 0;
    // find highest z-index
    _.each(Object.keys(widget), function (w) {
      var wZIndex = Number($('#' + w + 'c')[0].style['z-index']);
      if (wZIndex > maxZIindex) {
        maxZIindex = wZIndex;
      }
    });
    // assign highest z-index
    $('#' + idInstance + 'c')[0].style['z-index'] = maxZIindex + 1;
  }

  // Public functions
  return {
    loadPlayMode: loadPlayMode,
    renderDashboardWidgets,
    updateDataFromWidget: updateDataFromWidget,
    resizeDashboard: resizeDashboard,
    resizeDashboardCols: resizeDashboardCols,
    widget: widget,
    plotConstantData: plotConstantData,
    assignValueChangeHandlers: assignValueChangeHandlers,
    rescale: rescale,
    clear: clear,
    deserialize: deserialize,
    setDataOnWidget: setDataOnWidget,
    clearDataFromWidget: clearDataFromWidget,
    getCurrentDashZoneDims: getCurrentDashZoneDims,
    getSnapshotDashZoneDims: function () {
      return previewDimensionsSnapshot;
    },
    getWidgetsRelativeDims: function () {
      return {
        width: widthRatioModels,
        height: heightRatioModels,
        left: leftRatioModels,
        top: topRatioModels,
      };
    },
    setScalingInformation: setScalingInformation,
    getCols: function () {
      return scalingHelper.getCols();
    },
    mediaChangeProjection: mediaChangeProjection,
    toPng: toPng,
    elevateZIndex: elevateZIndex,
  };
})();
