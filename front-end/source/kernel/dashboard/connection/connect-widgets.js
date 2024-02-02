// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ widgetConnector                                                       │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Tristan BARTEMENT  │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\
import _ from 'underscore';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { singletons } from 'kernel/runtime/xdash-runtime-main';
import { EVENTS_EDITOR_CONNECTIONS_CHANGED } from 'angular/modules/editor/editor.events';

export const widgetConnector = (function () {
  var widgetsConnection = [];

  function _onConnectionsChanged() {
    const injector = angular.element(document.body).injector();
    // Also called in exported dashboards where EventCenterService is not available.
    // A 'deployed' mode might be preferable, or exporting EventCenterService, but this works.
    if (injector && injector.has('EventCenterService')) {
      injector.invoke([
        'EventCenterService',
        (eventCenterService) => {
          eventCenterService.sendEvent(EVENTS_EDITOR_CONNECTIONS_CHANGED);
        },
      ]);
    }
  }

  /*--------update Widget Connection--------*/
  function updateWidgetsConnections() {
    const widgetEditor = singletons.widgetEditor;

    // Purge missing widgets
    for (const idx in widgetsConnection) {
      if (!widgetEditor.widgetContainers.get(widgetsConnection[idx].id)) {
        delete widgetsConnection[idx];
      }
    }

    // Create missing connections
    for (const [key, widget] of widgetEditor.widgetContainers) {
      if (widgetsConnection[key]) {
        if (!!widgetEditor.widgetObject[key]) {
          if (!_.isNull(widgetsConnection[key].widgetObjEdit) && !_.isNull(widgetEditor.widgetObject[key])) {
            let len =
              widgetsConnection[key].widgetObjEdit.numberOfTriggers - widgetEditor.widgetObject[key].numberOfTriggers;
            while (len > 0) {
              // widgetsConnection[key].sliders.pop();
              let keys = Object.keys(widgetsConnection[key].sliders);
              delete widgetsConnection[key].sliders[keys[keys.length - 1]];
              len--;
            }
          }
          // TODO dedicated update ?
          widgetsConnection[key].widgetObjEdit = widgetEditor.widgetObject[key];
        }
      } else {
        widgetsConnection[key] = {
          name: key, //key is instanceId
          id: key,
          instanceId: key,
          modelJsonId: widget.modelJsonId,
          sliders: [],
          widgetObjEdit: widgetEditor.widgetObject[key],
          widgetObjConnect: null,
        };
      }
    }

    _onConnectionsChanged();
  }

  /*--------Reset Single Matching Box--------*/
  function resetSingleMatchingBox() {
    //clear all widget connections
    for (const propertyName in widgetsConnection) {
      _clearWidgetConnection(propertyName);
    }

    _onConnectionsChanged();
  }

  /*--------clearWidgetConnection--------*/
  function _clearWidgetConnection(instanceId) {
    const widgetConnection = widgetsConnection[instanceId];
    for (const key in widgetConnection.sliders) {
      const slider = widgetConnection.sliders[key];
      slider.dataNode = 'None';
      slider.dataFields.length = 0;
    }
  }

  /*--------serialize--------*/
  function serialize() {
    const connectJson = {};

    for (const key in widgetsConnection) {
      connectJson[key] = {};
      for (const actuator in widgetsConnection[key].sliders) {
        connectJson[key][actuator] = jQuery.extend(true, {}, widgetsConnection[key].sliders[actuator]); // MBG Fix for dataNodeIndex pb! 03/08/2017 - 17:06
      }
    }

    return connectJson;
  }

  /*--------deserialize--------*/
  function deserialize(connectObj) {
    clear();

    updateWidgetsConnections();
    var freeboardDataName = [];
    for (var f = 0; f < datanodesManager.getAllDataNodes().length; f++) {
      freeboardDataName[f] = datanodesManager.getAllDataNodes()[f].name();
    }

    for (const key in widgetsConnection) {
      for (const actuator in connectObj[key]) {
        if (_.isUndefined(connectObj[key][actuator].dataNode)) {
          //compatibility
          connectObj[key][actuator].dataNode = connectObj[key][actuator].dataSource;
          delete connectObj[key][actuator].dataSource;
        }
        widgetsConnection[key].sliders[actuator] = connectObj[key][actuator];
      }
    }

    for (let key in widgetsConnection) {
      try {
        // MBG tmp to handle pb of long requests
        widgetPreview.plotConstantData(key, false);
        // widgetsConnection[key].widgetObjEdit = null; //AEF: comment  for issue#152
      } catch (exc) {
        console.error(exc);
      }
    }

    _onConnectionsChanged();
  }

  /*--------clear--------*/
  function clear() {
    for (const property in widgetsConnection) {
      delete widgetsConnection[property];
    }

    resetSingleMatchingBox();
  }

  /*--------duplicateConnection--------*/
  function duplicateConnection(instanceId, element) {
    widgetsConnection[instanceId] = jQuery.extend(true, {}, widgetsConnection[element.id]);
    widgetsConnection[instanceId].id = instanceId;
    widgetsConnection[instanceId].name = instanceId;
    widgetsConnection[instanceId].instanceId = instanceId;

    _onConnectionsChanged();
  }

  function refreshDatanodeConsumers(newData, dsName, dsStatus, dsLastUpdated) {
    for (const e in widgetsConnection) {
      const widgetConnection = widgetsConnection[e];
      for (const i in widgetConnection.sliders) {
        const slider = widgetConnection.sliders[i];
        if (slider.name != 'None') {
          let actuator = null;
          if (widgetConnection.widgetObjEdit != null) {
            actuator = widgetConnection.widgetObjEdit.getByName(slider.name);
          } else if (widgetConnection.widgetObjConnect != null) {
            actuator = widgetConnection.widgetObjConnect.getByName(slider.name);
          }
          if (actuator != null) {
            if (slider.dataNode === dsName) {
              if (datanodesManager.getDataNodeByName(dsName).type() == 'Python_pyodide_plugin' && i === 'fig') {
                widgetPreview.setDataOnWidget(e, i, actuator, dsName, dsStatus, dsLastUpdated, false); // transfer name instead of value
              } else {
                widgetPreview.setDataOnWidget(e, i, actuator, newData, dsStatus, dsLastUpdated, false);
              }
            } else if (slider.dataNode === 'None') {
            }
          }
        }
      }
    }
    //
  }

  // Public functions
  return {
    widgetsConnection: widgetsConnection,
    updateWidgetsConnections: updateWidgetsConnections,
    effectiveSliders: function () {
      let effSlr = [];
      _.each(_.keys(widgetsConnection), (wdId) => {
        let wdSldrs = _.keys(widgetsConnection[wdId].sliders);
        for (let k = 0; k < wdSldrs.length; k++) {
          if (!_.isEmpty(wdSldrs[k])) {
            effSlr.push(wdSldrs[k]);
          }
        }
      });
      return _.uniq(effSlr);
    },
    resetSingleMatchingBox: resetSingleMatchingBox,
    serialize: serialize,
    deserialize: deserialize,
    clear: clear,
    duplicateConnection: duplicateConnection,
    refreshDatanodeConsumers: refreshDatanodeConsumers,
  };
})();
