// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ widgetPreview                                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { applyGeometry } from 'kernel/dashboard/widget/widget-placement';
import { runtimeSingletons } from 'kernel/runtime-singletons';
import { customNavigationRuntime } from 'kernel/runtime/custom-navigation-runtime';
import { rowToTabRuntime } from 'kernel/runtime/row-to-tab-runtime';
import { rowToPageRuntime } from 'kernel/runtime/row-to-page-runtime';

const DISPLAY_CONTAINER_ID = 'DropperDroitec';

class WidgetPreview {
  constructor() {
    this.idWC = 401;

    /*
        widget id => {
          layout: { top: number, left: number, width: number, height: number, zIndex: number, page?: number },
          containerDiv: HTMLElement,
          instance : baseWidget,
        }
     */
    this.widgetsInfo = new Map();

    this.currentPage = undefined;
    this.pageNames = [];

    // TODO padding

    this.widgetsOnErrorState = new Set();
  }

  /**
   * @description Get an ID for containerDiv (such WidgetContainer1xx)
   */
  #nextWidgetContainerId() {
    this.idWC = this.idWC + 1;
    return `WidgetContainer${this.idWC}c`;
  }

  createWidget(modelJsonId, instanceId, layout) {
    const containerDiv = document.createElement('div');
    containerDiv.id = instanceId + 'c';

    containerDiv.classList.add('widget');
    containerDiv.classList.add('widget__layout--item');

    const wcId = this.#nextWidgetContainerId();
    const div = document.createElement('div');
    div.id = wcId;
    containerDiv.appendChild(div);

    applyGeometry(containerDiv, layout);
    if (layout.zIndex !== undefined) {
      containerDiv.style.zIndex = layout.zIndex;
    }

    document.getElementById(DISPLAY_CONTAINER_ID).appendChild(containerDiv);

    const show = this.currentPage === undefined || this.currentPage === layout.page;
    containerDiv.style.display = show ? 'block' : 'none';

    let instance;
    try {
      instance = widgetsPluginsHandler.createWidget(wcId, modelJsonId, instanceId, true);
      this.widgetsInfo.set(instanceId, {
        layout,
        containerDiv,
        instance,
      });
    } catch (ex) {
      aElement.remove();
      throw ex;
    }

    if (widgetConnector.widgetsConnection[instanceId] != null) {
      widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
      widgetConnector.widgetsConnection[instanceId].widgetObjConnect = instance;

      // TODO coords check needed at runtime
      this.plotConstantData(instanceId, false); //on preview mode
    }
  }

  setCurrentPage(newPage) {
    this.currentPage = newPage;
    this.#applyCurrentPage();
  }

  #applyCurrentPage() {
    this.widgetsInfo.values().forEach((info) => {
      const show = this.currentPage === undefined || this.currentPage === info.layout.page;
      info.containerDiv.style.display = show ? 'block' : 'none';
    });
  }

  /**
   * LoadPlayMode is an editor only function, when preview (play) mode is requested
   */
  loadPlayMode() {
    // cleanup : here make a reset not a clear
    this.reset();

    const xprjson = runtimeSingletons.xdash.serialize();

    for (const [instanceId, desc] of Object.entries(xprjson.dashboard)) {
      this.createWidget(desc.container.modelJsonId, instanceId, desc.layout);
    }

    // assign change value handlers
    if (datanodesManager.getAllDataNodes().length != 0) {
      this.assignValueChangeHandlers();
    }
  }

  /**
   * Assigns change value handlers to all widgets : which allows
   * each concerned widget to write on connected dataNodes
   * */
  assignValueChangeHandlers() {
    for (const widgetInfo of this.widgetsInfo.values()) {
      const instance = widgetInfo.instance;
      for (const sliderName of widgetConnector.effectiveSliders()) {
        const slider = instance.getByName(sliderName);
        if (slider != null) {
          //getting slider object
          slider.addValueChangedHandler((sender, e) => this.updateDataFromWidget(sender, e));
        }
      }
    }
  }

  /**
   * Main dashboard global rendering function. Works both for editor and runtime
   * @param {any} xprjson : xprjson definition to be rendered
   */
  renderDashboardWidgets(xprjson) {
    // TODO coords put in deserialize ?
    _.each(_.keys(xprjson.dashboard), (instanceId) => {
      let element = document.getElementById(instanceId + 'c');
      let modelJsonId = instanceId.substring(0, instanceId.length - 1);
      let wcId = element.firstElementChild.id;

      widget[instanceId] = widgetsPluginsHandler.createWidget(wcId, modelJsonId, instanceId, true);
      if (widgetConnector.widgetsConnection[instanceId] != null) {
        widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
        widgetConnector.widgetsConnection[instanceId].widgetObjConnect = widget[instanceId];
        this.plotConstantData(instanceId, false); //on preview mode
      }
    });
  }

  reRenderWidget(instanceId) {
    this.widgetsInfo.get(instanceId)?.render(true);
  }

  /**
   * Deserialisation of widget's connections at runtime mode
   * Only called from runtime mode (not editor mode)
   * @param {any} connectObj
   */
  // MBG : TODO refactor together with widget connection
  deserialize(connectObj) {
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
        this.plotConstantData(key, false);
        widgetConnector.widgetsConnection[key].widgetObjEdit = null;
      } catch (exc) {
        // TODO nope
      }
    }
  }

  /**
   * Plots the data on the specified widget
   * (necessary for constant value exp: data from csv reader or static json file)
   * @param {string} instanceId : widget's instanceId
   */
  plotConstantData(instanceId, bCaptionManuallyChanged) {
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
                this.setDataOnWidget(
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
                this.displayErrorOnWidget(instanceId, actuatorName, msg);
              }
            } else {
              this.clearDataFromWidget(actuator, true);
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
  displayErrorOnWidget(instanceId, i, msg) {
    const info = this.widgetsInfo.get(instanceId);
    if (info && !this.widgetsOnErrorState.has(instanceId)) {
      const containerDiv = info.containerDiv;
      containerDiv.style.outline = '4px groove #e40000';
      containerDiv.style.borderRadius = '6px';
      containerDiv.style.background = 'rgba(255, 0, 0, 0.26)';

      const span = document.createElement('span');
      span.style.color = 'red';
      span.innerText = `${msg} "${widgetConnector.widgetsConnection[instanceId].sliders[i].dataNode}" !`;
      containerDiv.appendChild(document.createElement('br'));
      containerDiv.appendChild(span);

      this.widgetsOnErrorState.add(instanceId);
    }
  }

  /**
   * Removes error display on widget
   * @param {string} instanceId
   */
  removeDisplayErrorOnWidget(instanceId) {
    const info = this.widgetsInfo.get(instanceId);
    if (info) {
      const containerDiv = info.containerDiv;

      containerDiv.style.removeProperty('outline');
      containerDiv.style.removeProperty('borderRadius');
      containerDiv.style.removeProperty('background');

      const containerDiv$ = $(containerDiv);

      containerDiv$.children('span').remove();
      containerDiv$.children('br').remove();
    }

    this.widgetsOnErrorState.delete(instanceId);
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
  setDataOnWidget(instanceId, actuatorName, actuator, newData, status, last_updated, bCaptionManuallyChanged) {
    if ((_.isUndefined(newData) && last_updated != 'never') || status == 'Error') {
      // MBG
      const msg = 'Invalid data';
      this.displayErrorOnWidget(instanceId, actuatorName, msg);
      return; // MBG : security. To invalidate widgets instead
    }

    this.removeDisplayErrorOnWidget(instanceId);

    if (!(_.isUndefined(newData) || _.isNull(newData))) {
      // ABK: fix bug after MBG modif of &&(status!="None") // MBG 30/10/2018 add check on isNull following test "Gecoair UserTripso no JWT (6).html"
      const slider = widgetConnector.widgetsConnection[instanceId].sliders[actuatorName];

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
        this.clearDataFromWidget(actuator, true);
      } else {
        if (slider.name.substring(0, 1) === 'D') {
          // TODO
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
   * @param {any} actuator
   * @param {any} bCaption : clear caption (true or false)
   */
  clearDataFromWidget(actuator, bCaption) {
    if (!_.isUndefined(actuator.clearCaption) && bCaption) {
      actuator.clearCaption();
    }
    if (!_.isUndefined(actuator.setValue)) {
      actuator.setValue(null); // MBG attention, set to null
    }
  }

  /**
   * Finds a slider/binding from an actuator instance
   * @param {*} actuator
   * @returns
   */
  #findBindingFromActuator(actuator) {
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
  updateDataFromWidget(sender, e) {
    const binding = this.#findBindingFromActuator(sender);
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

  /**
   * Resize dashboard function
   * @param {any} target
   */
  resizeDashboard(target) {
    // TODO coords
    // Prepare rescale for rowToPage mode
    if (window.dashboardConfig?.execOutsideEditor) {
      const scalingSrc = window.scaling;
      let navMenuHeightPx = 0;

      if ($('#nav-menu')[0]) {
        navMenuHeightPx = parseInt($('#nav-menu')[0].style.height);
        if (isNaN(navMenuHeightPx)) navMenuHeightPx = 0; // MBG 18/05/2021 : piste pour pb NG ??
      }

      switch (window.exportOptions) {
        case 'rowToPage':
          rowToPageRuntime.rowToPagePrepareRescale(targetRows, targetCols);
          break;
        case 'rowToTab':
          rowToTabRuntime.rowToTabPrepareRescale(targetRows, targetCols);
          break;
        case 'customNavigation':
          customNavigationRuntime.customNavigationPrepareRescale(targetRows, targetCols);
          break;
        case 'keepOriginalWidth': {
          const $dashboardZone = $('#dashboard-zone');
          const bodyHeight = document.body.clientHeight;
          const bodyWidth = document.body.clientWidth;
          $dashboardZone.css({
            top: bodyHeight / 2 - $dashboardZone.outerHeight() / 2 + 'px',
            left: bodyWidth / 2 - $dashboardZone.outerWidth() / 2 + 'px',
            position: 'absolute',
            height: scalingSrc.scrollHeightPx + navMenuHeightPx + 'px',
            width: scalingSrc.scrollWidthPx + 'px',
          });
          break;
        }
        case 'adjustToFullWidth': {
          const $dashboardZone = $('#dashboard-zone');
          const bodyHeight = document.body.clientHeight;
          $dashboardZone.css({
            top: bodyHeight / 2 - $dashboardZone.outerHeight() / 2 + 'px',
            position: 'absolute',
            height: scalingSrc.scrollHeightPx + navMenuHeightPx + 'px',
          });
          break;
        }
        default:
          $('#dashboard-zone')[0].style.height = document.body.clientHeight - navMenuHeightPx + 'px';
          break;
      }
    }

    scalingHelper.setScalingMethod(targetScalingMethod);
    scalingHelper.resizeDashboard(target);

    // Finish rescale for rowToPage
    if (window.dashboardConfig?.execOutsideEditor) {
      if (window.exportOptions == 'rowToPage')
        setTimeout(rowToPageRuntime.rowToPageFinishRescale, 500, targetRows, targetCols); // MBG temp hack
    }
  }

  reset() {
    for (const info of this.widgetsInfo.values()) {
      info.containerDiv.remove();
    }
    this.widgetsInfo.clear();
    this.widgetsOnErrorState.clear();

    document.getElementById(DISPLAY_CONTAINER_ID).scrollTop = 0;
  }

  #getDashboardExtent() {
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
   * Converts the dashboard's content to png
   * Currently unused
   * */
  toPng() {
    const dashExt = this.#getDashboardExtent();

    const originalHTML = document.getElementById('DropperDroitec');
    const origHeight = originalHTML.style.height;
    const origWidth = originalHTML.style.width;
    originalHTML.style.height = dashExt.bottom + 'px';
    originalHTML.style.width = dashExt.right + 'px';

    html2canvas(originalHTML, { allowTaint: false, useCORS: true }).then(function (canvas) {
      const png = Canvas2Image.convertToPNG(canvas, dashExt.right, dashExt.bottom);

      const link = document.createElement('a');
      link.setAttribute('download', $('#projectName')[0].value + '.png');
      link.setAttribute('href', png.src.replace('image/png', 'image/octet-stream'));
      link.click();

      originalHTML.style.height = origHeight;
      originalHTML.style.width = origWidth;
    });
  }

  /**
   * Put z-index of selected widget on top of all widgets
   * MBG from AEF work for autocomplete
   * @param {string} idInstance
   * @param {any} e
   */
  elevateZIndex(idInstance, e) {
    // TODO
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
}

// TODO rename
export const widgetPreview = new WidgetPreview();
