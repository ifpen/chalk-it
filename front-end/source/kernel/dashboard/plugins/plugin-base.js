// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ Widget base                                                           │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                     │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\



// +--------------------------------------------------------------------¦ \\
// |                           Plugin base                              | \\
// +--------------------------------------------------------------------¦ \\
function basePlugin(pluginDefinition = undefined) {
    if(pluginDefinition) {
        this.pluginDefinition = pluginDefinition;
        // The alternative is legacy behavior and relies on the subclass having defined pluginDefinition before calling the parent constructor.
    }

    this.widgetsCount = {};

    Object.keys(this.pluginDefinition.widgetsDefinitionList).forEach((widgetId) => this.widgetsCount[widgetId] = 0);

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                      createWidget (public)                         | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    this.createWidget = function (idDivContainer, typeWidget, idInstance, bInteractive) {
        this.widgetsCount[typeWidget]++;

        const factoryDef = this.pluginDefinition.widgetsDefinitionList[typeWidget]["factory"];
        const factory = typeof factoryDef === "function" ? factoryDef : this[factoryDef];
        const wdg = new factory(idDivContainer, this.widgetsCount[typeWidget], idInstance, bInteractive)
        return wdg;
    };

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                       copyWidget (public)                          | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    this.copyWidget = function (wcIdStr, modelJsonIdStr, oldWidgetObj, instanceId, bInteractive) {
        return this.createWidget(wcIdStr, modelJsonIdStr, instanceId, bInteractive);
    };

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                         clear (public)                             | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    this.clear = function () {
        Object.keys(this.pluginDefinition.widgetsDefinitionList).forEach((widgetId) => this.widgetsCount[widgetId] = 0);
    }
}