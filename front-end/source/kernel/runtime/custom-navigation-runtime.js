// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ customNavigationRuntime mode runtime display handling              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR                                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';

import { htmlExport } from 'kernel/general/export/html-export';
import { editorSingletons } from 'kernel/editor-singletons';

class CustomNavigationRuntime {
  #grid;
  #jsonContent;

  constructor() {
    this.#grid = {
      rows: 1,
      cols: 1,
    };
    this.#jsonContent = {};
  }

  /**
   * customNavigationPrepareRescale
   *
   * @param { Number | String } valueRow - jsonContent.device.cols.valueRow
   * @param { Number | String } valueCol - jsonContent.device.cols.valueCol
   */
  customNavigationPrepareRescale(valueRow, valueCol) {
    const { defaultRows, defaultCols } = this.grid;

    const rows = Number(valueRow) || defaultRows;
    const cols = Number(valueCol) || defaultCols;

    this.grid = { rows, cols };

    if (rows > 1) {
      $('[id^=dpr][id$=c]').show();
    }
  }

  /**
   * customNavigationModeInit
   *
   * @param { Object } _jsonContent - project xprjson
   */
  customNavigationModeInit(jsonContent) {
    const numDefaultPage = Number(jsonContent.pages.defaultPage.id);
    const { defaultRows, defaultCols } = this.grid;

    const rows = Number(valueRow) || defaultRows;
    const cols = Number(valueCol) || defaultCols;

    this.grid = { rows, cols };

    if (rows > 1) {
      $('[id^=dpr][id$=c]').hide();
      if (cols > 1) {
        const nbLastRowDiv = numDefaultPage * cols;
        const nbFirstRowDiv = nbLastRowDiv - cols + 1;
        for (let k = nbFirstRowDiv; k <= nbLastRowDiv; k++) {
          $('#dpr' + k + 'c').show();
        }
      } else {
        $('#dpr' + numDefaultPage + 'c').show();
      }
    }
  }

  /**
   * customNavigationGoToPage
   *
   * @param { Number } numPage - target page number
   */
  customNavigationGoToPage(numPage) {
    const $rootScope = angular.element(document.body).scope().$root;

    const layoutMgr = editorSingletons.layoutMgr;
    // Do not run in edit mode
    if (typeof layoutMgr !== 'undefined' && !$rootScope.bIsPlayMode) return;

    // When using the "row to tab" method, the page number must be updated.
    $rootScope.pageNumber = numPage;

    const jsonContent = this.jsonContent;
    let exportOptions = '';
    const { defaultRows, defaultCols } = this.grid;
    let rows, cols;

    if (_.isEmpty(jsonContent)) {
      // View mode
      rows = layoutMgr.getRows() || defaultRows;
      cols = layoutMgr.getCols() || defaultCols;
      exportOptions = htmlExport.exportOptions;
    } else {
      // Preview mode
      rows = Number(jsonContent.device.cols.valueRow) || defaultRows;
      cols = Number(jsonContent.device.cols.valueCol) || defaultCols;
      exportOptions = jsonContent.exportOptions;
    }

    this.grid = { rows, cols };

    if (rows > 1) {
      if (exportOptions == 'projectToTargetWindow') {
        const numDiv = numPage * cols;
        $('#dpr' + numDiv + 'c')[0].scrollIntoView(false);
      } else {
        $('[id^=dpr][id$=c]').hide();
        if (cols > 1) {
          const nbLastRowDiv = numPage * cols;
          const nbFirstRowDiv = nbLastRowDiv - cols + 1;
          for (let k = nbFirstRowDiv; k <= nbLastRowDiv; k++) {
            $('#dpr' + k + 'c').show();
          }
        } else {
          $('#dpr' + numPage + 'c').show();
        }
      }
    }
  }

  /**
   * Retrieves the dashboard json content.
   *
   * @return { Object } - project xprjson.
   */
  get jsonContent() {
    return this.#jsonContent;
  }

  /**
   * Setting the dashboard json content.
   *
   * @param { Object } jsonContent - project xprjson.
   */
  set jsonContent(jsonContent) {
    this.#jsonContent = jsonContent;
  }

  /**
   * Retrieves the dashboard grid.
   *
   * @return { Object } The grid object, which contains the number of rows and columns in the grid.
   * @property { Number } rows - The number of rows in the grid.
   * @property { Number } cols - The number of columns in the grid.
   */
  get grid() {
    return this.#grid;
  }

  /**
   * Setting the dashboard grid.
   *
   * @param { Object } grid - jsonContent.device.cols
   */
  set grid(grid) {
    this.#grid = grid;
  }
}

export const customNavigationRuntime = new CustomNavigationRuntime();
