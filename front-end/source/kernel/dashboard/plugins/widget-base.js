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
    this.getColorValueFromCSSProperty = function(value) {
        var color = value;
        if(color.includes('var(--')) {
            var realValue = value.substring(4, value.length - 1);
            color = window.getComputedStyle(document.documentElement).getPropertyValue(realValue);
        }
        return color;
    }

    this.labelFontSize = function () {
        var fs = 'font-size: calc(7px + ' +
            modelsParameters[idInstance].labelFontSize * getFontFactor() +
            'vw + 0.4vh); ';
        return fs;
    };

    this.valueFontSize = function () {
        var fs = 'font-size: calc(7px + ' +
            modelsParameters[idInstance].valueFontSize * getFontFactor() +
            'vw + 0.4vh); ';
        return fs;
    };


    this.valueFormat = function (val) {

        var decDigits = parseInt(modelsParameters[idInstance].decimalDigits, 10);
        if (isNaN(decDigits)) return val;

        var procVal = val;
        if (decDigits != -1) {
            if (!isNaN(val)) {
                procVal = parseFloat(val);
                if (isNaN(procVal)) return val;
                procVal = Math.round10(procVal, -decDigits);
            }
        }
        return procVal;
    }

    this.fontSize = function () {
        var fs = 'font-size: calc(7px + ' +
            modelsParameters[idInstance].fontsize * getFontFactor() +
            'vw + 0.4vh); ';
        return fs;
    };

    this.selectFontSize = function () {
        var fs = 'font-size: calc(7px + ' +
            modelsParameters[idInstance].selectValueFontSize * getFontFactor() +
            'vw + 0.4vh); ';
        return fs;
    };

    this.labelColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].labelColor)) {
            modelsParameters[idInstance].labelColor = "#2154ab";
        }
        var fc = 'color:' + modelsParameters[idInstance].labelColor + "; ";
        return fc;
    };

    this.valueColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].valueColor)) {
            modelsParameters[idInstance].valueColor = "#34495e";
        }
        var fc = 'color:' + modelsParameters[idInstance].valueColor + "; ";

        return fc;
    };

    this.labelFontFamily = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].labelFontFamily)) {
            modelsParameters[idInstance].labelFontFamily = 'Helvetica Neue';
        }
        var ff = 'font-family: ' + modelsParameters[idInstance].labelFontFamily + ', Helvetica, Arial, sans-serif' + "; ";
        return ff;
    }

    this.valueFontFamily = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].valueFontFamily)) {
            modelsParameters[idInstance].valueFontFamily = 'Helvetica Neue';
        }
        var ff = 'font-family: ' + modelsParameters[idInstance].valueFontFamily + ', Helvetica, Arial, sans-serif' + "; ";
        return ff;
    }



    this.buttonFontFamily = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].buttonFontFamily)) {
            modelsParameters[idInstance].buttonFontFamily = 'Helvetica Neue';
        }
        var ff = 'font-family: ' + modelsParameters[idInstance].buttonFontFamily + ', Helvetica, Arial, sans-serif' + "; ";
        return ff;
    }

    this.setButtonColorStyle = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].buttonDefaultColor)) {
            modelsParameters[idInstance].buttonDefaultColor = '#447bdc';
        }
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].buttonHoverColor)) {
            modelsParameters[idInstance].buttonHoverColor = '#a9c3ef';
        }
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].buttonActiveColor)) {
            modelsParameters[idInstance].buttonActiveColor = '#2154ab';
        }
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].buttonTextColor)) {
            modelsParameters[idInstance].buttonTextColor = '#ffffff';
        }

        var styleNormalId = 'styleNormalFor' + idInstance + 'widgetCustomColor';
        var styleNormal = document.getElementById(styleNormalId);
        var styleNormalHtml = '.' + idInstance + 'widgetCustomColor' +
            '{ ' +
            'color: ' + modelsParameters[idInstance].buttonTextColor + ';' +
            'background-color: ' + modelsParameters[idInstance].buttonDefaultColor + ';' +
            'border-color: ' + modelsParameters[idInstance].buttonDefaultColor + ';' +
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
            var styleHoverId = 'styleHoverFor' + idInstance + 'widgetCustomColor';
            var styleHover = document.getElementById(styleHoverId);
            var styleHoverHtml = '.' + idInstance + 'widgetCustomColor:hover' +
                '{ ' +
                'background-color: ' + modelsParameters[idInstance].buttonHoverColor + ';' +
                'border-color: ' + modelsParameters[idInstance].buttonHoverColor + ';' +
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

            var styleActiveId = 'styleActiveFor' + idInstance + 'widgetCustomColor';
            var styleActive = document.getElementById(styleActiveId);
            var styleActiveHtml = '.' + idInstance + 'widgetCustomColor:active' +
                '{ ' +
                'background-color: ' + modelsParameters[idInstance].buttonActiveColor + ';' +
                'border-color: ' + modelsParameters[idInstance].buttonActiveColor + ';' +
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
    }

    this.border = function () {

        var border = 'border: none; ';
        if (modelsParameters[idInstance].displayBorder) {
            if (_.isUndefined(modelsParameters[idInstance].borderColor)) {
                modelsParameters[idInstance].borderColor = "#447bdc";
            }
            border = ' border: 2px solid ' + modelsParameters[idInstance].borderColor + '; ';
        } else {
            border = border + '-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
            border = border + '-moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
            border = border + 'box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
        }

        return border;
    }

    this.captionHelper = function (caption, bIsInteractive, bCaptionManuallyChanged) {
        if (!bIsInteractive) {
            if (bCaptionManuallyChanged) {
                modelsParameters[idInstance].inheritLabelFromData = false;
            } else {
                modelsParameters[idInstance].label = caption;
            }
        } else { // est-ce qu'on a intérêt à l'héritage en runtime ?
            modelsParameters[idInstance].label = caption;
        }
    }
    // +--------------------------------------------------------------------¦ \\
    // |                            Value  widget                           | \\
    // +--------------------------------------------------------------------¦ \\
    this.validationButtonDefaultColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].validationBtnDefaultColor)) {
            modelsParameters[idInstance].validationBtnDefaultColor = "#447bdc";
        }
        var bc = 'background-color:' + modelsParameters[idInstance].validationBtnDefaultColor + "; ";
        return bc;
    };

    this.validationButtonHoverColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].validationBtnHoverColor)) {
            modelsParameters[idInstance].validationBtnHoverColor = "#a9c3ef";
        }
        var bc = 'background-color:' + modelsParameters[idInstance].validationBtnHoverColor + "; ";
        return bc;
    };

    this.validationButtonActiveColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].validationBtnActiveColor)) {
            modelsParameters[idInstance].validationBtnActiveColor = "#2154ab";
        }
        var bc = 'background-color:' + modelsParameters[idInstance].validationBtnActiveColor + "; ";
        return bc;
    };

    this.validationButtonBorderColor = function () {
        // Backward compatibility
        var border = 'border: none; ';
        if (modelsParameters[idInstance].displayBorder) {
            if (_.isUndefined(modelsParameters[idInstance].validationBtnDefaultColor)) {
                modelsParameters[idInstance].validationBtnDefaultColor = "#2154ab";
            }
            border = 'border: 2px solid ' + modelsParameters[idInstance].validationBtnDefaultColor + "; ";
        } else {
            border = border + '-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
            border = border + '-moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
            border = border + 'box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
        }

        return border;
    };

    // +--------------------------------------------------------------------¦ \\
    // |                          KPI Advanced widget                       | \\
    // +--------------------------------------------------------------------¦ \\
    this.graphColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].graphColor)) {
            modelsParameters[idInstance].graphColor = "#007a87";
        }
        return this.getColorValueFromCSSProperty(modelsParameters[idInstance].graphColor);
    };

    this.subLabelFontFamily = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].subLabelFontFamily)) {
            modelsParameters[idInstance].subLabelFontFamily = 'Helvetica Neue';
        }
        var ff = 'font-family: ' + modelsParameters[idInstance].subLabelFontFamily + ', Helvetica, Arial, sans-serif' + "; ";
        return ff;
    }

    this.subLabelColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].subLabelColor)) {
            modelsParameters[idInstance].subLabelColor = "#34495e";
        }
        var fc = 'color:' + modelsParameters[idInstance].subLabelColor + "; ";
        return fc;
    };

    this.subLabelFontSize = function () {
        var fs = 'font-size: calc(7px + ' +
            modelsParameters[idInstance].subLabelFontSize * getFontFactor() +
            'vw + 0.4vh); ';
        return fs;
    };

    // +--------------------------------------------------------------------¦ \\
    // |                            Switch widget                           | \\
    // +--------------------------------------------------------------------¦ \\
    this.switchOnColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].switchOnColor)) {
            modelsParameters[idInstance].switchOnColor = "#447bdc";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].switchOnColor + "; ";
        return bc;
    };

    this.switchOffColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].switchOffColor)) {
            modelsParameters[idInstance].switchOffColor = "#ccc";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].switchOffColor + "; ";
        return bc;
    };

    this.switchShadowColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].switchOnColor)) {
            modelsParameters[idInstance].switchOnColor = "#447bdc";
        }
        var sc = 'box-shadow: 0 0 1px ' + modelsParameters[idInstance].switchOnColor + "; ";
        return sc;
    };

    // +--------------------------------------------------------------------¦ \\
    // |                        Progress bar widget                         | \\
    // +--------------------------------------------------------------------¦ \\
    this.progressBarRangeColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].progressBarRangeColor)) {
            modelsParameters[idInstance].progressBarRangeColor = "#447bdc";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].progressBarRangeColor + "; ";
        return bc;
    };

    this.progressBarSegmentColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].progressBarSegmentColor)) {
            modelsParameters[idInstance].progressBarSegmentColor = "#ebedef";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].progressBarSegmentColor + "; ";
        return bc;
    };

    // +--------------------------------------------------------------------¦ \\
    // |            Horizontal & Vertical & double sliders widgets          | \\
    // +--------------------------------------------------------------------¦ \\
    this.sliderRangeColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].sliderRangeColor)) {
            modelsParameters[idInstance].sliderRangeColor = "#447bdc";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].sliderRangeColor + "; ";
        return bc;
    };

    this.sliderSegmentColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].sliderSegmentColor)) {
            modelsParameters[idInstance].sliderSegmentColor = "#ebedef";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].sliderSegmentColor + "; ";
        return bc;
    };

    this.sliderHandleDefaultColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].sliderHandleDefaultColor)) {
            modelsParameters[idInstance].sliderHandleDefaultColor = "#2154ab";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].sliderHandleDefaultColor + "; ";
        return bc;
    };

    this.sliderHandleHoverColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].sliderHandleHoverColor)) {
            modelsParameters[idInstance].sliderHandleHoverColor = "#a9c3ef";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].sliderHandleHoverColor + "; ";
        return bc;
    };

    this.sliderHandleActiveColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].sliderHandleActiveColor)) {
            modelsParameters[idInstance].sliderHandleActiveColor = "#a9c3ef";
        }
        var bc = 'background-color: ' + modelsParameters[idInstance].sliderHandleActiveColor + "; ";
        return bc;
    };

    this.valueBorderColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].valueBorderColor)) {
            modelsParameters[idInstance].valueBorderColor = "#447bdc";
        }
        var bc = 'border-color: ' + modelsParameters[idInstance].valueBorderColor + "; ";
        return bc;
    };

    // +--------------------------------------------------------------------¦ \\
    // |                         Load file widget                           | \\
    // +--------------------------------------------------------------------¦ \\
    this.textSize = function () {
        var fs = 'font-size: calc(7px + ' +
            modelsParameters[idInstance].textSize * getFontFactor() +
            'vw + 0.4vh); ';
        return fs;
    };

    this.textColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].textColor)) {
            modelsParameters[idInstance].textColor = "#3e3f47";
        }
        var tc = 'color: ' + modelsParameters[idInstance].textColor + "; ";
        return tc;
    };

    this.subTextColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].subTextColor)) {
            modelsParameters[idInstance].subTextColor = "#88878e";
        }
        var tc = 'color: ' + modelsParameters[idInstance].subTextColor + "; ";
        return tc;
    };

    this.browseButtonTextColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].browseButtonTextColor)) {
            modelsParameters[idInstance].browseButtonTextColor = "#e0807f";
        }
        var tc = ' color: ' + modelsParameters[idInstance].browseButtonTextColor + "; ";
        tc = tc + ' border-color: ' + modelsParameters[idInstance].browseButtonTextColor + "; ";
        return tc;
    };

    this.browseButtonDefaultColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].browseButtonDefaultColor)) {
            modelsParameters[idInstance].browseButtonDefaultColor = "#ffffff";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].browseButtonDefaultColor + "; ";
        return bc;
    };

    this.browseButtonHoverColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].browseButtonHoverColor)) {
            modelsParameters[idInstance].browseButtonHoverColor = "#ffffff";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].browseButtonHoverColor + "; ";
        return bc;
    };

    this.browseButtonActiveColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].browseButtonActiveColor)) {
            modelsParameters[idInstance].browseButtonActiveColor = "#ffffff";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].browseButtonActiveColor + "; ";
        return bc;
    };

    this.deleteButtonDefaultColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].deleteButtonDefaultColor)) {
            modelsParameters[idInstance].deleteButtonDefaultColor = "#e8eaf1";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].deleteButtonDefaultColor + "; ";
        bc = bc + ' box-shadow: 0 0 2px 3px ' + modelsParameters[idInstance].deleteButtonDefaultColor + "; ";
        return bc;
    };

    this.deleteButtonActiveColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].deleteButtonActiveColor)) {
            modelsParameters[idInstance].deleteButtonActiveColor = "#e0807f";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].deleteButtonActiveColor + "; ";
        bc = bc + ' box-shadow: 0 0 2px 3px ' + modelsParameters[idInstance].deleteButtonActiveColor + "; ";
        return bc;
    };

    this.deleteButtonHoverColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].deleteButtonHoverColor)) {
            modelsParameters[idInstance].deleteButtonHoverColor = "#e0807f";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].deleteButtonHoverColor + "; ";
        bc = bc + ' box-shadow: 0 0 2px 3px ' + modelsParameters[idInstance].deleteButtonHoverColor + "; ";
        return bc;
    };


    // +--------------------------------------------------------------------¦ \\
    // |                              List widget                           | \\
    // +--------------------------------------------------------------------¦ \\
    this.listBackgroundColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].listBackgroundColor)) {
            modelsParameters[idInstance].listBackgroundColor = "#ffffff";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].listBackgroundColor + '; ';
        return bc;
    };

    this.selectValueColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].selectValueColor)) {
            modelsParameters[idInstance].selectValueColor = "#34495e";
        }
        var vc = ' color: ' + modelsParameters[idInstance].selectValueColor + '; ';
        return vc;
    };

    this.selectValueBackgroundColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].selectValueBackgroundColor)) {
            modelsParameters[idInstance].selectValueBackgroundColor = "#cecece";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].selectValueBackgroundColor + '; ';
        return bc;
    };

    // +--------------------------------------------------------------------¦ \\
    // |                         Multi-select widget                        | \\
    // +--------------------------------------------------------------------¦ \\
    this.valueDefaultColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].valueDefaultColor)) {
            modelsParameters[idInstance].valueDefaultColor = "#666666";
        }
        var vc = ' color: ' + modelsParameters[idInstance].valueDefaultColor + '; ';
        return vc;
    };

    this.valueFocusColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].valueFocusColor)) {
            modelsParameters[idInstance].valueFocusColor = "#666666";
        }
        var vc = ' color: ' + modelsParameters[idInstance].valueFocusColor + '; ';
        return vc;
    };

    this.valueHoverColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].valueHoverColor)) {
            modelsParameters[idInstance].valueHoverColor = "#000000";
        }
        var vc = ' color: ' + modelsParameters[idInstance].valueHoverColor + '; ';
        return vc;
    };

    this.checkboxDefaultColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].checkboxDefaultColor)) {
            modelsParameters[idInstance].checkboxDefaultColor = "#ffffff";
        }
        var vc = ' background-color: ' + modelsParameters[idInstance].checkboxDefaultColor + '; ';
        return vc;
    };

    this.checkboxFocusColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].checkboxFocusColor)) {
            modelsParameters[idInstance].checkboxFocusColor = "#bdd7ee";
        }
        var vc = ' background-color: ' + modelsParameters[idInstance].checkboxFocusColor + '; ';
        return vc;
    };

    this.checkboxHoverColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].checkboxHoverColor)) {
            modelsParameters[idInstance].checkboxHoverColor = "#ffffff";
        }
        var vc = ' background-color: ' + modelsParameters[idInstance].checkboxHoverColor + '; ';
        return vc;
    };

    this.checkboxHoverBorderColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].checkboxHoverBorderColor)) {
            modelsParameters[idInstance].checkboxHoverBorderColor = "#171819";
        }
        var vc = " border-color: " + modelsParameters[idInstance].checkboxHoverBorderColor + "; ";
        return vc;
    };

    this.checkboxFocusBorderColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].checkboxFocusBorderColor)) {
            modelsParameters[idInstance].checkboxFocusBorderColor = "#171819";
        }
        var vc = " border-color: " + modelsParameters[idInstance].checkboxFocusBorderColor + "; ";
        return vc;
    };

    this.checkboxWidth = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].checkboxWidth)) {
            modelsParameters[idInstance].checkboxWidth = 7;
        }
        var cw = ' width: ' + modelsParameters[idInstance].checkboxWidth + 'rem; ';
        return cw;
    };

    this.checkboxHeight = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].checkboxHeight)) {
            modelsParameters[idInstance].checkboxHeight = 1.5;
        }
        var ch = ' line-height: ' + modelsParameters[idInstance].checkboxHeight + '; ';
        return ch;
    };

    this.checkboxBorder = function () {
        var border = 'border: none; ';
        if (modelsParameters[idInstance].displayBorder) {
            if (_.isUndefined(modelsParameters[idInstance].checkboxBorderColor)) {
                modelsParameters[idInstance].checkboxBorderColor = "#171819";
            }
            border = ' border: 1.5px solid ' + modelsParameters[idInstance].checkboxBorderColor + '; ';
        } else {
            border = border + '-webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
            border = border + '-moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
            border = border + 'box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0);';
        }
        return border;
    }

    // +--------------------------------------------------------------------¦ \\
    // |                          Select widget                             | \\
    // +--------------------------------------------------------------------¦ \\
    this.selectedValueColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].selectedValueColor)) {
            modelsParameters[idInstance].selectedValueColor = "#ffffff";
        }
        var vc = ' color: ' + modelsParameters[idInstance].selectedValueColor + '; ';
        return vc;
    };

    this.selectedItemDefaultColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].selectedItemDefaultColor)) {
            modelsParameters[idInstance].selectedItemDefaultColor = "#447bdc";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].selectedItemDefaultColor + '; ';
        return bc;
    };

    this.selectedItemHoverColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].selectedItemHoverColor)) {
            modelsParameters[idInstance].selectedItemHoverColor = "#a9c3ef";
        }
        var bc = ' background-color: ' + modelsParameters[idInstance].selectedItemHoverColor + '; ';
        return bc;
    };

    // +--------------------------------------------------------------------¦ \\
    // |                     Scoring & Gauges widgets                       | \\
    // +--------------------------------------------------------------------¦ \\
    this.thicknessBackgroundColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].thicknessBackgroundColor)) {
            modelsParameters[idInstance].thicknessBackgroundColor = "#ebedef";
        }
        var bc = ' background-color="' + this.getColorValueFromCSSProperty(modelsParameters[idInstance].thicknessBackgroundColor) + '" ';
        return bc;
    };

    this.thicknessColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].thicknessColor)) {
            modelsParameters[idInstance].thicknessColor = "#447bdc";
        }
        var bc = ' foreground-color="' + this.getColorValueFromCSSProperty(modelsParameters[idInstance].thicknessColor) + '" ';
        return bc;
    };

    // +--------------------------------------------------------------------¦ \\
    // |                     Scoring & Gauges widgets                       | \\
    // +--------------------------------------------------------------------¦ \\
    this.thicknessBackgroundColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].thicknessBackgroundColor)) {
            modelsParameters[idInstance].thicknessBackgroundColor = "#ebedef";
        }
        var bc = ' background-color="' + this.getColorValueFromCSSProperty(modelsParameters[idInstance].thicknessBackgroundColor) + '" ';
        return bc;
    };

    this.thicknessColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].thicknessColor)) {
            modelsParameters[idInstance].thicknessColor = "#447bdc";
        }
        var bc = ' foreground-color="' + this.getColorValueFromCSSProperty(modelsParameters[idInstance].thicknessColor) + '" ';
        return bc;
    };

    // +--------------------------------------------------------------------¦ \\
    // |                     Annotations widgets                            | \\
    // +--------------------------------------------------------------------¦ \\
    this.tipBackgroundColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].tipBackgroundColor)) {
            modelsParameters[idInstance].tipBackgroundColor = "#2A3F54";
        }
        var bc = this.getColorValueFromCSSProperty(modelsParameters[idInstance].tipBackgroundColor);
        return bc;
    };

    this.tipBorderColor = function () {
        // Backward compatibility
        if (_.isUndefined(modelsParameters[idInstance].tipBorderColor)) {
            modelsParameters[idInstance].tipBorderColor = "#FFF";
        }
        var bc = this.getColorValueFromCSSProperty(modelsParameters[idInstance].tipBorderColor);
        return bc;
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
    removeValueChangedHandler(callBack) { }

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
    static NOOP_CALLBACK = function(actuator, value, doubleTrig = undefined) {};

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
 * Provides information on a actuator for user feedback (description, validation, filtering of datasources)
 */
class WidgetActuatorDescription {
    // Directions
    static TRIGGER = 0;
    static READ = 1;
    static WRITE = 2;
    static READ_WRITE = WidgetActuatorDescription.READ | WidgetActuatorDescription.WRITE;
    static FILE = 4;

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
     * Advertise wether the actuator reads/writes data, pushes a file's content, or is a mere trigger.
     * @type {!number} one of TRIGGER, READ, WRITE, READ_WRITE or FILE
     */
    get direction() {
        return this._readwrite;
    }

    /**
     * Json Schema that will be provided to `WidgetPrototypesManager` to validate data bound to the actuator.
     * Pointless for files and triggers, or when a validator function is directly provided.
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
        return this._print().join("\n")
    }

    _print(prefix = "") {
        return [prefix + "- " + this._msg, ...this._nested.flatMap(_ => _._print(prefix + "   "))];
    }

    compareTo(other) {
        const msgCmp = this.msg.localeCompare(other.msg);
        if(msgCmp !== 0) {
            return msgCmp;
        }

        const len = this.nested.length;
        const lenCpm = len - other.nested.length;
        if(lenCpm !== 0) {
            return lenCpm;
        }

        for(let i = 0; i < len; i++) {
            const cmp = this.nested[i].compareTo(other.nested[i]);
            if(cmp !== 0) {
                return cmp;
            }
        }

        return 0;
    }
}
