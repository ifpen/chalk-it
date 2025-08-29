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

class CheckboxValueActuator extends WidgetActuatorBase {
  setValue(val) {
    modelsHiddenParams[this.widget.idInstance].value = val;
    const checkboxElement = document.getElementById(`checkbox${this.widget.idWidget}`);
    if (checkboxElement) {
      checkboxElement.checked = val;
      if (val) {
        $(checkboxElement).radiocheck('check');
      } else {
        $(checkboxElement).radiocheck('uncheck');
      }
    }
  }

  getValue() {
    const checkboxElement = document.getElementById(`checkbox${this.widget.idWidget}`);
    return checkboxElement ? checkboxElement.checked : modelsHiddenParams[this.widget.idInstance].value;
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

export class CheckboxFlatUiWidget extends baseWidget {
  static _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
    'value',
    'Current value',
    WidgetActuatorDescription.READ_WRITE,
    WidgetPrototypesManager.SCHEMA_BOOLEAN
  );

  constructor(idDivContainer, idWidget, idInstance, bInteractive) {
    super(idDivContainer, idWidget, idInstance, bInteractive);

    this.value = new CheckboxValueActuator(this);
    this.render();
  }

  enable() {
    $(`#checkbox${this.idWidget}`)
      .off('click')
      .on('click', (e) => {
        this.value.updateCallback(this.value, this.value.getValue());
      });
    $(`#checkbox${this.idWidget}`).radiocheck('enable');
  }

  disable() {
    $(`#checkbox${this.idWidget}`).unbind('click');
    $(`#checkbox${this.idWidget}`).radiocheck('disable');
  }

  rescale() {
    this.render();
  }

  render() {
    let checkboxHeight = 20; // default value in class icons of flatui
    let checkboxWidth = 20; // default value in class icons of flatui

    // Update icon dimensions if elements are present
    const iconElement = $('.icons');
    checkboxHeight = iconElement.height() ?? checkboxHeight;
    checkboxWidth = iconElement.width() ?? checkboxWidth;

    // backward compatibility
    if (_.isUndefined(modelsParameters[this.idInstance].checkboxSize)) {
      modelsParameters[this.idInstance].checkboxSize = 1;
    }

    const checkboxSize = modelsParameters[this.idInstance].checkboxSize;
    const padding = checkboxSize * checkboxWidth;
    const lineHeight = checkboxSize * checkboxHeight;
    const labelHeight = checkboxHeight * checkboxSize;

    // Create and configure the main widget container
    const widgetHtml = document.createElement('div');
    widgetHtml.id = `checkbox-widget-html${this.idWidget}`;
    widgetHtml.style.cssText = `
      width: inherit;
      cursor: inherit;
      display: flex;
      justify-content: center;
    `;

    // Determine label position and direction
    const labelPosition = modelsParameters[this.idInstance].labelPosition === 'right' ? 'right' : 'left';
    const widgetDirection = labelPosition === 'left' ? 'rtl' : 'ltr';

    // Dynamically set the direction property to 'ltr' or 'rtl'
    if (document.styleSheets.length > 0) {
      document.styleSheets[0].addRule(`#checkbox-widget-html${this.idWidget}`, `direction: ${widgetDirection}`);
    }

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
        id="checkbox${this.idWidget}"
        disabled
      />
    `;

    if (modelsParameters[this.idInstance].displayLabel) {
      const styleSpan = `
        display: flex;
        align-items: center;
        ${this.labelFontSize()}
        ${this.labelColor()}
        ${this.labelFontFamily()}
      `;
      divContent = `
        <label class="checkbox" id="label${this.idWidget}" style="${styleLabel}" for="checkbox${this.idWidget}">
          ${checkboxHtml}
        </label>
        <span id="checkbox-span${this.idWidget}" class="checkbox-span" style="${styleSpan}">${labelText}</span>
      `;
    } else {
      divContent = `
        <label class="checkbox" id="label${this.idWidget}" style="${styleLabelBase} padding-left: ${padding}px;" for="checkbox${this.idWidget}">
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
    
    const container = document.getElementById(this.idDivContainer);
    container.innerHTML = '';
    container.appendChild(widgetHtml);

    this.applyDisplayOnWidget();
    $('[data-toggle="checkbox"]').radiocheck();
    $('[data-toggle="radio"]').radiocheck();

    // Check or uncheck the checkbox based on the value
    const checkboxSelector = `#checkbox${this.idWidget}`;
    if (modelsHiddenParams[this.idInstance].value) {
      $(checkboxSelector).radiocheck('check');
    } else {
      $(checkboxSelector).radiocheck('uncheck');
    }

    // Apply dynamic styles
    if (document.styleSheets.length > 0) {
      const zoomSize = `zoom: ${checkboxSize}`;
      document.styleSheets[0].addRule(`#label${this.idWidget} .icons *`, zoomSize);
      document.styleSheets[0].addRule(`#label${this.idWidget} .icons .icon-checked`, this.checkedColor());
      document.styleSheets[0].addRule(`#label${this.idWidget} .icons .icon-unchecked`, this.uncheckedColor());
    }

    // Enable or disable the widget based on interactivity
    if (this.bIsInteractive) {
      this.enable();
    } else {
      this.disable();
    }
  }

  getActuatorDescriptions() {
    return [CheckboxFlatUiWidget._VALUE_DESCRIPTOR];
  }
}