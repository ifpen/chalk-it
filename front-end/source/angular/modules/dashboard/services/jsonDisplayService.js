// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ jsonDisplayService                                                               │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mondher AJIMI                                 │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.dashboard').service('JsonDisplayService', [
  '$rootScope',
  function ($rootScope) {
    const self = this;

    /*---------- json result display ----------------*/
    self.beautifulStringFromHtml = function (data) {
      if (!_.isUndefined(data)) {
        //AEF: Add test
        data._beautifulString = data.beautifulString();
        return data._beautifulString;
      } else {
        return undefined;
      }
    };
  },
]);
