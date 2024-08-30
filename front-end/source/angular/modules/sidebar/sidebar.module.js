import { sidebarModule as _sidebarModule } from './sidebar';
import './sidebar.controller';
import './services/filterPrjService';

import sidebarTemplate from './sidebar.html';
import sidebarBasicTemplate from './sidebar-basic.html';

export const sidebarModule = _sidebarModule;

sidebarModule.run([
  '$templateCache',
  function ($templateCache) {
    $templateCache.put('angular/modules/sidebar/sidebar.html', sidebarTemplate);
    $templateCache.put('angular/modules/sidebar/sidebar-basic.html', sidebarBasicTemplate);
  },
]);
