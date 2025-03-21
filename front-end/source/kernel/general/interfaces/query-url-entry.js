// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ urlQueryEntry                                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { findGetParameter } from 'kernel/datanodes/plugins/thirdparty/utils';
import { runtimeSingletons } from 'kernel/runtime-singletons';

export const urlQueryEntry = (function () {
  function process(isHtmlLoad) {
    const xdash = runtimeSingletons.xdash;

    if (!isHtmlLoad) {
      if (xdash.pageLoad) {
        xdash.pageLoad = false;
        let project = findGetParameter('project');
        if (project == null) {
          let projectUrl = findGetParameter('projectUrl');
          if (projectUrl == null) {
            let template = findGetParameter('template');
            if (template != null) {
              xdash.readFileFromServer(template, 'template');
            }
          } else {
            xdash.readFileFromUrl('project', projectUrl);
          }
        } else {
          xdash.readFileFromServer(project, 'project');
        }
      }
    }
  }

  return {
    process,
  };
})();
