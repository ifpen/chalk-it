// ┌──────────────────────────────────────────────────────────────────────┐ \\
// │ layoutMgr                                                            │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                          │ \\
// | Licensed under the Apache License, Version 2.0                       │ \\
// ├──────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Tristan BARTEMENT │ \\
// └──────────────────────────────────────────────────────────────────────┘ \\


/*constants*/
const keyShift = 5; // cst; size in px of keyboard shift using arrows, can be modified
const minLeftCst = 10; // cst; min left of the dashboard
const minTopCst = 10; // cst; min top of the dashboard
const minHeightCst = 10; // cst; min height of a widget, can be modified
const minWidthCst = 10; // cst; min width of a widget, can be modified

// Toggles entering one height per row; not quite functionnal yet
const MULTIPLE_HEIGHT = false;

class LayoutMgrClass {

    constructor() {
        // Alias
        this.drprD = $('#DropperDroite')[0];

        // Device rows & columns
        this.rows = 0;
        this.cols = 0;

        this.heightCols = [];
        this.newHeightCols = [];

        this.maxTopCst = this.drprD.offsetHeight * 15; // TODO : coordinate with dragresize 
        if (this.maxTopCst == 0) { //AEF: temp modif --> drpD is not loaded yet
            this.maxTopCst = $('#DropperDroite').height() * 15;
        }
        this.maxLeftCst = panelDash.fullScreenWidth - minLeftCst; // max left of the dashboard, can be modified

        this.scalingHelper = undefined;

        this.rowNames = [];
        this.defaultRow = {};

        // Dashboard background color
        this.dashBgColor = "";
        this.basicDashBgColor = "#ffffff";
        this.dashboardTheme = "default";
        this.$rootScope = angular.element(document.body).scope().$root;
    }

    findAllCells() {
        return $("#DropperDroite [id^='dpr']");
    }

    updateButtonState() {
        const newRows = this._readRows();
        const newCols = newRows ? this._readCols() : 0;

        if (newRows === 0) {
            // $('#row-device-col')[0].style.display = "none";
            // $('#height-row-button')[0].style.display = "none";
            $("#select-cols").attr("disabled", true);
            $('#height-row-button').attr("disabled", true);
            $("#select-cols")[0].value = "1";
            //$("#select-cols")[0].value = "None";
        } else {
            $("#select-cols").attr("disabled", false);
            $('#height-row-button').attr("disabled", false);
            //$('#row-device-col')[0].style.display = "table-row";
            //$('#height-row-button')[0].style.display = "table-cell";
        }

        const canApply = this.rows !== newRows || this.cols !== newCols || !angular.equals(this.heightCols, this.newHeightCols);
        $('#buttonDevice')[0].disabled = !canApply;
    }

    isRowColMode() {
        return this.rows >= 1;
    }

    getDefaultContainer() {
        return this.isRowColMode() ? $('#dpr1')[0] : this.drprD;
    }

    setScalingHelper(scalingHelper) {
        this.scalingHelper = scalingHelper;
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
            if (this.maxTopCst == 0) { //AEF: temp modif --> drpD is not loaded yet
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
            this.maxTopCst = (this.drprD.childNodes[0].offsetHeight * this.rows) - minTopCst;
        }
    }

    _updateNewHeightCols(newRows) {
        if (newRows === 0) {
            this.newHeightCols = [];
        } else {
            //const defaultValue = Math.ceil(100 / newRows);
            const defaultValue =100; // MBG 12/09/2022
            if (MULTIPLE_HEIGHT) {
                if (newRows !== this.rows && this.heightCols.length > 0 && angular.equals(this.heightCols, this.newHeightCols)) {
                    let sum = 0;
                    this.heightCols.forEach(v => {
                        if (v !== undefined) { sum += v; }
                    });
                    if (sum >= 99 && sum <= 101) {
                        this.newHeightCols = [];
                        for (let i = 0; i < newRows; i++) {
                            this.newHeightCols.push(defaultValue);
                        }
                    }
                }

                // Sanitize
                if (this.newHeightCols.length > newRows) {
                    this.newHeightCols = this.newHeightCols.slice(0, newRows);
                }

                let placeholderValue = this.newHeightCols.find(it => !!it) || defaultValue; // Missing values are replaced with the first valid one, or 100%/rows.
                for (let i = 0; i < nbValues; i++) { // i <= nbRows for original general version
                    if (_.isUndefined(this.newHeightCols[i])) {
                        this.newHeightCols[i] = placeholderValue;
                    } else {
                        // When adding rows, the last value is repeated.
                        placeholderValue = this.newHeightCols[i];
                    }
                }
            } else {
                if (this.newHeightCols.length !== 1) {
                    // Should catch 0, but will also get incorrect sizes
                    this.newHeightCols = [defaultValue];
                } else if (newRows !== this.rows && this.heightCols.length === 1) {
                    const previous = this.heightCols[0];
                    const value = this.newHeightCols[0];
                    const height = this.rows * previous;
                    if (previous === value && height >= 99 && height <= 101) {
                        // Height not changed yet, and in ~100% total
                        this.newHeightCols = [defaultValue];
                    }
                }
            }
        }
    }

    /*--------configureRowHeight--------*/
    /*--MBG : impose same row height right now--*/
    configureRowHeight() {
        const nbRows = this._readRows();
        if (!nbRows) {
            // Button should only be visible when rows >= 1, so this should not happen.
            return;
        }

        this._updateNewHeightCols(nbRows);

        let divContent = "";
        const nbValues = MULTIPLE_HEIGHT ? nbRows : 1;
        for (let i = 0; i < nbValues; i++) { // i <= nbRows for original general version
            divContent += '<div class="Row">';
            divContent += '<div class="CellH"><label style="font-size: calc(8px + 0.4vw);font-weight: bold;">Height (%) of rows</label></div>'; // of row n° '+ i +' for general version
            divContent += '<div class="Cell">';
            divContent += '<input type="number" min="15" max="150" name="height-cols_' + i + '" style="height:25px;width:100%" id="heightCols_' + i + '" value=' + this.newHeightCols[i] + ' />';
            divContent += '</div>'; // Cell
            divContent += '</div>'; // Row
        }
        divContent += '</div>';

        const contentElement = document.createElement('div');
        contentElement.innerHTML = divContent;
        contentElement.setAttribute("style", "display: inline-block");

        const self = this;
        new DialogBoxForToolboxEdit(contentElement, "Configuration of each height's row", "OK", "Cancel", function() {
            // Read heights
            for (let i = 0; i < nbValues; i++) {
                const value = parseInt($("#heightCols_" + i).val(), 10);
                if (value !== undefined && value > 0) {
                    // Discard invalid values
                    self.newHeightCols[i] = value;
                }
            }

            //self.updateButtonState();
        });
    }

    getRows() {
        return this.rows;
    }

    getHeightCols() {
        return [...this.heightCols];
    }

    _readRows() {
        const strRows = $("#select-rows").val();
        return parseInt(strRows, 10);
    }

    _readCols() {
        const strCols = $("#select-cols").val();
        return parseInt(strCols, 10);
    }

    /*--------applyCells--------*/
    applyCells() {
        const newRows = this._readRows();
        const newCols = newRows ? this._readCols() : 0;

        // GHI #260
        $("#DropperDroite")[0].scrollTo({
            top: 0,
            left: 0,
            behavior: "auto",
        });

        this._updateNewHeightCols(newRows);

        angular.element(document.body).injector().invoke(['UndoManagerService', 'EditorActionFactory', (undoManagerService, editorActionFactory) => {
            const action = editorActionFactory.createUpdateLayoutAction(newRows, newCols, this.newHeightCols);
            undoManagerService.execute(action);
        }]);

        this._setExportOptions();
        this.updateDashBgColor();
        this._initRowNames();
    }

    _setExportOptions() {
        const exportOptions = htmlExport.exportOptions;
        const singleRow = ["adjustToFullWidth", "ajustToTargetWindow", "keepOriginalWidth"];
        const multiRow = ["projectToTargetWindow", "rowToPage", "rowToTab", "customNavigation"];
        if ((this.getRows() == 0) && !singleRow.includes(exportOptions))  {
            htmlExport.exportOptions = "adjustToFullWidth";
        } else if ((this.getRows() >= 1) && !multiRow.includes(exportOptions)) {
            htmlExport.exportOptions = "projectToTargetWindow";
        }
    }

    setLayout(newRows, newColls, newHeights, ui = false) {
        const cellsChange = this.rows !== newRows || this.cols !== newColls;
        const heightsChange = !angular.equals(this.heightCols, newHeights);

        this.rows = newRows;
        this.cols = newColls;
        this.newHeightCols = [...newHeights];
        this.heightCols = [...newHeights];

        if (cellsChange) {
            this.cleanColumns();

            this.scalingHelper.setRows(this.rows);
            this.scalingHelper.setCols(this.cols);
            const classType = this._getClassType(this.cols);
            this._createColumn(classType);

            if (this.rows !== 0) {
                _.each(widgetEditor.modelsId, (instanceId) => {
                    const element = document.getElementById(instanceId);
                    this.putWidgetInTheRightCol(element, 10, 10); // minLeftCst=10, minTopCst=10 // to coordinate                 
                });
            }
        } else if (heightsChange) {
            this._applyHeights();
            this.scalingHelper.updateCellsProportions();

            // TODO get all widgets
            // TODO get the new height of drop zone
            // TODO get the element in each drp div
            // TODO rescale each element in drp div
            // TODO find other element not inside drp div
        }

        if (ui && this.rows) {
            const cell = $("#dpr1"); // TODO reach row
            if (parseInt(cell.css('min-height')) > cell.height()) {
                swal(cell[0].style.height + " is too small considering the size of your screen!", "The minimum allowed height '" + cell.css('min-height') + "' will be applied.", "warning");
            }
        }

        this.updateMaxTopAndLeft();
        widgetEditor.updateSnapshotDashZoneDims();

        $("select[name=select-rows]")[0].value = this.rows;
        $("select[name=select-cols]")[0].value = this.cols || 1;
        this.updateButtonState();
    }

    /*--------getCols--------*/
    getCols() {
        return this.cols;
    }

    /*--------getClassType--------*/
    _getClassType(value) {
        let classType = "";
        if (value === 0) {
            classType = "";
        } else if (value === 1) {
            classType = "col-md-12";
        } else if (value === 2) {
            classType = "col-md-6";
        } else if (value === 3) {
            classType = "col-md-4";
        } else if (value === 4) {
            classType = "col-md-3";
        }
        return classType;
    }

    getTargetDivLayoutPx(targetDiv) {
        if (this.isRowColMode()) {
            return getElementLayoutPx(targetDiv);
        } else {
            return {
                'top': minTopCst,
                'left': minLeftCst,
                'height': this.maxTopCst,
                'width': this.maxLeftCst,
            };
        }
    }

    /*--------clean Columns--------*/
    cleanColumns() {
        const cells = this.findAllCells();

        cells.each((i, div) => {
            const position = $(div).position();
            const dprTop = position.top;
            const dprLeft = position.left;

            // A temporary array is needed as appending to an other node 
            // changes "div.childNodes", corrupting the iteration loop
            const children = [];
            div.childNodes.forEach(child => children.push(child));
            children.forEach(child => {
                const widget = child.firstChild;
                const widgetPosition = $(widget).position();
                const wcTop = widgetPosition.top;
                const wcLeft = widgetPosition.left;
                $(child).appendTo($('#DropperDroite'));
                widget.style.top = unitH(dprTop + wcTop);
                widget.style.left = unitW(dprLeft + wcLeft);
            });
        });

        cells.remove();

        this.drprD.classList.remove('has-device-col');
    }

    _getRowHeight(i) {
        if (MULTIPLE_HEIGHT) {
            if (i < this.heightCols.length) {
                return this.heightCols[i];
            }
        } else if (this.heightCols[0] !== undefined) {
            return this.heightCols[0];
        } else if (this.heightCols[1] !== undefined) {
            // Legacy opt
            return this.heightCols[1];
        }

        // Safeguard
        return 100;
    }

    /*--------create Column--------*/
    _createColumn(classType) {
        this._createCols(classType);
        this._applyHeights();
        this.scalingHelper.updateCellsProportions();
    }

    _applyHeights() {
        for (let i = 0; i < this.rows; i++) {
            const rowHeight = this._getRowHeight(i);
            const rowStart = i * this.cols + 1;
            const rowEnd = rowStart + this.cols;
            for (let j = rowStart; j < rowEnd; j++) {
                $("#dpr" + j)[0].style.height = rowHeight + "%";
            }
        }
    }

    /*--------createCols--------*/
    _createCols(classType) {
        if (this.rows) {
            this.drprD.classList.add('has-device-col');

            const nb = this.rows * this.cols;
            for (let i = 1; i <= nb; i++) {
                const dprCol = document.createElement('div');
                dprCol.setAttribute("class", classType + ' device-col drop-zone-col');
                dprCol.setAttribute("id", "dpr" + i);
                this.drprD.appendChild(dprCol);
            }

            gridMgr.updateGrid();
        }
    }

    /*--------putWidgetInDrprD--------*/
    putWidgetInDrprD(element) {
        if (this.isRowColMode() && element && element.parentNode) {
            const cell = element.parentNode.parentNode;
            if (cell && cell.id.startsWith("dpr")) {
                const left = element.offsetLeft + cell.offsetLeft;
                const top = element.offsetTop + cell.offsetTop;
                $(this.drprD).append(element.parentNode);
                element.style.left = unitW(left);
                element.style.top = unitH(top);
            }
        }
    }

    /*--------putWidgetInTheRightCol--------*/
    putWidgetInTheRightCol(element, minLeftCst, minTopCst) {
        if (this.isRowColMode()) {
            const offsetLeft = element.offsetLeft;
            for (let i = 1; i <= this.cols; i++) {
                const cell = $("#dpr" + i)[0];
                const isRightOfCell = (offsetLeft - minLeftCst) >= cell.offsetLeft;
                if ((i === 1 || isRightOfCell) && (i === this.cols || (offsetLeft - minLeftCst) < $("#dpr" + (i + 1))[0].offsetLeft)) {
                    this._putWidgetInTheRightRow(element, i, minLeftCst, minTopCst);
                    break;
                }
            }
        }
    }

    /*--------putWidgetInTheRightRow--------*/
    _putWidgetInTheRightRow(element, i, minLeftCst, minTopCst) {
        const top = element.offsetTop - minTopCst;
        for (let r = 0; r < this.rows; r++) {
            // i is 1-based
            const cellIdx = this.cols * r + i;
            const cell = $("#dpr" + cellIdx)[0];

            const aboveBottom = top < cell.offsetTop + cell.offsetHeight;
            const belowTop = top >= cell.offsetTop;

            if ((aboveBottom || r === this.rows - 1) && (belowTop || r === 0)) {
                this._dropWidgetAndUpdatePosition(element, cell, minLeftCst, minTopCst);
                break;
            }
        }
    }

    /*--------dropWidgetAndUpdatePosition--------*/
    _dropWidgetAndUpdatePosition(element, cell, minLeftCst, minTopCst) {
        cell.append(element.parentNode);
        const left = element.offsetLeft - cell.offsetLeft;
        const top = element.offsetTop - cell.offsetTop;
        element.style.left = unitW(left);
        element.style.top = unitH(top);

        const maxLeft = cell.offsetWidth - minLeftCst;
        const maxTop = cell.offsetHeight - minTopCst;
        // overpass limits
        if (element.offsetTop > (maxTop - element.offsetHeight)) {
            element.style.top = unitH(maxTop - element.offsetHeight);
        }
        if (element.offsetLeft > (maxLeft - element.offsetWidth)) {
            element.style.left = unitW(maxLeft - element.offsetWidth);
        }
    }

    /*--------makeColsTrasparent--------*/
    makeColsTrasparent() {
        for (let i = 1; i <= this.rows * this.cols; i++) {
            if (!$("#dpr" + i + "c").hasClass('col-invisible')) {
                $("#dpr" + i + "c").addClass('col-invisible');
            }
        }
    }

    /*--------clear--------*/
    clear() {
        this.clearCols();
    }

    /*--------clearCols--------*/
    clearCols() {
        this.cols = 0;
        this.rows = 0;
        this.scalingHelper.setRows(this.rows);
        this.scalingHelper.setCols(this.cols);

        $("select[name=select-rows]")[0].value = this.rows;
        $("select[name=select-cols]")[0].value = 1;
        this.heightCols = [];
        this.newHeightCols = [];
        this.rowNames = []; // GHI #245
        this.defaultRow = {}; // GHI #245
        this.updateMaxTopAndLeft();
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                      DashboardBackgroundColor                      | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    setDashBgColor() {
        this.dashBgColor = $("#inputDashBgColor")[0].value;
        $(".dropperR").css("background-color", this.dashBgColor);
        this.$rootScope.updateFlagDirty(true);
    }

    updateDashBgColor() {
        $("#inputDashBgColor").val(this.dashBgColor);
        $(".dropperR").css("background-color", this.dashBgColor);
    }

    resetDashBgColor() {
        this.dashBgColor = this.basicDashBgColor;
        $("#inputDashBgColor").val(this.basicDashBgColor);
        $(".dropperR").css("background-color", this.basicDashBgColor);
    }

    serializeDashBgColor() {
        const backgroundColor = this.dashBgColor;
        return {
            'backgroundColor': backgroundColor
        };
    }

    deserializeDashBgColor(deviceObj) {
        if(!_.isUndefined(deviceObj.backgroundColor)){
            this.dashBgColor = deviceObj.backgroundColor;
            this.basicDashBgColor = deviceObj.backgroundColor;
            this.updateDashBgColor();
        }
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                          Dashboard Theme                           | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    onChangeDashboardTheme(theme) {
        this.dashboardTheme = theme;
        $("html").attr("data-theme", this.dashboardTheme);
        $("#current-theme").attr("data-theme", this.dashboardTheme);
        // TODO Open Sweet alert to ask the user if he wants to reset styles for all components
        widgetEditor.resizeDashboard(); // Resize event triggers widget generation (usefull for graphs or gauges with colors)
        this.$rootScope.updateFlagDirty(true);
    }

    updateDashboardTheme() {
        $("html").attr("data-theme", this.dashboardTheme);
        $("#current-theme").attr("data-theme", this.dashboardTheme);
        widgetEditor.resizeDashboard(); // Resize event triggers widget generation (usefull for graphs or gauges with colors)
    }

    resetDashboardTheme() {
        this.dashboardTheme = "default";
        this.updateDashboardTheme();
    }

    serializeDashboardTheme() {
        const theme = this.dashboardTheme;
        return {
            'theme': theme
        };
    }

    deserializeDashboardTheme(deviceObj) {
        if(!_.isUndefined(deviceObj.theme)){
            this.dashboardTheme = deviceObj.theme;
            this.updateDashboardTheme();
        }
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                           Row Names                               | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    /*--------configureRowName--------*/
    configureRowName() {
        const nbRows = this._readRows();
        if (!nbRows) {
            // Button should only be visible when rows >= 1, so this should not happen.
            return;
        }

        if (this.rowNames.length !== nbRows) {
            for (let i = 0; i < nbRows; i++) {
                this.rowNames[i] = "Page " + (i + 1);
            }
        }

        let divContent = '<div class="dashboard-form">';
        for (let i = 1; i <= nbRows; i++) {
            divContent += '<div class="dashboard-form__group dashboard-form__group--inline">';
            divContent += '<div class="dashboard-form__label"><label>row ' + i + '</label></div>';
            divContent += '<input type="text" name="row_' + i + '" id="row_' + i + '" value="' + this.rowNames[i-1] + '" />';
            divContent += '</div>';
        }
        divContent += '</div>';

        const contentElement = document.createElement('div');
        contentElement.innerHTML = divContent;
        contentElement.setAttribute("style", "display: inline-block; width: 100%;");

        const self = this;
        new DialogBoxForToolboxEdit(contentElement, "Configuration of each row's name", "OK", "Cancel", function() {
            for (let i = 1; i <= nbRows; i++) {
                const rowName = $("#row_" + i).val();
                if (rowName !== undefined) {
                    // Discard invalid values
                    self.rowNames[i-1] = rowName;
                }
            }
        });
    }
    
    /*--------_initRowNames--------*/
    _initRowNames() {
        const nbRows = this._readRows(); 
        if (nbRows > 0) {
            if (nbRows < this.rowNames.length) {
                this.rowNames.splice(nbRows, this.rowNames.length);
            }
            for (let i = 1; i <= nbRows; i++) {
                if (_.isUndefined(this.rowNames[i-1])) {
                    this.rowNames[i-1] = "Page " + i;
                }
            }
        }
    }

    /*--------getRowNames--------*/
    getRowNames() {
        this._initRowNames();
        return this.rowNames;
    }

    /*--------getRowNamesObj--------*/
    getRowNamesObj() {
        let rowNames = this.getRowNames();
        let rowNamesObj = [];
        for (let i=0; i<rowNames.length; i++) {
            rowNamesObj.push({
                id: (i+1),
                name: rowNames[i]
            })
        }
        return rowNamesObj;
    }

    /*--------serializeRowNames--------*/
    serializeRowNames() {
        const rowNames = this.rowNames;
        return {
            'pageNames': rowNames
        };
    }

    /*--------deserializeRowNames--------*/
    deserializeRowNames(pageObj) {
        if(!_.isUndefined(pageObj.pageNames)){
            this.rowNames = pageObj.pageNames;
        }
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                           Default Row                              | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    /*--------getDefaultRow--------*/
    getDefaultRow() {
        if (!_.isEmpty(this.defaultRow)) {
            return this.defaultRow;
        } else {
            let firstPage = this.getRowNames()[0];
            return {
                id: '1',
                name: firstPage
            };
        }
    }

    getDefaultRowID() {
        const defaultRow = this.getDefaultRow();
        const nbRows = this._readRows();
        if (defaultRow.id < nbRows) {
            return defaultRow.id;
        } else {
            return '1';
        }
    }
    
    /*--------setDefaultRow--------*/
    setDefaultRow(rowObj) {   // rowObj : name and number of default row
        this.defaultRow = rowObj;
    }

    /*--------serializeDefaultRow--------*/
    serializeDefaultRow() {
        let defaultRow = {}; 
        if (htmlExport.exportOptions.indexOf("customNavigation") !== -1) {
            defaultRow = this.getDefaultRow();
        }
        return {
            'defaultPage': defaultRow
        };
    }

    /*--------deserializeDefaultRow--------*/
    deserializeDefaultRow(pageObj) {
        if(!_.isUndefined(pageObj.defaultPage)){
            this.defaultRow = pageObj.defaultPage;
        }
    }

    
    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                           other functions                          | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\

    /*--------deserialize--------*/
    deserialize(deviceObj, scalingObj) {
        if (!_.isUndefined(deviceObj)) {
            this.cols = deviceObj.cols.maxCols;
            const maxCells = deviceObj.cols.maxCells;
            this.rows = maxCells / (this.cols ? this.cols : 1);

            // backward compatibility
            if (_.isUndefined(deviceObj.cols.valueRow)) {
                if (_.isUndefined(deviceObj.cols.value)) {
                    deviceObj.cols.valueRow = "none";
                } else {
                    switch (deviceObj.cols.value) {
                        case "none":
                            deviceObj.cols.valueRow = "none";
                            break;
                        case "1":
                        case "3":
                            deviceObj.cols.valueRow = "1";
                            break;
                        case "6":
                            deviceObj.cols.valueRow = "6";
                            break;
                        default:
                            deviceObj.cols.valueRow = "none";
                    }
                }
            }
            if (_.isUndefined(deviceObj.cols.valueCol)) {
                if (_.isUndefined(deviceObj.cols.value)) {
                    deviceObj.cols.valueCol = "1";
                } else {
                    switch (deviceObj.cols.value) {
                        case "none":
                        case "1":
                            deviceObj.cols.valueCol = "1";
                            break;
                        case "3":
                        case "6":
                            deviceObj.cols.valueCol = "3";
                            break;
                        default:
                            deviceObj.cols.valueCol = "1";
                    }
                }
            }
            // end of backward compatibility

            this.scalingHelper.setRows(this.rows);
            this.scalingHelper.setCols(this.cols);
            $("select[name=select-rows]")[0].value = this.rows;
            $("select[name=select-cols]")[0].value = this.cols ? this.cols : 1;

            this.cleanColumns();
            const classType = this._getClassType(this.cols);
            this._createColumn(classType);

            this.updateButtonState();

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
                }*/ // MBG dead code 12/02/2022
            }
        } else {
            this.cols = 0;
            this.rows = 0;
            this.heightCols = [];
            this.newHeightCols = [];

            // very old backward compatibility
            deviceObj = {
                "cols": {
                    "valueRow": "none",
                    "valueCol": "1",
                    "maxCells": 0,
                    "maxCols": 0,
                    "classType": "",
                }
            };
        }

        return deviceObj;
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

        const valueRow = this.rows ? this.rows.toString() : "none";
        const valueCol = (this.rows && this.cols) ? this.cols.toString() : "1";
        const maxCells = this.rows * this.cols;

        const deviceCols = { 'valueRow': valueRow, 'valueCol': valueCol, 'maxCells': maxCells, 'maxCols': this.cols, 'classType': classType };

        for (let i = 1; i <= maxCells; i++) {
            const drpName = {};
            const dpr = $("#dpr" + i)[0];
            if (dpr.hasChildNodes()) {
                for (let j = 0; j < dpr.childNodes.length; j++) {
                    const child = dpr.childNodes[j];
                    drpName["component" + j] = child.childNodes[0].id; //$("#dpr" + i)[0].childNodes[j].id == DIV_element
                }
            }
            deviceDroppers["dpr" + i] = drpName;
        }
        const device = {
            'cols': deviceCols,
            'droppers': deviceDroppers
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

var layoutMgr = new LayoutMgrClass();

/*--------event on device rows--------*/
$("select[name=select-rows]").on('change', function(e) {
    layoutMgr.updateButtonState();
});

/*--------event on device columns--------*/
$("select[name=select-cols]").on('change', function(e) {
    layoutMgr.updateButtonState();
});

/*--------event on device columns--------*/
/*$("#rescale-opts,#stretchWidth,#keepProportion").on('change', function(e) {
    const stretchWidth = $('#stretchWidth').prop('checked');
    const keepProportion = $('#keepProportion').prop('checked');

    let scalingMethod;
    if (stretchWidth) {
        if (keepProportion) {
            scalingMethod = 'scaleTwSp';
        } else {
            scalingMethod = 'scaleTwh';
        }
    } else {
        if (keepProportion) {
            scalingMethod = 'scaleIdent'; // MBG : to be improved
        } else {
            scalingMethod = 'scaleIdent';
        }
    }

    widgetEditor.setScalingMethod(scalingMethod);
});*/ // MBG 12/02/2022 dead code