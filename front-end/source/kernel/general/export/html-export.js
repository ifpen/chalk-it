// +--------------------------------------------------------------------+ \\
// ¦ htmlExport                                                         ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2016-2024 IFPEN                                        ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  ¦ \\
// +--------------------------------------------------------------------+ \\

import { xDashConfig } from 'config.js';
import _ from 'lodash';

import { runtimeSingletons } from 'kernel/runtime-singletons';
import { runtimeToolbar } from 'kernel/general/export/runtime-toolbar';
import {
  DASHBOARD_DATA_ID,
  DASHBOARD_DATA_TYPE,
  DASHBOARD_CONFIG_ID,
  DASHBOARD_CONFIG_TYPE,
  PAGE_MODE_PAGES,
  PAGE_MODE_TABS,
} from 'kernel/general/export/export-constants';

class HtmlExport {
  #pageMode;
  #initialPage;
  #navBarNotification;

  constructor() {
    this.#pageMode = undefined;
    this.#initialPage = undefined;
    this.#navBarNotification = false;
  }

  /**
   * Previews the dashboard with the given JSON and project name.
   *
   * @param {Object} xprjson - JSON data for the dashboard.
   * @param {string} projectName - Name of the project.
   */
  previewDashboard(xprjson, projectName) {
    const $rootScope = angular.element(document.body).scope().$root;
    const _projectName = $rootScope.xDashFullVersion ? projectName : $('#projectName').val() || 'Untitled';
    const param = xprjson && _projectName ? [xprjson, _projectName] : null;

    this.previewDashboardCallback(param);
  }

  /**
   * Callback for previewing the dashboard.
   *
   * @param {Array} param - Array containing the JSON data and project name.
   */
  async previewDashboardCallback(param) {
    const dashboardName = param?.[1] || $('#projectName').val();
    const xprjson = param?.[0];

    const tab = window.open('about:blank', '_blank');
    const txt = await this.createDashboardDocument(dashboardName, xprjson);
    tab.document.write(txt);
    tab.document.close();
    tab.focus();
  }

  /**
   * Creates the HTML document for the dashboard.
   *
   * @param {string} name - Name of the dashboard.
   * @param {Object} xprjson - JSON data for the dashboard.
   * @returns {Promise<string>} Serialized HTML document as a string.
   */
  async createDashboardDocument(name, xprjson) {
    const xdashPrj = xprjson || runtimeSingletons.xdash.serialize();
    const doc = await this.#createHtmlDoc();
    this.#insertContent(doc, name, xdashPrj);
    return new XMLSerializer().serializeToString(doc);
  }

  /**
   * Saves the dashboard.
   */
  saveDashboard() {
    const dashboardName = $('#projectName').val();

    this.#selectDashboardName(dashboardName);
  }

  /**
   * Creates the HTML document from a template.
   *
   * @returns {Promise<Document>} Parsed HTML document.
   * @private
   */
  async #createHtmlDoc() {
    try {
      const resp = await fetch('index-view.html');
      if (!resp.ok) {
        throw new Error(`${resp.status} - ${resp.statusText}`);
      }
      const text = await resp.text();
      const parser = new DOMParser();
      const document = parser.parseFromString(text, 'text/html');
      return document;
    } catch (error) {
      console.error('Error fetching HTML document:', error);
      throw error;
    }
  }

  /**
   * Updates the resource paths in the document.
   *
   * @param {Document} doc - HTML document.
   * @param {string} baseUrl - Base URL to use for updating paths.
   * @private
   */
  #updateResourcePaths(doc, baseUrl) {
    const adjustUrl = (target) => baseUrl + (baseUrl.endsWith('/') || target.startsWith('/') ? '' : '/') + target;

    Array.from(doc.getElementsByTagName('link')).forEach((lnk) => {
      if (lnk.getAttribute('rel') === 'stylesheet' && lnk.hasAttribute('src')) {
        lnk.setAttribute('src', adjustUrl(lnk.getAttribute('src')));
      }
    });

    Array.from(doc.getElementsByTagName('script')).forEach((script) => {
      if (script.hasAttribute('src')) {
        script.setAttribute('src', adjustUrl(script.getAttribute('src')));
      }
    });
  }

  /**
   * Inserts content into the HTML document.
   *
   * @param {Document} doc - HTML document.
   * @param {string} name - Name of the dashboard.
   * @param {Object} xdashPrj - Serialized dashboard project data.
   * @private
   */
  #insertContent(doc, name, xdashPrj) {
    const showNavBar = this.#shouldShowNavBar(xdashPrj);

    const config = {
      tabActive: 'play', // TODO
      execOutsideEditor: true,
      urlBase: xDashConfig.urlBaseForExport,
      navBarNotification: this.navBarNotification,
      showNavBar,
    };

    if (xDashConfig.urlBaseForExport) {
      this.#updateResourcePaths(doc, xDashConfig.urlBaseForExport);
    }

    doc.title = name;
    this.#insertScripts(doc, xdashPrj, config);
    if (showNavBar) {
      this.#insertNavBar(doc);
    }
  }

  /**
   * Determines if the navbar should be shown based on export options.
   *
   * @param {Object} xdashPrj - Serialized dashboard project data.
   * @returns {boolean} Whether the navbar should be shown.
   * @private
   */
  #shouldShowNavBar(xdashPrj) {
    const notifications = xdashPrj.navBarNotification ?? this.navBarNotification;
    const hasPages = !!xdashPrj?.pages?.pageNames?.length;
    const pageMode = xdashPrj?.pages?.pageMode ?? PAGE_MODE_PAGES;
    const pageModesWithNavBar = [PAGE_MODE_PAGES, PAGE_MODE_TABS];
    return notifications || (hasPages && pageModesWithNavBar.includes(pageMode));
  }

  /**
   * Inserts the necessary scripts into the document.
   *
   * @param {Document} doc - HTML document.
   * @param {Object} xdashPrj - Serialized dashboard project data.
   * @param {Object} config - Configuration for the dashboard.
   * @private
   */
  #insertScripts(doc, xdashPrj, config) {
    const body = doc.body;

    const createScript = (id, type, content) => {
      const script = doc.createElement('script');
      script.setAttribute('id', id);
      script.setAttribute('type', type);
      script.textContent = JSON.stringify(content, null, '  ');
      return script;
    };

    body.appendChild(createScript(DASHBOARD_DATA_ID, DASHBOARD_DATA_TYPE, xdashPrj));
    body.appendChild(createScript(DASHBOARD_CONFIG_ID, DASHBOARD_CONFIG_TYPE, config));
  }

  /**
   * Inserts the navbar into the document if it should be shown.
   *
   * @param {Document} doc - HTML document.
   * @private
   */
  #insertNavBar(doc) {
    const navBar = doc.getElementById('nav_bar');
    navBar.innerHTML = runtimeToolbar.toolbarTemplate;
  }

  /**
   * Selects and sets the dashboard name.
   *
   * @param {string} dashboardName - Name of the dashboard.
   * @private
   */
  #selectDashboardName(dashboardName) {
    const $rootScope = angular.element(document.body).scope().$root;

    $rootScope.infoPage = {
      isPrivatePage: $rootScope.securedLink === 'True',
      name: dashboardName,
      title: 'HTML page export',
      btnTxt: 'Save',
      exportPage: true,
      isManagePageOpen: true,
    };
  }

  get pageMode() {
    return this.#pageMode;
  }

  set pageMode(value) {
    this.#pageMode = value;
  }

  get initialPage() {
    return this.#initialPage;
  }

  set initialPage(value) {
    this.#initialPage = value;
  }

  get navBarNotification() {
    return this.#navBarNotification;
  }

  set navBarNotification(value) {
    this.#navBarNotification = value;
  }
}

// Export an instance of HtmlExport as a singleton
export const htmlExport = new HtmlExport();
