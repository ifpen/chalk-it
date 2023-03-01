// ┌────────────────────────────────────────────────────────────────────┐ \\
// │  widgetFactory : absract factory class for buidling widgets        │ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\


function widgetFactoryClass() {

    const POSSIBLE_ANSI = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const POSSIBLE_HINDI = "कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ";

    /**
     * Widget abstract factory
     * @param {any} modelJsonId (mandatory) model template ID
     * @param {any} targetDiv (optional) where to put the widget
     * @param {any} instanceId (optional) used if provided, will be created otherwise
     * @param {any} wLayout (optional) used if provided, defaults used otherwise
     * @param {=number} wzIndex (optional) used if provided, last widget has highest zIndex otherwise
     */
    this.build = function _build(modelJsonId, targetDiv, instanceId, wLayout, wzIndex) {
        var cln, div;
        if (_.isUndefined(instanceId) || instanceId === null) {
            instanceId = widgetFactory.createUniqueInstanceId(modelJsonId); // create unique key for the instance
        }
        // create mainDiv and containerDiv, with right layout in right targetDiv
        [cln, div, targetDiv] = createNewDiv(modelJsonId, targetDiv, wLayout);
        cln.id = instanceId;
        widgetEditor.lastContainingDrpr[instanceId] = targetDiv.id;
        // add editable widget css classes
        // TODO clean
        $("#" + cln.id).addClass("drsElement");
        $("#" + cln.id).addClass("drag-drop-move");
        $("#" + cln.id).addClass("_cloned");
        $("#" + cln.id).addClass("widget widget__layout--item");
        $("#" + cln.id)[0].setAttribute("item-width", $("#" + cln.id).width());
        $("#" + cln.id)[0].setAttribute("item-height", $("#" + cln.id).height());

        const overlay = document.createElement('div');
        overlay.classList.add('widget-overlay');
        cln.appendChild(overlay);

        //
        let menu = $('<ul class="actions__list" style="padding:0"></ul>').appendTo(cln);
        $('<li id="li_' + cln.id + '" onclick="widgetEditor.showHideWidgMenu(this)" style="z-index:999999;margin:0"><a id="ed_a_' + cln.id + '" tilte="edit widget"><i id="showHideWidgetMenu" class="basic icn-edit"></i></a></li>').appendTo(menu);

        // generate containerDiv id
        var wcId = widgetContainer.getWidgetContainerId();
        div.id = wcId;
        // use widget zIndex if provided to the factory
        if (!_.isUndefined(wzIndex)) {
            cln.style.zIndex = wzIndex;
        }
        // add widgetTitle to identify widget type with tooltip
        var widgetTitle = widgetsPluginsHandler.widgetToolbarDefinitions[modelJsonId].title;
        if (_.isUndefined(widgetTitle)) {
            widgetTitle = "";
        }

        widgetTitle = widgetTitle + '(' + instanceId + ')'; // MBG 03/06/2021

        // create coatingDiv
        $('div#' + cln.id).wrap("<a id=DIV_" + cln.id + " title='" + widgetTitle.replace('_', ' ') + "'></a>");
        var wo = widgetInstance.createWidget(wcId, modelJsonId.toString(), instanceId);
        return {
            id: instanceId,
            instanceId: instanceId,
            modelJsonId: modelJsonId,
            name: instanceId,
            divContainer: div,
            divModel: cln,
            widgetObj: wo,
            widgetTitle: widgetTitle //AEF
                //add sliders
        }
    }

    /**
     * @description Creates "MainDiv"(cln) and his child "ContainerDiv"(div)
     * @param {any} modelJsonId (mandatory) widget template ID
     * @param {any} targetDiv (optionnal) where to create the div. Automatic find if empty
     * @param {any} wLayout (optional) widget layout (left, top, width, height).
     * Default modelJsonId layout used if undefined
     */
    function createNewDiv(modelJsonId, targetDiv, wLayout) {
        var cln = document.createElement('div'); // mainDiv
        var targetDiv = widgetContainer.putAndGetTargetDiv(cln, targetDiv);
        var layoutViewport = computeMainDivLayout(wLayout, modelJsonId);

        // Default zIndex : can be overloaded later
        cln.style.zIndex = (widgetContainer.getMaxZIndex() || 0) + 1; // positionner l'élément en 1er plan

        // Conversions to work in px
        var widgetLayoutPx = convertViewportToPx(layoutViewport);
        var containerLayoutPx = layoutMgr.getTargetDivLayoutPx(targetDiv);
        // Enforce size is into container and place correctly newly drag and dropped widget
        var relativeContainerLayoutPx = computeContainerRelativeLayout(containerLayoutPx);
        var relativeWidgetLayoutPx = enforceConstraints(widgetLayoutPx, relativeContainerLayoutPx);
        // Enforce minHeight and minWidth consistency
        widgetLayoutPx = enforceMinConsistency(widgetLayoutPx);
        // Back to viewport
        var widgetLayoutViewPort = pxToViewPort(relativeWidgetLayoutPx);
        // Add minHeight & minWidth
        widgetLayoutViewPort.minHeight = widgetLayoutPx.minHeight;
        widgetLayoutViewPort.minWidth = widgetLayoutPx.minWidth;
        // Apply layout to cln
        applyLayout(cln, widgetLayoutViewPort);
        // Create containerDiv
        var div = document.createElement('div');
        // Propagate to containerDiv
        widgetContainer.computeAndApplyContainerDivLayout(cln, div)

        // Append containerDiv to mainDiv
        cln.appendChild(div);

        return [cln, div, targetDiv];
    }

    // to 62 possible values
    function makeid() {
        var text = "";
        text = POSSIBLE_ANSI.charAt(Math.floor(Math.random() * POSSIBLE_ANSI.length));
        return text;
    }

    // Use Hindi chars
    function makeidNext() {
        var text = "";
        text = POSSIBLE_HINDI.charAt(Math.floor(Math.random() * POSSIBLE_HINDI.length));
        return text;
    }

    /**
     * @description Creates unique instanceId (for edit, play and (se/dese)rialization)
     * @param {any} modelJsonId
     */
    this.createUniqueInstanceId = function(modelJsonId) {
        var bFoundIndex = true;
        var instanceId;
        var attempt = 0;
        while ((bFoundIndex) && (attempt < POSSIBLE_ANSI.length)) {
            var character = ".";
            character = makeid();
            instanceId = modelJsonId.toString() + character;
            bFoundIndex = false;
            for (var i = 0; i < widgetEditor.modelsId.length; i++) {
                if (widgetEditor.modelsId[i] == instanceId) { // TODO : ask dashboard for unicity check
                    bFoundIndex = true;
                    break;
                }
            }
            attempt++;
        }
        if (attempt == POSSIBLE_ANSI.length) {
            bFoundIndex = true;
            while (bFoundIndex) {
                character = makeidNext(); // Use Hindi chars
                instanceId = modelJsonId.toString() + character;
                bFoundIndex = false;
                for (var i = 0; i < widgetEditor.modelsId.length; i++) {
                    if (widgetEditor.modelsId[i] == instanceId) { // TODO : ask dashboard for unicity check
                        bFoundIndex = true;
                        break;
                    }
                }
            }
        }
        widgetEditor.modelsId[widgetEditor.modelsId.length] = instanceId; // TODO 
        return instanceId;
    }
}

var widgetFactory = new widgetFactoryClass()