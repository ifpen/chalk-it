﻿// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ urlQueryEntry                                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { findGetParameter } from 'kernel/datanodes/plugins/thirdparty/utils';
import { singletons } from 'kernel/runtime/xdash-runtime-main';

export const urlQueryEntry = (function () {
  function process(isHtmlLoad) {
    const xdash = singletons.xdash;

    if (!isHtmlLoad) {
      if (xdash.pageLoad) {
        xdash.pageLoad = false;
        let project = findGetParameter('project');
        if (project == null) {
          let projectUrl = findGetParameter('projectUrl');
          if (projectUrl == null) {
            let template = findGetParameter('template');
            if (template != null) {
              //cleanupUrl("template", template);
              xdash.readFileFromServer(template, 'template');
            }
          } else {
            //cleanupUrl("project", projectUrl);
            xdash.readFileFromUrl('project', projectUrl);
          }
        } else {
          //cleanupUrl("project", project)
          xdash.readFileFromServer(project, 'project');
        }
      }
    }
  }

  // Not working
  function cleanupUrl(command, value) {
    let currentUrl = window.location.href;
    let newState = currentUrl.replace('?' + command + '=' + value, '');
    newState = newState.replace('&' + command + '=' + value, '');

    window.history.replaceState(null, null, newState);
  }

  return {
    process,
  };
})();
