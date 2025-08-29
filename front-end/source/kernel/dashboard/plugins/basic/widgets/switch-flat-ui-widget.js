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
import { modelsHiddenParams, modelsParameters } from 'kernel/base/widgets-states';
import { baseWidget, WidgetActuatorBase, WidgetActuatorDescription } from '../../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

class SwitchValueActuator extends WidgetActuatorBase {
  setValue(val) {
    modelsHiddenParams[this.widget.idInstance].value = val;
    this.widget.updateSwitchStatus();
  }

  getValue() {
    const switchElement = document.getElementById(`switch${this.widget.idWidget}`);
    return switchElement ? switchElement.checked : modelsHiddenParams[this.widget.idInstance].value;
  }

  setCaption(caption, bCaptionManuallyChanged) {
    if (modelsParameters[this.widget.idInstance].inheritLabelFromData) {
      this.widget.captionHelper(caption, this.widget.bIsInteractive, bCaptionManuallyChanged);
      this.widget.render();
    }
  }

  clearCaption() {
    if (modelsParameters[this.widget.idInstance].inheritLabelFromData) {
      modelsParameters[this.widget.idInstance].label = '';
    }
    this.widget.render();
  }
}

export class SwitchFlatUiWidget extends baseWidget {
  static _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
    'value',
    'Current value',
    WidgetActuatorDescription.READ_WRITE,
    WidgetPrototypesManager.SCHEMA_BOOLEAN
  );

  constructor(idDivContainer, idWidget, idInstance, bInteractive) {
    super(idDivContainer, idWidget, idInstance, bInteractive);

    this.value = new SwitchValueActuator(this);
    this.render();
  }

  enable() {
    $(`#switch${this.idWidget}`).on('click', (e) => {
      this.value.updateCallback(this.value, this.value.getValue());
      if ($(`#switch${this.idWidget}`)[0].checked) {
        const divSwitchHeightPx = $(`#switch-label${this.idWidget}`).height();
        const divContainerWidthPx = $(`#${this.idDivContainer}`).width();
        const size = Math.min(divContainerWidthPx, divSwitchHeightPx) - 8;
        const size2 = $(`#slide${this.idWidget}`).width() - size - 8;
        if (document.styleSheets.length > 0) {
          document.styleSheets[0].addRule(`#slide${this.idWidget}:before`, `transform: translateX(${size2}px);`);
        }
      } else {
        if (document.styleSheets.length > 0) {
          document.styleSheets[0].addRule(`#slide${this.idWidget}:before`, 'transform: translateX(0px);');
        }
      }
    });
    $(`#switch${this.idWidget}`).prop('disabled', false);
  }

  disable() {
    $(`#switch${this.idWidget}`).unbind('click');
    $(`#switch${this.idWidget}`).prop('disabled', true);
  }

  updateSwitchStatus() {
    if (modelsHiddenParams[this.idInstance].value === true) {
      if (!$(`#switch${this.idWidget}`)[0].checked) {
        $(`#switch${this.idWidget}`).prop('checked', true);
        const divSwitchHeightPx = $(`#switch-label${this.idWidget}`).height();
        const divContainerWidthPx = $(`#${this.idDivContainer}`).width();
        const size = Math.min(divContainerWidthPx, divSwitchHeightPx) - 8;
        const size2 = $(`#slide${this.idWidget}`).width() - size - 8;
        if (document.styleSheets.length > 0) {
          document.styleSheets[0].addRule(`#slide${this.idWidget}:before`, `transform: translateX(${size2}px);`);
          document.styleSheets[0].addRule(`input:checked + #slide${this.idWidget}`, this.switchOnColor());
          document.styleSheets[0].addRule(`input:focus + #slide${this.idWidget}`, this.switchOnColor());
        }
      }
    } else if (modelsHiddenParams[this.idInstance].value === false) {
      if ($(`#switch${this.idWidget}`)[0].checked) {
        $(`#switch${this.idWidget}`).prop('checked', false);
        if (document.styleSheets.length > 0) {
          document.styleSheets[0].addRule(`#slide${this.idWidget}:before`, 'transform: translateX(0px);');
        }
      }
    }
  }

  rescale() {
    this.render();
  }

  render() {
    let coeff = 1;

    if (!_.isUndefined(modelsParameters[this.idInstance].switchWidthProportion)) {
      coeff = Math.min(1, parseFloat(modelsParameters[this.idInstance].switchWidthProportion) / 100);
    }

    const divContainerHeightPx = $(`#${this.idDivContainer}`).height();

    let divSwitchHeightPx = Math.min(divContainerHeightPx, 260); //maxHeight
    divSwitchHeightPx = Math.min(divSwitchHeightPx, (coeff * $(`#${this.idDivContainer}`).width()) / 3); //keepRatio
    divSwitchHeightPx = Math.ceil(divSwitchHeightPx); // in px

    const divContainerWidthPx = $(`#${this.idDivContainer}`).width();
    const widgetHtml = document.createElement('div');
    widgetHtml.setAttribute('id', `switch-widget-html${this.idWidget}`);
    widgetHtml.setAttribute('class', 'switch-widget-html');
    widgetHtml.setAttribute('style', `height: ${divContainerHeightPx}px;`);

    const labelPosition =
      !_.isUndefined(modelsParameters[this.idInstance].labelPosition) &&
      modelsParameters[this.idInstance].labelPosition === 'right'
        ? 'right'
        : 'left';
    const widgetDirection = labelPosition === 'left' ? 'rtl' : 'ltr';

    // Dynamically set the direction property to 'ltr' or 'rtl'
    if (document.styleSheets.length > 0) {
      document.styleSheets[0].addRule(`#switch-widget-html${this.idWidget}`, `direction: ${widgetDirection}`);
    }

    let divContent;
    if (!_.isUndefined(modelsParameters[this.idInstance].switchWidthProportion)) {
      const proportion = Math.min(100, parseFloat(modelsParameters[this.idInstance].switchWidthProportion)) + '%';
      divContent = `<div class="switch-div" style="width: ${proportion};">`;
    } else {
      divContent = '<div class="switch-div" style="width: 100%;">';
    }
    let cursorSwitch = '';
    if (this.bIsInteractive) {
      cursorSwitch = 'cursor: pointer;';
    } else {
      cursorSwitch = 'cursor: inherit;';
    }
    divContent += `<label id="switch-label${this.idWidget}" class="switch-label" style="height:${divSwitchHeightPx}px;">`;
    divContent += `<input type="checkbox" id="switch${this.idWidget}">`;
    divContent += `<div id="slide${this.idWidget}"class="slider round" style="${cursorSwitch}">`;
    divContent += '</div>';
    divContent += '</label>';
    divContent += '</div>';
    if (modelsParameters[this.idInstance].displayLabel) {
      // conversion to enable HTML tags
      const labelText = this.getTransformedText('label');

      divContent += `<span id="switch-span${this.idWidget}" class="switch-span" style="${this.labelFontSize()}${this.labelColor()}${this.labelFontFamily()} text-align: ${labelPosition};">${labelText}</span>`;
    }
    widgetHtml.innerHTML = divContent;

    // Set widget display and enable/disable styles
    const showWidget = this.showWidget();
    const displayStyle = showWidget ? 'display: table;' : 'display: none;';
    const enableWidget = this.enableWidget();
    const enableStyle = enableWidget ? 'pointer-events: initial; opacity:initial;' : 'pointer-events: none; opacity:0.5;';

    widgetHtml.setAttribute('style', displayStyle + enableStyle);
    
    const container = document.getElementById(this.idDivContainer);
    container.innerHTML = '';
    container.appendChild(widgetHtml);

    if (document.styleSheets.length > 0) {
      document.styleSheets[0].addRule(`input + #slide${this.idWidget}`, this.switchOffColor());
      document.styleSheets[0].addRule(`input:checked + #slide${this.idWidget}`, this.switchOnColor());
      document.styleSheets[0].addRule(`input:focus + #slide${this.idWidget}`, this.switchShadowColor());

      //resize the circle
      const size = Math.min(divContainerWidthPx, divSwitchHeightPx) - 8;
      document.styleSheets[0].addRule(`#slide${this.idWidget}:before`, `width: ${size}px;`);
      document.styleSheets[0].addRule(`#slide${this.idWidget}:before`, `height: ${size}px;`);
    }

    if (modelsHiddenParams[this.idInstance].value == null) {
      modelsHiddenParams[this.idInstance].value = false;
    }

    if (modelsHiddenParams[this.idInstance].value === true) {
      $(`#switch${this.idWidget}`).prop('checked', true);
      const size = Math.min(divContainerWidthPx, divSwitchHeightPx) - 8;
      const size2 = $(`#slide${this.idWidget}`).width() - size - 8;
      if (document.styleSheets.length > 0) {
        document.styleSheets[0].addRule(`#slide${this.idWidget}:before`, `transform: translateX(${size2}px);`);
      }
    } else if (modelsHiddenParams[this.idInstance].value === false) {
      $(`#switch${this.idWidget}`).prop('checked', false);
      if (document.styleSheets.length > 0) {
        document.styleSheets[0].addRule(`#slide${this.idWidget}:before`, 'transform: translateX(0px);');
      }
    }

    if (this.bIsInteractive) {
      this.enable();
    } else {
      this.disable();
    }

    $(`#switch${this.idWidget}`)[0].checked = modelsHiddenParams[this.idInstance].value;
  }

  getActuatorDescriptions() {
    return [SwitchFlatUiWidget._VALUE_DESCRIPTOR];
  }
}