// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ widgetsPluginsHandler                                              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function widgetsPluginsHandlerClass() {
  var pluginNames = [];
  var pluginObjects = [];
  var pluginDefinitions = [];
  var widgetToolbarDefinitions = [];
  var plgIndex = 0;

  function loadWidgetPlugin(pluginInstance) {
    var pluginDef = pluginInstance.pluginDefinition;
    pluginDefinitions[plgIndex] = pluginDef;
    pluginNames[plgIndex] = pluginDef.name;
    pluginObjects[plgIndex] = pluginInstance;
    _.each(_.keys(pluginDef.widgetsDefinitionList), (wdc) => {
      widgetToolbarDefinitions[wdc] = pluginDef.widgetsDefinitionList[wdc];
    });
    plgIndex++;
  }

  function getHandlingPlugin(modelJsonIdStr) {
    for (var plg in pluginObjects) {
      var pluginWidgetsList = _.keys(pluginObjects[plg].pluginDefinition.widgetsDefinitionList);
      if (_.contains(pluginWidgetsList, modelJsonIdStr)) {
        return pluginObjects[plg];
      }
    }
  }

  function createWidget(wcIdStr, modelJsonIdStr, instanceId, bInteractive) {
    var pluginObject = getHandlingPlugin(modelJsonIdStr);
    if (!_.isUndefined(pluginObject))
      //AEF: fix bug, must be to be tested if widget doen not exist in current xdash version
      return pluginObject.createWidget(wcIdStr, modelJsonIdStr, instanceId, bInteractive);
    else console.log(modelJsonIdStr + ' does not exist. Create widget failed');
  }

  function copyWidget(wcIdStr, modelJsonIdStr, oldWidgetObj, instanceId, bInteractive) {
    var pluginObject = getHandlingPlugin(modelJsonIdStr);
    if (!_.isUndefined(pluginObject))
      //AEF: fix bug, must be to be tested if widget doen not exist in current xdash version
      return pluginObject.copyWidget(wcIdStr, modelJsonIdStr, oldWidgetObj, instanceId, bInteractive);
    else console.log(modelJsonIdStr + ' does not exist. Copy widget failed');
  }

  return {
    loadWidgetPlugin,
    createWidget,
    copyWidget,
    widgetToolbarDefinitions,
  };
}

var widgetsPluginsHandler = new widgetsPluginsHandlerClass();
