// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ customNavigationRuntime mode runtime display handling              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR                                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { widgetViewer } from 'kernel/dashboard/rendering/widget-viewer';

export const customNavigationRuntime = {
  goToPage: (page) => {
    const $rootScope = angular.element(document.body).scope().$root;
    if (page >= 0 && page < $rootScope.pageNames.length) {
      $rootScope.pageNumber = page;
      widgetViewer.setCurrentPage(page);
    }
  },
};
