// ┌────────────────────────────────────────────────────────────────────┐ \\
// │  widgetFactory : absract factory class for buidling widgets        │ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import PNotify from 'pnotify';

import { widgetContainer } from 'kernel/dashboard/widget/widget-container';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { editorSingletons } from 'kernel/editor-singletons';
import {
  computeMainDivLayout,
  pxToViewPort,
  computeContainerRelativeLayout,
  enforceConstraints,
  enforceMinConsistency,
  applyLayout,
} from 'kernel/dashboard/widget/widget-placement';
import { convertViewportToPx } from 'kernel/dashboard/scaling/scaling-utils';
import { widgetInstance } from 'kernel/dashboard/widget/widget-instance';

function widgetFactoryClass() {
  const POSSIBLE_ANSI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // (62 characters)
  const POSSIBLE_HINDI = 'कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ'; // Hindi chars (34 characters)
  const POSSIBLE_DEVANAGARI = 'अआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह'; // Devanagari chars (46 characters)
  const POSSIBLE_JAPANESE =
    'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'; // Japanese chars (46 characters)
  const POSSIBLE_RUSSIAN = 'БГДЁЖИЙЛПФЦЧШЩЪЫЭЮЯ'; // 33 characters
  const POSSIBLE_ARABIC = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي'; // 28 characters
  const POSSIBLE_HEBREW = 'אבגדהוזחטיכךלמםנןסעפףצץקרשת'; // 22 characters
  const POSSIBLE_GREEK = 'βΓΔδεζηΘθκΛλμΞξΠπΣτΦφχΨψΩω'; // 24 characters
  const POSSIBLE_CHINESE = '一二三四五六七八九十百千万亿中人天地日月金木水火风雷'; // 26 characters

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

    // add editable widget css classes
    // TODO clean
    $('#' + cln.id).addClass('drsElement');
    $('#' + cln.id).addClass('drag-drop-move');
    $('#' + cln.id).addClass('_cloned');
    $('#' + cln.id).addClass('widget widget__layout--item');
    $('#' + cln.id)[0].setAttribute('item-width', $('#' + cln.id).width());
    $('#' + cln.id)[0].setAttribute('item-height', $('#' + cln.id).height());

    const overlay = document.createElement('div');
    overlay.classList.add('widget-overlay');
    cln.appendChild(overlay);

    //
    let menu = $('<ul class="actions__list" style="padding:0"></ul>').appendTo(cln);
    $(
      '<li id="li_' +
        cln.id +
        '" onclick="widgetEditor.showHideWidgMenu(this)" style="z-index:999999;margin:0"><a id="ed_a_' +
        cln.id +
        '" title="edit widget"><i id="showHideWidgetMenu" class="basic icn-edit"></i></a></li>'
    ).appendTo(menu);

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
      widgetTitle = '';
    }

    widgetTitle = widgetTitle + '(' + instanceId + ')'; // MBG 03/06/2021

    // create coatingDiv
    $('div#' + cln.id).wrap('<a id=DIV_' + cln.id + " title='" + widgetTitle.replace('_', ' ') + "'></a>");
    var wo = widgetInstance.createWidget(wcId, modelJsonId.toString(), instanceId);
    return {
      id: instanceId,
      instanceId: instanceId,
      modelJsonId: modelJsonId,
      name: instanceId,
      divContainer: div,
      divModel: cln,
      widgetObj: wo,
      widgetTitle: widgetTitle, //AEF
      //add sliders
    };
  };

  /**
   * @description Creates "MainDiv"(cln) and his child "ContainerDiv"(div)
   * @param {any} modelJsonId (mandatory) widget template ID
   * @param {any} targetDiv (optionnal) where to create the div. Automatic find if empty
   * @param {any} wLayout (optional) widget layout (left, top, width, height).
   * Default modelJsonId layout used if undefined
   */
  function createNewDiv(modelJsonId, targetDiv, wLayout) {
    var cln = document.createElement('div'); // mainDiv
    targetDiv = widgetContainer.putAndGetTargetDiv(cln, targetDiv);
    var layoutViewport = computeMainDivLayout(wLayout, modelJsonId);

    // Default zIndex : can be overloaded later
    cln.style.zIndex = (widgetContainer.getMaxZIndex() || 0) + 1; // positionner l'élément en 1er plan

    // Conversions to work in px
    var widgetLayoutPx = convertViewportToPx(layoutViewport);
    var containerLayoutPx = editorSingletons.layoutMgr.getTargetDivLayoutPx(targetDiv);
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
    widgetContainer.computeAndApplyContainerDivLayout(cln, div);

    // Append containerDiv to mainDiv
    cln.appendChild(div);

    return [cln, div, targetDiv];
  }

  /**
   * @description Creates unique instanceId (for edit, play and (se/dese)rialization)
   * @param {any} modelJsonId
   */
  this.createUniqueInstanceId = function (modelJsonId) {
    const modelsIdLength = editorSingletons.widgetEditor.modelsId.length;
    const usedIds = new Set(editorSingletons.widgetEditor.modelsId);
    const makeid = (charset) => charset.charAt(Math.floor(Math.random() * charset.length));
    const ids = [
      ...POSSIBLE_ANSI,
      ...POSSIBLE_HINDI,
      ...POSSIBLE_DEVANAGARI,
      ...POSSIBLE_JAPANESE,
      ...POSSIBLE_RUSSIAN,
      ...POSSIBLE_ARABIC,
      ...POSSIBLE_HEBREW,
      ...POSSIBLE_GREEK,
      ...POSSIBLE_CHINESE,
    ].map((character) => modelJsonId + makeid(character));
    const instanceId = ids.find((id) => !usedIds.has(id));
    if (!instanceId) {
      // handle case where all possible IDs are taken
      const notice = new PNotify({
        title: 'Annotation label',
        text: 'The number of label instances is reached',
        type: 'warning',
        delay: 1800,
        styling: 'bootstrap3',
      });
      $('.ui-pnotify-container').on('click', function () {
        notice.remove();
      });

      // TODO throw an error
    } else {
      usedIds.add(instanceId);
      editorSingletons.widgetEditor.modelsId[modelsIdLength] = instanceId;
    }
    return instanceId;
  };
}

export const widgetFactory = new widgetFactoryClass();
