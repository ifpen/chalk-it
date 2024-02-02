import { headerbarModule as _headerbarModule } from './headerbar';
import './headerbar.controller';
import './services/logoutService';
import './services/notificationService';

import headerbarTemplate from './headerbar.html';

export const headerbarModule = _headerbarModule;

headerbarModule.directive('headerbarTemplate', function () {
    return {
      template: headerbarTemplate,
    };
  });