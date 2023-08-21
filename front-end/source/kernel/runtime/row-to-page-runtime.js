// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ rowToPage mode runtime display handling                            │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID , Ghiles HIDEUR                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\


var rowToPageRuntime = (function () {

    const self = this;
    self.grid = {
        rows: 1,
        cols: 1
    };

    /**
     * Retrieves the dashboard grid.
     * 
     * @return { Object } The grid object, which contains the number of rows and columns in the grid.
     * @property { Number } rows - The number of rows in the grid.
     * @property { Number } cols - The number of columns in the grid.
     */
    function _getGrid() {
        return self.grid;
    }

    /**
     * Setting the dashboard grid.
     * 
     * @param { Object } grid - jsonContent.device.cols
     */
    function _setGrid(grid) {
        self.grid = grid;
    }

    /**
     * rowToPagePrepareRescale
     * 
     * @param { Number | String } valueRow - jsonContent.device.cols.valueRow
     * @param { Number | String } valueCol - jsonContent.device.cols.valueCol
     */
    function rowToPagePrepareRescale(valueRow, valueCol) {
        let { rows, cols } = _getGrid();

        rows = Number(valueRow) || 1;
        cols = Number(valueCol) || 1;

        _setGrid({ rows, cols });

        if (rows > 1) {
            $('[id^=dpr][id$=c]').show();
        }
    }

    /**
     * rowToPageFinishRescale
     * 
     * @param { Number | String } valueRow : jsonContent.device.cols.valueRow
     * @param { Number | String } valueCol : jsonContent.device.cols.valueCol
     */
    function rowToPageFinishRescale(valueRow, valueCol) {
        const $rootScope = angular.element(document.body).scope().$root;
        const currentPage = $rootScope.pageNumber;
        let { rows, cols } = _getGrid();

        rows = Number(valueRow) || 1;
        cols = Number(valueCol) || 1;

        _setGrid({ rows, cols });

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
    function rowToPageModeInit(jsonContent) {
        const $rootScope = angular.element(document.body).scope().$root;

        let { rows, cols } = _getGrid();

        rows = Number(jsonContent.device.cols.valueRow) || 1;
        cols = Number(jsonContent.device.cols.valueCol) || 1;

        _setGrid({ rows, cols });

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
            let operation = "";
            switch (action) {
                case "previous": {
                    condition = $rootScope.pageNumber > 1;
                    operation = "-";
                    break;
                };
                case "next": {
                    condition = $rootScope.pageNumber < $rootScope.totalPages;
                    operation = "+";
                    break;
                };
            }
            if (condition) {
                $('[id^=dpr][id$=c]').hide();
                switch (operation) {
                    case "-": {
                        $rootScope.pageNumber -= 1;
                        break;
                    };
                    case "+": {
                        $rootScope.pageNumber += 1;
                        break;
                    };
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
        }
    }

    return { 
        rowToPagePrepareRescale, 
        rowToPageFinishRescale, 
        rowToPageModeInit 
    };
}());