// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Mongi BEN GAID,               │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';
import { getFontFactor } from 'kernel/dashboard/scaling/scaling-utils';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.datepickerSimple = { value: '', visibility: false };
modelsHiddenParams.datepickerVisible = { value: '', visibility: true };

// Parameters
modelsParameters.datepickerSimple = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelWidthProportion: '30%',
  valueFontSize: 0.5,
  valueColor: 'var(--widget-color)',
  valueFontFamily: 'var(--widget-font-family)',
  valueTextAlign: 'left',
  displayBorder: true,
  borderColor: 'var(--widget-border-color)',
  backgroundColor: 'var(--widget-input-color)',
};
modelsParameters.datepickerVisible = {
  label: 'labelText',
  inheritLabelFromData: false,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  valueFontSize: 0.5,
  valueColor: 'var(--widget-color)',
  valueFontFamily: 'var(--widget-font-family)',
};

// Layout (default dimensions)
modelsLayout.datepickerSimple = { height: '5vh', width: '19vw', minWidth: '150px', minHeight: '32px' };
modelsLayout.datepickerVisible = { height: '45vh', width: '22vw', minWidth: '150px', minHeight: '190px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function datePickerWidgetsPluginClass() {
  var selfClass = this;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                       Date Picker Widget                           | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.datePickerWidget = function (idDivContainer, idWidget, idInstance, bInteractive, mode) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    this.dateFieldShow = function () {
      // avoid overflow (big DropperDroite and pbs)
      var calendar = $('#ng-datepicker' + idWidget);
      if (calendar.hasClass('daterangepicker-hide')) {
        calendar.removeClass('daterangepicker-hide');
      }
    };

    this.dateFieldHide = function () {
      // avoid overflow (big DropperDroite and pbs)
      var calendar = $('#ng-datepicker' + idWidget);
      if (!calendar.hasClass('daterangepicker-hide')) {
        calendar.addClass('daterangepicker-hide');
      }
    };

    this.enable = function () {
      $('#' + idInstance + 'c').on('click', function (e, ui) {
        widgetPreview.elevateZIndex(idInstance);
        self.dateFieldShow();
      });
    };

    this.disable = function () {
      self.dateFieldHide();
    };

    this.updateValue = function (e) {
      self.dateValue.updateCallback(self.dateValue, self.dateValue.getValue());
      self.dateFieldHide();
    };

    this.getShortDate = function (date) {
      var dd = String(date.getDate()).padStart(2, '0');
      var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = date.getFullYear();

      date = yyyy + '-' + mm + '-' + dd;
      return date;
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      var visibility = false,
        display = ' ',
        displayTable = 'display: table;';
      if (modelsHiddenParams[idInstance].visibility) {
        visibility = true;
        display = 'display: none; ';
        displayTable = '';
      }
      //
      const showWidget = this.showWidget();
      let displayStyle = 'display: table;';
      if (!showWidget) {
        displayStyle = 'display: none;';
      }
      const enableWidget = this.enableWidget();
      let enableStyle = 'pointer-events: initial; opacity:initial;';
      if (!enableWidget) {
        enableStyle = 'pointer-events: none; opacity:0.5;';
      }
      //
      widgetHtml.setAttribute(
        'style',
        displayTable +
          'text-align: left; height: inherit; width: inherit; cursor: inherit;' +
          displayStyle +
          enableStyle
      );
      widgetHtml.setAttribute('id', 'div-for-ng-datepicker' + idWidget);
      $('#' + idDivContainer).html(widgetHtml);
      this.applyDisplayOnWidget();
      var heightCalender = $('#div-for-ng-datepicker' + idWidget).height();

      var modelObj = 'datepickerValues.val' + idInstance;

      var labelProportion = '100%';
      var labelText = 'labelText';
      var widthInput = $('#div-for-ng-datepicker' + idWidget).width();
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
          widthInput = ((100 - parseInt(labelProportion)) * $('#div-for-ng-datepicker' + idWidget).width()) / 100;
        }
        if (!_.isUndefined(modelsParameters[idInstance].labelFontSize)) {
          labelFontSize = this.labelFontSize();
        }
        if (!_.isUndefined(modelsParameters[idInstance].valueFontSize)) {
          valueFontSize = 'calc(7px + ' + modelsParameters[idInstance].valueFontSize * getFontFactor() + 'vw + 0.4vh)';
        }
        LabelHtml =
          '<span class="value-span" id="date-label-span' +
          idWidget +
          '" style="width:' +
          labelProportion +
          '; ' +
          labelFontSize +
          this.labelColor() +
          this.labelFontFamily() +
          '">' +
          labelText +
          '</span>';
        if (visibility) {
          var widthLab = ($('#div-for-ng-datepicker' + idWidget).width() * 80) / 100;
          var heightLab = ($('#div-for-ng-datepicker' + idWidget).height() * 20) / 100;
          LabelHtml =
            '<span class="value-span" id="date-label-span' +
            idWidget +
            '" style="width:' +
            widthLab +
            'px' +
            ';height:' +
            heightLab +
            'px' +
            ';text-align: center' +
            ';padding-bottom: 0px' +
            '; ' +
            labelFontSize +
            this.labelColor() +
            this.labelFontFamily() +
            '">' +
            labelText +
            '</span>';
        }
      }
      let dataPickerdisabled = 'disabled';
      let cursorIcon = 'cursor: inherit; ';
      if (this.bIsInteractive) {
        dataPickerdisabled = '';
        cursorIcon = 'cursor: pointer; ';
      }

      const border = this.border();

      const idCalender = 'calender-input' + idWidget;
      const divDatapicker =
        '<datepicker id="ng-datepicker' +
        idWidget +
        '" date-format="yyyy-MM-dd" datepicker-show="' +
        visibility +
        '" selector="form-control">' +
        '<div style="cursor: inherit">' +
        '<input  id="' +
        idCalender +
        '" class="value-input form-control " ' +
        'style="' +
        cursorIcon +
        ' height: ' +
        heightCalender +
        'px; border-radius: 6px; ' +
        display +
        border +
        'float: right; font-size: ' +
        valueFontSize +
        ';' +
        this.valueColor() +
        this.valueFontFamily() +
        this.backgroundColor() +
        'padding-right: ' +
        valueFontSize.replace('(', '(3*(').replace(')', '))') +
        ';' +
        'text-align: ' +
        modelsParameters[idInstance].valueTextAlign +
        ';' +
        ' " ' +
        'ng-model="' +
        modelObj +
        '.currentDate" ' +
        dataPickerdisabled +
        ' placeholder="Choose a date"/>' +
        '<span class="form-control-feedback" style="cursor: inherit; display: table;' +
        'margin-top:0; top:0; ' +
        'padding-right: ' +
        valueFontSize +
        '; height: ' +
        heightCalender +
        'px;' +
        '"><i class="fa fa-lg fa-calendar" style="display: table-cell; vertical-align: middle;' +
        ' font-size:' +
        valueFontSize +
        '"></i>' +
        '</span>' +
        '</div>' +
        '</datepicker>';
      var divContentTemplate = LabelHtml + '<div style="cursor: inherit; height: 100%"> ' + divDatapicker + '</div> ';

      if (visibility) {
        var styleL = 'height: 100%; width: 100%';
        if (modelsParameters[idInstance].displayLabel) {
          styleL = 'height: 80%; width: 80%';
        }
        divContentTemplate = '<div style="' + styleL + '"> ' + divDatapicker + '</div> ' + LabelHtml;
      }
      var divContent = angular.element(divContentTemplate);

      var target = document.getElementById('div-for-ng-datepicker' + idWidget);
      angular.element(target).append(divContent);

      angular
        .element(document.body)
        .injector()
        .invoke([
          '$compile',
          '$rootScope',
          function ($compile, $rootScope) {
            var scope = angular.element(divContent).scope();

            if (!$rootScope.datepickerValues) {
              $rootScope.datepickerValues = {};
            }
            if (!$rootScope.datepickerValues['val' + idInstance]) {
              $rootScope.datepickerValues['val' + idInstance] = {
                currentDate: self.getShortDate(new Date()),
              };
            }
            if (modelsHiddenParams[idInstance]) {
              if (!modelsHiddenParams[idInstance].value) {
                var today = new Date();
                modelsHiddenParams[idInstance].value = self.getShortDate(today);
              }
              $rootScope.datepickerValues['val' + idInstance] = {
                currentDate: modelsHiddenParams[idInstance].value,
              };
            }
            $rootScope.$watch(
              'datepickerValues.val' + idInstance,
              function () {
                self.updateValue();
              },
              true
            );

            $compile(divContent)(scope);
          },
        ]);

      self.dateFieldHide(); // hide overflow of hidden calendar (very bad for row/col mode)

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _DATE_DESCRIPTOR = new WidgetActuatorDescription(
      'dateValue',
      'Selected date as YYYY-MM-DD',
      WidgetActuatorDescription.READ_WRITE,
      {
        $schema: WidgetPrototypesManager.SCHEMA_VERSION,
        $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:datePickerWidgetSemi',
        type: 'string',
        pattern: '^\\d\\d\\d\\d-[0-1]\\d-[0-3]\\d$',
      }
    );
    this.getActuatorDescriptions = function () {
      return [_DATE_DESCRIPTOR];
    };

    this.dateValue = {
      updateCallback: function () {},
      setValue: function (val) {
        var parsedDate = Date.parse(val);
        if (_.isNaN(parsedDate)) return;
        modelsHiddenParams[idInstance].value = self.getShortDate(new Date(parsedDate));
        angular
          .element(document.body)
          .injector()
          .invoke([
            '$compile',
            '$rootScope',
            function ($compile, $rootScope) {
              if ($rootScope.datepickerValues['val' + idInstance]) {
                $rootScope.datepickerValues['val' + idInstance].currentDate = modelsHiddenParams[idInstance].value;
                $rootScope.safeApply();
              }
            },
          ]);
      },
      getValue: function () {
        var val = null;
        angular
          .element(document.body)
          .injector()
          .invoke([
            '$compile',
            '$rootScope',
            function ($compile, $rootScope) {
              if ($rootScope.datepickerValues['val' + idInstance]) {
                val = $rootScope.datepickerValues['val' + idInstance].currentDate;
                modelsHiddenParams[idInstance].value = val;
              }
            },
          ]);
        return val;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
      setCaption: function (caption, bCaptionManuallyChanged) {
        if (modelsParameters[idInstance].inheritLabelFromData) {
          self.captionHelper(caption, self.bIsInteractive, bCaptionManuallyChanged);
          $('#date-label-span' + idWidget).text(modelsParameters[idInstance].label);
        }
      },
      clearCaption: function () {
        if (modelsParameters[idInstance].inheritLabelFromData) {
          modelsParameters[idInstance].label = '';
        }
        self.render();
      },
    };
    self.render();
  };

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                        Dispatch functions                          | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  this.datePickerWidgetSemi = function (idDivContainer, idWidget, idInstance, bInteractive) {
    return new selfClass.datePickerWidget(idDivContainer, idWidget, idInstance, bInteractive, 'semi');
  };

  this.datePickerWidgetFull = function (idDivContainer, idWidget, idInstance, bInteractive) {
    return new selfClass.datePickerWidget(idDivContainer, idWidget, idInstance, bInteractive, 'full');
  };

  // Inherit from baseWidget class
  this.datePickerWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'datepicker',
    widgetsDefinitionList: {
      datepickerSimple: {
        factory: 'datePickerWidgetSemi',
        title: 'Simple calender',
        icn: 'calendar',
        help: 'wdg/wdg-geo-time/#simple-calendar',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
datePickerWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var datePickerWidgetsPlugin = new datePickerWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(datePickerWidgetsPlugin);
