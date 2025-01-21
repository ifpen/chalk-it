// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │                                                                       │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2024 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir El FEKI, Tristan BARTEMENT, │ \\
// │                      Guillaume CORBELIN                               │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.flatUiCheckbox = { value: false };
modelsHiddenParams.flatUiSwitch = { value: false };

// Parameters
modelsParameters.flatUiCheckbox = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelPosition: 'right',
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  checkboxSize: 1,
  checkedColor: 'var(--widget-input-checked-color)',
  uncheckedColor: 'var(--widget-input-unchecked-color)',
};
modelsParameters.flatUiSwitch = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelPosition: 'right',
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  switchWidthProportion: '30%',
  switchOnColor: 'var(--widget-input-checked-color)',
  switchOffColor: 'var(--widget-input-unchecked-color)',
};

// Layout
modelsLayout.flatUiCheckbox = { height: '40px', width: '140px', minWidth: '32px', minHeight: '24px' };
modelsLayout.flatUiSwitch = { height: '40px', width: '140px', minWidth: '50px', minHeight: '24px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function flatUiBooleanWidgetsPluginClass() {
  // +--------------------------------------------------------------------¦ \\
  // |                            Checkbox                                | \\
  // +--------------------------------------------------------------------¦ \\
  this.checkboxFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    this.enable = function () {
      $('#checkbox' + idWidget)
        .off('click')
        .on('click', function (e, ui) {
          self.value.updateCallback(self.value, self.value.getValue());
        });
      $('#checkbox' + idWidget).radiocheck('enable');
    };

    this.disable = function () {
      $('#checkbox' + idWidget).unbind('click');
      $('#checkbox' + idWidget).radiocheck('disable');
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      let checkboxHeight = 20; // default value in class icons of flatui
      let checkboxWidth = 20; // default value in class icons of flatui

      // Update icon dimensions if elements are present
      const iconElement = $('.icons');
      checkboxHeight = iconElement.height() ?? checkboxHeight;
      checkboxWidth = iconElement.width() ?? checkboxWidth;

      // backward compatibility
      if (_.isUndefined(modelsParameters[idInstance].checkboxSize)) {
        modelsParameters[idInstance].checkboxSize = 1;
      }

      const checkboxSize = modelsParameters[idInstance].checkboxSize;
      const padding = checkboxSize * checkboxWidth;
      const lineHeight = checkboxSize * checkboxHeight;
      const labelHeight = checkboxHeight * checkboxSize;
      const divContainerHeightPx = $('#' + idDivContainer).height();
      //const divMarginTop = (divContainerHeightPx - labelHeight) / 2;

      // Create and configure the main widget container
      const widgetHtml = document.createElement('div');
      widgetHtml.id = `checkbox-widget-html${idWidget}`;
      widgetHtml.style.cssText = `
        width: inherit;
        cursor: inherit;
        display: flex;
        justify-content: center;
      `;

      // Determine label position and direction
      const labelPosition = modelsParameters[idInstance].labelPosition === 'right' ? 'right' : 'left';
      const widgetDirection = labelPosition === 'left' ? 'rtl' : 'ltr';

      // Dynamically set the direction property to 'ltr' or 'rtl'
      document.styleSheets[0].addRule(`#checkbox-widget-html${idWidget}`, `direction: ${widgetDirection}`);

      // Construct label and checkbox HTML
      let divContent = '';
      const labelText = this.getTransformedText('label');
      const styleLabelBase = `
        cursor: inherit;
        padding-top: ${lineHeight}px;
      `;
      const styleLabel =
        labelPosition === 'right'
          ? `${styleLabelBase} padding-right: ${padding}px; padding-left: 0px; margin-right: 6px;`
          : `${styleLabelBase} padding-left: ${padding}px; padding-right: 0px; margin-left: 6px;`;

      const checkboxHtml = `
        <input
          type="checkbox"
          class="nohover"
          data-toggle="radio"
          style="zoom: ${checkboxSize}"
          value=""
          id="checkbox${idWidget}"
          disabled
        />
      `;

      if (modelsParameters[idInstance].displayLabel) {
        const styleSpan = `
          display: flex;
          align-items: center;
          ${this.labelFontSize()}
          ${this.labelColor()}
          ${this.labelFontFamily()}
        `;
        divContent = `
          <label class="checkbox" id="label${idWidget}" style="${styleLabel}" for="checkbox${idWidget}">
            ${checkboxHtml}
          </label>
          <span id="checkbox-span${idWidget}" class="checkbox-span" style="${styleSpan}">${labelText}</span>
        `;
      } else {
        divContent = `
          <label class="checkbox" id="label${idWidget}" style="${styleLabelBase} padding-left: ${padding}px;" for="checkbox${idWidget}">
            ${checkboxHtml}
          </label>
        `;
      }

      widgetHtml.innerHTML = divContent;

      // Set widget display and enable/disable styles
      const showWidget = this.showWidget();
      const displayStyle = showWidget ? 'display: flex;' : 'display: none;';
      const enableWidget = this.enableWidget();
      const enableStyle = enableWidget ? 'pointer-events: initial; opacity: 1;' : 'pointer-events: none; opacity: 0.5;';

      widgetHtml.style.cssText += `${displayStyle} ${enableStyle}`;
      $('#' + idDivContainer).html(widgetHtml);

      this.applyDisplayOnWidget();
      $('[data-toggle="checkbox"]').radiocheck();
      $('[data-toggle="radio"]').radiocheck();

      // Check or uncheck the checkbox based on the value
      const checkboxSelector = `#checkbox${idWidget}`;
      if (modelsHiddenParams[idInstance].value) {
        $(checkboxSelector).radiocheck('check');
      } else {
        $(checkboxSelector).radiocheck('uncheck');
      }

      // Apply dynamic styles
      const zoomSize = `zoom: ${checkboxSize}`;
      document.styleSheets[0].addRule(`#label${idWidget} .icons *`, zoomSize);
      document.styleSheets[0].addRule(`#label${idWidget} .icons .icon-checked`, this.checkedColor());
      document.styleSheets[0].addRule(`#label${idWidget} .icons .icon-unchecked`, this.uncheckedColor());

      // Enable or disable the widget based on interactivity
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
      WidgetPrototypesManager.SCHEMA_BOOLEAN
    );
    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        $('#checkbox' + idWidget)[0].checked = val;
      },
      getValue: function () {
        return $('#checkbox' + idWidget)[0].checked; // or modelsHiddenParams[idInstance].value ?
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

    self.render();
  };

  // Inherit from baseWidget class
  this.checkboxFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                             Switch                                 | \\
  // +--------------------------------------------------------------------¦ \\
  this.switchFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;

    this.enable = function (updateDataFromWidget) {
      $('#switch' + idWidget).on('click', function (e, ui) {
        self.value.updateCallback(self.value, self.value.getValue());
        if ($('#switch' + idWidget)[0].checked) {
          //ABK
          const divSwithHeightPx = $('#switch-label' + idWidget).height();
          const divContainerWidthPx = $('#' + idDivContainer).width();
          const size = Math.min(divContainerWidthPx, divSwithHeightPx) - 8;
          const size2 = $('#slide' + idWidget).width() - size - 8;
          document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(' + size2 + 'px);');
        } else {
          document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(0px);');
        }
      });
      $('#switch' + idWidget).prop('disabled', false);
    };

    this.disable = function () {
      $('#switch' + idWidget).unbind('click');
      $('#switch' + idWidget).prop('disabled', true);
    };

    this.updateSwitchStatus = function () {
      if (modelsHiddenParams[idInstance].value == true) {
        if (!$('#switch' + idWidget)[0].checked) {
          $('#switch' + idWidget).prop('checked', true);
          const divSwithHeightPx = $('#switch-label' + idWidget).height();
          const divContainerWidthPx = $('#' + idDivContainer).width();
          const size = Math.min(divContainerWidthPx, divSwithHeightPx) - 8;
          const size2 = $('#slide' + idWidget).width() - size - 8;
          document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(' + size2 + 'px);');
          document.styleSheets[0].addRule('input:checked + #slide' + idWidget, this.switchOnColor());
          document.styleSheets[0].addRule('input:focus + #slide' + idWidget, this.switchOnColor());
        }
      } else if (modelsHiddenParams[idInstance].value == false) {
        if ($('#switch' + idWidget)[0].checked) {
          $('#switch' + idWidget).prop('checked', false);
          document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(0px);');
        }
      }
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      let coeff = 1;

      if (!_.isUndefined(modelsParameters[idInstance].switchWidthProportion)) {
        coeff = Math.min(1, parseFloat(modelsParameters[idInstance].switchWidthProportion) / 100);
      }

      const divContainerHeightPx = $('#' + idDivContainer).height();
      //$('#' + idDivContainer)[0].style.minHeight = divContainerHeightPx + 'px';

      let divSwitchHeightPx = Math.min(divContainerHeightPx, 260); //maxHeight
      divSwitchHeightPx = Math.min(divSwitchHeightPx, (coeff * $('#' + idDivContainer).width()) / 3); //keepRatio
      //divSwitchHeightPx = Math.max(divSwitchHeightPx, parseFloat($('#' + idDivContainer)[0].style.minHeight)); //minHeight
      divSwitchHeightPx = Math.ceil(divSwitchHeightPx); // in px

      const divContainerWidthPx = $('#' + idDivContainer).width();
      const widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'switch-widget-html' + idWidget);
      widgetHtml.setAttribute('class', 'switch-widget-html');
      widgetHtml.setAttribute('style', 'height: ' + divContainerHeightPx + 'px;');

      const labelPosition =
        !_.isUndefined(modelsParameters[idInstance].labelPosition) &&
        modelsParameters[idInstance].labelPosition === 'right'
          ? 'right'
          : 'left';
      const widgetDirection = labelPosition === 'left' ? 'rtl' : 'ltr';

      // Dynamically set the direction property to 'ltr' or 'rtl'
      document.styleSheets[0].addRule('#switch-widget-html' + idWidget, 'direction: ' + widgetDirection);

      let divContent;
      if (!_.isUndefined(modelsParameters[idInstance].switchWidthProportion)) {
        const proportion = Math.min(100, parseFloat(modelsParameters[idInstance].switchWidthProportion)) + '%';
        divContent = '<div class="switch-div" style="width: ' + proportion + ';">';
      } else {
        divContent = '<div class="switch-div" style="width: 100%;">';
      }
      let cursorSwitch = '';
      if (this.bIsInteractive) {
        cursorSwitch = 'cursor: pointer;';
      } else {
        cursorSwitch = 'cursor: inherit;';
      }
      divContent +=
        '<label id="switch-label' + idWidget + '" class="switch-label" style="height:' + divSwitchHeightPx + 'px;">';
      divContent += '<input type="checkbox" id="switch' + idWidget + '">';
      divContent += '<div id="slide' + idWidget + '"class="slider round" style="' + cursorSwitch + '">';
      divContent += '</div>';
      divContent += '</label>';
      divContent += '</div>';
      if (modelsParameters[idInstance].displayLabel) {
        // conversion to enable HTML tags
        const labelText = this.getTransformedText('label');

        divContent +=
          '<span id="switch-span' +
          idWidget +
          '" class="switch-span" style="' +
          this.labelFontSize() +
          this.labelColor() +
          this.labelFontFamily() +
          ' text-align: ' +
          labelPosition +
          ';">' +
          labelText +
          '</span>';
      }
      widgetHtml.innerHTML = divContent;
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
      widgetHtml.setAttribute('style', displayStyle + enableStyle);
      $('#' + idDivContainer).html(widgetHtml);

      document.styleSheets[0].addRule('input + #slide' + idWidget, this.switchOffColor());
      document.styleSheets[0].addRule('input:checked + #slide' + idWidget, this.switchOnColor());
      document.styleSheets[0].addRule('input:focus + #slide' + idWidget, this.switchShadowColor());

      //resize the cercle
      const size = Math.min(divContainerWidthPx, divSwitchHeightPx) - 8;
      document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'width: ' + size + 'px;');
      document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'height: ' + size + 'px;');

      if (modelsHiddenParams[idInstance].value == null) {
        modelsHiddenParams[idInstance].value = false;
      }

      if (modelsHiddenParams[idInstance].value == true) {
        $('#switch' + idWidget).prop('checked', true);
        const size2 = $('#slide' + idWidget).width() - size - 8;
        document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(' + size2 + 'px);');
      } else if (modelsHiddenParams[idInstance].value == false) {
        $('#switch' + idWidget).prop('checked', false);
        document.styleSheets[0].addRule('#slide' + idWidget + ':before', 'transform: translateX(0px);');
      }

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }

      $('#switch' + idWidget)[0].checked = modelsHiddenParams[idInstance].value;
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Current value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_BOOLEAN
    );
    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        self.updateSwitchStatus();
      },
      getValue: function () {
        return $('#switch' + idWidget)[0].checked; // or modelsHiddenParams[idInstance].value ?
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
        if (modelsParameters[idInstance].inheritLabelFromData) {
          modelsParameters[idInstance].label = '';
        }
        self.render();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.switchFlatUiWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'flatUiBoolean',
    widgetsDefinitionList: {
      flatUiCheckbox: {
        factory: 'checkboxFlatUiWidget',
        title: 'Checkbox',
        icn: 'checkbox',
        help: 'wdg/wdg-basics/#checkbox',
      },
      flatUiSwitch: { factory: 'switchFlatUiWidget', title: 'Switch', icn: 'switch', help: 'wdg/wdg-basics/#switch' },
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
