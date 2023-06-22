// ┌───────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                           │ \\
// ├───────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                               │ \\
// | Licensed under the Apache License, Version 2.0                            │ \\
// ├───────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR, Tristan BARTEMENT, Guillaume CORBELIN │ \\
// └───────────────────────────────────────────────────────────────────────────┘ \\


/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/


// models
modelsHiddenParams.dateRangePicker = {
    "startDateValue": "",
    "endDateValue": ""
};

// Parameters
modelsParameters.dateRangePicker = {
    "label": "labelText",
    "displayLabel": true,
    "displayTimePicker": false,
    "displayTimePicker24Hour": false,
    "labelFontSize": 0.5,
    "labelColor": "var(--widget-label-color)",
    "labelFontFamily": "var(--widget-font-family)",
    "labelWidthProportion": "25%",
    "valueFontSize": 0.5,
    "valueColor": "var(--widget-color)",
    "valueFontFamily": "var(--widget-font-family)",
    "valueTextAlign": "left",
    "displayBorder": true,
    "borderColor": "var(--widget-border-color)",
    "backgroundColor": "var(--widget-input-color)"
};

// Layout (default dimensions)
modelsLayout.dateRangePicker = { 'height': '5vh', 'width': '24vw', 'minWidth': '170px', 'minHeight': '32px' };


/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function dateRangePickerWidgetsPluginClass() {

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                      Date Range Picker Widget                      | \\
    // | From : https://github.com/dangrossman/daterangepicker              |
    // ├────────────────────────────────────────────────────────────────────┤ \\
    
    this.dateRangePickerWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

        const self = this;
        this.formatDateValue = "";

        this.updateDateValue = function (e) {
            if (this.bIsInteractive) {
                self.endDateValue.updateCallback(self.endDateValue, self.endDateValue.getValue());
                modelsHiddenParams[idInstance].endDateValue = self.endDateValue.getValue();

                self.startDateValue.updateCallback(self.startDateValue, self.startDateValue.getValue());
                modelsHiddenParams[idInstance].startDateValue = self.startDateValue.getValue();
            }          
        };

        this.rescale = function () {
            this.render();
        };

        this.render = function () {
            const widgetHtml = document.createElement('div');
            widgetHtml.setAttribute("style", 'display: table;text-align: left; height: inherit; width: inherit; cursor: inherit');
            widgetHtml.setAttribute("id", "div-for-daterangepicker" + idWidget);
            $("#" + idDivContainer).html(widgetHtml);

            let labelProportion = "0%";
            let labelText = "labelText";
            let widthInput = $("#div-for-daterangepicker" + idWidget).width();
            let LabelHtml = "",
                labelFontSize = "calc(7px + 0.5vw + 0.4vh)",
                valueFontSize = "calc(7px + 0.5vw + 0.4vh)";

            // remove inheritLabelFromData because there is more than one actuator
            if (!_.isUndefined(modelsParameters[idInstance].inheritLabelFromData)) {
                delete modelsParameters[idInstance].inheritLabelFromData;
            }

            if (modelsParameters[idInstance].displayLabel == true) {
                if (!_.isUndefined(modelsParameters[idInstance].label)) {
                    // conversion to enable HTML tags
                    labelText = this.getTransformedText("label");
                }
                if (!_.isUndefined(modelsParameters[idInstance].labelWidthProportion)) {
                    labelProportion = modelsParameters[idInstance].labelWidthProportion;
                    widthInput = ((100 - parseInt(labelProportion)) * $("#div-for-daterangepicker" + idWidget).width()) / 100;
                }
                if (!_.isUndefined(modelsParameters[idInstance].labelFontSize)) {
                    labelFontSize = this.labelFontSize();
                }
                if (!_.isUndefined(modelsParameters[idInstance].valueFontSize)) {
                    valueFontSize = "calc(7px + " +
                        modelsParameters[idInstance].valueFontSize * getFontFactor() + "vw + 0.4vh)";
                }
                LabelHtml = '<span class="value-span" id="date-label-span' + idWidget +
                    '" style="width:' + labelProportion +
                    '; ' + labelFontSize + this.labelColor() + this.labelFontFamily() +
                    ';">' + labelText + '</span>';
            }

            let dateRangePickerDisabled = 'disabled';
            let cursorIcon = 'cursor: inherit; ';
            if (this.bIsInteractive) {
                dateRangePickerDisabled = '';
                cursorIcon = 'cursor: pointer; ';
            }

            const border = this.border();
            const divHeight = $("#div-for-daterangepicker" + idWidget).height();

            const daterangepickerHtml = '<div id="daterangepicker' + idWidget + '" >' +
                '<input type="text" autocomplete="off" ' + dateRangePickerDisabled + ' placeholder="Choose a date range" id="daterangepickerInput' + idWidget + '" ' +
                'style="' + cursorIcon + ' height: ' + divHeight + 'px; border-radius: 6px; ' + border +
                'float: right;' +
                'padding-right: ' + valueFontSize.replace('(', '(3*(').replace(')', '))') + ';' +
                'text-align: ' + modelsParameters[idInstance].valueTextAlign + '; ' +
                'font-size: ' + valueFontSize + '; ' + this.valueColor() + this.valueFontFamily() + this.backgroundColor() + '" ' +
                'class="value-input form-control ng-pristine ng-untouched ng-valid ng-empty" />' +
                '<span class="form-control-feedback" style="' + cursorIcon +
                'height: ' + divHeight + 'px; ' +
                'display:table; margin-top: 0; top:0; padding-right: ' + valueFontSize +
                '"><i class="fa fa-lg fa-calendar" ' + 'style="display: table-cell; vertical-align: middle;' +
                cursorIcon + 'font-size: ' + valueFontSize + ';" ' +
                '></i></span>' +
                '</div>';
            const divContent = (
                LabelHtml +
                '<div style="height:100% ' +
                'width: ' + widthInput + 'px;">' +
                daterangepickerHtml +
                '</div>'
            );
            widgetHtml.innerHTML = divContent;

            if (modelsParameters[idInstance].displayTimePicker) {
                self.formatDateValue = modelsParameters[idInstance].displayTimePicker24Hour ? 'YYYY-MM-DD hh:mm' : 'YYYY-MM-DD hh:mm A';
            } else {
                self.formatDateValue = 'YYYY-MM-DD';
            }

            let startDate = "";
            let endDate = "";

            if (modelsHiddenParams[idInstance].startDateValue !== "") {
                startDate = modelsHiddenParams[idInstance].startDateValue
            } else {
                startDate = moment().startOf('hour');
            }

            if (modelsHiddenParams[idInstance].endDateValue !== "") {
                endDate = modelsHiddenParams[idInstance].endDateValue
            } else {
                endDate = moment().startOf('hour').add(32, 'hour');
            }

            $('input[id="daterangepickerInput' + idWidget + '"]').daterangepicker({
                opens: 'right',
                singleDatePicker: false,
                showDropdowns: true,
                autoUpdateInput: true,
                timePicker: modelsParameters[idInstance].displayTimePicker,
                timePicker24Hour: modelsParameters[idInstance].displayTimePicker24Hour,
                startDate: startDate,
                endDate: endDate,
                locale: {
                  format: self.formatDateValue
                }
            });

            $('input[id="daterangepickerInput' + idWidget + '"]').on('apply.daterangepicker', function(ev, picker) {
                modelsHiddenParams[idInstance].startDateValue = picker.startDate.format(self.formatDateValue);
                modelsHiddenParams[idInstance].endDateValue = picker.endDate.format(self.formatDateValue);
                self.updateDateValue();
            });
        };

        const _DATE_SCHEMA = {
            $schema: WidgetPrototypesManager.SCHEMA_VERSION,
            $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:dateRangeWidget_date",
            type: "string",
            pattern: "^\\d\\d\\d\\d-[0-1]\\d-[0-3]\\d$",
        };
        const _DATE_START_DESCRIPTOR = new WidgetActuatorDescription("startDateValue", "Selected start date as YYYY-MM-DD", WidgetActuatorDescription.READ_WRITE, _DATE_SCHEMA);
        const _DATE_END_DESCRIPTOR = new WidgetActuatorDescription("endDateValue", "Selected end date as YYYY-MM-DD", WidgetActuatorDescription.READ_WRITE, _DATE_SCHEMA);
        this.getActuatorDescriptions = function () {
            return [_DATE_START_DESCRIPTOR, _DATE_END_DESCRIPTOR];
        };

        this.startDateValue = {
            updateCallback: function () { },
            setValue: function (val) {
                if (moment(val, self.formatDateValue, true).isValid()) {
                    modelsHiddenParams[idInstance].startDateValue = val;
                    $('input[id="daterangepickerInput' + idWidget + '"]').data('daterangepicker').setStartDate(modelsHiddenParams[idInstance].startDateValue);
                }
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].startDateValue;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
            setCaption: function (caption, bCaptionManuallyChanged) {},
            clearCaption: function () {
                modelsParameters[idInstance].label = "";
                self.render();
            }
        };

        this.endDateValue = {
            updateCallback: function () { },
            setValue: function (val) {
                if (moment(val, self.formatDateValue, true).isValid()) {
                    modelsHiddenParams[idInstance].endDateValue = val
                    $('input[id="daterangepickerInput' + idWidget + '"]').data('daterangepicker').setEndDate(modelsHiddenParams[idInstance].endDateValue);
                }
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].endDateValue;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) {},
            setCaption: function (caption, bCaptionManuallyChanged) {},
            clearCaption: function () {
                modelsParameters[idInstance].label = "";
                self.render();
            }
        };
        self.render();
    };

    // Inherit from baseWidget class
    this.dateRangePickerWidget.prototype = baseWidget.prototype;

    // Plugin definition
    this.pluginDefinition = {
        'name': 'dateRangePicker',
        'widgetsDefinitionList': {
            dateRangePicker: { factory: "dateRangePickerWidget", title: "Date-range calendar", icn: "date-range-calendar", help: "wdg/wdg-geo-time/#advanced-calendar" }
        },
    };

    this.constructor();
}

// Inherit from basePlugin class
dateRangePickerWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var dateRangePickerWidgetsPlugin = new dateRangePickerWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(dateRangePickerWidgetsPlugin);