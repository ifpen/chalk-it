// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ Widget base                                                           │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Ghiles HIDEUR, Tristan BARTEMENT │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\

// +--------------------------------------------------------------------¦ \\
// |                           Widget base                              | \\
// +--------------------------------------------------------------------¦ \\
function baseWidget(idDivContainer, idWidget, idInstance, bInteractive) {
  this.idDivContainer = idDivContainer;
  this.idWidget = idWidget;
  this.idInstance = idInstance;
  this.bIsInteractive = bInteractive;

  // Get Hexadecimal value of CSS Custom property
  this.getColorValueFromCSSProperty = function (value) {
    let color = value;
    if (color.includes('var(--')) {
      const realValue = value.substring(4, value.length - 1);
      color = window.getComputedStyle(document.documentElement).getPropertyValue(realValue);
    }
    return color;
  };

  // Helper function to set the color value from the modelParameters (for backward compatibility)
  this.setColorValueFromModelParameters = function (prop, defaultValue) {
    let colorValue = defaultValue;
    if (_.isUndefined(modelsParameters[idInstance][prop])) {
      modelsParameters[idInstance][prop] = defaultValue;
    } else {
      colorValue = modelsParameters[idInstance][prop];
    }
    // TODO theme backwards compatibility
    // if (!paramValue || paramValue.startsWith("#")) {
    //   modelsParameters[idInstance][value] = defaultValue;
    //   return defaultValue;
    // }
    const colorHex = this.getColorValueFromCSSProperty(colorValue);
    return colorHex;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                          Global functions                          | \\
  // +--------------------------------------------------------------------¦ \\
  this.labelFontSize = function () {
    const fs =
      'font-size: calc(7px + ' + modelsParameters[idInstance].labelFontSize * getFontFactor() + 'vw + 0.4vh); ';
    return fs;
  };

  this.valueFontSize = function () {
    const fs =
      'font-size: calc(7px + ' + modelsParameters[idInstance].valueFontSize * getFontFactor() + 'vw + 0.4vh); ';
    return fs;
  };

  this.valueFormat = function (val) {
    const decDigits = parseInt(modelsParameters[idInstance].decimalDigits, 10);
    if (isNaN(decDigits)) return val;

    let procVal = val;
    if (decDigits != -1) {
      if (!isNaN(val)) {
        procVal = parseFloat(val);
        if (isNaN(procVal)) return val;
        procVal = Math.round10(procVal, -decDigits);
      }
    }
    return procVal;
  };

  this.fontSize = function () {
    const fs = 'font-size: calc(7px + ' + modelsParameters[idInstance].fontsize * getFontFactor() + 'vw + 0.4vh); ';
    return fs;
  };

  this.labelColor = function () {
    const color = this.setColorValueFromModelParameters('labelColor', 'var(--widget-label-color)');
    const fc = 'color:' + color + '; ';
    return fc;
  };

  this.valueColor = function () {
    const color = this.setColorValueFromModelParameters('valueColor', 'var(--widget-color)');
    const fc = 'color:' + color + '; ';
    return fc;
  };

  this.labelFontFamily = function () {
    if (_.isUndefined(modelsParameters[idInstance].labelFontFamily)) {
      modelsParameters[idInstance].labelFontFamily = 'Helvetica Neue';
    }
    const ff = 'font-family: ' + modelsParameters[idInstance].labelFontFamily + ', Helvetica, Arial, sans-serif; ';
    return ff;
  };

  this.valueFontFamily = function () {
    if (_.isUndefined(modelsParameters[idInstance].valueFontFamily)) {
      modelsParameters[idInstance].valueFontFamily = 'Helvetica Neue';
    }
    const ff = 'font-family: ' + modelsParameters[idInstance].valueFontFamily + ', Helvetica, Arial, sans-serif; ';
    return ff;
  };

  this.border = function () {
    let border = 'border: none; ';
    if (modelsParameters[idInstance].displayBorder) {
      const borderColor = this.setColorValueFromModelParameters('borderColor', 'var(--widget-border-color)');
      border = 'border: 2px solid ' + borderColor + '; ';
    } else {
      border += +'-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
      border += '-moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
      border += 'box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
    }

    return border;
  };

  this.captionHelper = function (caption, bIsInteractive, bCaptionManuallyChanged) {
    if (!bIsInteractive) {
      if (bCaptionManuallyChanged) {
        modelsParameters[idInstance].inheritLabelFromData = false;
      } else {
        modelsParameters[idInstance].label = caption;
      }
    } else {
      // est-ce qu'on a intérêt à l'héritage en runtime ?
      modelsParameters[idInstance].label = caption;
    }
  };

  this.backgroundColor = function () {
    // Backward compatibility
    const color = this.setColorValueFromModelParameters('backgroundColor', '#ffffff');
    const bc = 'background-color:' + color + '; ';
    return bc;
  };

  /**
   * Conversion to enable HTML tags
   * Retrieves the transformed text by handling HTML tags.
   *
   * @param {string} prop - The property to retrieve the text from.
   * @returns {string} The transformed text.
   */
  this.getTransformedText = function (prop) {
    let text = modelsParameters[idInstance][prop] || '';
    if (text) {
      // Check if the text has HTML tags
      const hasHtmlTags = $('<div>').html(text).children().length > 0;
      if (!hasHtmlTags) {
        // If the text does not have HTML tags, parse it as HTML
        const parser = new DOMParser();
        text = parser.parseFromString('<!doctype html><body>' + text, 'text/html').body.textContent;
      }
    }
    return text;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                            Button widget                           | \\
  // +--------------------------------------------------------------------¦ \\
  this.buttonFontFamily = function () {
    if (_.isUndefined(modelsParameters[idInstance].buttonFontFamily)) {
      modelsParameters[idInstance].buttonFontFamily = 'Helvetica Neue';
    }
    const ff =
      'font-family: ' + modelsParameters[idInstance].buttonFontFamily + ', Helvetica, Arial, sans-serif' + '; ';
    return ff;
  };

  this.setButtonColorStyle = function () {
    const defaultColor = this.setColorValueFromModelParameters('buttonDefaultColor', 'var(--widget-button-color)');
    const hoverColor = this.setColorValueFromModelParameters('buttonHoverColor', 'var(--widget-button-hover-color)');
    const activeColor = this.setColorValueFromModelParameters('buttonActiveColor', 'var(--widget-button-active-color)');
    const textColor = this.setColorValueFromModelParameters('buttonTextColor', 'var(--widget-button-text)');

    const styleNormalId = 'styleNormalFor' + idInstance + 'widgetCustomColor';
    let styleNormal = document.getElementById(styleNormalId);
    const styleNormalHtml =
      '.' +
      idInstance +
      'widgetCustomColor' +
      '{ ' +
      'color: ' +
      textColor +
      ';' +
      'background-color: ' +
      defaultColor +
      ';' +
      'border-color: ' +
      defaultColor +
      ';' +
      ' }';
    if (styleNormal == null) {
      styleNormal = document.createElement('style');
      styleNormal.type = 'text/css';
      styleNormal.id = styleNormalId;
      styleNormal.innerHTML = styleNormalHtml;
      document.getElementsByTagName('head')[0].appendChild(styleNormal);
    } else {
      styleNormal.innerHTML = styleNormalHtml;
    }

    if (bInteractive) {
      const styleHoverId = 'styleHoverFor' + idInstance + 'widgetCustomColor';
      let styleHover = document.getElementById(styleHoverId);
      const styleHoverHtml =
        '.' +
        idInstance +
        'widgetCustomColor:hover' +
        '{ ' +
        'background-color: ' +
        hoverColor +
        ';' +
        'border-color: ' +
        hoverColor +
        ';' +
        '}';
      if (styleHover == null) {
        styleHover = document.createElement('style');
        styleHover.type = 'text/css';
        styleHover.id = styleHoverId;
        styleHover.innerHTML = styleHoverHtml;
        document.getElementsByTagName('head')[0].appendChild(styleHover);
      } else {
        styleHover.innerHTML = styleHoverHtml;
      }

      const styleActiveId = 'styleActiveFor' + idInstance + 'widgetCustomColor';
      let styleActive = document.getElementById(styleActiveId);
      const styleActiveHtml =
        '.' +
        idInstance +
        'widgetCustomColor:active' +
        '{ ' +
        'background-color: ' +
        activeColor +
        ';' +
        'border-color: ' +
        activeColor +
        ';' +
        '}';
      if (styleActive == null) {
        styleActive = document.createElement('style');
        styleActive.type = 'text/css';
        styleActive.id = styleActiveId;
        styleActive.innerHTML = styleActiveHtml;
        document.getElementsByTagName('head')[0].appendChild(styleActive);
      } else {
        styleActive.innerHTML = styleActiveHtml;
      }
    }
  };

  this.displayIcon = function () {
    if (_.isUndefined(modelsParameters[idInstance].displayIcon)) {
      modelsParameters[idInstance].displayIcon = false;
    }
    return modelsParameters[idInstance].displayIcon;
  };

  this.fontAwesomeIcon = function () {
    if (_.isUndefined(modelsParameters[idInstance].fontAwesomeIcon)) {
      modelsParameters[idInstance].fontAwesomeIcon = '';
    }
    return modelsParameters[idInstance].fontAwesomeIcon;
  };

  // +--------------------------------------------------------------------¦ \\
  // |          Value widget (text input, numeric input, display)         | \\
  // +--------------------------------------------------------------------¦ \\
  this.validationButtonDefaultColor = function () {
    const color = this.setColorValueFromModelParameters(
      'validationBtnDefaultColor',
      'var(--widget-button-primary-color)'
    );
    const bc = 'background-color:' + color + '; ';
    return bc;
  };

  this.validationButtonHoverColor = function () {
    const color = this.setColorValueFromModelParameters('validationBtnHoverColor', 'var(--widget-button-hover-color)');
    const bc = 'background-color:' + color + '; ';
    return bc;
  };

  this.validationButtonActiveColor = function () {
    const color = this.setColorValueFromModelParameters(
      'validationBtnActiveColor',
      'var(--widget-button-active-color)'
    );
    const bc = 'background-color:' + color + '; ';
    return bc;
  };

  this.validationButtonBorderColor = function () {
    let border = 'border: none; ';
    if (modelsParameters[idInstance].displayBorder) {
      const color = this.setColorValueFromModelParameters('validationBtnDefaultColor', 'var(--widget-border-color)');
      border = 'border: 2px solid ' + color + '; ';
    } else {
      border += '-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
      border += '-moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
      border += 'box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
    }

    return border;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                          KPI Advanced widget                       | \\
  // +--------------------------------------------------------------------¦ \\
  this.graphColor = function () {
    const color = this.setColorValueFromModelParameters('graphColor', 'var(--widget-label-color)');
    return color;
  };

  this.subLabelFontFamily = function () {
    if (_.isUndefined(modelsParameters[idInstance].subLabelFontFamily)) {
      modelsParameters[idInstance].subLabelFontFamily = 'Helvetica Neue';
    }
    const ff =
      'font-family: ' + modelsParameters[idInstance].subLabelFontFamily + ', Helvetica, Arial, sans-serif' + '; ';
    return ff;
  };

  this.subLabelColor = function () {
    const color = this.setColorValueFromModelParameters('subLabelColor', 'var(--widget-subtext-color)');
    const fc = 'color:' + color + '; ';
    return fc;
  };

  this.subLabelFontSize = function () {
    const fs =
      'font-size: calc(7px + ' + modelsParameters[idInstance].subLabelFontSize * getFontFactor() + 'vw + 0.4vh); ';
    return fs;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                            Checkbox widget                         | \\
  // +--------------------------------------------------------------------¦ \\
  this.checkedColor = function () {
    if (!_.isUndefined(modelsParameters[idInstance].checkboxColor)) {
      delete modelsParameters[idInstance].checkboxColor;
    }
    const color = this.setColorValueFromModelParameters('checkedColor', 'var(--widget-input-checked-color)');
    const fc = 'color: ' + color + '; ';
    return fc;
  };

  this.uncheckedColor = function () {
    const color = this.setColorValueFromModelParameters('uncheckedColor', 'var(--widget-input-unchecked-color)');
    const fc = 'color: ' + color + '; ';
    return fc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                            Switch widget                           | \\
  // +--------------------------------------------------------------------¦ \\
  this.switchOnColor = function () {
    const color = this.setColorValueFromModelParameters('switchOnColor', 'var(--widget-input-checked-color)');
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  this.switchOffColor = function () {
    const color = this.setColorValueFromModelParameters('switchOffColor', 'var(--widget-input-unchecked-color)');
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  this.switchShadowColor = function () {
    const color = this.setColorValueFromModelParameters('switchOnColor', 'var(--widget-input-checked-color)');
    const sc = 'box-shadow: 0 0 1px ' + color + '; ';
    return sc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                        Progress bar widget                         | \\
  // +--------------------------------------------------------------------¦ \\
  this.progressBarRangeColor = function () {
    const color = this.setColorValueFromModelParameters('progressBarRangeColor', 'var(--widget-range-color)');
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  this.progressBarSegmentColor = function () {
    const color = this.setColorValueFromModelParameters('progressBarSegmentColor', 'var(--widget-segment-color)');
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |            Horizontal & Vertical & double sliders widgets          | \\
  // +--------------------------------------------------------------------¦ \\
  this.sliderRangeColor = function () {
    const color = this.setColorValueFromModelParameters('sliderRangeColor', 'var(--widget-range-color)');
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  this.sliderSegmentColor = function () {
    const color = this.setColorValueFromModelParameters('sliderSegmentColor', 'var(--widget-segment-color)');
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  this.sliderHandleDefaultColor = function () {
    const color = this.setColorValueFromModelParameters(
      'sliderHandleDefaultColor',
      'var(--widget-handle-default-color)'
    );
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  this.sliderHandleHoverColor = function () {
    const color = this.setColorValueFromModelParameters('sliderHandleHoverColor', 'var(--widget-handle-hover-color)');
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  this.sliderHandleActiveColor = function () {
    const color = this.setColorValueFromModelParameters('sliderHandleActiveColor', 'var(--widget-handle-active-color)');
    const bc = 'background-color: ' + color + '; ';
    return bc;
  };

  this.valueBorderColor = function () {
    const color = this.setColorValueFromModelParameters('valueBorderColor', 'var(--widget-border-color)');
    const bc = 'border-color: ' + color + '; ';
    return bc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                         Load file widget                           | \\
  // +--------------------------------------------------------------------¦ \\
  this.textSize = function () {
    const fs = 'font-size: calc(7px + ' + modelsParameters[idInstance].textSize * getFontFactor() + 'vw + 0.4vh); ';
    return fs;
  };

  this.textColor = function () {
    const color = this.setColorValueFromModelParameters('textColor', 'var(--widget-color)');
    const tc = 'color: ' + color + '; ';
    return tc;
  };

  this.subTextColor = function () {
    const color = this.setColorValueFromModelParameters('subTextColor', 'var(--widget-color)');
    const tc = 'color: ' + color + '; ';
    return tc;
  };

  this.browseButtonTextColor = function () {
    const color = this.setColorValueFromModelParameters('browseButtonTextColor', 'var(--widget-button-text)');
    let tc = ' color: ' + color + '; ';
    tc += ' border-color: ' + color + '; ';
    return tc;
  };

  this.browseButtonDefaultColor = function () {
    const color = this.setColorValueFromModelParameters('browseButtonDefaultColor', 'var(--widget-button-color)');
    const bc = ' background-color: ' + color + '; ';
    return bc;
  };

  this.browseButtonHoverColor = function () {
    const color = this.setColorValueFromModelParameters('browseButtonHoverColor', 'var(--widget-button-hover-color)');
    const bc = ' background-color: ' + color + '; ';
    return bc;
  };

  this.browseButtonActiveColor = function () {
    const color = this.setColorValueFromModelParameters('browseButtonActiveColor', 'var(--widget-button-active-color)');
    const bc = ' background-color: ' + color + '; ';
    return bc;
  };

  this.deleteButtonDefaultColor = function () {
    const color = this.setColorValueFromModelParameters(
      'deleteButtonDefaultColor',
      'var(--widget-delete-button-default-color)'
    );
    let bc = ' background-color: ' + color + '; ';
    bc += ' box-shadow: 0 0 2px 3px ' + color + '; ';
    return bc;
  };

  this.deleteButtonActiveColor = function () {
    const color = this.setColorValueFromModelParameters(
      'deleteButtonActiveColor',
      'var(--widget-delete-button-active-color)'
    );
    let bc = ' background-color: ' + color + '; ';
    bc += ' box-shadow: 0 0 2px 3px ' + color + '; ';
    return bc;
  };

  this.deleteButtonHoverColor = function () {
    const color = this.setColorValueFromModelParameters(
      'deleteButtonHoverColor',
      'var(--widget-delete-button-hover-color)'
    );
    let bc = ' background-color: ' + color + '; ';
    bc += ' box-shadow: 0 0 2px 3px ' + color + '; ';
    return bc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                              List widget                           | \\
  // +--------------------------------------------------------------------¦ \\
  this.listBackgroundColor = function () {
    const color = this.setColorValueFromModelParameters('listBackgroundColor', 'var(--widget-select-drop-color)');
    const bc = ' background-color: ' + color + '; ';
    return bc;
  };

  this.selectValueColor = function () {
    const color = this.setColorValueFromModelParameters(
      'selectValueColor',
      'var(--widget-select-option-highlighted-text)'
    );
    const vc = ' color: ' + color + '; ';
    return vc;
  };

  this.selectValueBackgroundColor = function () {
    const color = this.setColorValueFromModelParameters(
      'selectValueBackgroundColor',
      'var(--widget-select-option-highlighted-color)'
    );
    const bc = ' background-color: ' + color + '; ';
    return bc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                         Multi-select widget                        | \\
  // +--------------------------------------------------------------------¦ \\
  this.valueDefaultColor = function () {
    const color = this.setColorValueFromModelParameters('valueDefaultColor', 'var(--widget-label-color)');
    const vc = ' color: ' + color + '; ';
    return vc;
  };

  this.valueFocusColor = function () {
    const color = this.setColorValueFromModelParameters('valueFocusColor', 'var(--widget-multiselect-checked-text)');
    const vc = ' color: ' + color + '; ';
    return vc;
  };

  this.valueHoverColor = function () {
    const color = this.setColorValueFromModelParameters('valueHoverColor', 'var(--widget-multiselect-hover-text)');
    const vc = ' color: ' + color + '; ';
    return vc;
  };

  this.checkboxDefaultColor = function () {
    const color = this.setColorValueFromModelParameters('checkboxDefaultColor', 'var(--widget-multiselect-color)');
    const vc = ' background-color: ' + color + '; ';
    return vc;
  };

  this.checkboxFocusColor = function () {
    const color = this.setColorValueFromModelParameters(
      'checkboxFocusColor',
      'var(--widget-multiselect-checked-color)'
    );
    const vc = ' background-color: ' + color + '; ';
    return vc;
  };

  this.checkboxHoverColor = function () {
    const color = this.setColorValueFromModelParameters('checkboxHoverColor', 'var(--widget-multiselect-hover-color)');
    const vc = ' background-color: ' + color + '; ';
    return vc;
  };

  this.checkboxHoverBorderColor = function () {
    const color = this.setColorValueFromModelParameters(
      'checkboxHoverBorderColor',
      'var(--widget-multiselect-hover-border-color)'
    );
    const vc = ' border-color: ' + color + '; ';
    return vc;
  };

  this.checkboxFocusBorderColor = function () {
    const color = this.setColorValueFromModelParameters(
      'checkboxFocusBorderColor',
      'var(--widget-multiselect-checked-border-color)'
    );
    const vc = ' border-color: ' + color + '; ';
    return vc;
  };

  this.checkboxWidth = function () {
    if (_.isUndefined(modelsParameters[idInstance].checkboxWidth)) {
      modelsParameters[idInstance].checkboxWidth = 7;
    }
    const cw = ' width: ' + modelsParameters[idInstance].checkboxWidth + 'rem; ';
    return cw;
  };

  this.checkboxHeight = function () {
    if (_.isUndefined(modelsParameters[idInstance].checkboxHeight)) {
      modelsParameters[idInstance].checkboxHeight = 1.5;
    }
    const ch = ' line-height: ' + modelsParameters[idInstance].checkboxHeight + '; ';
    return ch;
  };

  this.checkboxBorder = function () {
    let border = 'border: none; ';
    if (modelsParameters[idInstance].displayBorder) {
      const color = this.setColorValueFromModelParameters(
        'checkboxBorderColor',
        'var(--widget-multiselect-border-color)'
      );
      border = ' border: 1.5px solid ' + color + '; ';
    } else {
      border += '-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
      border += '-moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
      border += 'box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
    }
    return border;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                          Select widget                             | \\
  // +--------------------------------------------------------------------¦ \\
  this.selectFontSize = function () {
    if (_.isUndefined(modelsParameters[idInstance].selectValueFontSize)) {
      modelsParameters[idInstance].selectValueFontSize = modelsParameters[idInstance].labelFontSize;
    }
    const fs =
      'font-size: calc(7px + ' + modelsParameters[idInstance].selectValueFontSize * getFontFactor() + 'vw + 0.4vh); ';
    return fs;
  };

  this.selectValueFontFamily = function () {
    if (_.isUndefined(modelsParameters[idInstance].selectValueFontFamily)) {
      modelsParameters[idInstance].selectValueFontFamily = 'Helvetica Neue';
    }
    const ff =
      'font-family: ' + modelsParameters[idInstance].selectValueFontFamily + ', Helvetica, Arial, sans-serif' + '; ';
    return ff;
  };

  this.selectedValueColor = function () {
    const color = this.setColorValueFromModelParameters(
      'selectedValueColor',
      'var(--widget-select-option-highlighted-text)'
    );
    const vc = ' color: ' + color + '; ';
    return vc;
  };

  this.selectedItemDefaultColor = function () {
    const color = this.setColorValueFromModelParameters(
      'selectedItemDefaultColor',
      'var(--widget-select-option-highlighted-color)'
    );
    const bc = ' background-color: ' + color + '; ';
    return bc;
  };

  this.selectedItemHoverColor = function () {
    const color = this.setColorValueFromModelParameters(
      'selectedItemHoverColor',
      'var(--widget-select-option-highlighted-color)'
    );
    const bc = ' background-color: ' + color + '; ';
    return bc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                           Table widget                             | \\
  // +--------------------------------------------------------------------¦ \\
  this.valueAlign = function () {
    // Remove ValueAlign which uses kamel case
    if (!_.isUndefined(modelsParameters[idInstance].ValueAlign)) {
      delete modelsParameters[idInstance].ValueAlign;
    }
    // Backward compatibility
    if (_.isUndefined(modelsParameters[idInstance].valueAlign)) {
      modelsParameters[idInstance].valueAlign = 'left';
    }
    const textAlign = ' text-align: ' + modelsParameters[idInstance].valueAlign + '; ';
    return textAlign;
  };

  this.tableBackgroundColor = function (prop) {
    if (_.isUndefined(modelsParameters[idInstance].backgroundColor)) {
      modelsParameters[idInstance].backgroundColor = {
        primary: 'var(--widget-color-0)',
        secondary: 'var(--widget-table-striped-odd)',
      };
    }
    const bc =
      ' background-color: ' +
      this.getColorValueFromCSSProperty(modelsParameters[idInstance].backgroundColor[prop]) +
      '; ';
    return bc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                     Scoring & Gauges widgets                       | \\
  // +--------------------------------------------------------------------¦ \\
  this.thicknessBackgroundColor = function () {
    const color = this.setColorValueFromModelParameters('thicknessBackgroundColor', 'var(--widget-segment-color)');
    const bc = ' background-color="' + color + '" ';
    return bc;
  };

  this.thicknessColor = function () {
    const color = this.setColorValueFromModelParameters('thicknessColor', 'var(--widget-range-color)');
    const bc = ' foreground-color="' + color + '" ';
    return bc;
  };

  // +--------------------------------------------------------------------¦ \\
  // |                     Annotations widgets                            | \\
  // +--------------------------------------------------------------------¦ \\
  this.tipBackgroundColor = function () {
    const color = this.setColorValueFromModelParameters('tipBackgroundColor', 'var(--widget-button-color)');
    return color;
  };

  this.tipBorderColor = function () {
    const color = this.setColorValueFromModelParameters('tipBorderColor', 'var(--widget-button-text)');
    return color;
  };
}

/**
 * Lists the descriptions of the actuators (potentialy) available on the widget. The actual instances must be accessed through {@link getByName} with the names found in the descriptions.
 *
 * If the list depends on "modelsParameters[idInstance]", an alternative "would-be" model may be provided and should be used instead when this is the case.
 * @param {Object} model if provided and the available actuators depend on the widget's configuration, determination should be based on the provided state instead of "modelsParameters[idInstance]"
 * @returns {WidgetActuatorDescription[]} the list of actuator descriptions for the widget
 */
baseWidget.prototype.getActuatorDescriptions = function _getActuatorDescriptions(model = null) {
  return [];
};

/**
 * Get an actuator from its name.
 * @param {string} key
 * @returns {(WidgetActuator | undefined)}
 */
baseWidget.prototype.getByName = function (key) {
  if (this.hasOwnProperty(key)) {
    return this[key];
  }
};

baseWidget.prototype.getInteractive = function () {
  return this.bIsInteractive;
};

baseWidget.prototype.setInteractive = function (bInteractive) {
  if (bInteractive != this.bIsInteractive) {
    this.bIsInteractive = bInteractive;
    this.render();
  }
};

baseWidget.prototype.rescale = function () {};

baseWidget.prototype.render = function () {};

/**
 * Not used (a least for now). Only meant to document the expected interface of actuators.
 */
class WidgetActuator {
  /**
   * Sets a new value into the widget for this actuator
   * @param {*} value
   */
  setValue(val) {}

  /**
   * Gets the widget's current for this actuator
   * @returns {*}
   */
  getValue() {
    return undefined;
  }

  /**
   * callback the widget will notify when this actuator's value changes.
   *
   * @callback updateDataFromWidget
   * @param {WidgetActuator} sender this actuator instance
   * @param {*} e the new value of the actuator. TODO not used! getValue is called instead
   * @param {?boolean} doubleTrig used to handle some edge cases
   * @returns {void}
   */

  /**
   * Adds a callback the widget will notify when this actuator's value changes.
   * !! Most widgets currently only support one callback at a time !!
   * // FIXME either make this 'setValueChangedHandler' or implements a list
   * @param {updateDataFromWidget} callback
   */
  addValueChangedHandler(callback) {}

  /**
   * Removes a change callback
   * @param {updateDataFromWidget} callback
   */
  removeValueChangedHandler(callBack) {}

  /**
   * Optional. Set the actuator's caption.
   * @param {string} caption new caption
   * @param {boolean} bCaptionManuallyChanged
   */
  setCaption(caption, bCaptionManuallyChanged) {}

  /**
   * Optional. Reset the actuator's caption.
   */
  clearCaption() {}
}

/** Base implementation providing a refecence to the widget and an updateCallback */
class WidgetActuatorBase extends WidgetActuator {
  static NOOP_CALLBACK = function (actuator, value, doubleTrig = undefined) {};

  constructor(widget) {
    super();
    this.widget = widget;
  }

  /**
   * @type {updateDataFromWidget}
   */
  updateCallback = WidgetActuatorBase.NOOP_CALLBACK;

  addValueChangedHandler(callback) {
    this.updateDataFromWidget = callback;
  }

  removeValueChangedHandler(callBack) {
    this.updateDataFromWidget = WidgetActuatorBase.NOOP_CALLBACK;
  }
}

/**
 * Provides information on a actuator for user feedback (description, validation, filtering of datanodes)
 */
class WidgetActuatorDescription {
  // Directions
  static TRIGGER = 0;
  static READ = 1;
  static WRITE = 2;
  static READ_WRITE = WidgetActuatorDescription.READ | WidgetActuatorDescription.WRITE;

  constructor(name, summary, readwrite, schema = null, validator = null) {
    this._name = name;
    this._summary = summary;
    this._readwrite = readwrite;
    this._schema = schema;
    this._validator = validator;
  }

  /**
   * Name of the actuator. Must be a valid input for `getByName`. Very mandatory.
   * @type {!string}
   */
  get name() {
    return this._name;
  }

  /**
   * Short description of what the actuator is/does
   * @type {!string}
   */
  get summary() {
    return this._summary;
  }

  /**
   * Advertise wether the actuator reads/writes data or is a mere trigger.
   * @type {!number} one of TRIGGER, READ, WRITE or READ_WRITE
   */
  get direction() {
    return this._readwrite;
  }

  /**
   * Json Schema that will be provided to `WidgetPrototypesManager` to validate data bound to the actuator.
   * Pointless for triggers, or when a validator function is directly provided.
   *
   * Json Schema version should be `WidgetPrototypesManager.SCHEMA_VERSION`.
   * Providing a globally unique `$id` is mandatory. Advised form is `${WidgetPrototypesManager.ID_URI_SCHEME}xdash:widgetName_actuatorName`.
   * `WidgetPrototypesManager` also provides reusable schemas for basic cases as static variables.
   * Can be an array of schemas when using `$ref`s to other schemas.
   * @type {?(string | Array<string>)}
   */
  get jsonSchema() {
    return this._schema;
  }

  /**
   * Alternative to `jsonSchema`. Directly provides a function to validate the data bound to the actuator. Said function must return a a
   * @type {?function(any):Array<WidgetActuatorValidationError>}
   */
  get validator() {
    return this._validator;
  }
}

/**
 * Errors returned by an actuator's validator.
 *
 * Composite used to nest errors to structure causes, etc.
 */
class WidgetActuatorValidationError {
  constructor(msg, nested = undefined) {
    this._msg = msg;
    this._nested = nested || [];
  }

  /**
   * Description of the problem
   * @type {string}
   */
  get msg() {
    return this._msg;
  }

  /**
   * Nested errors (ex: causes, details...)
   * @type {Array<WidgetActuatorValidationError>}
   */
  get nested() {
    return this._nested;
  }

  /**
   * @returns {string} a default representation of this error and all nested ones
   */
  toString() {
    return this._print().join('\n');
  }

  _print(prefix = '') {
    return [prefix + '- ' + this._msg, ...this._nested.flatMap((_) => _._print(prefix + '   '))];
  }

  compareTo(other) {
    const msgCmp = this.msg.localeCompare(other.msg);
    if (msgCmp !== 0) {
      return msgCmp;
    }

    const len = this.nested.length;
    const lenCpm = len - other.nested.length;
    if (lenCpm !== 0) {
      return lenCpm;
    }

    for (let i = 0; i < len; i++) {
      const cmp = this.nested[i].compareTo(other.nested[i]);
      if (cmp !== 0) {
        return cmp;
      }
    }

    return 0;
  }
}
