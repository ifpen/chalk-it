// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir El FEKI, Ghiles HIDEUR   │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import 'flat-ui.alt';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';
import { getFontFactor } from 'kernel/dashboard/scaling/scaling-utils';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

// Needed for Flat-Ui
String.prototype.repeat = function (num) {
  return new Array(Math.round(num) + 1).join(this);
};

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.flatUiHorizontalSlider = { value: 0 };
modelsHiddenParams.flatUiVerticalSlider = { value: 0 };
modelsHiddenParams.flatUiProgressBar = { value: 0 };
modelsHiddenParams.flatUiTextInput = { value: '' };
modelsHiddenParams.flatUiNumericInput = { value: '' };
modelsHiddenParams.flatUiValueDisplay = { value: '' };

// Parameters
modelsParameters.flatUiHorizontalSlider = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  rangeActuator: false,
  min: 0,
  max: 100,
  step: 1,
  displayValue: true,
  validationOnFocusOut: true,
  valueFontSize: 0.5,
  valueFontFamily: 'var(--widget-font-family)',
  valueBorderColor: 'var(--widget-border-color)',
  labelWidthProportion: '20%',
  sliderWidthProportion: '60%',
  valueWidthProportion: '20%',
  sliderRangeColor: 'var(--widget-range-color)',
  sliderSegmentColor: 'var(--widget-segment-color)',
  sliderHandleDefaultColor: 'var(--widget-handle-default-color)',
  sliderHandleHoverColor: 'var(--widget-handle-hover-color)',
  sliderHandleActiveColor: 'var(--widget-handle-active-color)',
  valueColor: 'var(--widget-color)',
  unit: 'unitText',
  displayUnit: false,
  unitFontSize: 0.5,
};
modelsParameters.flatUiVerticalSlider = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  rangeActuator: false,
  min: 0,
  max: 100,
  step: 1,
  sliderRangeColor: 'var(--widget-range-color)',
  sliderSegmentColor: 'var(--widget-segment-color)',
  sliderHandleDefaultColor: 'var(--widget-handle-default-color)',
  sliderHandleHoverColor: 'var(--widget-handle-hover-color)',
  sliderHandleActiveColor: 'var(--widget-handle-active-color)',
};
modelsParameters.flatUiProgressBar = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  rangeActuator: false,
  min: 0,
  max: 100,
  displayValue: false,
  valueFontSize: 0.5,
  valueFontFamily: 'var(--widget-font-family)',
  labelWidthProportion: '20%',
  progressBarWidthProportion: '60%',
  valueWidthProportion: '20%',
  progressBarRangeColor: 'var(--widget-range-color)',
  progressBarSegmentColor: 'var(--widget-segment-color)',
  valueColor: 'var(--widget-color)',
};
modelsParameters.flatUiTextInput = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  labelTextAlign: 'left',
  labelTextPosition: 'left',
  valueWidthProportion: '70%',
  validationButton: false,
  validationBtnDefaultColor: 'var(--widget-button-primary-color)',
  validationBtnActiveColor: 'var(--widget-button-active-color)',
  validationBtnHoverColor: 'var(--widget-button-hover-color)',
  validationOnFocusOut: true,
  isPassword: false,
  valueFontSize: 0.5,
  valueColor: 'var(--widget-input-text)',
  valueFontFamily: 'var(--widget-font-family)',
  valueTextAlign: 'left',
  displayBorder: true,
  borderColor: 'var(--widget-border-color)',
  backgroundColor: 'var(--widget-input-color)',
};
modelsParameters.flatUiNumericInput = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  labelTextAlign: 'left',
  labelTextPosition: 'left',
  valueWidthProportion: '70%',
  validationButton: false,
  validationBtnDefaultColor: 'var(--widget-button-primary-color)',
  validationBtnActiveColor: 'var(--widget-button-active-color)',
  validationBtnHoverColor: 'var(--widget-button-hover-color)',
  validationOnFocusOut: true,
  valueFontSize: 0.5,
  valueColor: 'var(--widget-input-text)',
  valueFontFamily: 'var(--widget-font-family)',
  valueTextAlign: 'left',
  displayBorder: true,
  borderColor: 'var(--widget-border-color)',
  backgroundColor: 'var(--widget-input-color)',
  unit: 'unitText',
  displayUnit: false,
  unitFontSize: 0.5,
};
modelsParameters.flatUiValueDisplay = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  labelTextAlign: 'left',
  valueWidthProportion: '70%',
  valueFontSize: 0.5,
  valueColor: 'var(--widget-input-text)',
  valueFontFamily: 'var(--widget-font-family)',
  valueTextAlign: 'left',
  displayBorder: true,
  borderColor: 'var(--widget-border-color)',
  backgroundColor: 'var(--widget-input-color)',
  unit: 'unitText',
  displayUnit: false,
  unitFontSize: 0.5,
};
modelsParameters.flatUiButton = {
  text: 'Push button',
  numberOfTriggers: 1,
  fileInput: false,
  binaryFileInput: false,
  buttonFontSize: 0.3,
  displayIcon: false,
  fontAwesomeIcon: '',
  buttonFontFamily: 'var(--widget-font-family)',
  buttonTextColor: 'var(--widget-button-primary-text)',
  buttonDefaultColor: 'var(--widget-button-primary-color)',
  buttonActiveColor: 'var(--widget-button-active-color)',
  buttonHoverColor: 'var(--widget-button-hover-color)',
};
modelsParameters.flatUiFileInputButton = {
  text: 'File load button',
  numberOfTriggers: 1,
  fileInput: true,
  binaryFileInput: false,
  buttonFontSize: 0.3,
  displayIcon: false,
  fontAwesomeIcon: '',
  buttonFontFamily: 'var(--widget-font-family)',
  buttonTextColor: 'var(--widget-button-primary-text)',
  buttonDefaultColor: 'var(--widget-button-primary-color)',
  buttonActiveColor: 'var(--widget-button-active-color)',
  buttonHoverColor: 'var(--widget-button-hover-color)',
};

// Layout (default dimensions)
modelsLayout.flatUiHorizontalSlider = { height: '5vh', width: '24vw', minWidth: '200px', minHeight: '24px' };
modelsLayout.flatUiVerticalSlider = { height: '20vh', width: '5vw', minWidth: '32px', minHeight: '50px' };
modelsLayout.flatUiProgressBar = { height: '5vh', width: '24vw', minWidth: '200px', minHeight: '24px' };
modelsLayout.flatUiTextInput = { height: '5vh', width: '19vw', minWidth: '150px', minHeight: '24px' };
modelsLayout.flatUiNumericInput = { height: '5vh', width: '19vw', minWidth: '150px', minHeight: '24px' };
modelsLayout.flatUiValueDisplay = { height: '5vh', width: '19vw', minWidth: '150px', minHeight: '24px' };
modelsLayout.flatUiButton = { height: '7vh', width: '9vw', minWidth: '55px', minHeight: '24px' };
modelsLayout.flatUiFileInputButton = { height: '7vh', width: '9vw', minWidth: '55px', minHeight: '24px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function flatUiWidgetsPluginClass() {
  const self = this;
  // Flat-Ui sliders initialization
  (function ($) {
    // Add segments to a slider
    $.fn.addSliderSegments = function () {
      return this.each(function () {
        var $this = $(this),
          option = $this.slider('option'),
          amount = (option.max - option.min) / option.step,
          orientation = option.orientation;
        if ('vertical' === orientation) {
          var output = '',
            i;
          for (var i = 1; i <= amount - 1; i++) {
            output += '<div class="ui-slider-segment" style="top:' + (100 / amount) * i + '%;"></div>';
          }
          $this.prepend(output);
        } else {
          var segmentGap = 100 / amount + '%';
          var segment = '<div class="ui-slider-segment" style="margin-left: ' + segmentGap + ';"></div>';
          $this.prepend(segment.repeat(amount - 1));
        }
      });
    };
  })(jQuery);

  // +--------------------------------------------------------------------¦ \\
  // |                             Button                                 | \\
  // +--------------------------------------------------------------------¦ \\
  this.buttonFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;

    this.numberOfTriggers = modelsParameters[idInstance].numberOfTriggers;

    this.enable = function () {};

    this.disable = function () {};

    this.readFileEvt = function () {
      const input = $('#button' + idWidget + '_select_file');
      input.on('change', function (e) {
        const reader = new FileReader();
        const file = e.target.files[0];
        const fileSize = file.size;
        let fileSizeFormat = '';

        if (fileSize < 1024) {
          fileSizeFormat = `${fileSize} bytes`;
        } else if (fileSize < 1_048_576) {
          fileSizeFormat = `${(fileSize / 1024).toFixed(1)} KB`; // 1024 * 1024
        } else {
          fileSizeFormat = `${(fileSize / 1_048_576).toFixed(1)} MB`; // 1024 * 1024
        }

        const result = {
          type: file.type,
          size: fileSizeFormat,
          name: file.name,
        };
        reader.addEventListener('load', function (event) {
          const data = event.target.result;
          if (data instanceof ArrayBuffer) {
            result.content = btoa(
              [].reduce.call(
                new Uint8Array(data),
                function (p, c) {
                  return p + String.fromCharCode(c);
                },
                ''
              )
            );
            result.isBinary = true;
          } else {
            result.content = data;
            result.isBinary = false;
          }

          self.notifyNewValue(result);
        });

        if (modelsParameters[idInstance].binaryFileInput) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      });
      $('#button' + idWidget).mousedown(function (e) {
        e.preventDefault();
        input.trigger('click');
      });
    };

    this.notifyNewValue = function (value) {
      this.fileContent = value;
      for (let i = 1; i <= this.numberOfTriggers; i++) {
        const act = this[`trigger${i}`];
        act.updateCallback(act);
      }
    };

    this.rescale = function () {
      this.render();
    };

    function displaySpinnerOnInputFileButton(idWidget) {
      const self = this;
      const aElement = document.getElementById('button' + idWidget);
      const inputElement = document.getElementById('button' + idWidget + '_select_file');
      const iElement = document.createElement('i');
      let timeoutId;

      this.disableButton = function () {
        // disable until request finished
        aElement.classList.add('disabled');
        iElement.setAttribute('id', 'icon' + idWidget);
        iElement.setAttribute('class', 'fa fa-spinner fa-spin');
        aElement.append(iElement);
      };
      this.enableButton = function () {
        aElement.classList.remove('disabled');
        if (!!iElement) {
          iElement.remove();
        }
      };

      this.disableButton();
      inputElement.onchange = function () {
        clearTimeout(timeoutId);
        document.body.focus();
        self.enableButton();
      };
      document.body.onfocus = function () {
        timeoutId = setTimeout(() => {
          self.enableButton();
          document.body.onfocus = null;
        }, 200);
      };
    }

    function updateDataNodeFromWidgetwithspinButton(idInstance, idWidget) {
      if (_.isUndefined(widgetConnector.widgetsConnection[idInstance])) return;
      const sliders = widgetConnector.widgetsConnection[idInstance].sliders;
      const dnNames = [];
      if (!_.isUndefined(sliders)) {
        for (const trigger in sliders) {
          const dataNodeName = sliders[trigger].dataNode;
          if (dataNodeName != 'None') {
            dnNames.push(datanodesManager.getDataNodeByName(dataNodeName).name());
          }
        }

        if (dnNames.length > 0) {
          const widgetElement = document.getElementById('button' + idWidget);
          const iElement = document.createElement('i');
          iElement.setAttribute('id', 'icon' + idWidget);
          datanodesManager.getDataNodeByName(dnNames[0]).schedulerStart(dnNames, dnNames[0], 'triggerButton');
          const intervalId = setInterval(function () {
            const pendings = [];
            dnNames.forEach((element) => {
              if (datanodesManager.getDataNodeByName(element).status() == 'Pending') {
                // check if datanode is in Pending state
                $('#button' + idWidget).attr('class', 'btn btn-table-cell btn-lg disabled'); // disable until request finished
                pendings.push(true);
                // Just do it if one datanode has "Pending" status. And do it only once
                if (!widgetElement.contains(iElement)) {
                  if (!iElement.classList.contains('fa', 'fa-spinner', 'fa-spin')) {
                    iElement.classList.add('fa', 'fa-spinner', 'fa-spin');
                  }
                  widgetElement.append(iElement);
                }
              }
            });
            if (pendings.length == 0) {
              $(iElement).remove();
              $('#button' + idWidget).attr('class', 'btn btn-table-cell btn-lg ' + idInstance + 'widgetCustomColor ');
              clearInterval(intervalId);
            }
          }, 100);
        }
      }
    }

    this.render = function () {
      const widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'button-widget-html' + idWidget);
      widgetHtml.setAttribute('class', 'button-widget-html');
      const valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 2); // keepRatio
      let fontSize = 0.5;
      if (!_.isUndefined(modelsParameters[idInstance].buttonFontSize)) {
        fontSize = modelsParameters[idInstance].buttonFontSize;
      }
      const styles = `height: inherit; font-size: calc(7px + ${
        fontSize * getFontFactor()
      }vw + 0.4vh); ${this.buttonFontFamily()}`;
      const classes = `btn btn-table-cell btn-lg ${idInstance}widgetCustomColor`;

      this.setButtonColorStyle();

      // conversion to enable HTML tags
      const text = this.getTransformedText('text');
      let content = text;
      const hasIcon = this.displayIcon();
      if (hasIcon) {
        const iconClass = this.fontAwesomeIcon();
        const icon = '<i class="' + iconClass + '"></i>';
        content = icon + ' ' + text;
      }

      const divContent = document.createElement('a');
      divContent.innerHTML = content;
      divContent.id = 'button' + idWidget;
      divContent.style = styles;
      divContent.classList = classes;
      if (this.bIsInteractive) {
        if (modelsParameters[idInstance].fileInput || modelsParameters[idInstance].binaryFileInput) {
          const fileInput = document.createElement('input');
          fileInput.id = `button${idWidget}_select_file`;
          fileInput.type = 'file';
          fileInput.style = 'display : none;';
          fileInput.onclick = function () {
            displaySpinnerOnInputFileButton.bind(this)(idWidget);
          };
          divContent.appendChild(fileInput);
        } else {
          divContent.onclick = () => updateDataNodeFromWidgetwithspinButton(idInstance, idWidget);
        }
        self.enable();
      } else {
        self.disable();
      }
      widgetHtml.replaceChildren(divContent);

      widgetHtml.setAttribute('style', 'height: ' + valueHeightPx + 'px;');
      $('#' + idDivContainer).html(widgetHtml);

      if (modelsParameters[idInstance].fileInput || modelsParameters[idInstance].binaryFileInput) {
        self.readFileEvt();
      }
    };

    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];

      const result = [];
      if (data && data.numberOfTriggers) {
        const isFile = data.fileInput || data.binaryFileInput;
        for (let i = 1; i <= data.numberOfTriggers; i++) {
          const name = 'trigger' + i;
          if (isFile) {
            result.push(new WidgetActuatorDescription(name, 'File content', WidgetActuatorDescription.WRITE));
          } else {
            result.push(
              new WidgetActuatorDescription(
                name,
                'Node to trigger/re-evaluate',
                WidgetActuatorDescription.TRIGGER,
                WidgetPrototypesManager.SCHEMA_ANYTHING
              )
            );
          }
        }
      }
      return result;
    };

    for (let i = 1; i <= this.numberOfTriggers; i++) {
      const triggerName = 'trigger' + i;
      this[triggerName] = {
        setValue: function (val) {},
        getValue: function () {
          return self.fileContent;
        },

        updateCallback: function () {},
        addValueChangedHandler: function (updateDataFromWidget) {
          this.updateCallback = updateDataFromWidget;
          self.enable();
        },
        removeValueChangedHandler: function (updateDataFromWidget) {
          self.disable();
        },
      };
    }

    self.render();
  };

  // Inherit from baseWidget class
  this.buttonFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                        Horizontal Slider                           | \\
  // +--------------------------------------------------------------------¦ \\
  this.horizontalSliderFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    self.updateValue = function (e) {
      var val = Number($('#hslider-value' + idWidget)[0].value);
      $('#slider' + idWidget).slider({ value: val });
      // TODO : type check at assignement. Highlight error and type mismatch
      modelsHiddenParams[idInstance].value = val;
      self.value.updateCallback(self.value, self.value.getValue());
      e.preventDefault();
    };

    this.enable = function () {
      $('#slider' + idWidget).on('slidestop', function (e, ui) {
        self.value.setValue(ui.value);
        self.value.updateCallback(self.value, ui);
      });
      $('#slider' + idWidget).on('slide', function (e, ui) {
        self.value.setValue(ui.value);
      });
      $('#slider' + idWidget).slider('enable');

      if (modelsParameters[idInstance].validationOnFocusOut) {
        $('#hslider-value' + idWidget).on('focusout', function (e, ui) {
          self.updateValue(e);
        });
      }

      if (modelsParameters[idInstance].displayValue) {
        $('#hslider-value' + idWidget).prop('disabled', false);
        $('#hslider-value' + idWidget).on('keypress', function (e, ui) {
          if (e.which == 13) {
            self.updateValue(e);
          }
        });
      }
    };

    this.disable = function () {
      $('#slider' + idWidget).on('slide', function (e, ui) {});
      $('#slider' + idWidget).on('slidestop', function (e, ui) {});
      $('#slider' + idWidget).slider('disable');
      if (modelsParameters[idInstance].displayValue) {
        $('#hslider-value' + idWidget).prop('disabled', true);
      }
    };

    //  self.labelWidthPx = 0;

    this.insertLabel = function (widgetHtml) {
      // conversion to enable HTML tags
      const labelText = this.getTransformedText('label');
      const widgetLabel = document.createElement('span');
      widgetLabel.setAttribute('class', 'label-h-slider');
      widgetLabel.setAttribute('id', 'h-slider-span');
      if (!_.isUndefined(modelsParameters[idInstance].labelWidthProportion)) {
        widgetLabel.setAttribute(
          'style',
          'width:' +
            modelsParameters[idInstance].labelWidthProportion +
            '; ' +
            this.labelFontSize() +
            this.labelColor() +
            this.labelFontFamily()
        );
      } else {
        widgetLabel.setAttribute(
          'style',
          'width: 20%; ' + this.labelFontSize() + this.labelColor() + this.labelFontFamily()
        );
      }
      widgetLabel.innerHTML = labelText;
      widgetHtml.appendChild(widgetLabel);
    };

    this.insertValue = function (widgetHtml) {
      var valueHeightPx;
      if (modelsParameters[idInstance].displayLabel)
        valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 6); // keepRatio
      else valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 8); // keepRatio
      var valueHtml = document.createElement('div');
      valueHtml.setAttribute('class', 'h-slider-value-div');
      valueHtml.setAttribute('id', 'div-for-hslider-value' + idWidget);
      if (!_.isUndefined(modelsParameters[idInstance].valueWidthProportion)) {
        valueHtml.setAttribute('style', 'width:' + modelsParameters[idInstance].valueWidthProportion + ';');
      } else {
        valueHtml.setAttribute('style', 'width:30%;');
      }
      var hsliderValueCursor = '';
      if (this.bIsInteractive) {
        hsliderValueCursor = 'cursor: text;';
      } else {
        hsliderValueCursor = 'cursor: inherit;';
      }
      var valueContent =
        '<input id="hslider-value' +
        idWidget +
        '" type="text" placeholder="" class="hslider-input form-control" style="height: ' +
        valueHeightPx +
        'px; ' +
        this.valueFontSize() +
        this.valueColor() +
        this.valueFontFamily() +
        hsliderValueCursor +
        '" disabled></input>';

      valueHtml.innerHTML = valueContent;
      widgetHtml.appendChild(valueHtml);
    };

    /* this.computeDimensions = function () {
             var sliderContainerWidthPx = $('#' + idDivContainer).width();    // in px
             self.sliderWidthPx = sliderContainerWidthPx;
             var sliderHeightPx = $('#' + idDivContainer).height();  // in px
             self.divSliderInputMarginTop = (sliderHeightPx / 2) - 16;

             if (modelsParameters[idInstance].displayLabel) {
                 self.labelWidthPx = Math.round(modelsParameters[idInstance].labelWidth * document.documentElement.clientWidth / 100) - 1;
                 self.sliderWidthPx = Math.round(self.sliderWidthPx - self.labelWidthPx - 4) - 1;
             }

             if (modelsParameters[idInstance].displayValue) {
                 self.valueWidthPx = Math.round(modelsParameters[idInstance].valueWidth * (document.documentElement.clientWidth / 100)) - 1;
                 self.sliderWidthPx = Math.round(self.sliderWidthPx - self.valueWidthPx - 4) - 1;
                 if (self.sliderWidthPx < 40) {
                     self.sliderWidthPx = 40;
                     self.labelWidthPx = Math.round(sliderContainerWidthPx - 40 - self.valueWidthPx - 8) - 1;
                 }
             }
         }*/

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      //self.computeDimensions();
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('class', 'sliderInput');
      widgetHtml.setAttribute('style', 'display: table');

      var widgetDiv = document.createElement('div');
      widgetDiv.setAttribute('id', 'h-slider-div');
      if (!_.isUndefined(modelsParameters[idInstance].sliderWidthProportion)) {
        widgetDiv.setAttribute('style', 'width:' + modelsParameters[idInstance].sliderWidthProportion + ';');
      } else {
        widgetDiv.setAttribute('style', 'width:50%;');
      }
      var widgetCore = document.createElement('div');
      widgetCore.setAttribute('id', 'slider' + idWidget);
      widgetDiv.appendChild(widgetCore);

      if (modelsParameters[idInstance].displayLabel) {
        this.insertLabel(widgetHtml);
      }

      widgetHtml.appendChild(widgetDiv);
      if (modelsParameters[idInstance].displayValue) {
        this.insertValue(widgetHtml);
      }
      //AEF: add unitText
      if (modelsParameters[idInstance].unit != '' && modelsParameters[idInstance].displayUnit) {
        const widgetUnit = document.createElement('span');
        widgetUnit.setAttribute('class', 'value-span');
        widgetUnit.setAttribute(
          'style',
          'max-width: 45%; font-size: calc(7px + ' +
            modelsParameters[idInstance].unitFontSize * getFontFactor() +
            'vw + 0.4vh);'
        );
        widgetUnit.setAttribute('id', 'unit-span' + idWidget);
        widgetUnit.innerHTML = modelsParameters[idInstance].unit;
        widgetHtml.appendChild(widgetUnit);
      }

      $('#' + idDivContainer).html(widgetHtml);
      var $slider = $('#slider' + idWidget);
      if ($slider.length > 0) {
        $slider
          .slider({
            min: modelsParameters[idInstance].min,
            max: modelsParameters[idInstance].max,
            step: modelsParameters[idInstance].step,
            value: modelsHiddenParams[idInstance].value,
            orientation: 'horizontal',
            range: 'min',
          })
          .addSliderSegments();
      }
      $('#slider' + idWidget).addClass('h-slider-div-div');

      document.styleSheets[0].addRule('#slider' + idWidget, this.sliderSegmentColor());
      document.styleSheets[0].addRule('#slider' + idWidget + ' > .ui-slider-range', this.sliderRangeColor());
      document.styleSheets[0].addRule('#slider' + idWidget + ' > .ui-slider-handle', this.sliderHandleDefaultColor());
      document.styleSheets[0].addRule(
        '#slider' + idWidget + ' > .ui-slider-handle:hover',
        this.sliderHandleHoverColor()
      );
      document.styleSheets[0].addRule(
        '#slider' + idWidget + ' > .ui-slider-handle:active',
        this.sliderHandleActiveColor()
      );
      document.styleSheets[0].addRule('#hslider-value' + idWidget, this.valueBorderColor());

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }

      if (modelsParameters[idInstance].displayValue) {
        if (modelsParameters[idInstance].min > modelsHiddenParams[idInstance].value) {
          $('#hslider-value' + idWidget)[0].value = modelsParameters[idInstance].min;
        } else {
          $('#hslider-value' + idWidget)[0].value = modelsHiddenParams[idInstance].value;
        }
      }
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Current value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    const _MIN_DESCRIPTOR = new WidgetActuatorDescription(
      'min',
      'Value lower bound',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    const _MAX_DESCRIPTOR = new WidgetActuatorDescription(
      'max',
      'Value upper bound',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      const result = [_VALUE_DESCRIPTOR];

      if (data && data.rangeActuator) {
        result.push(_MIN_DESCRIPTOR);
        result.push(_MAX_DESCRIPTOR);
      }

      return result;
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        $('#slider' + idWidget).slider({ value: val });
        if (modelsParameters[idInstance].displayValue) {
          $('#hslider-value' + idWidget)[0].value = val;
        }
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].value; // $("#slider" + idWidget).slider("value");
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
        if (modelsParameters[idInstance].inheritLabelFromData) {
          modelsParameters[idInstance].label = '';
        }
        self.render();
      },
    };

    this.max = {
      updateCallback: function () {},
      setValue: function (valArg) {
        const val = Number(valArg);
        if (!typeof val === 'number') {
          return;
        }
        modelsParameters[idInstance].max = val;
        self.render();
      },
      getValue: function () {
        return modelsParameters[idInstance].max;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    this.min = {
      updateCallback: function () {},
      setValue: function (valArg) {
        const val = Number(valArg);
        if (!typeof val === 'number') {
          return;
        }
        modelsParameters[idInstance].min = val;
        self.render();
      },
      getValue: function () {
        return modelsParameters[idInstance].min;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.horizontalSliderFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                         Vertical Slider                            | \\
  // +--------------------------------------------------------------------¦ \\
  this.verticalSliderFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    this.enable = function (updateDataFromWidget) {
      $('#vertical-slider' + idWidget).on('slidestop', function (e, ui) {
        self.value.setValue(ui.value);
        self.value.updateCallback(self.value, ui);
      });
      $('#vertical-slider' + idWidget).on('slide', function (e, ui) {
        self.value.setValue(ui.value);
      });
      $('#vertical-slider' + idWidget).slider('enable');
    };

    this.disable = function () {
      $('#vertical-slider' + idWidget).on('slidestop', function (e, ui) {});
      $('#vertical-slider' + idWidget).on('slide', function (e, ui) {});
      $('#vertical-slider' + idWidget).slider('disable');
    };

    this.insertLabel = function (widgetHtml) {
      // conversion to enable HTML tags
      const labelText = this.getTransformedText('label');
      const widgetLabelDiv = document.createElement('div');
      widgetLabelDiv.setAttribute('class', 'v-slider-div');
      const widgetLabel = document.createElement('span');
      widgetLabel.setAttribute('class', 'v-slider-span label-v-slider');
      widgetLabel.setAttribute('style', this.labelFontSize() + this.labelColor() + this.labelFontFamily());
      widgetLabel.innerHTML = labelText;
      widgetLabelDiv.appendChild(widgetLabel);
      widgetHtml.appendChild(widgetLabelDiv);
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('class', 'sliderInput');
      var widgetCore = document.createElement('div');
      widgetCore.setAttribute('id', 'vertical-slider' + idWidget);
      widgetCore.setAttribute('class', 'v-slider-div-div');
      widgetCore.setAttribute('style', 'height: calc(100% - 24px);');
      widgetHtml.appendChild(widgetCore);

      if (modelsParameters[idInstance].displayLabel && modelsParameters[idInstance].label != '') {
        widgetCore.setAttribute('style', 'height: 80%;');
        this.insertLabel(widgetHtml);
      }

      $('#' + idDivContainer).html(widgetHtml);
      var $verticalSlider = $('#vertical-slider' + idWidget);
      if ($verticalSlider.length > 0) {
        $verticalSlider
          .slider({
            min: modelsParameters[idInstance].min,
            max: modelsParameters[idInstance].max,
            step: modelsParameters[idInstance].step,
            value: modelsHiddenParams[idInstance].value,
            orientation: 'vertical',
            range: 'min',
          })
          .addSliderSegments($verticalSlider.slider('option').max, 'vertical');
      }

      document.styleSheets[0].addRule('#vertical-slider' + idWidget, this.sliderSegmentColor());
      document.styleSheets[0].addRule('#vertical-slider' + idWidget + ' > .ui-slider-range', this.sliderRangeColor());
      document.styleSheets[0].addRule(
        '#vertical-slider' + idWidget + ' > .ui-slider-handle',
        this.sliderHandleDefaultColor()
      );
      document.styleSheets[0].addRule(
        '#vertical-slider' + idWidget + ' > .ui-slider-handle:hover',
        this.sliderHandleHoverColor()
      );
      document.styleSheets[0].addRule(
        '#vertical-slider' + idWidget + ' > .ui-slider-handle:active',
        this.sliderHandleActiveColor()
      );

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Current value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    const _MIN_DESCRIPTOR = new WidgetActuatorDescription(
      'min',
      'Value lower bound',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    const _MAX_DESCRIPTOR = new WidgetActuatorDescription(
      'max',
      'Value upper bound',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      const result = [_VALUE_DESCRIPTOR];

      if (data && data.rangeActuator) {
        result.push(_MIN_DESCRIPTOR);
        result.push(_MAX_DESCRIPTOR);
      }

      return result;
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        $('#vertical-slider' + idWidget).slider({ value: val });
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].value; // $("#vertical-slider" + idWidget).slider("value");
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
        if (modelsParameters[idInstance].inheritLabelFromData) {
          modelsParameters[idInstance].label = '';
        }
        self.render();
      },
    };

    this.max = {
      updateCallback: function () {},
      setValue: function (valArg) {
        const val = Number(valArg);
        if (!typeof val === 'number') {
          return;
        }
        modelsParameters[idInstance].max = val;
      },
      getValue: function () {
        return modelsParameters[idInstance].max;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    this.min = {
      updateCallback: function () {},
      setValue: function (valArg) {
        const val = Number(valArg);
        if (!typeof val === 'number') {
          return;
        }
        modelsParameters[idInstance].min = val;
      },
      getValue: function () {
        return modelsParameters[idInstance].min;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.verticalSliderFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                         Progress Bar                               | \\
  // +--------------------------------------------------------------------¦ \\
  this.progressBarFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    this.enable = function () {
      if (modelsParameters[idInstance].displayValue) {
        $('#progress-bar-value' + idWidget).prop('disabled', false);
      }
    };

    this.disable = function () {
      if (modelsParameters[idInstance].displayValue) {
        $('#progress-bar-value' + idWidget).prop('disabled', true);
      }
    };

    this.insertLabel = function (widgetHtml) {
      // conversion to enable HTML tags
      const labelText = this.getTransformedText('label');
      const widgetLabel = document.createElement('span');
      widgetLabel.setAttribute('class', 'label-progress-bar');
      widgetLabel.setAttribute('id', 'progress-bar-span');
      if (!_.isUndefined(modelsParameters[idInstance].labelWidthProportion)) {
        widgetLabel.setAttribute(
          'style',
          'width:' +
            modelsParameters[idInstance].labelWidthProportion +
            '; ' +
            this.labelFontSize() +
            this.labelColor() +
            this.labelFontFamily()
        );
      } else {
        widgetLabel.setAttribute(
          'style',
          'width: 20%; ' + this.labelFontSize() + this.labelColor() + this.labelFontFamily()
        );
      }
      widgetLabel.innerHTML = labelText;
      widgetHtml.appendChild(widgetLabel);
    };

    this.insertValue = function (widgetHtml) {
      var valueHeightPx;
      if (modelsParameters[idInstance].displayLabel)
        valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 6); // keepRatio
      else valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 8); // keepRatio
      var valueHtml = document.createElement('div');
      valueHtml.setAttribute('class', 'progress-bar-value-div');
      valueHtml.setAttribute('id', 'div-for-progress-bar-value' + idWidget);
      if (!_.isUndefined(modelsParameters[idInstance].valueWidthProportion)) {
        valueHtml.setAttribute('style', 'width:' + modelsParameters[idInstance].valueWidthProportion + ';');
      } else {
        valueHtml.setAttribute('style', 'width:30%;');
      }
      var progressBarValueCursor = '';
      if (this.bIsInteractive) {
        progressBarValueCursor = 'cursor: text;';
      } else {
        progressBarValueCursor = 'cursor: inherit;';
      }
      var valueContent =
        '<input id="progress-bar-value' +
        idWidget +
        '" type="text" placeholder="" class="hslider-input form-control" style="height: ' +
        valueHeightPx +
        'px; ' +
        this.valueFontSize() +
        this.valueColor() +
        this.valueFontFamily() +
        progressBarValueCursor +
        '" disabled></input>';

      valueHtml.innerHTML = valueContent;
      widgetHtml.appendChild(valueHtml);
    };

    this.updateProgressBarWidth = function () {
      if (!_.isUndefined(modelsHiddenParams[idInstance].value)) {
        var val = modelsHiddenParams[idInstance].value;
        var progressBarDiv = $('#progress-bar' + idWidget + ' div');
        var valMin = modelsParameters[idInstance].min;
        var valMax = modelsParameters[idInstance].max;
        var percentWidth;
        if (val <= valMin) {
          percentWidth = 0;
        } else {
          percentWidth = Math.ceil(((val - valMin) / (valMax - valMin)) * 100);
        }

        progressBarDiv.css('width', percentWidth + '%');
      }
    };

    this.updateProgressBarValue = function () {
      if (modelsParameters[idInstance].displayValue) {
        if (modelsParameters[idInstance].min > modelsHiddenParams[idInstance].value) {
          $('#progress-bar-value' + idWidget)[0].value = modelsParameters[idInstance].min;
        } else {
          $('#progress-bar-value' + idWidget)[0].value = modelsHiddenParams[idInstance].value;
        }
      }
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('class', 'progress-bar-widget');

      var widgetDiv = document.createElement('div');
      widgetDiv.setAttribute('id', 'progress-bar-div');

      if (!_.isUndefined(modelsParameters[idInstance].progressBarWidthProportion)) {
        widgetDiv.setAttribute('style', 'width:' + modelsParameters[idInstance].progressBarWidthProportion + ';');
      } else {
        widgetDiv.setAttribute('style', 'width:50%;');
      }

      var widgetCore = document.createElement('div');
      widgetCore.setAttribute('id', 'progress-bar' + idWidget);
      widgetCore.setAttribute('class', 'progress');

      var widgetCoreDiv = document.createElement('div');
      widgetCoreDiv.setAttribute('class', 'progress-bar');
      widgetCoreDiv.setAttribute('role', 'progressbar');

      widgetCore.appendChild(widgetCoreDiv);
      widgetDiv.appendChild(widgetCore);

      if (modelsParameters[idInstance].displayLabel) {
        this.insertLabel(widgetHtml);
      }

      widgetHtml.appendChild(widgetDiv);
      if (modelsParameters[idInstance].displayValue) {
        this.insertValue(widgetHtml);
      }
      $('#' + idDivContainer).html(widgetHtml);
      $('#progress-bar' + idWidget).addClass('progress-bar-div-div');

      document.styleSheets[0].addRule('#progress-bar' + idWidget, this.progressBarSegmentColor());
      document.styleSheets[0].addRule('#progress-bar' + idWidget + ' > .progress-bar', this.progressBarRangeColor());

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }

      this.updateProgressBarWidth();
      this.updateProgressBarValue();
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Current progress',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    const _MIN_DESCRIPTOR = new WidgetActuatorDescription(
      'min',
      'Base progress value',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    const _MAX_DESCRIPTOR = new WidgetActuatorDescription(
      'max',
      'Final progress value',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      const result = [_VALUE_DESCRIPTOR];

      if (data && data.rangeActuator) {
        result.push(_MIN_DESCRIPTOR);
        result.push(_MAX_DESCRIPTOR);
      }

      return result;
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        //this.updateProgressBarWidth();
        if (modelsParameters[idInstance].displayValue) {
          $('#progress-bar-value' + idWidget)[0].value = val;
        }
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].value; // $("#slider" + idWidget).slider("value");
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
        if (modelsParameters[idInstance].inheritLabelFromData) {
          modelsParameters[idInstance].label = '';
        }
        self.render();
      },
    };

    this.max = {
      updateCallback: function () {},
      setValue: function (valArg) {
        const val = Number(valArg);
        if (!typeof val === 'number') {
          return;
        }
        modelsParameters[idInstance].max = val;
        self.render();
      },
      getValue: function () {
        return modelsParameters[idInstance].max;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    this.min = {
      updateCallback: function () {},
      setValue: function (valArg) {
        const val = Number(valArg);
        if (!typeof val === 'number') {
          return;
        }
        modelsParameters[idInstance].min = val;
        self.render();
      },
      getValue: function () {
        return modelsParameters[idInstance].min;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.progressBarFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                       valueFlatUiWidgetModel                       | \\
  // +--------------------------------------------------------------------¦ \\
  this.valueFlatUiWidgetModel = function (idDivContainer, idWidget, idInstance, bInteractive, scope, nameWidget) {
    const self = scope;
    self.updateValue = function (e) {
      const val = $('#' + nameWidget + idWidget)[0].value;
      // TODO : type check at assignement. Highlight error and type mismatch
      modelsHiddenParams[idInstance].value = val;
      self.value.updateCallback(self.value, self.value.getValue());
      e.preventDefault();
    };

    self.enable = function () {
      const $widget = $(`#${nameWidget}${idWidget}`);
      $widget.prop('disabled', false);

      $widget.off('keypress').on('keypress', function (e) {
        if (e.which === 13) {
          self.updateValue(e);
        }
      });

      $widget.off('focusout');
      if (modelsParameters[idInstance].validationOnFocusOut) {
        $widget.on('focusout', (e) => self.updateValue(e));
      }

      if (modelsParameters[idInstance].validationButton) {
        const $widgetBtn = $(`#${nameWidget}-valid-btn${idWidget}`);
        $widgetBtn.prop('disabled', false);
        $widgetBtn.off('click').on('click', (e) => self.updateValue(e));
      }
    };
    self.disable = function () {
      //$("#" + nameWidget + idWidget).prop("disabled", true);
      if (modelsParameters[idInstance].validationButton) {
        //$("#" + nameWidget + "-valid-btn" + idWidget).prop("disabled", true);
      }
    };

    self.rescale = function () {
      this.render();
    };

    self.render = function () {
      let valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 2); // keepRatio
      const widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', nameWidget + '-widget-html' + idWidget);
      widgetHtml.setAttribute('class', 'value-widget-html');
      let divContent = '';
      let labelTextPosition = 'left';
      if (modelsParameters[idInstance].displayLabel) {
        if (modelsParameters[idInstance].labelTextPosition == 'left') labelTextPosition = 'display: table-cell';
        else if (modelsParameters[idInstance].labelTextPosition == 'right') labelTextPosition = 'display: table-cell';
        else if (modelsParameters[idInstance].labelTextPosition == 'top')
          labelTextPosition = 'display: table-header-group';
        else if (modelsParameters[idInstance].labelTextPosition == 'bottom')
          labelTextPosition = 'display: table-footer-group';
        // conversion to enable HTML tags
        const labelText = this.getTransformedText('label');
        valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 4); // keepRatio
        if (!_.isUndefined(modelsParameters[idInstance].valueWidthProportion)) {
          const proportion = Math.max(0, 100 - parseFloat(modelsParameters[idInstance].valueWidthProportion)) + '%';
          divContent =
            '<span id ="' +
            nameWidget +
            '-span' +
            idWidget +
            '" class="value-span" style="width:' +
            proportion +
            '; ' +
            this.labelFontSize() +
            this.labelColor() +
            this.labelFontFamily() +
            ' text-align:' +
            modelsParameters[idInstance].labelTextAlign +
            ';' +
            labelTextPosition +
            '">' +
            labelText +
            '</span>';
        } else {
          divContent =
            '<span id ="' +
            nameWidget +
            '-span' +
            idWidget +
            '" class="value-span" style="max-width: 45%;' +
            +this.labelFontSize() +
            this.labelColor() +
            this.labelFontFamily() +
            this.valueFontSize() +
            ' text-align:' +
            modelsParameters[idInstance].labelTextAlign +
            ';' +
            labelTextPosition +
            '">' +
            labelText +
            '</span>';
        }
      }

      let valuedisabled = 'disabled ';
      //if (this.bIsInteractive) {
      valuedisabled = '';
      //}
      let typeInput;
      switch (nameWidget) {
        case 'text-input':
          if (modelsParameters[idInstance].isPassword) {
            typeInput = 'password';
          } else {
            typeInput = 'text';
          }
          break;
        case 'numeric-input':
          typeInput = 'number';
          break;
        case 'value-display':
          typeInput = 'text';
          break;
      }

      let readOnlyValue = '';
      let opacityValue = '';
      if (nameWidget === 'value-display') {
        readOnlyValue = 'readonly ';
        opacityValue = 'opacity: 1; ';
      }

      let inputGroup = '';
      let inputStyle = '';
      let btnCtrl = '';

      if (modelsParameters[idInstance].validationButton) {
        inputGroup = '<div class="input-group">';
        inputStyle = 'border-bottom-right-radius: 0; border-top-right-radius: 0; ';
        btnCtrl =
          '<span class="input-group-btn">' +
          '<button id="' +
          nameWidget +
          '-valid-btn' +
          idWidget +
          '" class="/*ui-value-button*/ btn btn-primary" type="button" ' +
          'style="height:' +
          valueHeightPx +
          'px; width:' +
          valueHeightPx +
          'px; ">' +
          '<span class="fa fa-check" style="color: #ffffff"/>' +
          '</button>' +
          '</span>';
      } else {
        inputGroup = '<div id="value-no-input-group">';
        inputStyle = 'float: right;';
      }

      let valueTextAlign = 'left';
      if (!_.isUndefined(modelsParameters[idInstance].valueTextAlign))
        valueTextAlign = modelsParameters[idInstance].valueTextAlign;

      let inputContent =
        '<input ' +
        valuedisabled +
        readOnlyValue +
        ' id="' +
        nameWidget +
        idWidget +
        '" type=' +
        typeInput +
        ' placeholder="" class="value-input form-control" ' +
        'style="height: ' +
        valueHeightPx +
        'px; ' +
        opacityValue +
        this.valueColor() +
        this.backgroundColor() +
        this.valueFontFamily() +
        this.border() +
        this.valueFontSize() +
        inputStyle +
        ' text-align:' +
        valueTextAlign +
        ';"' +
        '</input>';
      inputContent += btnCtrl;
      inputGroup += inputContent;
      inputGroup += '</div>';
      if (modelsParameters[idInstance].labelTextPosition == 'right') divContent = inputGroup + divContent;
      else divContent += inputGroup;

      if (nameWidget != 'text-input') {
        //AEF: add unitText
        if (modelsParameters[idInstance].unit != '' && modelsParameters[idInstance].displayUnit) {
          divContent =
            divContent +
            '<span id ="unit-span' +
            idWidget +
            '" class="value-span" style="max-width: 45%; font-size: calc(7px + ' +
            modelsParameters[idInstance].unitFontSize * getFontFactor() +
            'vw + 0.4vh);">' +
            modelsParameters[idInstance].unit +
            '</span>';
        }
      }

      //
      widgetHtml.innerHTML = divContent;

      if (nameWidget !== 'value-display') {
        document.styleSheets[0].addRule('#' + nameWidget + '-valid-btn' + idWidget, this.validationButtonBorderColor());
        document.styleSheets[0].addRule(
          '#' + nameWidget + '-valid-btn' + idWidget,
          this.validationButtonDefaultColor()
        );
        document.styleSheets[0].addRule(
          '#' + nameWidget + '-valid-btn' + idWidget + ':hover',
          ' outline: none; ' + this.validationButtonHoverColor()
        );
        document.styleSheets[0].addRule('#' + nameWidget + '-valid-btn' + idWidget + ':focus', ' outline: none; ');
        document.styleSheets[0].addRule(
          '#' + nameWidget + '-valid-btn' + idWidget + ':active',
          this.validationButtonActiveColor()
        );
      }

      if (this.bIsInteractive) {
        widgetHtml.setAttribute('style', 'height: ' + valueHeightPx + 'px; cursor: auto;');
      } else {
        widgetHtml.setAttribute('style', 'height: ' + valueHeightPx + 'px;');
      }

      $('#' + idDivContainer).html(widgetHtml);
      $('#' + nameWidget + idWidget)[0].value = modelsHiddenParams[idInstance].value;

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    self.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        $('#' + nameWidget + idWidget)[0].value = val;
      },
      getValue: function () {
        switch (nameWidget) {
          case 'value-display':
            if (modelsParameters[idInstance].isNumber) {
              return Number(modelsHiddenParams[idInstance].value);
            } else {
              return modelsHiddenParams[idInstance].value;
            }
          case 'text-input':
            return modelsHiddenParams[idInstance].value;
          case 'numeric-input':
            return Number(modelsHiddenParams[idInstance].value);
        }
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
          $('#' + nameWidget + '-span' + idWidget).text(modelsParameters[idInstance].label);
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

  // +--------------------------------------------------------------------¦ \\
  // |                              Text Input                            | \\
  // +--------------------------------------------------------------------¦ \\
  this.textInputFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    self.valueFlatUiWidgetModel(idDivContainer, idWidget, idInstance, bInteractive, this, 'text-input');

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Current string',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    this.getActuatorDescriptions = () => [_VALUE_DESCRIPTOR];
  };

  // Inherit from baseWidget class
  this.textInputFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                              Numeric Input                         | \\
  // +--------------------------------------------------------------------¦ \\
  this.numericInputFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    self.valueFlatUiWidgetModel(idDivContainer, idWidget, idInstance, bInteractive, this, 'numeric-input');

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Current number',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    this.getActuatorDescriptions = () => [_VALUE_DESCRIPTOR];
  };

  // Inherit from baseWidget class
  this.numericInputFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                              Value Display                         | \\
  // +--------------------------------------------------------------------¦ \\
  this.valueDisplayFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    self.valueFlatUiWidgetModel(idDivContainer, idWidget, idInstance, bInteractive, this, 'value-display');

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Displayed value',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER_OR_STRING
    );
    this.getActuatorDescriptions = () => [_VALUE_DESCRIPTOR];
  };

  // Inherit from baseWidget class
  this.valueDisplayFlatUiWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'flatUi',
    widgetsDefinitionList: {
      flatUiHorizontalSlider: {
        factory: 'horizontalSliderFlatUiWidget',
        title: 'Horizontal slider',
        icn: 'horizontal-slider',
        help: 'wdg-basics/#horizontal-slider',
      },
      flatUiVerticalSlider: {
        factory: 'verticalSliderFlatUiWidget',
        title: 'Vertical slider',
        icn: 'vertical-slider',
        help: 'wdg/wdg-basics/#vertical-slider',
      },
      flatUiProgressBar: {
        factory: 'progressBarFlatUiWidget',
        title: 'Progress bar',
        icn: 'progress-bar',
        help: 'wdg-basics/#progress-bar',
      },
      flatUiTextInput: {
        factory: 'textInputFlatUiWidget',
        title: 'Text Input',
        icn: 'text-input',
        help: 'wdg/wdg-basics/#text-input',
      },
      flatUiNumericInput: {
        factory: 'numericInputFlatUiWidget',
        title: 'Numeric Input',
        icn: 'numeric-input',
        help: 'wdg/wdg-basics/#numeric-input',
      },
      flatUiValueDisplay: {
        factory: 'valueDisplayFlatUiWidget',
        title: 'Value Display',
        icn: 'value',
        help: 'wdg/wdg-basics/#value-display',
      },
      flatUiButton: {
        factory: 'buttonFlatUiWidget',
        title: 'Trigger button',
        icn: 'trigger',
        help: 'wdg/wdg-basics/#push-button',
      },
      flatUiFileInputButton: {
        factory: 'buttonFlatUiWidget',
        title: 'Load file button',
        icn: 'button',
        help: 'wdg/wdg-basics/#push-button',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
flatUiWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
export const flatUiWidgetsPlugin = new flatUiWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(flatUiWidgetsPlugin);
