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

// TODO coords remove ?
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
}

export const widgetInstance = new widgetInstanceClass();
