// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │ editor                                                                      │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2024 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                      │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\

import { dashboardModule } from '../dashboard/dashboard.module';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { editorSingletons } from 'kernel/editor-singletons';
import { EventCenter } from './editor.events';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { widgetContainer } from 'kernel/dashboard/widget/widget-container';

export const editorModule = angular.module('modules.editor', [dashboardModule.name]).config([
  '$stateProvider',
  function ($stateProvider) {
    $stateProvider.state('modules.editor', {
      notAuthenticate: true,
      userAuthenticated: false,
      abstract: true,
      url: '/editor',
    });
  },
]);

editorModule
  .service('EventCenterService', [EventCenter])
  .value('LayoutMgrGetter', () => editorSingletons.layoutMgr)
  .value('WidgetsPluginsHandlerGetter', () => widgetsPluginsHandler)
  .value('WidgetConnectorGetter', () => widgetConnector)
  .value('WidgetEditorGetter', () => editorSingletons.widgetEditor)
  .value('WidgetContainerGetter', () => widgetContainer);
