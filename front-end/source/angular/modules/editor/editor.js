// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │ editor                                                                      │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2021-2023 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                      │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.editor', ['modules.dashboard'])
    .config(['$stateProvider',
        function ($stateProvider) {
            $stateProvider
                .state('modules.editor', {
                    notAuthenticate: true,
                    userAuthenticated: false,
                    abstract: true,
                    url: '/editor',
                    templateUrl: 'source/angular/templates/layout/default2.html'

                });
        }]);

angular.module('modules.editor')
    .value('LayoutMgrGetter', () => layoutMgr)
    .value('WidgetsPluginsHandlerGetter', () => widgetsPluginsHandler)
    .value('WidgetConnectorGetter', () => widgetConnector)
    .value('WidgetEditorGetter', () => widgetEditor)
    .value('WidgetContainerGetter', () => widgetContainer);
