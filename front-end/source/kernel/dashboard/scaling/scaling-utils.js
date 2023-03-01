// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard load for page view                                       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var workOnViewport = true;

/*--------convert px to vw--------*/
function unitW(value) {
    var vwFl = value * (100.0 / document.documentElement.clientWidth);
    var vwStr = vwFl.toPrecision(23);
    vwStr = vwStr + 'vw';
    return vwStr;
}

/*--------convert px to vh--------*/
function unitH(value) {
    var vhFl = value * (100 / document.documentElement.clientHeight);
    var vhStr = vhFl.toPrecision(23);
    vhStr = vhStr + 'vh';
    return vhStr;
}

/*--------convert vw to px--------*/
function convertVwtoPx(value) {
    value = rmUnit(value);
    return (value / 100) * document.documentElement.clientWidth;
}

/*--------convert vh to px--------*/
function convertVhtoPx(value) {
    value = rmUnit(value);
    return (value / 100) * document.documentElement.clientHeight;
}

/*--------convert viewport obj to px obj--------*/
function convertViewportToPx(vpObj) {
    var pxObj = {
        "left": convertVwtoPx(vpObj.left),
        "top": convertVhtoPx(vpObj.top),
        "width": convertVwtoPx(vpObj.width),
        "height": convertVhtoPx(vpObj.height),
        "minWidth": vpObj.minWidth,
        "minHeight": vpObj.minHeight
    };
    return pxObj;
}

/*-----WidgetContainer width from top level container-----*/
function inheritWcWidthFromPx(value) {
    return (value - 2) * (100 / document.documentElement.clientWidth) + 'vw';
}

/*-----WidgetContainer height from top level container-----*/
function inheritWcHeightFromPx(value) {
    return (value - 2) * (100 / document.documentElement.clientHeight) + 'vh';
}

/*-----WidgetContainer width from top level container-----*/
function inheritWcWidthFromIdInst(idInstance) {
    var elt = idInstance
    if (tabActive == "play") {
        elt = elt + 'c';
    }
    return inheritWcWidthFromPx($('#' + elt).width);
}

/*-----WidgetContainer height from top level container-----*/
function inheritWcHeightFromIdInst(idInstance) {
    var elt = idInstance
    if (tabActive == "play") {
        elt = elt + 'c';
    }
    return inheritWcHeightFromPx($('#' + elt).height);
}

/*--------match Media--------*/
function getMedia() {
    var lastMedia = "";
    if (window.matchMedia("(min-width: 768px)").matches) {
        lastMedia = "large";
    } else {
        lastMedia = "small";
    }
    return lastMedia;
}

/*--------isMediaChanged --------*/
function isMediaChanged(lastMedia) {
    var bChanged = false;

    if (lastMedia == "small" && window.matchMedia("(min-width: 768px)").matches) {
        lastMedia = "large";
        bChanged = true;
    } else if (lastMedia == "large" && window.matchMedia("(max-width: 767px)").matches) {
        lastMedia = "small";
        bChanged = true;
    } else {
        bChanged = false;
    }
    return { "bChanged": bChanged, "lastMedia": lastMedia };
}

/*--------getFontFactor --------*/
function getFontFactor() {
    if (tabActive == "play") {
        if (!window.matchMedia("(min-width: 768px)").matches) {
            return widgetPreview.getCols() || 1;
        } else { return 1; }
    } else if (tabActive == "widgets") {
        if (!window.matchMedia("(min-width: 768px)").matches) {
            return layoutMgr.getCols() || 1;
        } else { return 1; }
    } else {
        return 1;
    }
}