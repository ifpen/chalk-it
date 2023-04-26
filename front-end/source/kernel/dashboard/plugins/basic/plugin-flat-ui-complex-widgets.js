// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir El FEKI, Ghiles HIDEUR   │ \\
// │ Tristan BARTEMENT, Guillaume CORBELIN                              │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.flatUiSelect = { "values": [], "keys": [], "value": [], "selectedValue": "" };
modelsHiddenParams.flatUiMultiSelect = { "value": [], "selectedValue": "" };
modelsHiddenParams.flatUiList = { "value": [], "selectedValue": "" };
modelsHiddenParams.flatUiTable = { "value": null };


// Parameters
modelsParameters.flatUiSelect = {
    "label": "labelText",
    "inheritLabelFromData": true,
    "displayLabel": true,
    "labelFontSize": 0.5,
    "labelColor": "var(--widget-label-color)",
    "labelFontFamily": "var(--widget-font-family)",
    "selectWidthProportion": "70%",
    "isNumber": false,
    "selectValueFontSize": 0.5,
    "selectedValueColor": "var(--widget-select-option-highlighted-text)",
    "selectedItemDefaultColor": "var(--widget-select-option-highlighted-color)",
    "selectedItemHoverColor": "var(--widget-select-option-highlighted-color)",
    "isKeyValuePairs": false,
};
modelsParameters.flatUiMultiSelect = {
    "addControls": false,
    "valueFontSize": 0.4,
    "valueFontFamily": "var(--widget-font-family)",
    "checkboxWidth": 7,
    "checkboxHeight": 1.5,
    "valueDefaultColor": "var(--widget-label-color)",
    "checkboxDefaultColor": "var(--widget-multiselect-color)",
    "checkboxBorderColor": "var(--widget-multiselect-border-color)",
    "valueHoverColor": "var(--widget-multiselect-hover-text)",
    "checkboxHoverColor": "var(--widget-multiselect-hover-color)",
    "checkboxHoverBorderColor": "var(--widget-multiselect-hover-border-color)",
    "valueFocusColor": "var(--widget-multiselect-checked-text)",
    "checkboxFocusColor": "var(--widget-multiselect-checked-color)",
    "checkboxFocusBorderColor": "var(--widget-multiselect-checked-border-color)",
    "displayBorder": true,
    "borderColor": "var(--widget-border-color)",
    "isNumber": false
};
modelsParameters.flatUiList = {
    "addControls": false,
    "listValueFontSize": 0.5,
    "listValueColor": "var(--widget-select-drop-text)",
    "listBackgroundColor": "var(--widget-select-drop-color)",
    "selectValueColor": "var(--widget-select-option-highlighted-text)",
    "selectValueBackgroundColor": "var(--widget-select-option-highlighted-color)",
    "valueFontFamily": "var(--widget-font-family)",
    "borderColor": "var(--widget-border-color)",
    "displayBorder": true
};
modelsParameters.flatUiTable = {
    "headerLine": false,
    "tableValueFontSize": 0.5,
    "striped": true,
    "valueColor": "var(--widget-table-value-color)",
    "valueFontFamily": "var(--widget-font-family)",
    "valueAlign": "left",
    "bordered": true,
    "noBorder": false,
    "editableCols": "[]"
};

// Layout (default dimensions)
modelsLayout.flatUiSelect = { 'height': '5vh', 'width': '19vw', 'minWidth': '80px', 'minHeight': '32px' };
modelsLayout.flatUiMultiSelect = { 'height': '16vh', 'width': '11vw', 'minWidth': '80px', 'minHeight': '75px' };
modelsLayout.flatUiList = { 'height': '16vh', 'width': '11vw', 'minWidth': '80px', 'minHeight': '75px' };
modelsLayout.flatUiTable = { 'height': '10vh', 'width': '11vw', 'minWidth': '88px', 'minHeight': '79px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function flatUiComplexWidgetsPluginClass() {

    // +--------------------------------------------------------------------¦ \\
    // |                              Select                                | \\
    // +--------------------------------------------------------------------¦ \\
    this.selectFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
        var self = this;
        this.bFirstExec = true;
        this.tmpSelectedValue = "";

        this.enable = function () {
            $("#select" + idWidget).off('click').on("click", function (e, ui) {
                modelsHiddenParams[idInstance].selectedValue = self.selectedValue.getValue();
                self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
            });
            $("#select" + idWidget).prop("disabled", false);
         
            document.styleSheets[0].addRule('#s2id_select' + idWidget + ' > .select2-choice > .select2-chosen', this.selectedValueColor());
            document.styleSheets[0].addRule('#s2id_select' + idWidget + ' > .select2-choice', this.selectedItemDefaultColor());
            document.styleSheets[0].addRule('#s2id_select' + idWidget + ' > .select2-choice:hover', this.selectedItemHoverColor());
        };

        this.disable = function () {
            $("#select" + idWidget).prop("disabled", true);
        };

        this.rescale = function () {
            this.render();
        };

        this.render = function () {
            var widgetHtml = document.createElement('div');
            widgetHtml.setAttribute("id", "select-widget-html" + idWidget);
            widgetHtml.setAttribute("class", "select-widget-html");
            var valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 2); // keepRatio
            var divContent = '';
            if (modelsParameters[idInstance].label != "" && modelsParameters[idInstance].displayLabel) {
                valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 4); // keepRatio
                if (!_.isUndefined(modelsParameters[idInstance].selectWidthProportion)) {
                    var proportion = Math.max(0, 100 - parseFloat(modelsParameters[idInstance].selectWidthProportion)) + "%";
                    divContent = '<span id="select-span' + idWidget + '" class="select-span" style="width:' + proportion +
                        '; ' + this.labelFontSize() + this.labelColor() + this.labelFontFamily() + '">' +
                        modelsParameters[idInstance].label + '</span>';
                } else
                    divContent = '<span id="select-span' + idWidget +
                        '" class="select-span" style="max-width: 45%; ' + this.labelFontSize() + this.labelColor() + this.labelFontFamily() + '">' +
                        modelsParameters[idInstance].label + '</span>';
            }

            var styleDef = '';

            if (_.isUndefined(modelsParameters[idInstance].selectValueFontSize)) {
                modelsParameters[idInstance].selectValueFontSize = modelsParameters[idInstance].labelFontSize;
            }
            var selectOptions = [];

            // MBG backward compatibility at exported dashboard
            if (_.isUndefined(modelsParameters[idInstance].isKeyValuePairs)) { //AEF: modif for issue#61
                modelsParameters[idInstance].isKeyValuePairs = true;
            }

            //AEF
            var i = 0;
            if (!_.isUndefined(modelsHiddenParams[idInstance].value)) { // MBG backward compatibility at exported dashboard
                if (modelsHiddenParams[idInstance].value.length != 0) {
                    selectOptions = modelsHiddenParams[idInstance].value;
                } else if (modelsHiddenParams[idInstance].values.length != 0) {
                    for (i = 0; i < modelsHiddenParams[idInstance].values.length; i++) {
                        selectOptions[i] = {};
                        selectOptions[i].value = modelsHiddenParams[idInstance].values[i];
                    }
                    for (i = 0; i < modelsHiddenParams[idInstance].keys.length; i++) {
                        selectOptions[i].key = modelsHiddenParams[idInstance].keys[i];
                    }
                }
            }

            divContent = divContent + '<select data-toggle="select" id="select' + idWidget +
                '" class="select-div form-control select select-primary select-block mbl" style="display:table;' + styleDef + ' height: ' + valueHeightPx + 'px;">';

            for (i = 0; i < selectOptions.length; i++) {
                divContent = divContent + '<option value="' + selectOptions[i].value + '">' + selectOptions[i].key + '</option>';
            }
            divContent = divContent + '</select>';

            widgetHtml.innerHTML = divContent;
            widgetHtml.setAttribute("id", "select-div-container" + idWidget);
            widgetHtml.setAttribute("style", "height: " + valueHeightPx + "px; " + this.selectFontSize());
            $("#" + idDivContainer).html(widgetHtml);

            if (this.bIsInteractive) {
                self.enable();
            } else {
                self.disable();
            }

            if (modelsHiddenParams[idInstance].selectedValue != "") {
                $('#select' + idWidget)[0].value = modelsHiddenParams[idInstance].selectedValue;
            }

            if (this.findInSelect(this.tmpSelectedValue)) {
                $('#select' + idWidget)[0].value = this.tmpSelectedValue;
            }
            $('#select' + idWidget).select2();
            self.bFirstExec = false;

            //old code: modif is made now directly in flat-ui.js
            //AEF: make fontsize, in dynamic combobox part, able to be changed
            // for (let i = 0; i < $(".select2-chosen").length; i++) {
            //     if ($(".select2-chosen")[i].parentNode.parentNode.parentNode.id == "select-div-container" + idWidget) {
            //         var selectChosenId = $(".select2-chosen")[i].id;
            //         $("#" + selectChosenId)[0].style.fontSize = 'calc(7px + ' +
            //             modelsParameters[idInstance].labelFontSize * getFontFactor() + 'vw + 0.4vh)';
            //     }
            // }
        };

        this.findInSelect = function (val) {
            var obj = {};
            if (!_.isUndefined(self.values)) {
                obj = self.values;
            } else if (!_.isUndefined(self.keyValuePairs)) {
                obj = self.keyValuePairs;
            }
            bFind = _.find(obj.selectionValues, function found(num) {
                return num == val;
            });
            return bFind;
        }

        // selectedValue
        const _VALUE_NUMBER_DESCRIPTOR = new WidgetActuatorDescription("selectedValue", "Selected value", WidgetActuatorDescription.READ_WRITE, WidgetPrototypesManager.SCHEMA_NUMBER);
        const _VALUE_STRING_DESCRIPTOR = new WidgetActuatorDescription("selectedValue", "Selected value", WidgetActuatorDescription.READ_WRITE, WidgetPrototypesManager.SCHEMA_STRING);
        const _VALUE_DESCRIPTOR = new WidgetActuatorDescription("selectedValue", "Selected value", WidgetActuatorDescription.READ_WRITE, WidgetPrototypesManager.SCHEMA_NUMBER_OR_STRING);

        // !isKeyValuePairs
        const _KEYS_DESCRIPTOR = new WidgetActuatorDescription("keys", "Labels of the selectable options", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_STRING_ARRAY);
        const _VALUES_STRING_DESCRIPTOR = new WidgetActuatorDescription("values", "Selectable values. Must match 'keys'.", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_STRING_ARRAY);
        const _VALUES_NUMBER_DESCRIPTOR = new WidgetActuatorDescription("values", "Selectable values. Must match 'keys'.", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_NUMBER_ARRAY);

        // isKeyValuePairs
        const _KEYVALUE_NUMBER_DESCRIPTOR = new WidgetActuatorDescription(
            "keyValuePairs",
            "Array of selectable key-value objects; Key being the displayed label",
            WidgetActuatorDescription.READ,
            {
                $schema: WidgetPrototypesManager.SCHEMA_VERSION,
                $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:selectFlatUiWidget_keyValuePairs_isNumber",
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        key: { type: ["string", "number", "boolean"] },
                        value: { type: "number" },
                    },
                    required: ["key"], // TODO value missing => key is number ?
                },
            },
        );
        const _KEYVALUE_STRING_DESCRIPTOR = new WidgetActuatorDescription(
            "keyValuePairs",
            "Array of selectable key-value objects; Key being the displayed label",
            WidgetActuatorDescription.READ,
            {
                $schema: WidgetPrototypesManager.SCHEMA_VERSION,
                $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:selectFlatUiWidget_keyValuePairs",
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        key: { type: ["string", "number", "boolean"] },
                        value: { type: "string" },
                    },
                    required: ["key"],
                },
            },
        );


        this.getActuatorDescriptions = function (model = null) {
            const data = model || modelsParameters[idInstance];
            const result = [];

            if (data && data.isKeyValuePairs) {
                result.push(data.isNumber ? _KEYVALUE_NUMBER_DESCRIPTOR : _KEYVALUE_STRING_DESCRIPTOR);
            } else {
                result.push(_KEYS_DESCRIPTOR);
                result.push((data && data.isNumber) ? _VALUES_NUMBER_DESCRIPTOR : _VALUES_STRING_DESCRIPTOR);
            }

            let selectedValue = _VALUE_DESCRIPTOR;
            if(data) {
                selectedValue = data.isNumber ? _VALUE_NUMBER_DESCRIPTOR : _VALUE_STRING_DESCRIPTOR;
            }
            result.push(selectedValue);

            return result;
        };
        this.selectedValue = {
            updateCallback: function () { },
            setValue: function (val) { //AEF: modif for issue#61
                self.tmpSelectedValue = val;
                var bFind = self.findInSelect(val);
                if (bFind) {
                    $('#select' + idWidget)[0].value = val;
                    modelsHiddenParams[idInstance].selectedValue = val;
                    self.render();
                }
            },
            getValue: function () {
                if (modelsParameters[idInstance].isNumber) {
                    return Number($('#select' + idWidget)[0].value);
                } else {
                    return $('#select' + idWidget)[0].value;
                }
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                if ($('#select' + idWidget)[0].value != "") {
                    updateDataFromWidget(this, $('#select' + idWidget)[0].value)
                }
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            },
            setCaption: function (caption, bCaptionManuallyChanged) {
                if (modelsParameters[idInstance].inheritLabelFromData) {
                    self.captionHelper(caption, self.bIsInteractive, bCaptionManuallyChanged);
                    $("#select-span" + idWidget).text(modelsParameters[idInstance].label);
                }
            },
            clearCaption: function () {
                modelsParameters[idInstance].label = "";
                self.render();
            }
        };

        self.render();

        if (!modelsParameters[idInstance].isKeyValuePairs) { //AEF: new created widget and newer loaded project
            this.keys = { //AEF: in this slider put array of keys (madatory)
                selectionValues: [],
                setValue: function (val) {
                    if (val === "") { //ABK
                        selectionValues = [];
                        modelsHiddenParams[idInstance].value = val;
                        //modelsHiddenParams[idInstance].keys = []; // MBG & ABK meeting 26/11/2020 : à faire (à décider) ???
                        self.render();
                    } else {
                        var msg1 = '"keys" must be an array (in widget' + idInstance + ')';
                        var msg2 = 'Example: ["choice1","choice2"]';
                        if (!Array.isArray(val)) {
                            swal(msg1, msg2, "info");
                            return;
                        }
                        if (typeof (val[0]) === "object") { //AEF: prevetn old format here [{},{}]
                            swal(msg1, msg2, "info");
                            return;
                        }

                        for (var i = 0; i < val.length; i++) {
                            this.selectionValues[i] = val[i];
                        }
                        modelsHiddenParams[idInstance].value = [];
                        modelsHiddenParams[idInstance].keys = val;
                        self.render();
                    }

                },
                getValue: function () {
                    return modelsHiddenParams[idInstance].value;
                },
                addValueChangedHandler: function (updateDataFromWidget) {
                    self.enable();
                },
                removeValueChangedHandler: function (updateDataFromWidget) {
                    self.disable();
                }
            };

            this.values = { //AEF: in this slider put array of values (optional)
                selectionValues: [],
                setValue: function (val) {
                    if (val === "") { //ABK
                        selectionValues = [];
                        modelsHiddenParams[idInstance].value = val;
                        //modelsHiddenParams[idInstance].values = []; // MBG & ABK meeting 26/11/2020 : à faire (à décider) ???
                        self.render();
                    } else {
                        var msg1 = '"value" must be an array (in widget' + idInstance + ')';
                        var msg2 = 'Example: [1, 2]';
                        if (_.isNull(val)) {
                            val = modelsHiddenParams[idInstance].keys; //AEF: values are optional, take keys if not provided
                        }
                        if (!Array.isArray(val)) {
                            swal(msg1, msg2, "info");
                            return;
                        }
                        if (typeof (val[0]) === "object") { //AEF: prevetn old format here [{},{}]
                            swal(msg1, msg2, "info");
                            return;
                        }

                        for (var i = 0; i < val.length; i++) {
                            this.selectionValues[i] = val[i];
                        }
                        modelsHiddenParams[idInstance].value = [];
                        modelsHiddenParams[idInstance].values = val;
                        self.render();
                    }

                },
                getValue: function () {
                    return modelsHiddenParams[idInstance].value;
                },
                addValueChangedHandler: function (updateDataFromWidget) {
                    self.enable();
                },
                removeValueChangedHandler: function (updateDataFromWidget) {
                    self.disable();
                }
            };
        } else { //AEF: older project (before issue#61)

            this.keyValuePairs = { //AEF: in this slider put array of key or array of key/value pairs
                selectionValues: [],
                setValue: function (val) {
                    if (val == "") { //ABK
                        selectionValues = [];
                        modelsHiddenParams[idInstance].value = val;
                        self.render();
                    } else {
                        var msg1 = '"keyValuePairs" must be an array of key or an array of key/value pairs (in widget' + idInstance + ')';
                        var msg2 = 'Example1: [{"key":"choice1"}, {"key":"choice2"}] \n or Example2: [{"key":"choice1", "value":"1"}, {"key":"choice2", "value":"2"}]';
                        if (!Array.isArray(val)) {
                            swal(msg1, msg2, "info"); //ABK
                            //swal({ title: msg1, text: msg2, type: "info", timer: 2000 });//ABK autoclose2s
                            return;
                        }
                        for (var i = 0; i < val.length; i++) {
                            if (_.isUndefined(val[i].key)) { //AEF: key is mandatory
                                swal(msg1, msg2, "info");
                                return;
                            }
                            if (_.isUndefined(val[i].value)) { //AEF: value is optional
                                //AEF: modif for issue#61: accept key table without value
                                val[i].value = val[i].key;
                            }
                            this.selectionValues[i] = val[i].value;
                        }
                        modelsHiddenParams[idInstance].value = val;
                        self.render();
                    }
                },
                getValue: function () {
                    return modelsHiddenParams[idInstance].value;
                },
                addValueChangedHandler: function (updateDataFromWidget) {
                    self.enable();
                },
                removeValueChangedHandler: function (updateDataFromWidget) {
                    self.disable();
                }
            };
        }
    };

    // Inherit from baseWidget class
    this.selectFlatUiWidget.prototype = baseWidget.prototype;

    // +--------------------------------------------------------------------¦ \\
    // |                          Multi-select                              | \\
    // +--------------------------------------------------------------------¦ \\
    this.multiSelectFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
        var self = this;

        this.enable = function () {
            $("#multi-select" + idWidget).on("click", function (e) {
                self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
            });
            $("#multi-select" + idWidget)[0].style.opacity = "1";
        };

        this.disable = function () {
            $("#multi-select" + idWidget)[0].style.opacity = "0.7";
        };

        this.rescale = function () {
            this.render();
        };

        this.hasScrollBar = function (element) {
            return element.get(0).scrollHeight > element.get(0).clientHeight;
        }

        this.render = function () {
            var widgetHtml = document.createElement('div');
            valueHeightPx = $("#" + idDivContainer).height();
            widgetHtml.setAttribute("style", "width: inherit; height: " + valueHeightPx + "px; cursor: inherit;");

            var divContent = '<div class="multi-select-div" id="multi-select' + idWidget +
                '" style="width: 100%; height: ' + valueHeightPx +
                'px;/*background-color: rgba(255, 255, 255, 0)*/; border-radius: 6px; ' +
                this.valueDefaultColor() + this.border() + '; box-sizing: border-box; cursor: inherit; max-width : 2000px">';

            var val = modelsHiddenParams[idInstance].value;
            var cursorElem = '';
            if (this.bIsInteractive) {
                cursorElem = "cursor: pointer; "
            } else {
                cursorElem = "cursor: inherit; "
            }

            if (_.isUndefined(modelsParameters[idInstance].valueFontSize)) {
                modelsParameters[idInstance].valueFontSize = 0.4;
            }

            if (Array.isArray(val)) {
                for (let i = 0; i < val.length; i++) {
                    divContent = divContent + '<label >';
                    divContent = divContent + '<input type="checkbox" value="' + val[i] + '" />';
                    divContent = divContent + '<span id="multi-select-label' + idWidget + '" style="' + cursorElem + 
                    this.valueFontFamily() + this.valueFontSize() +
                    this.checkboxWidth() + this.checkboxHeight() +
                    '" tabindex="-1">' + val[i] + '</span>';
                    divContent = divContent + '</label>';
                }
            }
            divContent = divContent + '</div>';
            widgetHtml.innerHTML = divContent;
            $("#" + idDivContainer).html(widgetHtml);

            var hasScrollBar = self.hasScrollBar($('#multi-select' + idWidget));
            if (!hasScrollBar) {
                $('#multi-select' + idWidget + '.multi-select-div').css("align-content", "center");
            }

            //AEF: detect tablets and phones to be able to shorten the height automatically with the device list display
            var isMobileOrTablet = window.mobileAndTabletCheck();
            var touchDevice = ('ontouchstart' in document.documentElement); // Only mobiles
            //AEF: can keep only one isMobileOrTablet or touchDevice 
            if (touchDevice || isMobileOrTablet) {
                $("#multi-select" + idWidget)[0].style.height = "auto";
            }
            if (!_.isEmpty(modelsHiddenParams[idInstance].selectedValue)) {
                $("#multi-select" + idWidget + " > label > input[type='checkbox']").each(function () {
                    for (let i = 0; i < modelsHiddenParams[idInstance].selectedValue.length; i++) {
                        if ($(this).val() == modelsHiddenParams[idInstance].selectedValue[i]) {
                            $(this).attr("checked", true);
                        }
                    }
                });
            }

            document.styleSheets[0].addRule('#multi-select-label' + idWidget, this.valueDefaultColor());
            document.styleSheets[0].addRule('#multi-select-label' + idWidget, this.checkboxDefaultColor());
            document.styleSheets[0].addRule('#multi-select-label' + idWidget, this.checkboxBorder());

            document.styleSheets[0].addRule('#multi-select-label' + idWidget + ':hover' , this.valueHoverColor());
            document.styleSheets[0].addRule('#multi-select-label' + idWidget + ':hover' , this.checkboxHoverColor());
            document.styleSheets[0].addRule('#multi-select-label' + idWidget + ':hover' , this.checkboxHoverBorderColor());
            
            document.styleSheets[0].addRule('input[type="checkbox"]:checked + #multi-select-label' + idWidget , this.valueFocusColor());
            document.styleSheets[0].addRule('input[type="checkbox"]:checked + #multi-select-label' + idWidget , this.checkboxFocusColor());
            document.styleSheets[0].addRule('input[type="checkbox"]:checked + #multi-select-label' + idWidget , this.checkboxFocusBorderColor());

            if (this.bIsInteractive) {
                self.enable();
            } else {
                self.disable();
            }
        }

        const _VALUE_DESCRIPTOR = new WidgetActuatorDescription("value", "Available choices", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_PRIMITIVE_ARRAY);
        const _SELECTED_DESCRIPTOR = new WidgetActuatorDescription("selectedValue", "Currently selected choices", WidgetActuatorDescription.READ_WRITE, WidgetPrototypesManager.SCHEMA_STRING_ARRAY);
        this.getActuatorDescriptions = function () {
            return [_VALUE_DESCRIPTOR, _SELECTED_DESCRIPTOR];
        };

        this.value = {
            updateCallback: function () { },
            setValue: function (val) {
                modelsHiddenParams[idInstance].value = val;
                self.render();
            },
            getValue: function () {
                if (modelsParameters[idInstance].isNumber) {
                    return Number(modelsHiddenParams[idInstance].value);
                } else {
                    return modelsHiddenParams[idInstance].value;
                }
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) { },
            setCaption: function (caption, bCaptionManuallyChanged) { },
            clearCaption: function () { }
        };

        this.selectedValue = {
            updateCallback: function () { },
            setValue: function (val) {
                $("#multi-select" + idWidget + " > label > input[type='checkbox']").each(function () {
                    for (let i = 0; i < val.length; i++) {
                        if ($(this).val() === val[i]) {
                            $(this).attr("checked", true);
                        }
                    }
                });
                modelsHiddenParams[idInstance].selectedValue = val;
            },
            getValue: function () {
                var selectedVal = [];
                $("#multi-select" + idWidget + " > label > input[type='checkbox']:checked").each(function () {
                    if (modelsParameters[idInstance].isNumber) {
                        selectedVal.push(Number($(this).val()));
                    } else {
                        selectedVal.push($(this).val());
                    }
                });

                return selectedVal;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) { },
            setCaption: function (caption, bCaptionManuallyChanged) { },
            clearCaption: function () { }
        };

        self.render();
    };

    // Inherit from baseWidget class
    this.multiSelectFlatUiWidget.prototype = baseWidget.prototype;

    // +--------------------------------------------------------------------¦ \\
    // |                              List                                  | \\
    // +--------------------------------------------------------------------¦ \\
    this.listFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
        var self = this;

        this.enable = function () {
            var fired = false; //fire keyup event only once
            var lastkeyup = false; //click+ctrl then ctrl+a

            $("#list" + idWidget).on("keyup", function (e) {
                if (lastkeyup) { // in case of: click+ctrl then ctrl+a, no click event between two ctrl keyup events
                    if (e.keyCode == 65 || e.keyCode == 97 || e.keyCode == 17) { // 'A' or 'a' or 'ctrl'
                        self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
                        lastkeyup = false;
                        //console.log('ctrl+ctrl+a');
                    }
                }
            });

            $("#list" + idWidget).on("click keyup", function (e) {
                lastkeyup = false;
                if (e.ctrlKey) {
                    //is ctrl + click  (for multiple selection with mouse (click))
                    if (!fired) {
                        fired = true;
                        $("#list" + idWidget).one("keyup", function (e) {
                            self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
                            fired = false;
                            lastkeyup = true;
                            //console.log('ctrl+click');
                        });
                    }
                } else {
                    // normal click
                    self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
                    // if click + ctrl+a (for all selection with keyboard (ctrl+a))
                    if (!fired) {
                        fired = true;
                        $("#list" + idWidget).one("keyup", function (e) {
                            if (e.keyCode == 65 || e.keyCode == 97 || e.keyCode == 17) { // 'A' or 'a' or 'ctrl'
                                self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
                                fired = false;
                                lastkeyup = true;
                                //console.log('click+ctrl+a');
                            }
                        });
                    }
                }
            });
            //$("#list" + idWidget).prop("disabled", false); // MBG : fix du problème qui l'empêche d'être bougée
            $("#list" + idWidget)[0].style.opacity = "1"; //ABK instead to enable list
        };

        this.disable = function () {
            //$("#list" + idWidget).prop("disabled", true); // MBG : fix du problème qui l'empêche d'être bougée
            $("#list" + idWidget)[0].style.opacity = "0.7"; //ABK instead to disable list
        };

        this.rescale = function () {
            this.render();
        };

        this.render = function () {
            var widgetHtml = document.createElement('div');
            valueHeightPx = $("#" + idDivContainer).height();
            widgetHtml.setAttribute("style", "width: inherit; height: " + valueHeightPx + "px; cursor: inherit;");

            var border = this.border();

            var divContent = '<select class="form-control" id="list' + idWidget +
                '" multiple size="10" style="width: 100%; height: ' + valueHeightPx +
                'px;/*background-color: rgba(255, 255, 255, 0)*/; border-radius: 6px; color: ' +
                modelsParameters[idInstance].listValueColor + '; ' + border + '; ' + this.valueFontFamily() +
                'box-sizing: border-box; font-size: calc(7px + ' +
                modelsParameters[idInstance].listValueFontSize * getFontFactor() + 'vw + 0.4vh); ' +
                'cursor: inherit; max-width : 2000px">';

            var val = modelsHiddenParams[idInstance].value;
            var cursorElem = '';
            if (this.bIsInteractive) {
                cursorElem = "cursor: pointer; "
            } else {
                cursorElem = "cursor: inherit; "
            }
            if (Array.isArray(val)) {
                var i;
                for (i = 0; i < val.length; i++) {
                    divContent = divContent + '<option style="' + cursorElem + '">' + val[i] + '</option>';
                }
            }
            divContent = divContent + '</select>';
            widgetHtml.innerHTML = divContent;
            $("#" + idDivContainer).html(widgetHtml);
            //AEF: detect tablets and phones to be able to shorten the height automatically with the device list display
            var isMobileOrTablet = window.mobileAndTabletCheck();
            var touchDevice = ('ontouchstart' in document.documentElement); // Only mobiles
            // var touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement); // desktops with a touch screen and mobiles
            //AEF: can keep only one isMobileOrTablet or touchDevice 
            if (touchDevice || isMobileOrTablet) {
                $("#list" + idWidget)[0].style.height = "auto";
            }
            if (!_.isEmpty(modelsHiddenParams[idInstance].selectedValue)) { // MBG for issue #214
                $('#list' + idWidget).val(modelsHiddenParams[idInstance].selectedValue)
            }

            document.styleSheets[0].addRule('#list' + idWidget + ' option', modelsParameters[idInstance].listValueColor);
            document.styleSheets[0].addRule('#list' + idWidget + ' option', this.listBackgroundColor());
            document.styleSheets[0].addRule('#list' + idWidget + ' option:checked', this.selectValueColor());
            document.styleSheets[0].addRule('#list' + idWidget + ' option:checked', this.selectValueBackgroundColor());

            if (this.bIsInteractive) {
                self.enable();
            } else {
                self.disable();
            }
        }

        const _VALUE_DESCRIPTOR = new WidgetActuatorDescription("value", "Available choices", WidgetActuatorDescription.READ, WidgetPrototypesManager.SCHEMA_PRIMITIVE_ARRAY);
        const _SELECTED_DESCRIPTOR = new WidgetActuatorDescription(
            "selectedValue",
            "Currently selected choices",
            WidgetActuatorDescription.READ_WRITE,
            {
                $schema: WidgetPrototypesManager.SCHEMA_VERSION,
                $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:listFlatUiWidget_selectedValue",
                anyOf: [
                    { type: "string" },
                    { 
                        type: "array",
                        items: { type: "string" },
                    },
                ],
            },
        );
        this.getActuatorDescriptions = function () {
            return [_VALUE_DESCRIPTOR, _SELECTED_DESCRIPTOR];
        };

        this.value = {
            updateCallback: function () { },
            setValue: function (val) {
                modelsHiddenParams[idInstance].value = val;
                self.render();
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].value;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) { },
            setCaption: function (caption, bCaptionManuallyChanged) { },
            clearCaption: function () { }
        };

        this.selectedValue = {
            updateCallback: function () { },
            setValue: function (val) {
                $('#list' + idWidget).val(val);
                modelsHiddenParams[idInstance].selectedValue = val;
            },
            getValue: function () {
                var x = document.getElementById('list' + idWidget);
                var selectedVal = $('#list' + idWidget).val();
                //var selectedIndex = x.selectedIndex;
                var selectedOptions = x.selectedOptions;
                var listLength = 0;
                if (Array.isArray(modelsHiddenParams[idInstance].value)) {
                    listLength = modelsHiddenParams[idInstance].value.length;
                }
                if (selectedOptions.length === 0)
                    return "";
                for (var i = 0; i < selectedOptions.length; i++) {
                    if ((selectedOptions[i].index < 0) || (selectedOptions[i].index >= listLength))
                        return "";
                }

                return selectedVal;

                // old code
                //if ((selectedIndex < 0) || (selectedIndex >= listLength))
                //    return "";
                // else
                //return modelsHiddenParams[idInstance].value[selectedIndex];
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) { },
            setCaption: function (caption, bCaptionManuallyChanged) { },
            clearCaption: function () { }
        };

        self.render();
    };

    // Inherit from baseWidget class
    this.listFlatUiWidget.prototype = baseWidget.prototype;

    // +--------------------------------------------------------------------¦ \\
    // |                              Table                                 | \\
    // +--------------------------------------------------------------------¦ \\
    this.tableFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
        var self = this;

        this.enable = function () {
            $('#table' + idWidget).editableTableWidget();
            $('#table' + idWidget + ' td').on('change', function (evt, newValue) {
                var cell = $(this);
                var parent = cell.parent();
                var column = cell.index();
                var row = parent.index();
                var fontSize = 0.5;
                if (!_.isUndefined(modelsParameters[idInstance].tableValueFontSize)) {
                    fontSize = modelsParameters[idInstance].tableValueFontSize;
                }
                if (modelsParameters[idInstance].headerLine) {
                    row = row + 1;
                }

                if (!_.isNaN(Number(newValue))) newValue = Number(newValue); // MBG : very basic type handling. To extend

                modelsHiddenParams[idInstance].value[row][column] = newValue;
                cell.html('<span style="' + self.valueColor() + self.valueFontFamily() +
                    ' font-size: calc(7px + ' + fontSize * getFontFactor() + 'vw)">' +
                    newValue + '<span>');
                self.value.updateCallback(self.value, self.value.getValue());
            });
        };

        this.disable = function () {
            $('#table' + idWidget + ' td').on('change', function (evt, newValue) { });
        };

        this.buildTable = function (val) {
            var tableContent = '';
            var startIndex = 0;
            var isEditable;
            var fontSize = 0.5;
            if (!_.isUndefined(modelsParameters[idInstance].tableValueFontSize)) {
                fontSize = modelsParameters[idInstance].tableValueFontSize;
            }
            var bIsArray = Array.isArray(val);
            if (bIsArray) {
                var token = val[0];
                bIsArray = Array.isArray(token);
                if (bIsArray) {
                    if (modelsParameters[idInstance].headerLine) {
                        startIndex = 1;
                        tableContent = tableContent + '<thead><tr>';
                        for (var j = 0; j < val[0].length; j++) {
                            tableContent = tableContent +
                                '<th style="' + this.valueAlign() + '"><span style="' + this.valueColor() + this.valueFontFamily() +
                                ' font-size: calc(7px + ' + fontSize * getFontFactor() + 'vw);"><b>' +
                                val[0][j] + '</b></span></th>';
                        }
                        tableContent = tableContent + '</tr></thead>';
                    }
                    tableContent = tableContent + '<tbody>';
                    for (var i = startIndex; i < val.length; i++) {
                        tableContent = tableContent + '<tr>';
                        for (var j = 0; j < val[i].length; j++) {
                            var ParsedEditableCols = [];
                            try {
                                ParsedEditableCols = JSON.parse(modelsParameters[idInstance].editableCols);
                            } catch (e) { }

                            var cursorEditable = '';
                            if (_.indexOf(ParsedEditableCols, j) == -1) {
                                isEditable = "false";
                            } else {
                                isEditable = "true";
                                if (this.bIsInteractive) {
                                    cursorEditable = "cursor: cell;";
                                }
                            }
                            tableContent = tableContent + '<td style="' + cursorEditable + this.valueAlign() + '" data-editable="' + isEditable +
                                '"><span style="' + this.valueColor() + this.valueFontFamily() +
                                ' font-size: calc(7px + ' + fontSize * getFontFactor() + 'vw)">' +
                                val[i][j] + '</span></td>';
                        }
                        tableContent = tableContent + '</tr>';
                    }
                    tableContent = tableContent + '</tbody>';
                } else { /* 1D table*/
                    /*if (modelsParameters[idInstance].headerLine) {
                        startIndex = 1;
                        tableContent = tableContent + '<thead><tr>';
                        tableContent = tableContent + '<th><span style="color: #2154ab; font-size: calc(7px + .5vw)"><b>' + val[0] + '</b></span></th>';
                        tableContent = tableContent + '</tr></thead>';
                    }*/ // MBG : does-it make sense to have header in 1D ?
                    tableContent = tableContent + '<tbody><tr>';
                    for (var i = startIndex; i < val.length; i++) {
                        token = val[i];
                        tableContent = tableContent +
                            '<td style="' + this.valueAlign() + '"><span style="' + this.valueColor() + this.valueFontFamily() +
                            ' font-size: calc(7px + ' + fontSize * getFontFactor() + 'vw)">' +
                            token + '</span></td>';
                    }
                    tableContent = tableContent + '</tr></tbody>';
                }
            }
            return tableContent;
        };

        this.rescale = function () {
            this.render();
        };

        this.render = function () {
            var widgetHtml = document.createElement('div');
            if (this.bIsInteractive) {
                widgetHtml.setAttribute('style', 'cursor: auto; width: inherit; height: inherit; overflow: auto');
            } else {
                widgetHtml.setAttribute('style', 'cursor: inherit; width: inherit; height: inherit; overflow: auto');
            }
            var divContent = '<table style="margin: 0; height: 90%;" class="table';
            if (modelsParameters[idInstance].striped) divContent = divContent + ' table-striped ';
            if (modelsParameters[idInstance].bordered) divContent = divContent + ' table-bordered ';
            if (!_.isUndefined(modelsParameters[idInstance].noBorder)) { // backward compatibiliy
                if (modelsParameters[idInstance].noBorder == true) divContent = divContent + ' no-border ';
            } else {
                modelsParameters[idInstance].noBorder = false; // update
            }
            divContent = divContent + ' table-responsive" id="table' + idWidget + '" >';
            var val = modelsHiddenParams[idInstance].value;
            var insideTable = self.buildTable(val);
            if (insideTable == '') {
                insideTable = '<tbody><tr><td/><td/><td/></tr><tr><td/><td/><td/></tr></tbody>'; // empty table
            }
            divContent = divContent + insideTable + '</table>';
            widgetHtml.innerHTML = divContent;
            $("#" + idDivContainer).html(widgetHtml);
            if (this.bIsInteractive) {
                self.enable();
            } else {
                self.disable();
            }
        };

        const _SCHEMA = {
            $schema: WidgetPrototypesManager.SCHEMA_VERSION,
            $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:tableFlatUiWidget",
            anyOf: [
                {
                    type: "array",
                    items: {
                        anyOf: [
                            { type: "string" },
                            { type: "number" },
                            { type: "boolean" },
                        ],
                    },
                },
                {
                    type: "array",
                    items: {
                        type: "array",
                        items: {
                            anyOf: [
                                { type: "string" },
                                { type: "number" },
                                { type: "boolean" },
                            ],
                        },
                    },
                },
            ],
        };
        const _VALUE_DESCRIPTOR_R = new WidgetActuatorDescription("value", "Table content as an array or array of arrays", WidgetActuatorDescription.READ, _SCHEMA);
        const _VALUE_DESCRIPTOR_RW = new WidgetActuatorDescription("value", "Table content as an array or array of arrays", WidgetActuatorDescription.READ_WRITE, _SCHEMA);
        this.getActuatorDescriptions = function (model = null) {
            params = model || modelsParameters[idInstance];
            let parsedEditableCols = [];
            try {
                parsedEditableCols = JSON.parse(params.editableCols);
            } catch (e) { }
            return (Array.isArray(parsedEditableCols) && parsedEditableCols.length) ? [_VALUE_DESCRIPTOR_RW] : [_VALUE_DESCRIPTOR_R];
        };


        this.value = {
            updateCallback: function () { },
            setValue: function (val) {
                modelsHiddenParams[idInstance].value = val;
                self.render();
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].value;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) { },
            setCaption: function (caption, bCaptionManuallyChanged) { },
            clearCaption: function () { }
        };

        self.render();
    };

    // Inherit from baseWidget class
    this.tableFlatUiWidget.prototype = baseWidget.prototype;

    // Plugin definition
    this.pluginDefinition = {
        'name': 'flatUi',
        'widgetsDefinitionList': {
            flatUiSelect: { factory: "selectFlatUiWidget", title: "Select", icn: "select", help: "wdg/wdg-basics/#select" },
            flatUiMultiSelect: { factory: "multiSelectFlatUiWidget", title: "Multi-select", icn: "multi-select", help: "wdg/wdg-basics/#multi-select" },
            flatUiList: { factory: "listFlatUiWidget", title: "List", icn: "list", help: "wdg/wdg-basics/#list" },
            flatUiTable: { factory: "tableFlatUiWidget", title: "Table", icn: "board", help: "wdg/wdg-basics/#table" }
        },
    };

    this.constructor();
}

// Inherit from basePlugin class
flatUiComplexWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var flatUiComplexWidgetsPlugin = new flatUiComplexWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(flatUiComplexWidgetsPlugin);