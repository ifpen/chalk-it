// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ customNavigationRuntime mode runtime display handling              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR                                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

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
    const rows = Number(valueRow);
    if (rows > 1) {
      $('[id^=dpr][id$=c]').show();
    }
  }

  /**
   * customNavigationModeInit
   *
   * @param { Object } jsonContent - project xprjson
   */
  customNavigationModeInit(jsonContent) {
    const numDefaultPage = Number(jsonContent.pages.defaultPage.id);
    const rows = Number(jsonContent.device.cols.valueRow);
    const cols = Number(jsonContent.device.cols.valueCol);

    this.jsonContent = jsonContent;
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

    // Do not run in edit mode
    if (typeof layoutMgr !== 'undefined' && !$rootScope.bIsPlayMode) return;

    // When using the "row to tab" method, the page number must be updated.
    $rootScope.pageNumber = numPage;

    const jsonContent = this.jsonContent;
    let exportOptions = '';
    let rows, cols;

    if (_.isEmpty(jsonContent)) {
      // Studio mode
      rows = layoutMgr.getRows();
      cols = layoutMgr.getCols();
      exportOptions = htmlExport.exportOptions;
    } else {
      // Runtime mode
      rows = Number(jsonContent.device.cols.valueRow);
      cols = Number(jsonContent.device.cols.valueCol);
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

const customNavigationRuntime = new CustomNavigationRuntime();
