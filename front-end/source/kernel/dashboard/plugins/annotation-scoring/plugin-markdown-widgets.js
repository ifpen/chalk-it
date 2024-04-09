﻿// ┌────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                            │ \\
// ├────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                                │ \\
// | Licensed under the Apache License, Version 2.0                             │ \\
// ├────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Ghiles HIDEUR, Guillaume CORBELIN, Tristan BARTEMENT │ \\
// └────────────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.annotationMarkdown = {
    "text": ""
};

// Parameters
modelsParameters.annotationMarkdown = {
    "fontsize": 0.3,
    "backgroundColor": 'rgba(0, 0, 0, 0)',
    "textColor": "var(--widget-color)",
    "valueFontFamily": "var(--widget-font-family)",
    "textAlign": "left",
    "displayBorder": false,
    "centerVertically": true
};

// Layout (default dimensions)
modelsLayout.annotationMarkdown = { 'height': '30vh', 'width': '30vw', 'minWidth': '50px', 'minHeight': '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function annotationMarkdownWidgetsPluginClass() {

    this.markdownAnnotationWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
        var self = this;

        if (_.isUndefined(modelsParameters[idInstance].textAlign)) modelsHiddenParams[idInstance].textAlign = "left"; // fix old projects

        this.enable = function () { };

        this.disable = function () { };

        this.rescale = function () {
            this.render();
        };

        if (_.isUndefined(modelsParameters[idInstance].centerVertically)) {
            modelsParameters[idInstance].centerVertically = true;
        }

        this.hasScrollBar = function (element) {
            return element.get(0).scrollHeight > element.get(0).clientHeight;
        }

        this.render = function () {
            var widgetHtml = document.createElement('div');
            var styleCenterVertically = "";

            var divContent = '<div id="annotationMarkdownDiv' + idWidget +
                '" class="defaultCSS" style="overflow: auto; background-color: transparent; ' +
                'box-shadow: none; width: inherit; height: inherit; ' +
                'color:' + modelsParameters[idInstance].textColor +
                '; text-align: ' + modelsParameters[idInstance].textAlign +
                '; padding: 4px; resize: inherit; border-radius: 6px; ' +
                this.fontSize() + this.valueFontFamily() + this.border() + '">' +
                '<div style="' + styleCenterVertically + '">' +
                marked.parse(modelsHiddenParams[idInstance].text) +
                '</div></div>';

            widgetHtml.innerHTML = divContent;
            widgetHtml.setAttribute("style", "width: inherit; height: inherit; background-color:" + modelsParameters[idInstance].backgroundColor);
            $("#" + idDivContainer).html(widgetHtml);

            var hasScrollBar = self.hasScrollBar($('#annotationMarkdownDiv' + idWidget));
            if (modelsParameters[idInstance].centerVertically && !hasScrollBar) {
                styleCenterVertically = " position: relative; top: 50%; -webkit-transform: translateY(-50%); -ms-transform: translateY(-50%); transform: translateY(-50%);";
                $('#annotationMarkdownDiv' + idWidget + ' div').attr("style", styleCenterVertically);
            }
        };

        const _TEXT_DESCRIPTOR = new WidgetActuatorDescription("text", "Markdown content", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_STRING);
        this.getActuatorDescriptions = function () {
            return [_TEXT_DESCRIPTOR];
        };

        this.text = {
            setValue: function (val) {
                modelsHiddenParams[idInstance].text = val;
                self.render();
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].text;
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
    this.markdownAnnotationWidget.prototype = baseWidget.prototype;

    // Plugin definition
    this.pluginDefinition = {
        'name': 'annotation',
        'widgetsDefinitionList': {
            annotationMarkdown: { factory: "markdownAnnotationWidget", title: "Markdown", icn: "markdown", help: "wdg/wdg-annotation-video/#markdown" }
        },
    };

    this.constructor();
}

// Inherit from basePlugin class
annotationMarkdownWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var annotationMarkdownWidgetsPlugin = new annotationMarkdownWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(annotationMarkdownWidgetsPlugin);