// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir El FEKI, Ghiles HIDEUR   │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import { modelsHiddenParams, modelsParameters } from 'kernel/base/widgets-states';
import { baseWidget, WidgetActuatorBase, WidgetActuatorDescription } from '../../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

class ProgressBarValueActuator extends WidgetActuatorBase {
  setValue(val) {
    modelsHiddenParams[this.widget.idInstance].value = val;
    if (modelsParameters[this.widget.idInstance].displayValue) {
      const valueElement = document.getElementById(`progress-bar-value${this.widget.idWidget}`);
      if (valueElement) {
        valueElement.value = val;
      }
    }
    this.widget.render();
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

class ProgressBarMinActuator extends WidgetActuatorBase {
  setValue(valArg) {
    const val = Number(valArg);
    if (typeof val !== 'number') {
      return;
    }
    modelsParameters[this.widget.idInstance].min = val;
    this.widget.render();
  }

  getValue() {
    return modelsParameters[this.widget.idInstance].min;
  }
}

class ProgressBarMaxActuator extends WidgetActuatorBase {
  setValue(valArg) {
    const val = Number(valArg);
    if (typeof val !== 'number') {
      return;
    }
    modelsParameters[this.widget.idInstance].max = val;
    this.widget.render();
  }

  getValue() {
    return modelsParameters[this.widget.idInstance].max;
  }
}

export class ProgressBarFlatUiWidget extends baseWidget {
  static _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
    'value',
    'Current progress',
    WidgetActuatorDescription.READ,
    WidgetPrototypesManager.SCHEMA_NUMBER
  );
  static _MIN_DESCRIPTOR = new WidgetActuatorDescription(
    'min',
    'Base progress value',
    WidgetActuatorDescription.READ,
    WidgetPrototypesManager.SCHEMA_NUMBER
  );
  static _MAX_DESCRIPTOR = new WidgetActuatorDescription(
    'max',
    'Final progress value',
    WidgetActuatorDescription.READ,
    WidgetPrototypesManager.SCHEMA_NUMBER
  );

  constructor(idDivContainer, idWidget, idInstance, bInteractive) {
    super(idDivContainer, idWidget, idInstance, bInteractive);

    this.value = new ProgressBarValueActuator(this);
    this.min = new ProgressBarMinActuator(this);
    this.max = new ProgressBarMaxActuator(this);

    this.render();
  }

  enable() {
    if (modelsParameters[this.idInstance].displayValue) {
      $(`#progress-bar-value${this.idWidget}`).prop('disabled', false);
    }
  }

  disable() {
    if (modelsParameters[this.idInstance].displayValue) {
      $(`#progress-bar-value${this.idWidget}`).prop('disabled', true);
    }
  }

  insertLabel(widgetHtml) {
    // conversion to enable HTML tags
    const labelText = this.getTransformedText('label');
    const widgetLabel = document.createElement('span');
    widgetLabel.setAttribute('class', 'label-progress-bar');
    widgetLabel.setAttribute('id', 'progress-bar-span');
    if (!_.isUndefined(modelsParameters[this.idInstance].labelWidthProportion)) {
      widgetLabel.setAttribute(
        'style',
        `width:${
          modelsParameters[this.idInstance].labelWidthProportion
        }; ${this.labelFontSize()}${this.labelColor()}${this.labelFontFamily()}`
      );
    } else {
      widgetLabel.setAttribute(
        'style',
        `width: 20%; ${this.labelFontSize()}${this.labelColor()}${this.labelFontFamily()}`
      );
    }
    widgetLabel.innerHTML = labelText;
    widgetHtml.appendChild(widgetLabel);
  }

  insertValue(widgetHtml) {
    let valueHeightPx;
    if (modelsParameters[this.idInstance].displayLabel)
      valueHeightPx = Math.min(
        $(`#${this.idDivContainer}`).height(),
        $(`#${this.idDivContainer}`).width() / 6
      ); // keepRatio
    else valueHeightPx = Math.min($(`#${this.idDivContainer}`).height(), $(`#${this.idDivContainer}`).width() / 8); // keepRatio

    const valueHtml = document.createElement('div');
    valueHtml.setAttribute('class', 'progress-bar-value-div');
    valueHtml.setAttribute('id', `div-for-progress-bar-value${this.idWidget}`);
    if (!_.isUndefined(modelsParameters[this.idInstance].valueWidthProportion)) {
      valueHtml.setAttribute('style', `width:${modelsParameters[this.idInstance].valueWidthProportion};`);
    } else {
      valueHtml.setAttribute('style', 'width:30%;');
    }
    let progressBarValueCursor = '';
    if (this.bIsInteractive) {
      progressBarValueCursor = 'cursor: text;';
    } else {
      progressBarValueCursor = 'cursor: inherit;';
    }
    const valueContent = `<input id="progress-bar-value${
      this.idWidget
    }" type="text" placeholder="" class="hslider-input form-control" style="height: ${valueHeightPx}px; ${this.valueFontSize()}${this.getValueColor()}${this.valueFontFamily()}${progressBarValueCursor}" disabled></input>`;

    valueHtml.innerHTML = valueContent;
    widgetHtml.appendChild(valueHtml);
  }

  updateProgressBarWidth() {
    if (!_.isUndefined(modelsHiddenParams[this.idInstance].value)) {
      const val = modelsHiddenParams[this.idInstance].value;
      const progressBarDiv = $(`#progress-bar${this.idWidget} div`);
      const valMin = modelsParameters[this.idInstance].min;
      const valMax = modelsParameters[this.idInstance].max;
      let percentWidth;
      if (val <= valMin) {
        percentWidth = 0;
      } else {
        percentWidth = Math.ceil(((val - valMin) / (valMax - valMin)) * 100);
      }

      progressBarDiv.css('width', percentWidth + '%');
      if (!modelsParameters[this.idInstance].progressBarAnimation) progressBarDiv.css('transition', 'none');
    }
  }

  updateProgressBarValue() {
    if (modelsParameters[this.idInstance].displayValue) {
      const valueElement = document.getElementById(`progress-bar-value${this.idWidget}`);
      if (valueElement) {
        if (modelsParameters[this.idInstance].min > modelsHiddenParams[this.idInstance].value) {
          valueElement.value = modelsParameters[this.idInstance].min;
        } else {
          valueElement.value = modelsHiddenParams[this.idInstance].value;
        }
      }
    }
  }

  rescale() {
    this.render();
  }

  render() {
    const widgetHtml = document.createElement('div');
    widgetHtml.setAttribute('class', 'progress-bar-widget');

    const widgetDiv = document.createElement('div');
    widgetDiv.setAttribute('id', 'progress-bar-div');

    if (!_.isUndefined(modelsParameters[this.idInstance].progressBarWidthProportion)) {
      widgetDiv.setAttribute('style', `width:${modelsParameters[this.idInstance].progressBarWidthProportion};`);
    } else {
      widgetDiv.setAttribute('style', 'width:50%;');
    }

    const widgetCore = document.createElement('div');
    widgetCore.setAttribute('id', `progress-bar${this.idWidget}`);
    widgetCore.setAttribute('class', 'progress');

    const widgetCoreDiv = document.createElement('div');
    widgetCoreDiv.setAttribute('class', 'progress-bar');
    widgetCoreDiv.setAttribute('role', 'progressbar');

    widgetCore.appendChild(widgetCoreDiv);
    widgetDiv.appendChild(widgetCore);

    if (modelsParameters[this.idInstance].displayLabel) {
      this.insertLabel(widgetHtml);
    }

    widgetHtml.appendChild(widgetDiv);
    if (modelsParameters[this.idInstance].displayValue) {
      this.insertValue(widgetHtml);
    }

    // Set widget display and enable/disable styles
    const showWidget = this.showWidget();
    const displayStyle = showWidget ? 'display: table;' : 'display: none;';
    const enableWidget = this.enableWidget();
    const enableStyle = enableWidget
      ? 'pointer-events: initial; opacity:initial;'
      : 'pointer-events: none; opacity:0.5;';

    widgetHtml.setAttribute('style', displayStyle + enableStyle);

    const container = document.getElementById(this.idDivContainer);
    container.innerHTML = '';
    container.appendChild(widgetHtml);

    this.applyDisplayOnWidget();
    $(`#progress-bar${this.idWidget}`).addClass('progress-bar-div-div');

    if (document.styleSheets.length > 0) {
      document.styleSheets[0].addRule(`#progress-bar${this.idWidget}`, this.progressBarSegmentColor());
      document.styleSheets[0].addRule(`#progress-bar${this.idWidget} > .progress-bar`, this.progressBarRangeColor());
    }

    if (this.bIsInteractive) {
      this.enable();
    } else {
      this.disable();
    }

    this.updateProgressBarWidth();
    this.updateProgressBarValue();
  }

  getActuatorDescriptions(model = null) {
    const data = model || modelsParameters[this.idInstance];
    const result = [ProgressBarFlatUiWidget._VALUE_DESCRIPTOR];

    if (data?.rangeActuator) {
      result.push(ProgressBarFlatUiWidget._MIN_DESCRIPTOR);
      result.push(ProgressBarFlatUiWidget._MAX_DESCRIPTOR);
    }

    return result;
  }
}
