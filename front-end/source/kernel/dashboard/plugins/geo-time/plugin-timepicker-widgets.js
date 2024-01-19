// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2020 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Mongi BEN GAID                │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// models
modelsHiddenParams.timepickerSimple = { timeValue: '' };

// Parameters
modelsParameters.timepickerSimple = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  labelWidthProportion: '30%',
  valueFontSize: 0.5,
  valueColor: 'var(--widget-color)',
  valueFontFamily: 'var(--widget-font-family)',
  valueTextAlign: 'left',
  displayBorder: true,
  borderColor: 'var(--widget-border-color)',
  backgroundColor: 'var(--widget-input-color)',
};

// Layout (default dimensions)
modelsLayout.timepickerSimple = { height: '5vh', width: '19vw', minWidth: '150px', minHeight: '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function timePickerWidgetsPluginClass() {
  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                         Time picker widget                         | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.timepickerWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.updateValue = function (e) {
      self.timeValue.updateCallback(self.timeValue, self.timeValue.getValue());
      modelsHiddenParams[idInstance].timeValue = self.timeValue.getValue();
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute(
        'style',
        'display: table;text-align: left; height: inherit; width: inherit; cursor: inherit'
      );
      widgetHtml.setAttribute('id', 'div-for-ng-timepicker' + idWidget);
      $('#' + idDivContainer).html(widgetHtml);
      var inputClass = '';
      if (this.bIsInteractive) {
        inputClass = 'clockpicker ';
      } else {
        inputClass = ' ';
      }
      var labelProportion = '0%';
      var labelText = 'labelText';
      var widthInput = $('#div-for-ng-timepicker' + idWidget).width();
      var LabelHtml = '',
        labelFontSize = 'calc(7px + 0.5vw + 0.4vh)',
        valueFontSize = 'calc(7px + 0.5vw + 0.4vh)';

      if (modelsParameters[idInstance].displayLabel == true) {
        if (!_.isUndefined(modelsParameters[idInstance].label)) {
          // conversion to enable HTML tags
          labelText = this.getTransformedText('label');
        }
        if (!_.isUndefined(modelsParameters[idInstance].labelWidthProportion)) {
          labelProportion = modelsParameters[idInstance].labelWidthProportion;
          widthInput = ((100 - parseInt(labelProportion)) * $('#div-for-ng-timepicker' + idWidget).width()) / 100;
        }
        if (!_.isUndefined(modelsParameters[idInstance].labelFontSize)) {
          labelFontSize = this.labelFontSize();
        }
        if (!_.isUndefined(modelsParameters[idInstance].valueFontSize)) {
          valueFontSize = 'calc(7px + ' + modelsParameters[idInstance].valueFontSize * getFontFactor() + 'vw + 0.4vh)';
        }
        LabelHtml =
          '<span class="value-span" id="time-label-span' +
          idWidget +
          '" style="width:' +
          labelProportion +
          '; ' +
          labelFontSize +
          this.labelColor() +
          this.labelFontFamily() +
          ';">' +
          labelText +
          '</span>';
      }

      var timePickerdisabled = 'disabled';
      var cursorIcon = 'cursor: inherit; ';
      if (this.bIsInteractive) {
        timePickerdisabled = '';
        cursorIcon = 'cursor: pointer; ';
      }

      var border = this.border();

      var divHeight = $('#div-for-ng-timepicker' + idWidget).height();

      var clockHtml =
        '<div id="clockpicker' +
        idWidget +
        '" >' +
        '<div class="' +
        inputClass +
        '">' +
        '<input autocomplete="off" ' +
        timePickerdisabled +
        ' placeholder="Select Time" id="clockpickerInput' +
        idWidget +
        '" ' +
        'style="' +
        cursorIcon +
        ' height: ' +
        divHeight +
        'px; border-radius: 6px; ' +
        border +
        'float: right;' +
        'padding-right: ' +
        valueFontSize.replace('(', '(3*(').replace(')', '))') +
        ';' +
        'text-align: ' +
        modelsParameters[idInstance].valueTextAlign +
        '; ' +
        'font-size: ' +
        valueFontSize +
        '; ' +
        this.valueColor() +
        this.valueFontFamily() +
        this.backgroundColor() +
        '" ' +
        'class="value-input form-control ng-pristine ng-untouched ng-valid ng-empty">' +
        '<span class="form-control-feedback" style="' +
        cursorIcon +
        'height: ' +
        divHeight +
        'px; ' +
        'display:table; margin-top: 0; top:0; padding-right: ' +
        valueFontSize +
        '"><i class="fa fa-lg fa-clock-o" ' +
        'style="display: table-cell; vertical-align: middle;' +
        cursorIcon +
        'font-size: ' +
        valueFontSize +
        ';" ' +
        '></i></span>' +
        '</div>' +
        '</div>';
      var divContent = LabelHtml + '<div style="height:100% ' + 'width: ' + widthInput + 'px;">' + clockHtml + '</div>';
      widgetHtml.innerHTML = divContent;

      $('#clockpicker' + idWidget)
        .clockpicker({
          // donetext: 'Done',
          autoclose: true,
          default: '12:00',
          init: function () {
            this.value = modelsHiddenParams[idInstance].timeValue;
          },
          beforeShow: function () {},
          afterShow: function () {},
          beforeHide: function () {},
          afterHide: function () {},
          beforeHourSelect: function () {},
          afterHourSelect: function () {},
          beforeDone: function () {},
          afterDone: function () {},
        })
        .find('input')
        .change(function () {
          modelsHiddenParams[idInstance].timeValue = this.value;
          self.updateValue();
        });

      $('#clockpickerInput' + idWidget)[0].value = modelsHiddenParams[idInstance].timeValue;

      // Manually toggle to the minutes view
      $('#check-minutes').click(function (e) {
        // Have to stop propagation here
        e.stopPropagation();
        input.clockpicker('show').clockpicker('toggleView', 'minutes');
      });
      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _TIME_DESCRIPTOR = new WidgetActuatorDescription(
      'timeValue',
      'Selected time as MM:HH',
      WidgetActuatorDescription.READ_WRITE,
      {
        $schema: WidgetPrototypesManager.SCHEMA_VERSION,
        $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:timepickerWidget',
        type: 'string',
        pattern: '^[0-2]\\d:[0-5]\\d$',
      }
    );
    this.getActuatorDescriptions = function () {
      return [_TIME_DESCRIPTOR];
    };

    this.timeValue = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].timeValue = val;
        $('#clockpickerInput' + idWidget)[0].value = val;
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].timeValue;
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
          $('#time-label-span' + idWidget).text(modelsParameters[idInstance].label);
        }
      },
      clearCaption: function () {
        modelsParameters[idInstance].label = '';
        self.render();
      },
    };
    self.render();
  };

  // Inherit from baseWidget class
  this.timepickerWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'timepicker',
    widgetsDefinitionList: {
      timepickerSimple: {
        factory: 'timepickerWidget',
        title: 'Simple clock',
        icn: 'clock',
        help: 'wdg/wdg-geo-time/#simple-clock',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
timePickerWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var timePickerWidgetsPlugin = new timePickerWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(timePickerWidgetsPlugin);
