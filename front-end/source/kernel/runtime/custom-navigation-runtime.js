// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ customNavigationRuntime mode runtime display handling              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR                                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\


var customNavigationRuntime = (function () {

    var nbRows = 1;
    var nbCols = 1;

    /**
     * 
     * @param {any} valueRow : jsonContent.device.cols.valueRow
     * @param {any} valueCol : jsonContent.device.cols.valueCol
     */
    function customNavigationPrepareRescale(valueRow, valueCol) {
        var rows = 1;
        if (valueRow != "none") {
            rows = Number(valueRow);
        }

        var cols = 1;
        if (valueCol > 1) {
            cols = Number(valueCol);
        }

        if (rows > 1) {
            if (cols > 1) {
                let nbDiv = cols * rows;
                for (var k = 1; k <= nbDiv; k++) {
                    $('#dpr' + k + 'c').show();
                }
            } else {
                for (var k = 1; k <= rows; k++) {
                    $('#dpr' + k + 'c').show();
                }
            }
        }
    }

    function customNavigationModeInit(jsonContent) {

        // pagination mode
        let numDefaultPage = Number(jsonContent.pages.defaultPage.id);

        var rows = 1;
        if (jsonContent.device.cols.valueRow != "none") {
            rows = Number(jsonContent.device.cols.valueRow);
        }

        var cols = 1;
        if (jsonContent.device.cols.valueCol > 1) {
            cols = Number(jsonContent.device.cols.valueCol);
        }

        nbRows = rows;
        nbCols = cols;

        if (rows > 1) {
            if (cols > 1) {
                let nbDiv = cols * rows;
                let firstRowDivId = ((numDefaultPage -1) * cols) + 1;
                let lastRowDivId = firstRowDivId + cols;
                for (var k = 1; k <= nbDiv; k++) {
                    if (k >= firstRowDivId && k < lastRowDivId) {
                        $('#dpr' + k + 'c').show();
                    } else {
                        $('#dpr' + k + 'c').hide();
                    }
                }
            } else {
                for (var k = 1; k <= rows; k++) {
                    if (k == numDefaultPage) {
                        $('#dpr' + k + 'c').show();
                    } else {
                        $('#dpr' + k + 'c').hide();
                    }
                }
            }
        }
    }

    function goToPage(numPage) { 

        if (typeof layoutMgr !== "undefined") {
            nbRows = layoutMgr.getRows();
            nbCols = layoutMgr.getCols();
        }

        if (nbRows > 1) {
            if (nbCols > 1) {
                let nbDiv = nbCols * nbRows;
                let firstRowDivId = ((numPage -1) * nbCols) + 1;
                let lastRowDivId = firstRowDivId + nbCols;
                for (var k = 1; k <= nbDiv; k++) {
                    if (k >= firstRowDivId && k < lastRowDivId) {
                        $('#dpr' + k + 'c').show();
                    } else {
                        $('#dpr' + k + 'c').hide();
                    }
                }
            } else {
                for (var k = 1; k <= nbRows; k++) {
                    if (k == numPage) {
                        $('#dpr' + k + 'c').show();
                    } else {
                        $('#dpr' + k + 'c').hide();
                    }
                }
            }
        }
    }

    return { customNavigationPrepareRescale, customNavigationModeInit, goToPage};
}());