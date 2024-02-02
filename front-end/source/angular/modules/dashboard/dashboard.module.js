import { dashboardModule as _dashboardModule } from './dashboard';
import './dashboard.controller';

import './services/depGraphService';
import './services/editPlaySwitchService';
import './services/jsonDisplayDirective';
import './services/manageDatanodeService';
import './services/uiNotificationService';

import './_partials/dashboard_contentTop.controller';
import './_partials/headerbar/dashboard_header.controller';
import './_partials/modals/datanode_notif.controller';
import './_partials/panels/dashboard_datanodes.controller';
import './_partials/panels/dashboard_depGraph.controller';
import './_partials/panels/dashboard_libraries.controller';
import './_partials/panels/dashboard_wdgtLibs.controller';
export const dashboardModule = _dashboardModule;
