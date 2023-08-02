// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │                                                                       │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir El FEKI, Tristan BARTEMENT, │ \\
// │                      Guillaume CORBELIN                               │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\


/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.flatUiCheckbox = { "value": false };
modelsHiddenParams.flatUiSwitch = { "value": false };

// Parameters
modelsParameters.flatUiCheckbox = {
    "label": "labelText",
    "inheritLabelFromData": true,
    "displayLabel": true,
    "labelFontSize": 0.5,
    "labelColor": "var(--widget-label-color)",
    "labelFontFamily": "var(--widget-font-family)",
    "checkboxSize": 1,
    "checkedColor": "var(--widget-input-checked-color)",
    "uncheckedColor": "var(--widget-input-unchecked-color)"
};
modelsParameters.flatUiSwitch = {
    "label": "labelText",
    "inheritLabelFromData": true,
    "displayLabel": true,
    "labelFontSize": 0.5,
    "labelColor": "var(--widget-label-color)",
    "labelFontFamily": "var(--widget-font-family)",
    "switchWidthProportion": '30%',
    "switchOnColor": "var(--widget-input-checked-color)",
    "switchOffColor": "var(--widget-input-unchecked-color)"
};

// Layout
modelsLayout.flatUiCheckbox = { 'height': '5vh', 'width': '9vw', 'minWidth': '32px', 'minHeight': '24px' };
modelsLayout.flatUiSwitch = { 'height': '5vh', 'width': '10vw', 'minWidth': '50px', 'minHeight': '24px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function flatUiBooleanWidgetsPluginClass() {

    // +--------------------------------------------------------------------¦ \\
    // |                            Checkbox                                | \\
    // +--------------------------------------------------------------------¦ \\
    this.checkboxFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

        var self = this;

        this.enable = function () {
            $("#checkbox" + idWidget).off('click').on("click", function (e, ui) {
                self.value.updateCallback(self.value, self.value.getValue());
            });
            $("#checkbox" + idWidget).radiocheck('enable');
        };

        this.disable = function () {
            $("#checkbox" + idWidget).unbind("click");
            $("#checkbox" + idWidget).radiocheck('disable');
        };

        this.rescale = function () {
            this.render();
        };

        this.render = function () {
            //AEF
            var checkboxHeight = 20; // default value in class icons of flatui
            var checkboxWidth = 20; // default value in class icons of flatui
            if (!_.isNull($(".icons").height())) {
                checkboxHeight = $(".icons").height();
            }
            if (!_.isNull($(".icons").width())) {
                checkboxWidth = $(".icons").width();
            }
            var padding = modelsParameters[idInstance].checkboxSize * checkboxWidth + 12;
            var lineHeight = modelsParameters[idInstance].checkboxSize * checkboxHeight;
            //
            var divContent = '';
            var widgetHtml = document.createElement('div');
            var divContainerHeightPx = $('#' + idDivContainer).height(); // in px
            if (modelsParameters[idInstance].label != "" && modelsParameters[idInstance].displayLabel) { //ABK
                // conversion to enable HTML tags
                const labelText = this.getTransformedText("label");

                divContent = '<label class="checkbox" id="label' + idWidget +
                    '" style="cursor: inherit; display: flex; align-items: center; margin:auto; ' +
                    this.labelFontSize() + this.labelColor() +
                    this.labelFontFamily() + '; padding-left: ' +
                    padding + 'px; line-height:' + lineHeight + 'px; " for="checkbox' + idWidget + '">' +
                    '<input type="checkbox" class="nohover" data-toggle="radio" style="zoom:' + modelsParameters[idInstance].checkboxSize +
                    '" value="" id="checkbox' + idWidget +
                    '" disabled></input>' +
                    labelText + '</label>';
            } else {
                divContent = '<label class="checkbox" id="label' + idWidget +
                    '" style="cursor: inherit; display: flex; align-items: center; margin: auto;" for="checkbox' +
                    idWidget + '"><input type="checkbox" class="nohover" data-toggle="radio" style="zoom:' + modelsParameters[idInstance].checkboxSize +
                    ' value="" id="checkbox' +
                    idWidget + '" disabled></input></label>';
            }
            widgetHtml.innerHTML = divContent;
            $("#" + idDivContainer).html(widgetHtml);

            //
            var labelHeight = checkboxHeight * modelsParameters[idInstance].checkboxSize;
            //divMarginTop = (divContainerHeightPx - labelHeight) / 2;
            widgetHtml.setAttribute("style",
                //'padding-top: ' + divMarginTop + 'px; ' +
                'width: inherit; cursor: inherit; display: flex; justify-content: center; align-items: center;');
            //

            $('[data-toggle="checkbox"]').radiocheck();
            $('[data-toggle="radio"]').radiocheck();

            //
            if (modelsHiddenParams[idInstance].value == true) {
                $("#checkbox" + idWidget).radiocheck('check');
            } else if (modelsHiddenParams[idInstance].value == false) {
                $("#checkbox" + idWidget).radiocheck('uncheck');
            }

            document.styleSheets[0].addRule('#label' + idWidget + ' .icons *' , 'zoom: ' + modelsParameters[idInstance].checkboxSize);
            document.styleSheets[0].addRule('#label' + idWidget + ' .icons .icon-checked' , this.checkedColor());
            document.styleSheets[0].addRule('#label' + idWidget + ' .icons .icon-unchecked' , this.uncheckedColor());

            if (this.bIsInteractive) {
                self.enable();
            } else {
                self.disable();
            }
        };

        const _VALUE_DESCRIPTOR = new WidgetActuatorDescription("value", "Current value", WidgetActuatorDescription.READ_WRITE, WidgetPrototypesManager.SCHEMA_BOOLEAN);
        this.getActuatorDescriptions = function () {
            return [_VALUE_DESCRIPTOR];
        };

        this.value = {
            updateCallback: function () { },
            setValue: function (val) {
                modelsHiddenParams[idInstance].value = val;
                $("#checkbox" + idWidget)[0].checked = val;
            },
            getValue: function () {
                return $("#checkbox" + idWidget)[0].checked; // or modelsHiddenParams[idInstance].value ?
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            },
            setCaption: function (caption, bCaptionManuallyChanged) {
                if (modelsParameters[idInstance].inheritLabelFromData) {
                    self.captionHelper(caption, self.bIsInteractive, bCaptionManuallyChanged);
                    self.render();
                }
            },
            clearCaption: function () {
                modelsParameters[idInstance].label = "";
                self.render();
            }
        };

        self.render();
    }

    // Inherit from baseWidget class
    this.checkboxFlatUiWidget.prototype = baseWidget.prototype;

    // +--------------------------------------------------------------------¦ \\
    // |                             Switch                                 | \\
    // +--------------------------------------------------------------------¦ \\
    this.switchFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
        var self = this;

        this.enable = function (updateDataFromWidget) {
            $("#switch" + idWidget).on("click", function (e, ui) {
                self.value.updateCallback(self.value, self.value.getValue());
                if ($("#switch" + idWidget)[0].checked) { //ABK
                    var divSwithHeightPx = $("#switch-label" + idWidget).height();
                    var divContainerWidthPx = $('#' + idDivContainer).width();
                    var size = Math.min(divContainerWidthPx, divSwithHeightPx) - 8;
                    var size2 = $('#slide' + idWidget).width() - size - 8;
                    document.styleSheets[0].addRule('#slide' + idWidget +
                        ':before', 'transform: translateX(' + size2 + 'px);');
                } else {
                    document.styleSheets[0].addRule('#slide' + idWidget +
                        ':before', 'transform: translateX(0px);');
                }
            });
            $("#switch" + idWidget).prop("disabled", false);
        }

        this.disable = function () {
            $("#switch" + idWidget).unbind("click");
            $("#switch" + idWidget).prop("disabled", true);
        };

        this.updateSwitchStatus = function () {
            if (modelsHiddenParams[idInstance].value == true) {
                if (!$("#switch" + idWidget)[0].checked) {
                    $("#switch" + idWidget).prop("checked", true);
                    var divSwithHeightPx = $("#switch-label" + idWidget).height();
                    var divContainerWidthPx = $('#' + idDivContainer).width();
                    var size = Math.min(divContainerWidthPx, divSwithHeightPx) - 8;
                    var size2 = $('#slide' + idWidget).width() - size - 8;
                    document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(' + size2 + 'px);');
                    document.styleSheets[0].addRule('input:checked + #slide' + idWidget , this.switchOnColor());
                    document.styleSheets[0].addRule('input:focus + #slide' + idWidget , this.switchOnColor());
                }
            } else if (modelsHiddenParams[idInstance].value == false) {
                if ($("#switch" + idWidget)[0].checked) {
                    $("#switch" + idWidget).prop("checked", false);
                    document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(0px);');
                }
            }
        };

        this.rescale = function () {
            this.render();
        };

        this.render = function () {
            var coeff = 1;

            if (!_.isUndefined(modelsParameters[idInstance].switchWidthProportion)) {
                coeff = Math.min(1, parseFloat(modelsParameters[idInstance].switchWidthProportion) / 100);
            }
            var divContainerHeightPx = $('#' + idDivContainer).height();
            //$('#' + idDivContainer)[0].style.minHeight = divContainerHeightPx + 'px';

            var divSwitchHeightPx = Math.min(divContainerHeightPx, 260); //maxHeight
            divSwitchHeightPx = Math.min(divSwitchHeightPx, coeff * $('#' + idDivContainer).width() / 3); //keepRatio
            //divSwitchHeightPx = Math.max(divSwitchHeightPx, parseFloat($('#' + idDivContainer)[0].style.minHeight)); //minHeight
            divSwitchHeightPx = Math.ceil(divSwitchHeightPx); // in px

            var divContainerWidthPx = $('#' + idDivContainer).width();
            var widgetHtml = document.createElement('div');
            widgetHtml.setAttribute('id', 'switch-widget-html' + idWidget);
            widgetHtml.setAttribute('class', 'switch-widget-html');
            var divContent;
            if (!_.isUndefined(modelsParameters[idInstance].switchWidthProportion)) {
                var proportion = Math.min(100, parseFloat(modelsParameters[idInstance].switchWidthProportion)) + "%";
                divContent = '<div class="switch-div" style="width: ' + proportion + ';">';
            } else {
                divContent = '<div class="switch-div" style="width: 100%;">';
            }
            var cursorSwitch = '';
            if (this.bIsInteractive) {
                cursorSwitch = 'cursor: pointer;';
            } else {
                cursorSwitch = 'cursor: inherit;';
            }
            divContent = divContent + '<label id="switch-label' + idWidget + '" class="switch-label" style="height:' + divSwitchHeightPx + 'px;">';
            divContent = divContent + '<input type="checkbox" id="switch' + idWidget + '">';
            divContent = divContent + '<div id="slide' + idWidget + '"class="slider round" style="' + cursorSwitch + '">';
            divContent = divContent + '</div>';
            divContent = divContent + '</label>';
            divContent = divContent + '</div>';
            if (modelsParameters[idInstance].label != "" && modelsParameters[idInstance].displayLabel) {
                // conversion to enable HTML tags
                const labelText = this.getTransformedText("label");

                divContent = divContent + '<span id="switch-span' + idWidget +
                    '" class="switch-span" style="' + this.labelFontSize() + this.labelColor() + this.labelFontFamily() + '">' +
                    labelText + '</span>';
            }
            widgetHtml.innerHTML = divContent;
            $("#" + idDivContainer).html(widgetHtml);

            widgetHtml.setAttribute('style', 'height: ' + divContainerHeightPx + 'px;');

            document.styleSheets[0].addRule('input + #slide' + idWidget , this.switchOffColor());
            document.styleSheets[0].addRule('input:checked + #slide' + idWidget , this.switchOnColor());
            document.styleSheets[0].addRule('input:focus + #slide' + idWidget , this.switchShadowColor());

            //resize the cercle
            var size = Math.min(divContainerWidthPx, divSwitchHeightPx) - 8;
            document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'width: ' + size + 'px;');
            document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'height: ' + size + 'px;');

            if (modelsHiddenParams[idInstance].value == null) {
                modelsHiddenParams[idInstance].value = false;
            }

            if (modelsHiddenParams[idInstance].value == true) {
                $("#switch" + idWidget).prop("checked", true);
                var size2 = $('#slide' + idWidget).width() - size - 8;
                document.styleSheets[0].addRule('#slide' + idWidget +
                    ':before', 'transform: translateX(' + size2 + 'px);');
            } else if (modelsHiddenParams[idInstance].value == false) {
                $("#switch" + idWidget).prop("checked", false);
                document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(0px);');
            }

            if (this.bIsInteractive) {
                self.enable();
            } else {
                self.disable();
            }

            $("#switch" + idWidget)[0].checked = modelsHiddenParams[idInstance].value;
        };

        const _VALUE_DESCRIPTOR = new WidgetActuatorDescription("value", "Current value", WidgetActuatorDescription.READ_WRITE, WidgetPrototypesManager.SCHEMA_BOOLEAN);
        this.getActuatorDescriptions = function () {
            return [_VALUE_DESCRIPTOR];
        };

        this.value = {
            updateCallback: function () { },
            setValue: function (val) {
                modelsHiddenParams[idInstance].value = val;
                self.updateSwitchStatus();
            },
            getValue: function () {
                return $("#switch" + idWidget)[0].checked; // or modelsHiddenParams[idInstance].value ?
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                //self.enable(); // tmp fix for RDR & Real-e
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                //self.disable(); // tmp fix for RDR & Real-e
            },
            setCaption: function (caption, bCaptionManuallyChanged) {
                if (modelsParameters[idInstance].inheritLabelFromData) {
                    self.captionHelper(caption, self.bIsInteractive, bCaptionManuallyChanged);
                    self.render();
                }
            },
            clearCaption: function () {
                modelsParameters[idInstance].label = "";
                self.render();
            }
        };

        self.render();
    }

    // Inherit from baseWidget class
    this.switchFlatUiWidget.prototype = baseWidget.prototype;

    // Plugin definition
    this.pluginDefinition = {
        'name': 'flatUiBoolean',
        'widgetsDefinitionList': {
            flatUiCheckbox: { factory: "checkboxFlatUiWidget", title: "Checkbox", icn: "checkbox", help: "wdg/wdg-basics/#checkbox" },
            flatUiSwitch: { factory: "switchFlatUiWidget", title: "Switch", icn: "switch", help: "wdg/wdg-basics/#switch" }
        },
    };

    this.constructor();
}

// Inherit from basePlugin class
flatUiBooleanWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var flatUiBooleanWidgetsPlugin = new flatUiBooleanWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(flatUiBooleanWidgetsPlugin);