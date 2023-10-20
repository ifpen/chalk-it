// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Mongi BEN GAID, Tristan BARTEMENT,     │ \\
// │                      Guillaume CORBELIN                                     │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.flatUiDoubleSlider = { "minValue": 25, "maxValue": 75 };

// Parameters
modelsParameters.flatUiDoubleSlider = {
    label: "labelText",
    displayLabel: true,
    labelFontSize: 0.5,
    labelColor: "var(--widget-label-color)",
    labelWidthProportion: "30%",
    minRange: 0,
    maxRange: 100,
    step: 0.1,
    precision: 2,
    enforceStep: false,
    disableAnimation: false,
    rangeActuator: false,
    forceValuesToMinAndMax: false,
    sliderSegmentColor: "var(--widget-segment-color)",
    sliderRangeColor: "var(--widget-range-color)",
    sliderHandleDefaultColor:"var(--widget-handle-default-color)",
    sliderHandleHoverColor: "var(--widget-handle-hover-color)",
    sliderHandleActiveColor: "var(--widget-handle-active-color)",
};

// Layout (default dimensions)
modelsLayout.flatUiDoubleSlider = { 'height': '8vh', 'width': '24vw', 'minWidth': '200px', 'minHeight': '24px' };


/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function doubleSliderWidgetsPluginClass() {

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                      Double Slider Widget                          | \\
    // | From : https://github.com/angular-slider/angularjs-slider          |
    // ├────────────────────────────────────────────────────────────────────┤ \\
    this.doubleSliderFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

        var self = this;

        this.enable = function () { };

        this.disable = function () { };

        this.getCleanedOptions = function (modelParams) {
            return { //minRange & maxRange cause bugs and should not be transmitted
                floor: modelParams.minRange,
                ceil: modelParams.maxRange,
                step: modelParams.step,
                precision: modelParams.precision,
                enforceStep: modelParams.enforceStep,
                disableAnimation: modelParams.disableAnimation,
                onEnd: modelParams.onEnd
            }
        };

        this.updateMinValue = function () {
            if (self.bIsInteractive) {
                self.minValue.updateCallback(self.minValue, self.minValue.getValue());
                modelsHiddenParams[idInstance].minValue = self.minValue.getValue();
            }
        }

        this.updateMaxValue = function () {
            if (self.bIsInteractive) {
                self.maxValue.updateCallback(self.maxValue, self.maxValue.getValue());
                modelsHiddenParams[idInstance].maxValue = self.maxValue.getValue();
            }
        }

        this.rescale = function () {
            this.render();
        };

        this.render = function () {

            var widgetHtml = document.createElement('div');
            widgetHtml.setAttribute("style", 'display: table; height: inherit; width: inherit; cursor: inherit');
            widgetHtml.setAttribute("id", "div-for-ng-slider" + idWidget);
            $("#" + idDivContainer).html(widgetHtml);
            var sliderSize = Math.min($("#div-for-ng-slider" + idWidget).width(), $("#div-for-ng-slider" + idWidget).height());

            var modelObjParams = "sliderValues.params_" + idInstance;
            var modelObjValues = "sliderValues.values_" + idInstance;
            var widgetWithLabel = "";
            var labelProportion = "30%";
            var labelText = "labelText";
            var rzsliderHtml =
                '<div>' +
                //'style="padding-top:' + ((sliderSize / 2) - 35) + 'px">' +
                '<rzslider id="ng-slider' + idWidget + '" ng-click="changeValue()"' +
                ' rz-slider-model="' + modelObjValues + '.minValue' + '" ' +
                ' rz-slider-high="' + modelObjValues + '.maxValue' + '" ' +
                ' rz-slider-options="getModel(' + modelObjParams + ')" >' +
                '</rzslider>' +
                '</div>';
            var LabelHtml = "",
                fontSize = "calc(7px + 0.5vw + 0.4vh)";


            if (modelsParameters[idInstance].displayLabel == true) {
                if (!_.isUndefined(modelsParameters[idInstance].label)) {
                    // conversion to enable HTML tags
                    labelText = this.getTransformedText("label");
                }
                if (!_.isUndefined(modelsParameters[idInstance].labelWidthProportion)) {
                    labelProportion = modelsParameters[idInstance].labelWidthProportion;
                }
                if (!_.isUndefined(modelsParameters[idInstance].labelFontSize)) {
                    fontSize = this.labelFontSize();
                }
                LabelHtml = '<span class="label-h-slider" id="h-slider-span" style="heigh: auto; width:' + labelProportion +
                    '; ' + fontSize + this.labelColor() + this.labelFontFamily() + ';">' + labelText + '</span>';
            }
            var divContent = angular.element(
                LabelHtml +
                '<div style="display: table-cell; vertical-align: middle; padding-bottom: 18px;"> ' +
                rzsliderHtml +
                '</div>'
            );

            modelsParameters[idInstance].onEnd = function (arg1, min, max, caller) {
                if (caller == "max")
                    self.updateMaxValue();
                if (caller == "min")
                    self.updateMinValue();
            }
            var target = document.getElementById("div-for-ng-slider" + idWidget);
            angular.element(target).append(divContent);
            angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                var scope = angular.element(divContent).scope();
                if (!$rootScope.sliderValues) {
                    $rootScope.sliderValues = {};
                }

                $rootScope.sliderValues["values_" + idInstance] = {
                    minValue: modelsHiddenParams[idInstance].minValue,
                    maxValue: modelsHiddenParams[idInstance].maxValue
                };

                $rootScope.getModel = function (options) {
                    var modelC = angular.copy(options);
                    if (self.bIsInteractive) {
                        if (!_.isUndefined(modelC.minRange)) {
                            modelC.floor = modelC.minRange;
                        }
                        if (!_.isUndefined(modelC.maxRange)) {
                            modelC.ceil = modelC.maxRange;
                        }
                    } else {
                        modelC.ceil = modelC.maxRange;
                        modelC.floor = modelC.minRange;
                        modelC.readOnly = true;
                    }
                    return modelC;
                };

                $rootScope.changeValue = function () { }

                $rootScope.sliderValues["params_" + idInstance] = self.getCleanedOptions(modelsParameters[idInstance]);
                $compile(divContent)(scope);
            }]);

            document.styleSheets[0].addRule('#ng-slider' + idWidget + ' > .rz-bar-wrapper > .rz-bar', this.sliderSegmentColor());
            document.styleSheets[0].addRule('#ng-slider' + idWidget + ' > .rz-bar-wrapper > .rz-selection', this.sliderRangeColor());
            document.styleSheets[0].addRule('#ng-slider' + idWidget + ' > .rz-pointer', this.sliderHandleDefaultColor());
            document.styleSheets[0].addRule('#ng-slider' + idWidget + ' > .rz-pointer:hover', this.sliderHandleHoverColor());
            document.styleSheets[0].addRule('#ng-slider' + idWidget + ' > .rz-pointer:active', this.sliderHandleActiveColor());
        };

        const _MINVALUE_DESCRIPTOR = new WidgetActuatorDescription("minValue", "Selected minimum value", WidgetActuatorDescription.READ_WRITE, WidgetPrototypesManager.SCHEMA_NUMBER);
        const _MAXVALUE_DESCRIPTOR = new WidgetActuatorDescription("maxValue", "Selected maximum value", WidgetActuatorDescription.READ_WRITE, WidgetPrototypesManager.SCHEMA_NUMBER);

        const _MINRANGE_DESCRIPTOR = new WidgetActuatorDescription("minRange", "Minimum allowed value", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_NUMBER);
        const _MAXRANGE_DESCRIPTOR = new WidgetActuatorDescription("maxRange", "Maximum allowed value", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_NUMBER);

        this.getActuatorDescriptions = function (model = undefined) {
            const data = model || modelsParameters[idInstance];
            const result = [_MINVALUE_DESCRIPTOR, _MAXVALUE_DESCRIPTOR];

            if (data && data.rangeActuator) {
                result.push(_MINRANGE_DESCRIPTOR);
                result.push(_MAXRANGE_DESCRIPTOR);
            }

            return result;
        };


        this.minValue = {
            updateCallback: function () { },
            setValue: function (valArg) {
                var val = Number(valArg);
                if (!typeof (val) === 'number') {
                    return;
                }
                modelsHiddenParams[idInstance].minValue = val;
                angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                    $rootScope.sliderValues["values_" + idInstance]['minValue'] = val;
                    $rootScope.safeApply();
                }]);
            },
            getValue: function () {
                var val = 0;
                angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                    val = $rootScope.sliderValues["values_" + idInstance].minValue;
                }]);
                return val;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            },
            setCaption: function (caption, bCaptionManuallyChanged) {},
            clearCaption: function () {
                modelsParameters[idInstance].label = "";
                self.render();
            }
        };

        this.maxValue = {
            updateCallback: function () { },
            setValue: function (valArg) {
                var val = Number(valArg);
                if (!typeof (val) === 'number') {
                    return;
                }
                modelsHiddenParams[idInstance].maxValue = val;
                angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                    $rootScope.sliderValues["values_" + idInstance]['maxValue'] = val;
                    $rootScope.safeApply();
                }]);
            },
            getValue: function () {
                var val;
                angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                    val = $rootScope.sliderValues["values_" + idInstance].maxValue;
                }]);
                return val;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            },
            setCaption: function (caption, bCaptionManuallyChanged) { },
            clearCaption: function () {
                modelsParameters[idInstance].label = "";
                self.render();
            }
        };

        self.maxRange = {
            updateCallback: function () { },
            setValue: function (valArg) {
                var val = Number(valArg);
                if (!typeof (val) === 'number') {
                    return;
                }
                modelsParameters[idInstance].maxRange = val;
                angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                    $rootScope.sliderValues["params_" + idInstance] = self.getCleanedOptions(modelsParameters[idInstance]);
                    $rootScope.safeApply();
                }]);
                if (modelsParameters[idInstance].forceValuesToMinAndMax) {
                    self.maxValue.setValue(modelsParameters[idInstance].maxRange);
                    self.updateMaxValue();
                    //widgetPreview.updateDataFromWidget(self.maxValue, modelsParameters[idInstance].maxRange); // MBG : dirty but only solution right now
                }
            },
            getValue: function () {
                var val;
                angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                    val = modelsParameters[idInstance].maxRange;
                }]);
                return val;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            }
        };

        self.minRange = {
            updateCallback: function () { },
            setValue: function (valArg) {
                var val = Number(valArg);
                if (!typeof (val) === 'number') {
                    return;
                }
                modelsParameters[idInstance].minRange = val;
                angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                    $rootScope.sliderValues["params_" + idInstance] = self.getCleanedOptions(modelsParameters[idInstance]);
                    $rootScope.safeApply();
                }]);
                if (modelsParameters[idInstance].forceValuesToMinAndMax) {
                    self.minValue.setValue(modelsParameters[idInstance].minRange);
                    self.updateMinValue();
                    //widgetPreview.updateDataFromWidget(self.minValue, modelsParameters[idInstance].minRange); // MBG : dirty but only solution right now
                }
            },
            getValue: function () {
                var val;
                angular.element(document.body).injector().invoke(['$compile', '$rootScope', function ($compile, $rootScope) {
                    val = modelsParameters[idInstance].minRange;
                }]);
                return val;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            }
        };

        self.render();
    }

    // Inherit from baseWidget class
    this.doubleSliderFlatUiWidget.prototype = baseWidget.prototype;

    // Plugin definition
    this.pluginDefinition = {
        'name': 'flatUiDoubleSlider',
        'widgetsDefinitionList': {
            flatUiDoubleSlider: { factory: "doubleSliderFlatUiWidget", title: "Double slider", icn: "double-slider", help: "wdg/wdg-basics/#double-slider" }
        },
    };

    this.constructor();

}

// Inherit from basePlugin class
doubleSliderWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var doubleSliderWidgetsPlugin = new doubleSliderWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(doubleSliderWidgetsPlugin);