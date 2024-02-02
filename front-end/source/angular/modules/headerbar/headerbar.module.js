import { headerbarModule as _headerbarModule } from './headerbar';
import './headerbar.controller';
import './services/logoutService';
import './services/notificationService';

import headerbarTemplate from 'angular/modules/headerbar/headerbar.html';

export const headerbarModule = _headerbarModule;

headerbarModule.run(function ($templateCache) {
  $templateCache.put('angular/modules/headerbar/headerbar.html', headerbarTemplate);
});
