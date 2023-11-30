// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ customNavigationRuntime mode runtime display handling              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR                                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\


var customNavigationRuntime = (function () {

    const self = this;
    self.jsonContent = {};
    self.grid = {
        rows: 1,
        cols: 1
    };

    /**
     * setJsonContent
     * 
     * @param { Object } jsonContent - project xprjson
     */
    function setJsonContent(jsonContent) {
        self.jsonContent = jsonContent;
    }

    /**
     * _getJsonContent
     * 
     * @return { Object } - project xprjson
     */
    function _getJsonContent() {
        return self.jsonContent;
    }

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
     * customNavigationPrepareRescale
     * 
     * @param { Number | String } valueRow - jsonContent.device.cols.valueRow
     * @param { Number | String } valueCol - jsonContent.device.cols.valueCol
     */
    function customNavigationPrepareRescale(valueRow, valueCol) {
        let { rows, cols } = _getGrid();

        rows = Number(valueRow) || 1;
        cols = Number(valueCol) || 1;

        _setGrid({ rows, cols });

        if (rows > 1) {
            $('[id^=dpr][id$=c]').show();
        }
    }

    /**
     * customNavigationModeInit
     * 
     * @param { Object } jsonContent - project xprjson
     */
    function customNavigationModeInit(jsonContent) {
        const numDefaultPage = Number(jsonContent.pages.defaultPage.id);
        let { rows, cols } = _getGrid();

        rows = Number(jsonContent.device.cols.valueRow) || 1;
        cols = Number(jsonContent.device.cols.valueCol) || 1;

        _setGrid({ rows, cols });

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
    function customNavigationGoToPage(numPage) {
        const $rootScope = angular.element(document.body).scope().$root;
        $rootScope.pageNumber = numPage;

        // Do not run in edit mode
        if (typeof layoutMgr !== "undefined" && !$rootScope.bIsPlayMode) return;

        const jsonContent = _getJsonContent();
        let exportOptions = "";
        let { rows, cols } = _getGrid();

        if (_.isEmpty(jsonContent)) {
            // View mode
            rows = layoutMgr.getRows() || 1;
            cols = layoutMgr.getCols() || 1;
            exportOptions = htmlExport.exportOptions;
        } else { 
            // Preview mode
            rows = Number(jsonContent.device.cols.valueRow) || 1;
            cols = Number(jsonContent.device.cols.valueCol) || 1;
            exportOptions = jsonContent.exportOptions;
        }

        _setGrid({ rows, cols });

        if (rows > 1) {
            if (exportOptions == "projectToTargetWindow") {
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

    return {
        customNavigationPrepareRescale,
        customNavigationModeInit,
        setJsonContent,
        customNavigationGoToPage
    };
}());