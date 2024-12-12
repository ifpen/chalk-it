// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ widgetViewer                                                      │ \\
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

const DISPLAY_CONTAINER_ID = 'DropperDroitec';

/**
 * Display widgets for the editor's view mode and for deployed dashboards.
 */
class WidgetWiewer {
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

    this.marginX = 0;
    this.marginY = 0;

    this.widgetsOnErrorState = new Set();
  }

  /**
   * @description Get an ID for containerDiv (such WidgetContainer1xx)
   */
  #nextWidgetContainerId() {
    this.idWC = this.idWC + 1;
    return `WidgetContainer${this.idWC}c`;
  }

  /**
   * Update the dashboard's margins.
   * @param {number} valueX
   * @param {number} valueY
   */
  setMargins(valueX, valueY) {
    this.marginX = valueX;
    this.marginY = valueY;

    this.widgetsInfo.values().forEach((info) => {
      this.#updateWidgetPosition(info.containerDiv, info.layout);
    });
  }

  #updateWidgetPosition(containerDiv, { top, left, width, height }) {
    left += this.marginX;
    top += this.marginY;
    applyGeometry(containerDiv, { top, left, width, height });
  }

  #createWidget(modelJsonId, instanceId, layout) {
    const containerDiv = document.createElement('div');
    containerDiv.id = instanceId + 'c';

    containerDiv.classList.add('widget');

    const wcId = this.#nextWidgetContainerId();
    const div = document.createElement('div');
    div.id = wcId;
    containerDiv.appendChild(div);

    this.#updateWidgetPosition(containerDiv, layout);
    if (layout['z-index'] !== undefined) {
      containerDiv.style.zIndex = layout['z-index'];
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
      containerDiv.remove();
      throw ex;
    }

    if (widgetConnector.widgetsConnection[instanceId] != null) {
      widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
      widgetConnector.widgetsConnection[instanceId].widgetObjConnect = instance;

      this.plotConstantData(instanceId, false);
    }
  }

  /**
   * Changes the currently displayed page
   * @param {number} newPage page number (0 based)
   */
  setCurrentPage(newPage) {
    this.currentPage = newPage;
    this.#applyCurrentPage();
  }

  /**
   * Filter displayed widgets according to the "currentPage"
   */
  #applyCurrentPage() {
    this.widgetsInfo.values().forEach((info) => {
      const show = this.currentPage === undefined || this.currentPage === info.layout.page;
      info.containerDiv.style.display = show ? 'block' : 'none';
    });
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
   * @param {any} dashboard : dashboard definition to be rendered
   */
  renderDashboardWidgets(dashboard) {
    for (const [instanceId, desc] of Object.entries(dashboard)) {
      this.#createWidget(desc.container.modelJsonId, instanceId, desc.layout);
    }

    // assign change value handlers
    if (datanodesManager.getAllDataNodes().length != 0) {
      this.assignValueChangeHandlers();
    }
  }

  reRenderWidget(instanceId) {
    this.widgetsInfo.get(instanceId)?.instance?.render(true);
  }

  #deserializeConnections(jsonContent) {
    const types = new Map();
    for (const widget of Object.values(jsonContent.dashboard)) {
      types.set(widget.container.instanceId, widget.container.modelJsonId);
    }

    for (const [instanceId, connections] of Object.entries(jsonContent.connections)) {
      const elementId = instanceId + 'c';
      const modelJsonId = types.get(instanceId);
      if (!modelJsonId) {
        throw new Error(`No definition for ${modelJsonId}`);
      }
      const sliders = []; // TODO should be an object

      widgetConnector.widgetsConnection[instanceId] = {
        name: elementId,
        id: elementId,
        instanceId,
        modelJsonId,
        sliders,
        widgetObjEdit: null,
        widgetObjConnect: null,
      };
      for (const [actuator, actuatorDef] of Object.entries(connections)) {
        sliders[actuator] = actuatorDef;
      }
    }
  }

  /**
   * Deserialisation of widgets and their connections.
   * Only called from runtime mode (not editor mode)
   * @param {any} jsonContent
   */
  deserialize(jsonContent) {
    const display = jsonContent.display;
    this.setMargins(display.marginX, display.marginY);

    const pages = jsonContent.pages;
    if (pages?.pageNames?.length) {
      this.pageNames = [...pages.pageNames];
      this.currentPage = pages.initialPage ?? 0;
    }

    // Set the theme
    // Theme must be set before we create the widgets
    $('html').attr('data-theme', display.theme);
    $('.dropperR').css('background-color', display.backgroundColor);

    this.#deserializeConnections(jsonContent);
    this.renderDashboardWidgets(jsonContent.dashboard);

    const { width, height } = this.#getDashboardExtent(display.width, display.height);
    const pageDiv$ = $('.dashboard-page-container');
    pageDiv$.width(width);
    pageDiv$.height(height);
    const contentDiv$ = $('.dashboard-content-container');
    contentDiv$.width(width);
    contentDiv$.height(height);
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
              this.#clearDataFromWidget(actuator, true);
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
  #removeDisplayErrorOnWidget(instanceId) {
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

    this.#removeDisplayErrorOnWidget(instanceId);

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
            // TODO seems harmful ???
            varInter = newData[varName];
          } else {
            varInter = varInter[varName];
          }
        }
      }
      if (varInter === null) {
        // data parsing has changed
        // MBG TODO : invalidate widget
        this.#clearDataFromWidget(actuator, true);
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

  /**
   *
   * @param {any} actuator
   * @param {any} bCaption : clear caption (true or false)
   */
  #clearDataFromWidget(actuator, bCaption) {
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

  reset() {
    for (const info of this.widgetsInfo.values()) {
      info.containerDiv.remove();
    }
    this.widgetsInfo.clear();
    this.widgetsOnErrorState.clear();

    document.getElementById(DISPLAY_CONTAINER_ID).scrollTop = 0;
  }

  #getDashboardExtent(width = 0, height = 0) {
    this.widgetsInfo.values().forEach((info) => {
      const layout = info.layout;
      width = Math.max(width, layout.left + layout.width);
      height = Math.max(height, layout.top + layout.height);
    });

    return { width: width + this.marginX * 2, height: height + this.marginY * 2 };
  }

  /**
   * Converts the dashboard's content to png
   * Currently unused
   * */
  toPng() {
    // FIXME unused
    const dashExt = this.#getDashboardExtent();

    const originalHTML = document.getElementById('DropperDroitec');
    const origHeight = originalHTML.style.height;
    const origWidth = originalHTML.style.width;
    originalHTML.style.height = dashExt.height + 'px';
    originalHTML.style.width = dashExt.width + 'px';

    html2canvas(originalHTML, { allowTaint: false, useCORS: true }).then(function (canvas) {
      const png = Canvas2Image.convertToPNG(canvas, dashExt.width, dashExt.height);

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
   */
  elevateZIndex(idInstance) {
    // find highest z-index
    let maxZIindex = 0;
    for (const info of this.widgetsInfo.values()) {
      maxZIindex = Math.max(maxZIindex, info.layout.zIndex);
    }

    // assign highest z-index
    this.widgetsInfo.get(idInstance).containerDiv.style['z-index'] = maxZIindex + 1;
  }
}

export const widgetViewer = new WidgetWiewer();
