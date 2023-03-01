﻿// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ editor-events                                                         │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Tristan BARTEMENT                  │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\


// ├────────────────────────────────────────────────────────────────────┤ \\
// |                         Grid functions                             | \\
// ├────────────────────────────────────────────────────────────────────┤ \\

function gridMgrClass() {
    var sizeX = 20;
    var sizeY = 20;

    /** 
     * @returns {null|{sizeX:number, sizeY:number}} the grid parameters if it is displayed
     */
    this.getGrid = function _getGrid() {
        // Testing the CSS class is debatable, but communication with the angular controler is such a pain...
        return $('#DropperDroite')[0].classList.contains('show-grid') ? { sizeX, sizeY } : null;
    };

    /**
    * @description updates the size of the grid
    */
    this.updateGrid = function _updateGrid() {
        _updateGridSizes();

        const styleStr = `${sizeX}px ${sizeY}px`;
        $('.dropperR:not(#DropperDroitec), .dropperR:not(#DropperDroitec) .device-col').each(function () {
            this.style['background-size'] = styleStr;
        });
    };

    /*--------updateGridSizes--------*/
    function _updateGridSizes() {
        // TODO : handle media type
        widgetEditor.updateSnapshotDashZoneDims();  //GHI #239
        const snapshotDashZoneDims = widgetEditor.getSnapshotDashZoneDims();

        sizeX = (snapshotDashZoneDims.widthPx - 22) / 48;
        sizeY = (snapshotDashZoneDims.heightPx - 4) / 24;

        sizeX = Math.max(1, Math.round(sizeX));
        sizeY = Math.max(1, Math.round(sizeY));
    }
}

var gridMgr = new gridMgrClass();
