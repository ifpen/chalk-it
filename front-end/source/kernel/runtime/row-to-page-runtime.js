// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ rowToPage mode runtime display handling                            │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID , Ghiles HIDEUR                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

class RowToPageRuntime {
  #grid;

  constructor() {
    this.#grid = {
      rows: 1,
      cols: 1,
    };
  }

  /**
   * rowToPagePrepareRescale
   *
   * @param { Number | String } valueRow - jsonContent.device.cols.valueRow
   * @param { Number | String } valueCol - jsonContent.device.cols.valueCol
   */
  rowToPagePrepareRescale(valueRow, valueCol) {
    const { defaultRows, defaultCols } = this.grid;
    const rows = Number(valueRow) || defaultRows;
    const cols = Number(valueCol) || defaultCols;

    this.grid = { rows, cols };

    if (rows > 1) {
      $('[id^=dpr][id$=c]').show();
    }
  }

  /**
   * rowToPageFinishRescale
   *
   * @param { Number | String } valueRow - jsonContent.device.cols.valueRow
   * @param { Number | String } valueCol - jsonContent.device.cols.valueCol
   */
  rowToPageFinishRescale(valueRow, valueCol) {
    const $rootScope = angular.element(document.body).scope().$root;
    const currentPage = $rootScope.pageNumber;
    const { defaultRows, defaultCols } = this.grid;
    const rows = Number(valueRow) || defaultRows;
    const cols = Number(valueCol) || defaultCols;

    this.grid = { rows, cols };

    if (rows > 1) {
      $('[id^=dpr][id$=c]').hide();
      if (cols > 1) {
        const nbLastRowDiv = currentPage * cols;
        const nbFirstRowDiv = nbLastRowDiv - cols + 1;
        for (let k = nbFirstRowDiv; k <= nbLastRowDiv; k++) {
          $('#dpr' + k + 'c').show();
        }
      } else {
        $('#dpr' + currentPage + 'c').show();
      }
    }
  }

  /**
   * rowToPageModeInit
   *
   * @param { Object } jsonContent - project xprjson
   */
  rowToPageModeInit(jsonContent) {
    const $rootScope = angular.element(document.body).scope().$root;
    const { defaultRows, defaultCols } = this.grid;
    const rows = Number(jsonContent.device.cols.valueRow) || defaultRows;
    const cols = Number(jsonContent.device.cols.valueCol) || defaultCols;

    this.grid = { rows, cols };

    $rootScope.pageNumber = 1;
    $rootScope.totalPages = rows;
    $rootScope.showPagination = true;
    $rootScope.exportOptions = jsonContent.exportOptions;
    $rootScope.$apply();

    if (rows > 1) {
      $('[id^=dpr][id$=c]').hide();
      if (cols > 1) {
        for (let k = 1; k <= cols; k++) {
          $('#dpr' + k + 'c').show();
        }
      } else {
        $('#dpr' + $rootScope.pageNumber + 'c').show();
      }
    }

    $rootScope.rowToPageChange = function (action) {
      let condition = true;
      let operation = '';
      switch (action) {
        case 'previous':
          condition = $rootScope.pageNumber > 1;
          operation = '-';
          break;
        case 'next':
          condition = $rootScope.pageNumber < $rootScope.totalPages;
          operation = '+';
          break;
      }
      if (condition) {
        $('[id^=dpr][id$=c]').hide();
        switch (operation) {
          case '-':
            $rootScope.pageNumber -= 1;
            break;
          case '+':
            $rootScope.pageNumber += 1;
            break;
        }
        if (cols > 1) {
          const nbLastRowDiv = $rootScope.pageNumber * cols;
          const nbFirstRowDiv = nbLastRowDiv - cols + 1;
          for (let k = nbFirstRowDiv; k <= nbLastRowDiv; k++) {
            $('#dpr' + k + 'c').show();
          }
        } else {
          $('#dpr' + $rootScope.pageNumber + 'c').show();
        }
      }
    };
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

export const rowToPageRuntime = new RowToPageRuntime();
