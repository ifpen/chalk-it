// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ rowToPage mode runtime display handling                            │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID , Ghiles HIDEUR                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\


var rowToPageRuntime = (function () {

    /**
     * 
     * @param {any} valueRow : jsonContent.device.cols.valueRow
     * @param {any} valueCol : jsonContent.device.cols.valueCol
     */
    function rowToPagePrepareRescale(valueRow, valueCol) {
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
                for (let k = 1; k <= nbDiv; k++) {
                    $('#dpr' + k + 'c').show();
                }
            } else {
                for (let k = 1; k <= rows; k++) {
                    $('#dpr' + k + 'c').show();
                }
            }
        }
    }

    /**
     * 
     * @param {any} valueRow : jsonContent.device.cols.valueRow
     * @param {any} valueCol : jsonContent.device.cols.valueCol
     */
    function rowToPageFinishRescale(valueRow, valueCol) {

        var $body = angular.element(document.body);
        var $rootScope = $body.scope().$root;

        // pagination mode
        var currentPage = $rootScope.pageNumber;
        var rows = 1;
        if (valueRow!= "none") {
            rows = Number(valueRow);
        }

        var cols = 1;
        if (valueCol > 1) {
            cols = Number(valueCol);
        }

        if (rows > 1) {
            if (cols > 1) {
                let nbDiv = cols * rows;
                let firstRowDivId = ((currentPage -1) * cols) + 1;
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
                    if (k == currentPage) {
                        $('#dpr' + k + 'c').show();
                    } else {
                        $('#dpr' + k + 'c').hide();
                    }
                }
            }
        }
    }

    function rowToPageModeInit(jsonContent) {
        var $body = angular.element(document.body);
        var $rootScope = $body.scope().$root;

        // pagination mode
        $rootScope.pageNumber = 1;
        var rows = 1;
        if (jsonContent.device.cols.valueRow != "none") {
            rows = Number(jsonContent.device.cols.valueRow);
        }

        var cols = 1;
        if (jsonContent.device.cols.valueCol > 1) {
            cols = Number(jsonContent.device.cols.valueCol);
        }

        $rootScope.totalPages = rows;
        $rootScope.showPagination = true;
        $rootScope.exportOptions = jsonContent.exportOptions;
        $rootScope.$apply();

        var nbDiv = rows * cols;

        if (rows > 1) {
            if (cols > 1) {
                for (let k = 1; k <= nbDiv; k++) {
                    if (k > cols) {
                        $('#dpr' + k + 'c').hide();
                    }
                }
            } else {
                for (let k = 2; k <= rows; k++) {
                    $('#dpr' + k + 'c').hide();
                }
            }
        }

        $rootScope.prevDpr = function () {
            if (cols > 1) {
                if ($rootScope.pageNumber > 1) {
                    let firstRowDivId = (($rootScope.pageNumber -1) * cols) + 1;
                    let lastRowDivId = firstRowDivId + cols;

                    for (let i=firstRowDivId; i <= lastRowDivId; i++) {
                        $('#dpr' + i + 'c').hide();
                    }

                    $rootScope.pageNumber = $rootScope.pageNumber - 1;
                    firstRowDivId = (($rootScope.pageNumber -1) * cols) + 1;
                    lastRowDivId = firstRowDivId + cols;

                    for (let i=firstRowDivId; i <= lastRowDivId; i++) {
                        $('#dpr' + i + 'c').show();
                    }
                }
            } else {
                if ($rootScope.pageNumber > 1) {
                    $('#dpr' + $rootScope.pageNumber + 'c').hide();
                    $rootScope.pageNumber = $rootScope.pageNumber - 1;
                    $('#dpr' + $rootScope.pageNumber + 'c').show();
                }
            }
        };

        $rootScope.nextDpr = function () {
            if (cols > 1) {
                if ($rootScope.pageNumber < $rootScope.totalPages) {
                    let firstRowDivId = (($rootScope.pageNumber -1) * cols) + 1;
                    let lastRowDivId = firstRowDivId + cols;

                    for (let i=firstRowDivId; i <= lastRowDivId; i++) {
                        $('#dpr' + i + 'c').hide();
                    }

                    $rootScope.pageNumber = $rootScope.pageNumber + 1;
                    firstRowDivId = (($rootScope.pageNumber -1) * cols) + 1;
                    lastRowDivId = firstRowDivId + cols;

                    for (let i=firstRowDivId; i <= lastRowDivId; i++) {
                        $('#dpr' + i + 'c').show();
                    }
                }
            } else {
                if ($rootScope.pageNumber < $rootScope.totalPages) {
                    $('#dpr' + $rootScope.pageNumber + 'c').hide();
                    $rootScope.pageNumber = $rootScope.pageNumber + 1;
                    $('#dpr' + $rootScope.pageNumber + 'c').show();
                }
            }
        };
    }


    return { rowToPagePrepareRescale, rowToPageFinishRescale, rowToPageModeInit };
}());