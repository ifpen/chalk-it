// +--------------------------------------------------------------------+ \\
// ¦ htmlExport                                                         ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2023 IFPEN                                        ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  ¦ \\
// +--------------------------------------------------------------------+ \\

import { xDashConfig } from 'config.js';
import _ from 'underscore';

import { runtimeSingletons } from 'kernel/runtime-singletons';
import {
  DASHBOARD_DATA_ID,
  DASHBOARD_DATA_TYPE,
  DASHBOARD_CONFIG_ID,
  DASHBOARD_CONFIG_TYPE,
} from 'kernel/runtime/xdash-runtime-main';

export const htmlExport = (function () {
  var exportOptions = 'ajustToTargetWindow';
  var checkExportOptions = true;
  var navBarNotification = false;

  async function createHtmlDoc() {
    const resp = await fetch('index-view.html');
    if (!resp.ok) {
      console.log(resp);
      throw new Error(`${resp.status} - ${resp.statusText}`);
    }
    const text = await resp.text();

    const parser = new DOMParser();
    const document = parser.parseFromString(text, 'text/html');

    return document;
  }

  function insertContent(doc, name, xdashPrj) {
    const config = {
      tabActive: 'play', // TODO
      execOutsideEditor: true, // TODO
      urlBase: xDashConfig.urlBaseForExport,
      navBarNotification,
      showNavBar,
    };

    if (xDashConfig.urlBaseForExport) {
      const baseUrl = xDashConfig.urlBaseForExport;

      for (const lnk of doc.getElementsByTagName('link')) {
        if (lnk.getAttribute('rel') === 'stylesheet' && lnk.hasAttribute('src')) {
          const target = lnk.getAttribute('src');
          lnk.setAttribute('src', baseUrl + (baseUrl.endsWith('/') || target.startsWith('/') ? '' : '/') + target);
        }
      }

      for (const script of doc.getElementsByTagName('script')) {
        if (script.hasAttribute('src')) {
          const target = script.getAttribute('src');
          script.setAttribute('src', baseUrl + (baseUrl.endsWith('/') || target.startsWith('/') ? '' : '/') + target);
        }
      }
    }

    const [head] = doc.getElementsByTagName('head');
    const [title] = head.getElementsByTagName('title');
    const [body] = doc.getElementsByTagName('body');

    title.textContent = name;

    const dataScript = doc.createElement('script');
    dataScript.setAttribute('id', DASHBOARD_DATA_ID);
    dataScript.setAttribute('type', DASHBOARD_DATA_TYPE);
    dataScript.textContent = JSON.stringify(xdashPrj, null, '  ');
    body.appendChild(dataScript);

    const paramsScript = doc.createElement('script');
    paramsScript.setAttribute('id', DASHBOARD_CONFIG_ID);
    paramsScript.setAttribute('type', DASHBOARD_CONFIG_TYPE);
    paramsScript.textContent = JSON.stringify(config, null, '  ');
    body.appendChild(paramsScript);

    const navBarNotification = xdashPrj.navBarNotification ?? htmlExport.navBarNotification;
    const showNavBar =
      xdashPrj.exportOptions === 'rowToPage' || xdashPrj.exportOptions === 'rowToTab' || navBarNotification;

    // FIXME
    // if (showNavBar) {
    //   bodyText4.push(...runtimeToolbar.toolbar);
    // }
  }

  /*--------create dashboard document--------*/
  async function createDashboardDocument(name, xprjson) {
    const xdashPrj = xprjson ?? runtimeSingletons.xdash.serialize();

    const doc = await createHtmlDoc();
    insertContent(doc, name, xdashPrj);

    const xml_serializer = new XMLSerializer();
    const txt = xml_serializer.serializeToString(doc);
    return txt;
  }

  /*--------preview dashboard--------*/
  function previewDashboard(xprjson, projectName, bNoExportModal) {
    const $rootScope = angular.element(document.body).scope().$root;
    const _projectName = $rootScope.xDashFullVersion ? projectName : $('#projectName').val() || 'Untitled';
    let param;
    if (!_.isUndefined(xprjson) && !_.isUndefined(_projectName)) {
      param = [xprjson, _projectName];
    }
    if (htmlExport.checkExportOptions || bNoExportModal) previewDashboardCallback(param);
  }

  /*--------save dashboard--------*/
  function saveDashboard() {
    saveDashboardCallback();
  }

  /*--------preview dashboard Callback--------*/
  async function previewDashboardCallback(param) {
    var dashboardName;

    var xprjson;
    var projectName;
    if (!_.isUndefined(param)) {
      xprjson = param[0];
      projectName = param[1];
    }
    if (!_.isUndefined($('#select-export-settings')[0])) {
      htmlExport.exportOptions = $('#select-export-settings')[0].value;
    }
    if (!_.isUndefined($('#check-scale-export')[0])) {
      htmlExport.checkExportOptions = $('#check-scale-export')[0].checked;
    }
    if (_.isUndefined(projectName)) dashboardName = $('#projectName')[0].value;
    else dashboardName = projectName;

    const tab = window.open('about:blank', '_blank');
    const txt = await createDashboardDocument(dashboardName, xprjson);
    tab.document.write(txt);
    tab.document.close();
    tab.focus();
  }

  /*--------save Dashboard Callback--------*/
  function saveDashboardCallback() {
    //AEF: only for server
    var dashboardName = $('#projectName')[0].value;
    if (!_.isUndefined($('#select-export-settings')[0])) {
      htmlExport.exportOptions = $('#select-export-settings')[0].value;
    }
    if (!_.isUndefined($('#check-scale-export')[0])) {
      htmlExport.checkExportOptions = $('#check-scale-export')[0].checked;
    }

    selectDashboardName(dashboardName);
  }

  /*--------select Dashboard Name Settings--------*/
  function selectDashboardName(dashboardName) {
    var $body = angular.element(document.body);
    var $rootScope = $body.scope().$root;
    // $rootScope.infoPage.exportPage = true;
    // $rootScope.infoPage.name = dashboardName;
    // $rootScope.infoPage.title = "HTML page export";
    // $rootScope.infoPage.btnTxt = "Save";
    // $rootScope.infoPage.isPrivatePage = $rootScope.securedLink ? "True" : "False";
    // $rootScope.infoPage.isManagePageOpen = true;
    $rootScope.infoPage = {
      isPrivatePage: $rootScope.securedLink === 'True' ? true : false,
      name: dashboardName,
      title: 'HTML page export',
      btnTxt: 'Save',
      exportPage: true,
      isManagePageOpen: true,
    };

    //$rootScope.infoPage.isManagePageOpen = true;
  }

  return {
    previewDashboardCallback: previewDashboardCallback,
    previewDashboard: previewDashboard,
    saveDashboard: saveDashboard,
    exportOptions: exportOptions,
    checkExportOptions: checkExportOptions,
    navBarNotification: navBarNotification,
    createDashboardDocument: createDashboardDocument,
  };
})();
