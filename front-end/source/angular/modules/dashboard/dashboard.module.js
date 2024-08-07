import { dashboardModule as _dashboardModule } from './dashboard';
import './dashboard.controller';

import './services/depGraphService';
import './services/editPlaySwitchService';
import './services/jsonDisplayDirective';
import './services/manageDatanodeService';
import './services/profGraphService';
import './services/uiNotificationService';

import './_partials/dashboard_contentTop.controller';
import './_partials/headerbar/dashboard_header.controller';
import './_partials/modals/datanode_notif.controller';
import './_partials/panels/dashboard_datanodes.controller';
import './_partials/panels/dashboard_depGraph.controller';
import './_partials/panels/dashboard_libraries.controller';
import './_partials/panels/dashboard_wdgtLibs.controller';

import editorTemplate from './_partials/editor/editor.html';

import dashboardAspectsTemplate from './_partials/panels/dashboard_aspects.html';

import dashboardHelpTemplate from './_partials/panels/dashboard_help.html';
import dashboardHistoricTemplate from './_partials/panels/dashboard_historic.html';
import dashboardLeftSidePanelTemplate from './_partials/panels/dashboard_leftSidePanel.html';
import dashboardLibrariesTemplate from './_partials/panels/dashboard_libraries.html';
import dashboardWdgtLibsTemplate from './_partials/panels/dashboard_wdgtLibs.html';

import exportDownloadPageTemplate from './_partials/modals/exportDownloadPage.html';

import dashboardContentTemplate from './_partials/dashboard_content.html';
import dashboardFooterTemplate from './_partials/dashboard_footer.html';

export const dashboardModule = _dashboardModule;

dashboardModule
  .directive('editorTemplate', function () {
    return {
      template: editorTemplate,
    };
  })
  .directive('dashboardAspectsTemplate', function () {
    return {
      template: dashboardAspectsTemplate,
    };
  })
  .directive('dashboardHelpTemplate', function () {
    return {
      template: dashboardHelpTemplate,
    };
  })
  .directive('dashboardHistoricTemplate', function () {
    return {
      template: dashboardHistoricTemplate,
    };
  })
  .directive('dashboardLeftSidePanelTemplate', function () {
    return {
      template: dashboardLeftSidePanelTemplate,
    };
  })
  .directive('dashboardLibrariesTemplate', function () {
    return {
      template: dashboardLibrariesTemplate,
    };
  })
  .directive('dashboardWdgtLibsTemplate', function () {
    return {
      template: dashboardWdgtLibsTemplate,
    };
  })
  .directive('exportDownloadPageTemplate', function () {
    return {
      template: exportDownloadPageTemplate,
    };
  })
  .directive('dashboardContentTemplate', function () {
    return {
      template: dashboardContentTemplate,
    };
  })
  .directive('dashboardFooterTemplate', function () {
    return {
      template: dashboardFooterTemplate,
    };
  });

import dashboardHeaderTemplate from './_partials/headerbar/dashboard_header.html';
import dashboardContentTopTemplate from './_partials/dashboard_contentTop.html';
import dashboardDatanodesTemplate from './_partials/panels/dashboard_datanodes.html';
import dashboardRightSidePanelTemplate from './_partials/panels/dashboard_rightSidePanel.html';
import dashboardTemplate from './dashboard.html';
import datanodeNotifTemplate from './_partials/modals/datanode_notif.html';
import dashboardDepGraphTemplate from './_partials/panels/dashboard_depGraph.html';

dashboardModule.run(function ($templateCache) {
  $templateCache.put(
    'angular/modules/dashboard/_partials/panels/dashboard_rightSidePanel.html',
    dashboardRightSidePanelTemplate
  );
  $templateCache.put('angular/modules/dashboard/dashboard.html', dashboardTemplate);
  $templateCache.put('angular/modules/dashboard/_partials/panels/dashboard_datanodes.html', dashboardDatanodesTemplate);
  $templateCache.put('angular/modules/dashboard/_partials/headerbar/dashboard_header.html', dashboardHeaderTemplate);
  $templateCache.put('angular/modules/dashboard/_partials/dashboard_contentTop.html', dashboardContentTopTemplate);
  $templateCache.put('angular/modules/dashboard/_partials/modals/datanode_notif.html', datanodeNotifTemplate);
  $templateCache.put('angular/modules/dashboard/_partials/panels/dashboard_depGraph.html', dashboardDepGraphTemplate);
});
