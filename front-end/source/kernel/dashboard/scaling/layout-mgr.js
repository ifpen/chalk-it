// ┌──────────────────────────────────────────────────────────────────────┐ \\
// │ layoutMgr                                                            │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                          │ \\
// | Licensed under the Apache License, Version 2.0                       │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Tristan BARTEMENT │ \\
// └──────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import { panelDash } from '../edition/panel-dashboard';
import { editorSingletons } from 'kernel/editor-singletons';
import { unitW, unitH } from 'kernel/dashboard/scaling/scaling-utils';
import { getElementLayoutPx } from 'kernel/dashboard/widget/widget-placement';
import { htmlExport } from 'kernel/general/export/html-export';

/*constants*/
export const keyShift = 5; // cst; size in px of keyboard shift using arrows, can be modified
export const minLeftCst = 10; // cst; min left of the dashboard
export const minTopCst = 10; // cst; min top of the dashboard
export const minHeightCst = 10; // cst; min height of a widget, can be modified
export const minWidthCst = 10; // cst; min width of a widget, can be modified

// Toggles entering one height per row; not quite functionnal yet
const MULTIPLE_HEIGHT = false;

export class LayoutMgrClass {
  constructor() {
    // Alias
    this.drprD = $('#DropperDroite')[0];

    this.maxTopCst = this.drprD.offsetHeight * 15; // TODO : coordinate with dragresize
    if (this.maxTopCst == 0) {
      //AEF: temp modif --> drpD is not loaded yet
      this.maxTopCst = $('#DropperDroite').height() * 15;
    }
    this.maxLeftCst = panelDash.fullScreenWidth - minLeftCst; // max left of the dashboard, can be modified

    // Dashboard background color
    this.defaultBgColor = 'var(--widget-color-0)';
    this.dashBgColor = '';
    this.inheritThemeBgColor = true;
    this.dashboardTheme = 'default';
    this.$rootScope = angular.element(document.body).scope().$root;
  }

  updateMaxTopAndLeft() {
    const container = $(this.drprD);
    if (this.rows === 0) {
      if (!container.hasClass('overflow-type1')) {
        container.addClass('overflow-type1');
        container.removeClass('overflow-type2');
        container.removeClass('overflow-type3');
      }
      this.maxLeftCst = panelDash.fullScreenWidth - minLeftCst; //- 14 webkit-scrollbar width: 14px
      this.maxTopCst = this.drprD.offsetHeight * 15;
      if (this.maxTopCst == 0) {
        //AEF: temp modif --> drpD is not loaded yet
        this.maxTopCst = $('#DropperDroite').height() * 15;
      }
    } else if (this.rows === 1) {
      if (!container.hasClass('overflow-type2')) {
        container.addClass('overflow-type2');
        container.removeClass('overflow-type1');
        container.removeClass('overflow-type3');
      }
      this.maxLeftCst = this.drprD.offsetWidth - minLeftCst - 14; // webkit-scrollbar width: 14px
      this.maxTopCst = this.drprD.childNodes[0].offsetHeight - minTopCst;
    } else if (this.rows > 1) {
      if (!container.hasClass('overflow-type3')) {
        container.addClass('overflow-type3');
        container.removeClass('overflow-type1');
        container.removeClass('overflow-type2');
      }
      this.maxLeftCst = this.drprD.offsetWidth - minLeftCst - 14; // webkit-scrollbar width: 14px
      this.maxTopCst = this.drprD.childNodes[0].offsetHeight * this.rows - minTopCst;
    }
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
    this.dashBgColor = this.defaultBgColor;
    this._toggleDashBgColor();
    this.updateDashBgColor();
  }

  _toggleDashBgColor() {
    $('#divInputDashBgColor').toggleClass('aspect_input-bg-color--disabled', this.inheritThemeBgColor);
    $('#checkboxBgColor').prop('checked', this.inheritThemeBgColor);
    if (this.inheritThemeBgColor) this.dashBgColor = this.defaultBgColor;
  }

  setDashBgColor() {
    this.inheritThemeBgColor = $('#checkboxBgColor').is(':checked');
    this._toggleDashBgColor();
    if (this.inheritThemeBgColor) this.updateDashBgColor();
    this.$rootScope.updateFlagDirty(true);
  }

  serializeDashBgColor() {
    const backgroundColor = this.dashBgColor;
    const inheritThemeBackgroundColor = this.inheritThemeBgColor;
    return {
      backgroundColor: backgroundColor,
      inheritThemeBackgroundColor: inheritThemeBackgroundColor,
    };
  }

  deserializeDashBgColor(deviceObj) {
    const bgColor = deviceObj?.backgroundColor;
    const inheritTheme = deviceObj?.inheritThemeBackgroundColor ?? false;

    if (bgColor) {
      this.dashBgColor = bgColor;
      this.inheritThemeBgColor = inheritTheme;
      this._toggleDashBgColor();
      this.updateDashBgColor();
    }
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                          Dashboard Theme                           | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  onChangeDashboardTheme(theme) {
    this.dashboardTheme = theme;
    $('html').attr('data-theme', this.dashboardTheme);
    $('#current-theme').attr('data-theme', this.dashboardTheme);
    this.updateDashBgColor();
    // TODO Open Sweet alert to ask the user if he wants to reset styles for all components
    editorSingletons.widgetEditor.resizeDashboard(); // Resize event triggers widget generation (usefull for graphs or gauges with colors)
    this.$rootScope.updateFlagDirty(true);
  }

  updateDashboardTheme() {
    $('html').attr('data-theme', this.dashboardTheme);
    $('#current-theme').attr('data-theme', this.dashboardTheme);
    this.updateDashBgColor();
    editorSingletons.widgetEditor.resizeDashboard(); // Resize event triggers widget generation (usefull for graphs or gauges with colors)
  }

  resetDashboardTheme() {
    this.dashboardTheme = 'default';
    this.updateDashboardTheme();
  }

  serializeDashboardTheme() {
    const theme = this.dashboardTheme;
    return {
      theme: theme,
    };
  }

  deserializeDashboardTheme(deviceObj) {
    if (deviceObj.theme) {
      this.dashboardTheme = deviceObj.theme;
      this.updateDashboardTheme();
    } else {
      this.resetDashboardTheme();
    }
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                           Export options                           | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  /*--------_updateExportOptions--------*/
  _updateExportOptions() {
    const exportOptions = htmlExport.exportOptions || '';
    const singleRow = ['adjustToFullWidth', 'ajustToTargetWindow', 'keepOriginalWidth'];
    const multiRow = ['projectToTargetWindow', 'rowToPage', 'rowToTab', 'customNavigation'];
    const nbRows = this.getRows();
    if (nbRows == 0 && !singleRow.includes(exportOptions)) {
      htmlExport.exportOptions = 'adjustToFullWidth';
    } else if (nbRows >= 1 && !multiRow.includes(exportOptions)) {
      htmlExport.exportOptions = 'projectToTargetWindow';
    }
  }

  /*--------serializeExportOptions--------*/
  serializeExportOptions() {
    return htmlExport.exportOptions;
  }

  /*--------deserializeExportOptions--------*/
  deserializeExportOptions(exportOptions) {
    if (!_.isUndefined(exportOptions)) {
      htmlExport.exportOptions = exportOptions;
    }

    // backward compatibility
    this._updateExportOptions();
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                           Default Row                              | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  /*--------_getDefaultRow--------*/
  _getDefaultRow() {
    if (!_.isEmpty(this.defaultRow)) {
      return this.defaultRow;
    }

    const firstPage = this._getRowNames()[0];
    return {
      id: '1',
      name: firstPage,
    };
  }

  getDefaultRowID() {
    const defaultRow = this._getDefaultRow();
    const nbRows = this.getRows();
    return defaultRow.id <= nbRows ? defaultRow.id : '1';
  }

  /*--------setDefaultRow--------*/
  setDefaultRow(rowObj) {
    // rowObj : name and number of default row
    this.defaultRow = rowObj;
  }

  /*--------serializeDefaultRow--------*/
  serializeDefaultRow() {
    const defaultRow = htmlExport.exportOptions.includes('customNavigation') ? this._getDefaultRow() : {};
    return {
      defaultPage: defaultRow,
    };
  }

  /*--------deserializeDefaultRow--------*/
  deserializeDefaultRow(pageObj) {
    if (!_.isUndefined(pageObj.defaultPage)) {
      this.defaultRow = pageObj.defaultPage;
    }
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                           other functions                          | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\

  /*--------deserialize--------*/
  deserialize(deviceObj, scalingObj) {
    this.cols = deviceObj.cols.maxCols;
    const maxCells = deviceObj.cols.maxCells;
    this.rows = maxCells / (this.cols || 1);

    this.scalingHelper.setRows(this.rows);
    this.scalingHelper.setCols(this.cols);
    $('select[name="select-rows"]').val(this.rows);
    $('select[name="select-cols"]').val(this.cols || 1);

    this.cleanColumns();
    const classType = this._getClassType(this.cols);
    this._createColumn(classType);

    //scaling method, with also backward compatibility
    if (!_.isUndefined(scalingObj)) {
      /*var scalingMethod = scalingObj.scalingMethod;
            switch (scalingMethod) {
                case 'scaleTwSp':
                    $('#stretchWidth').prop('checked', true);
                    $('#keepProportion').prop('checked', true);
                    break;
                case 'scaleTwh':
                    $('#stretchWidth').prop('checked', true);
                    $('#keepProportion').prop('checked', false);
                    break;
                case 'scaleIdent':
                    $('#stretchWidth').prop('checked', false);
                    $('#keepProportion').prop('checked', false);
                    break;
            }*/
      // MBG dead code 12/02/2022
    }
  }

  /*--------updateColHeight--------*/
  updateColHeight(scalingObj) {
    this.heightCols = [];
    this.newHeightCols = [];
    if (_.isUndefined(scalingObj) || scalingObj.colDims === null) {
      return;
    }

    let ch;
    if (_.isUndefined(scalingObj.colDims.rowHeightPercent)) {
      ch = this.scalingHelper.computeRelativeColHeigth(scalingObj);
    } else {
      ch = scalingObj.colDims.rowHeightPercent;
    }

    const nbValues = MULTIPLE_HEIGHT ? this.rows : 1;
    for (let i = 0; i < nbValues; i++) {
      this.heightCols.push(ch);
      this.newHeightCols.push(ch);
    }

    this.updateMaxTopAndLeft();
    this._applyHeights();
  }

  /*--------serializeCols--------*/
  serializeCols() {
    const deviceDroppers = {};
    const classType = this._getClassType(this.cols);

    const valueRow = this.rows ? this.rows.toString() : 'none';
    const valueCol = this.rows && this.cols ? this.cols.toString() : '1';
    const maxCells = this.rows * this.cols;

    const deviceCols = {
      valueRow: valueRow,
      valueCol: valueCol,
      maxCells: maxCells,
      maxCols: this.cols,
      classType: classType,
    };

    for (let i = 1; i <= maxCells; i++) {
      const drpName = {};
      const dpr = $('#dpr' + i)[0];
      if (dpr.hasChildNodes()) {
        for (let j = 0; j < dpr.childNodes.length; j++) {
          const child = dpr.childNodes[j];
          drpName['component' + j] = child.childNodes[0].id; //$("#dpr" + i)[0].childNodes[j].id == DIV_element
        }
      }
      deviceDroppers['dpr' + i] = drpName;
    }
    const device = {
      cols: deviceCols,
      droppers: deviceDroppers,
    };
    return device;
  }

  /*--------deserializeCols--------*/
  deserializeCols(dashObj, deviceObj) {
    const widgetsDroppersMap = {};
    if (deviceObj.cols.maxCells == 0) {
      const dprWidgets = _.values(dashObj);
      _.each(dprWidgets, (wdg) => {
        widgetsDroppersMap[wdg] = 'DropperDroite';
      });
    } else {
      const droppers = deviceObj.droppers;
      const drprs = _.keys(droppers);
      for (let i = 0; i < drprs.length; i++) {
        const dprWidgets = _.values(droppers[drprs[i]]);
        _.each(dprWidgets, (wdg) => {
          widgetsDroppersMap[wdg] = drprs[i];
        });
      }
    }
    return widgetsDroppersMap;
  }
}
