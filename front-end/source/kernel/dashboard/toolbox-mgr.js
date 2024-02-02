// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ widgetToolbox : load widgets library                               │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Mondher AJIMI   │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'underscore';
import swal from 'sweetalert';

import { widgetsEditorToolboxDefinition } from './toolbox-def';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';

export function widgetToolboxClass() {
  var searchParams = [];
  var allWidgets = getAllWidgetsNames();

  function getAllWidgetsNames() {
    let widgetName = [];
    let widgetTitle = [];
    let allWidget = [];
    let wdgtGroupId = _.keys(widgetsEditorToolboxDefinition);

    for (let i = 0; i < wdgtGroupId.length; i++) {
      widgetTitle = [];
      widgetName = widgetsEditorToolboxDefinition[wdgtGroupId[i]].widgets;
      _.each(widgetName, (wn) => {
        widgetTitle.push(widgetsPluginsHandler.widgetToolbarDefinitions[wn].title);
      });
      for (let j = 0; j < widgetName.length; j++) {
        allWidget.push({ name: widgetName[j], title: widgetTitle[j] });
      }
    }
    return allWidget;
  }

  var widgetToolbox = function () {
    var filter = searchParams.length > 0;
    //DOM Ready
    var wdgtGroupId = !filter ? _.keys(widgetsEditorToolboxDefinition) : ['collapse-search_results'];
    var wdgtGroupName = !filter ? _.pluck(widgetsEditorToolboxDefinition, 'name') : ['Search Results'];

    var htmlLib = '';
    var widgetName = [];
    var widgetTitle = [];
    var widgetIcon = [];

    for (var i = 0; i < wdgtGroupId.length; i++) {
      widgetName = [];
      widgetTitle = [];
      widgetIcon = [];

      widgetName = !filter ? widgetsEditorToolboxDefinition[wdgtGroupId[i]].widgets : searchParams;
      _.each(widgetName, (wn) => {
        if (!_.isUndefined(widgetsPluginsHandler.widgetToolbarDefinitions[wn])) {
          widgetTitle.push(widgetsPluginsHandler.widgetToolbarDefinitions[wn].title);
          widgetIcon.push(widgetsPluginsHandler.widgetToolbarDefinitions[wn].icn);
        } else {
          swal('Widget plugin loader Error', 'Did not find the definition of delcared widget ' + wn, 'error');
          widgetName = _.without(widgetName, wn);
        }
      });

      var html = fillCollapseHeader(wdgtGroupId, wdgtGroupName, i);
      html = fillWidgetContent(html, widgetTitle, widgetName, widgetIcon);
      html = fillCollapseFooter(html);

      htmlLib = [htmlLib, html].join('\n');
    }
    $('#widgetGroups').html('');
    $('#widgetGroups')[0].insertAdjacentHTML('beforeend', htmlLib);
    var $body = angular.element(document.body); // 1
    var $rootScope = $body.scope().$root;
    let scopeWdgt = angular.element(document.getElementById('widget__wrap')).scope();
    scopeWdgt.myWidgetHTML = $('#widgetGroups').html(); // FIXME

    if (filter) document.getElementById('widget__groups--wrapper--icons').style.overflow = 'visible';
    if (filter && scopeWdgt.displayedWdgtIndex != 0) scopeWdgt.toggleWidgetLibDisplay(0);
    $rootScope.safeApply();

    /*--------fillHeader--------*/
    function fillCollapseHeader(wdgtGroupId, wdgtGroupName, index) {
      var html = [
        '<div class="widget__groups--wrapper " ng-class="{open:displayedWdgtIndex==' + index + '}">',
        '    <div ng-click="toggleWidgetLibDisplay(' +
          index +
          ')" class="widget__groups--wrapper--top btn--collapse" id="' +
          wdgtGroupId[i] +
          '">',
        '        <h3>' + wdgtGroupName[i] + '</h3>',
        '        <a>',
        '            <i class="basic icn-miniarrowbottom"></i>',
        '        </a>',
        '    </div>',
        '    <div id="widget__groups--wrapper--icons" class="widget__groups--wrapper--icons">',
      ].join('\n');
      return html;
    }

    /*--------fillWidgetContent--------*/
    function fillWidgetContent(html, widgetTitle, widgetName, widgetIcon) {
      var widgetContent = [];
      var j = 0;
      for (j = 0; j < widgetName.length; j++) {
        //AEF: add widgetTitle in selectWidget to identify widget type
        widgetContent[j] = [
          '        <a href="#" title="Click to clone" class="icons__item drag-drop-new" id="' + widgetName[j] + '">',
          '           <i class="widgets icn-' + widgetIcon[j] + '"> </i>',
          '               <label>' + widgetTitle[j] + '</label>',
          '         </a>',
        ].join('\n');
      }
      for (j = 0; j < widgetContent.length; j++) {
        html = [html, widgetContent[j]].join('\n');
      }
      return html;
    }

    /*--------fillFooter--------*/
    function fillCollapseFooter(html) {
      html = [html, '  </div>', '</div>'].join('\n');
      return html;
    }
  };

  widgetToolbox();

  $('#inputSearchWidget').on('input', function (e) {
    var input = $(this);
    var val = input.val();
    var widgetsToSearch = [];
    var match = false;

    for (let k = 0; k < allWidgets.length; k++) {
      if (
        val.length > 0 &&
        allWidgets[k].title.toLowerCase().match(val) &&
        widgetsToSearch.indexOf(allWidgets[k].title) === -1
      ) {
        widgetsToSearch.push(allWidgets[k].name);
        match = true;
      }
    }

    if (match) {
      searchParams = widgetsToSearch;
      widgetToolbox();
    } else {
      searchParams = [];
      widgetToolbox();
    }
  });
}
