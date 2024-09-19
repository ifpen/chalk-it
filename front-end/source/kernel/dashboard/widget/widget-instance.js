// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ widgetInstanceClass                                                │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI & Mongi BEN GAID                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsTempParams, models } from 'kernel/base/widgets-states';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { editorSingletons } from 'kernel/editor-singletons';

function widgetInstanceClass() {
  /*--------Create Widget obj--------*/
  this.createWidget = function (wcIdStr, modelJsonIdStr, instanceId) {
    //console.log('Instance : createWidget')
    var bInteractive = false;
    var widgetObj = {};

    // Create instance
    if (_.isUndefined(modelsParameters[instanceId])) {
      modelsParameters[instanceId] = jQuery.extend(true, {}, modelsParameters[modelJsonIdStr]);
    } else {
      modelsParameters[instanceId] = { ...modelsParameters[modelJsonIdStr], ...modelsParameters[instanceId] };
    }
    if (_.isUndefined(models[instanceId])) {
      models[instanceId] = jQuery.extend(true, {}, models[modelJsonIdStr]);
    }
    if (_.isUndefined(modelsHiddenParams[instanceId])) {
      modelsHiddenParams[instanceId] = jQuery.extend(true, {}, modelsHiddenParams[modelJsonIdStr]);
    }
    if (_.isUndefined(modelsTempParams[instanceId])) {
      modelsTempParams[instanceId] = jQuery.extend(true, {}, modelsTempParams[modelJsonIdStr]);
    }

    widgetObj = new widgetsPluginsHandler.createWidget(wcIdStr, modelJsonIdStr, instanceId, bInteractive);

    return widgetObj;
  };

  /*--------Delete Widget--------*/
  this.deleteWidget = function (element) {
    delete widgetConnector.widgetsConnection[element.id]; // delete connection

    // set editor json
    const elm = element.parentNode;
    if (elm) {
      const widgetEditor = editorSingletons.widgetEditor;
      while (elm.hasChildNodes()) {
        elm.removeChild(elm.lastChild);
      }
      if (elm.parentNode) {
        elm.parentNode.removeChild(elm);
      }
      delete widgetEditor.widgetObject[element.id];

      for (let i = widgetEditor.modelsId.length - 1; i >= 0; i--) {
        if (widgetEditor.modelsId[i] === element.id) {
          widgetEditor.modelsId.splice(i, 1);
          break; // found and deleted
        }
      }

      delete widgetEditor.widthRatioModels[element.id];
      delete widgetEditor.heightRatioModels[element.id];
      delete widgetEditor.leftRatioModels[element.id];
      delete widgetEditor.topRatioModels[element.id];

      widgetEditor.widgetContainers.delete(element.id);
    }

    // delete instance
    const instanceId = element.id;
    if (!_.isUndefined(modelsParameters[instanceId])) {
      delete modelsParameters[instanceId];
    }
    if (!_.isUndefined(models[instanceId])) {
      delete models[instanceId];
    }
    if (!_.isUndefined(modelsHiddenParams[instanceId])) {
      delete modelsHiddenParams[instanceId];
    }
    if (!_.isUndefined(modelsTempParams[instanceId])) {
      delete modelsTempParams[instanceId];
    }
  };
}

export const widgetInstance = new widgetInstanceClass();
