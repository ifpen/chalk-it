// ┌──────────────────────────────────────────────────────────────────────┐ \\
// │ layoutMgr                                                            │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                          │ \\
// | Licensed under the Apache License, Version 2.0                       │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Tristan BARTEMENT │ \\
// └──────────────────────────────────────────────────────────────────────┘ \\


/*constants*/
const DEFAULT_BG_COLOR = 'var(--widget-color-0)';
const DEFAULT_THEME = 'default';
import { editorSingletons } from 'kernel/editor-singletons';

export class LayoutMgrClass {
  constructor() {
    // Dashboard background color
    this.dashBgColor = DEFAULT_BG_COLOR;
    this.inheritThemeBgColor = true;
    this.dashboardTheme = DEFAULT_THEME;

    this.$rootScope = angular.element(document.body).scope().$root;
  }

  serialize() {
    const backgroundColor = this.dashBgColor;
    const inheritThemeBackgroundColor = this.inheritThemeBgColor;
    const theme = this.dashboardTheme;

    return {
      theme,
      backgroundColor,
      inheritThemeBackgroundColor,
    };
  }

  deserialize(display) {
    this.dashboardTheme = display.theme ?? DEFAULT_THEME;
    this.dashBgColor = display.backgroundColor ?? DEFAULT_BG_COLOR;
    this.inheritThemeBgColor = display.inheritThemeBackgroundColor ?? false;

    this.updateDashboardTheme();
    this._toggleDashBgColor();
    this.updateDashBgColor();
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                      DashboardBackgroundColor                      | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  getColorValueFromCSSProperty(value) {
    // Convert CSS Custom Properties (ie: var(--widget-color)) to hexa codes
    let color = value;
    if (color.includes('var(--')) {
      const realValue = value.substring(4, value.length - 1);
      color = window.getComputedStyle(document.documentElement).getPropertyValue(realValue);
    }
    return color;
  }

  onInputDashBgColor() {
    this.dashBgColor = $('#inputDashBgColor').val();
    $('.dropperR').css('background-color', this.dashBgColor);
    this.$rootScope.updateFlagDirty(true);
  }

  updateDashBgColor() {
    const colorValue = this.getColorValueFromCSSProperty(this.dashBgColor);
    $('#inputDashBgColor').val(colorValue);
    $('.dropperR').css('background-color', colorValue);
  }

  resetDashBgColor() {
    this.dashBgColor = DEFAULT_BG_COLOR;
    this._toggleDashBgColor();
    this.updateDashBgColor();
  }

  _toggleDashBgColor() {
    $('#divInputDashBgColor').toggleClass('aspect_input-bg-color--disabled', this.inheritThemeBgColor);
    $('#checkboxBgColor').prop('checked', this.inheritThemeBgColor);
    if (this.inheritThemeBgColor) this.dashBgColor = DEFAULT_BG_COLOR;
  }

  setDashBgColor() {
    this.inheritThemeBgColor = $('#checkboxBgColor').is(':checked');
    this._toggleDashBgColor();
    if (this.inheritThemeBgColor) this.updateDashBgColor();
    this.$rootScope.updateFlagDirty(true);
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                          Dashboard Theme                           | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  onChangeDashboardTheme(theme) {
    this.dashboardTheme = theme;
    this.updateDashboardTheme();

    // TODO Open Sweet alert to ask the user if he wants to reset styles for all components
    this.$rootScope.updateFlagDirty(true);
  }

  updateDashboardTheme() {
    $('html').attr('data-theme', this.dashboardTheme);
    $('#current-theme').attr('data-theme', this.dashboardTheme);
    this.updateDashBgColor();
    
    const widgetEditor = editorSingletons.widgetEditor;
    widgetEditor.widgetEditorViewer.rerenderWidgets();
  }

  resetDashboardTheme() {
    this.dashboardTheme = 'default';
    this.updateDashboardTheme();
  }
}
