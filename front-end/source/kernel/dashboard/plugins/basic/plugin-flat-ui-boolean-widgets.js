// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │                                                                       │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2024 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir El FEKI, Tristan BARTEMENT, │ \\
// │                      Guillaume CORBELIN                               │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { CheckboxFlatUiWidget } from './widgets/checkbox-flat-ui-widget';
import { SwitchFlatUiWidget } from './widgets/switch-flat-ui-widget';

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
/************************ plugin declaration ***********************/
/*******************************************************************/

const PLUGIN_DEFINITION = {
  name: 'flatUiBoolean',
  widgetsDefinitionList: {
    flatUiCheckbox: {
      factory: CheckboxFlatUiWidget,
      title: 'Checkbox',
      icn: 'checkbox',
      help: 'wdg/wdg-basics/#checkbox',
    },
    flatUiSwitch: { 
      factory: SwitchFlatUiWidget, 
      title: 'Switch', 
      icn: 'switch', 
      help: 'wdg/wdg-basics/#switch' 
    },
  },
};

widgetsPluginsHandler.loadWidgetPlugin(new basePlugin(PLUGIN_DEFINITION));