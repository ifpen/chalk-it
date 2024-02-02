// ┌──────────────────────────────────────────────────────────┐ \\
// │ widgetDefaultLayoutClass                                 │ \\
// ├──────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2020-2023 IFPEN                              │ \\
// | Licensed under the Apache License, Version 2.0           │ \\
// ├──────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID                      │ \\
// └──────────────────────────────────────────────────────────┘ \\

function widgetDefaultLayoutClass() {
  var _widgetDefaultLayout = {
    left: '0vw',
    top: '0vh',
    height: '5vh',
    width: '10vw',
    minWidth: '20px',
    minHeight: '20px',
  };

  this.get = function () {
    return jQuery.extend(true, {}, _widgetDefaultLayout);
  };
}

export const widgetDefaultLayout = new widgetDefaultLayoutClass();
