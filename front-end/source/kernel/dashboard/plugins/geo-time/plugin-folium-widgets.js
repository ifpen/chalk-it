﻿// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2023 IFPEN                                             │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) :  Mongi BEN GAID                                        │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.foliumMaps = {
    map : ""
};

// Parameters
modelsParameters.foliumMaps = {
    backgroundColor : 'rgba(0, 0, 0, 0)'
};

// Layout (default dimensions)
modelsLayout.foliumMaps = { 'height': '30vh', 'width': '30vw', 'minWidth': '50px', 'minHeight': '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function foliumWidgetPluginClass() {

    this.foliumMapWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
        var self = this;

        this.enable = function () { };

        this.disable = function () { };

        this.rescale = function () {
            this.render();
        };


        this.hasScrollBar = function (element) {
            return element.get(0).scrollHeight > element.get(0).clientHeight;
        }

        this.render = function () {
            let foliumDiv = document.createElement('div');
            let wId = 'folium-map' + idWidget;
            if (bInteractive) wId = wId + 'c';
            foliumDiv.setAttribute('id', wId);
            

            if (modelsHiddenParams[idInstance].map) {

                foliumDiv.innerHTML = modelsHiddenParams[idInstance].map;

                try {
                    // Cleaning folium wrappers originally for Jupyter notebooks
                    div1 = foliumDiv.firstElementChild;
                    if (div1.tagName == 'DIV') {
                        div1.style.height = '100%';
                        div2 = div1.firstElementChild;
                        if (div2.tagName == 'DIV') {
                            div2.style.height = '100%';
                            div2.style['padding-bottom'] = null;
                            div3 = div2.firstElementChild;
                            if (div3.tagName == 'DIV') {
                                div3.style.height = '100%';
                            }
                        }
                    }
                }
                catch (ex) {
                    console.log(ex);
                }
            }
            foliumDiv.setAttribute("style", "width: inherit; height: inherit; background-color:" + modelsParameters[idInstance].backgroundColor);
            $("#" + idDivContainer).html(foliumDiv);


        };

        const _REPR_HTML_DESCRIPTOR = new WidgetActuatorDescription("_repr_html_", "Folium Map _repr_html_", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_STRING);
        this.getActuatorDescriptions = function () {
            return [_REPR_HTML_DESCRIPTOR];
        };

        this._repr_html_ = {
            setValue: function (val) {
                modelsHiddenParams[idInstance].map = val;
                self.render();
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].map;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            }
        };

        self.render();
    };

    // Inherit from baseWidget class
    this.foliumMapWidget.prototype = baseWidget.prototype;

    // Plugin definition
    this.pluginDefinition = {
        'name': 'Maps',
        'widgetsDefinitionList': {
            foliumMaps: { factory: "foliumMapWidget", title: "Folium Map", icn: "folium", help: "" }
        },
    };

    this.constructor();
}

// Inherit from basePlugin class
foliumWidgetPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var foliumWidgetPlugin = new foliumWidgetPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(foliumWidgetPlugin);