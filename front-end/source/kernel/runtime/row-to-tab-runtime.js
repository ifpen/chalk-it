// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ rowToTab mode runtime display handling                             │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR                                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\


var rowToTabRuntime = (function () {

    /**
     * 
     * @param {any} valueRow : jsonContent.device.cols.valueRow
     * @param {any} valueCol : jsonContent.device.cols.valueCol
     */
    function rowToTabPrepareRescale(valueRow, valueCol) {
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

    /**
     * 
     * @param {any} valueRow : jsonContent.device.cols.valueRow
     * @param {any} valueCol : jsonContent.device.cols.valueCol
     */
    function rowToTabFinishRescale(valueRow, valueCol) {

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
        $('#page-' + currentPage).removeClass('cancel').addClass('primary');

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

    function rowToTabModeInit(jsonContent) {
        var $body = angular.element(document.body);
        var $rootScope = $body.scope().$root;

        // pagination mode
        var rows = 1;
        if (jsonContent.device.cols.valueRow != "none") {
            rows = Number(jsonContent.device.cols.valueRow);
        }

        var cols = 1;
        if (jsonContent.device.cols.valueCol > 1) {
            cols = Number(jsonContent.device.cols.valueCol);
        }
        
        $rootScope.pageNames = jsonContent.pages.pageNames;
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
                for (let k = 2; k <= nbDiv; k++) {
                    $('#dpr' + k + 'c').hide();
                }
            }
        }
        $('#page-1').removeClass('cancel').addClass('primary');

        $rootScope.displayPage = function (numPage) {
            $('[id^=dpr]').hide();
            $('[id^=page-').removeClass('primary').addClass('cancel');

            if (cols > 1) {
                let firstRowDivId = ((numPage -1) * cols) + 1; 
                let lastRowDivId = firstRowDivId + cols;
                for (let i=firstRowDivId; i < lastRowDivId; i++) {
                    $('#dpr' + i + 'c').show();
                }
                $('#page-' + numPage).removeClass('cancel').addClass('primary');
            } else {
                $('#dpr' + numPage + 'c').show();
                $('#page-' + numPage).removeClass('cancel').addClass('primary');
            }
        };
    }

    return { rowToTabPrepareRescale, rowToTabFinishRescale, rowToTabModeInit };
}());