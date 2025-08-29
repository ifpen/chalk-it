// ┌───────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                               │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                                   │ \\
// | Licensed under the Apache License, Version 2.0                                │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Mongi BEN GAID, Tristan BARTEMENT, Guillaume CORBELIN   │ \\
// └───────────────────────────────────────────────────────────────────────────────┘ \\
import { modelsHiddenParams, modelsParameters } from 'kernel/base/widgets-states';
import { baseWidget, WidgetActuatorBase, WidgetActuatorDescription } from '../../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';
import { getFontFactor } from 'kernel/dashboard/scaling/scaling-utils';

class KpiCardValueActuator extends WidgetActuatorBase {
  constructor(widget) {
    super(widget);
    this.unitContent = '';
  }

  setValue(val) {
    modelsHiddenParams[this.widget.idInstance].value = val;
    const cardElement = document.getElementById(`card-value-${this.widget.idWidget}`);
    if (cardElement) {
      cardElement.innerText = this.widget.valueFormat(modelsHiddenParams[this.widget.idInstance].value);
      if (
        modelsParameters[this.widget.idInstance].unit !== '' &&
        modelsParameters[this.widget.idInstance].displayUnit
      ) {
        cardElement.insertAdjacentHTML('beforeend', this.unitContent);
      }
    }
  }

  getValue() {
    return modelsHiddenParams[this.widget.idInstance].value;
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

export class KpiCardWidget extends baseWidget {
  static _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
    'value',
    'Current value',
    WidgetActuatorDescription.READ,
    WidgetPrototypesManager.SCHEMA_ANY_PRIMITIVE
  );

  constructor(idDivContainer, idWidget, idInstance, bInteractive) {
    super(idDivContainer, idWidget, idInstance, bInteractive);

    this.value = new KpiCardValueActuator(this);
    this.render();
  }

  enable() {
    // KPI Card is read-only, no interaction needed
  }

  disable() {
    // KPI Card is read-only, no interaction needed
  }

  rescale() {
    this.render();
  }

  render() {
    const widgetHtml = document.createElement('div');
    if (modelsParameters[this.idInstance].borderShadow) {
      widgetHtml.setAttribute('class', 'card-kpi-container card-shadow');
    } else {
      widgetHtml.setAttribute('class', 'card-kpi-container');
    }

    let divContent = '<div class="card-kpi">';
    divContent += '<div class="card-body">';
    divContent += '<div class="row align-items-center">';

    let labelContent = '';
    if (modelsParameters[this.idInstance].displayLabel) {
      // conversion to enable HTML tags
      const labelText = this.getTransformedText('label');
      labelContent += '<h5 class="card-mt-0 text-truncate"';
      labelContent += ` style="text-align:center;${this.labelFontSize()}${this.labelColor()}${this.labelFontFamily()}">${labelText}`;
      labelContent += '</h5>';
    }

    let valueContent = `<div id="card-value-${this.idWidget}" class="card-value" style="text-align:center;`;
    valueContent += `${this.valueFontSize()}${this.getValueColor()}${this.valueFontFamily()}"></div>`;

    if (modelsParameters[this.idInstance].valuePosition === 'top') {
      divContent = valueContent + labelContent;
    } else {
      divContent = labelContent + valueContent;
    }

    divContent += '</div>';
    divContent += '</div>';
    divContent += '</div>';

    widgetHtml.innerHTML = divContent;

    // Set display and enable styles
    const showWidget = this.showWidget();
    const displayStyle = showWidget ? 'display: inherit;' : 'display: none;';
    const enableWidget = this.enableWidget();
    const enableStyle = enableWidget
      ? 'pointer-events: initial; opacity:initial;'
      : 'pointer-events: none; opacity:0.5;';

    widgetHtml.setAttribute('style', displayStyle + enableStyle);

    const container = document.getElementById(this.idDivContainer);
    container.innerHTML = '';
    container.appendChild(widgetHtml);

    this.applyDisplayOnWidget();

    const cardValueElement = document.getElementById(`card-value-${this.idWidget}`);
    if (cardValueElement) {
      cardValueElement.innerText = this.valueFormat(modelsHiddenParams[this.idInstance].value);
    }

    // Setup unit content
    this.value.unitContent = `<span id="unit-span${this.idWidget}" style="text-align: left; color: ${
      modelsParameters[this.idInstance].unitColor
    }; font-size: calc(7px + ${modelsParameters[this.idInstance].unitFontSize * getFontFactor()}vw + 0.4vh);">${
      modelsParameters[this.idInstance].unit
    }</span>`;

    if (
      modelsParameters[this.idInstance].unit !== '' &&
      modelsParameters[this.idInstance].displayUnit &&
      cardValueElement
    ) {
      cardValueElement.insertAdjacentHTML('beforeend', this.value.unitContent);
    }

    if (this.bIsInteractive) {
      this.enable();
    } else {
      this.disable();
    }
  }

  getActuatorDescriptions() {
    return [KpiCardWidget._VALUE_DESCRIPTOR];
  }
}
