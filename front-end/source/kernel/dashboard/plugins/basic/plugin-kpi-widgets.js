// ┌───────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                               │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2024 IFPEN                                                   │ \\
// | Licensed under the Apache License, Version 2.0                                │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Mongi BEN GAID, Tristan BARTEMENT, Guillaume CORBELIN   │ \\
// └───────────────────────────────────────────────────────────────────────────────┘ \\
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { KpiCardWidget } from './widgets/kpi-card-widget';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.kpiCard = { value: '--' };

// Parameters
modelsParameters.kpiCard = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  valuePosition: 'bottom',
  valueFontSize: 2,
  valueColor: 'var(--widget-color)',
  valueFontFamily: 'var(--widget-font-family)',
  decimalDigits: 3,
  unit: 'unitText',
  displayUnit: false,
  unitFontSize: 0.5,
  unitColor: 'var(--widget-label-color)',
  borderShadow: false /*,
    "backgroundColor": "#FFFFFF"*/,
};

// Layout (default dimensions)
modelsLayout.kpiCard = {
  height: '120px',
  width: '180px',
  minWidth: '64px',
  minHeight: '32px',
};

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

const PLUGIN_DEFINITION = {
  name: 'kpiCard',
  widgetsDefinitionList: {
    kpiCard: { factory: KpiCardWidget, title: 'KPI value', icn: 'kpi' },
  },
};

widgetsPluginsHandler.loadWidgetPlugin(new basePlugin(PLUGIN_DEFINITION));
