// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ main-common                                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// AEF: issue#304
// disableSchedulerLog is defined in env to disable scheduler log in public xdash. true by default
// offSchedLogUser is defined in xprjson to disable/enable scheduler log. To be used by developer and intern user expert.
// Only active when disableSchedulerLog is false

export const offSchedLogUser = { value: true }; //AEF: can be set to xDashConfig.disableSchedulerLog by default.

export const tabPlayLoadedEvt = new Event('play-tab-loaded');

/* MBG refactored from xdash-main.js because needed by runtime */
// For todays date;
Date.prototype.today = function () {
  return (
    (this.getDate() < 10 ? '0' : '') +
    this.getDate() +
    '/' +
    (this.getMonth() + 1 < 10 ? '0' : '') +
    (this.getMonth() + 1) +
    '/' +
    this.getFullYear()
  );
};

// For the time now
Date.prototype.timeNow = function () {
  return (
    (this.getHours() < 10 ? '0' : '') +
    this.getHours() +
    ':' +
    (this.getMinutes() < 10 ? '0' : '') +
    this.getMinutes() +
    ':' +
    (this.getSeconds() < 10 ? '0' : '') +
    this.getSeconds() +
    ':' +
    this.getMilliseconds()
  );
};

function _isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

export const isTouchDevice = _isTouchDevice();

/**
 * Sets the dirty flag in context when call can be from editor or runtime
 * Dirty flag only applies in runtime context
 * */
export function setDirtyFlagSafe(bDirty) {
  try {
    const $rootScope = angular.element(document.body).scope().$root;
    if (!window.dashboardConfig?.execOutsideEditor) {
      $rootScope.updateFlagDirty(bDirty);
    }
  } catch (ex) {
    // handling very old pages
    // FIXME
  }
}

window.mobileAndTabletCheck = (function () {
  // Cached result for performance
  let cachedResult = null;

  return function () {
    if (cachedResult !== null) {
      return cachedResult;
    }

    // Use User-Agent Client Hints if available (e.g. Chrome on Android)
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
      cachedResult = navigator.userAgentData.mobile;
      return cachedResult;
    }

    // Fallback: use the userAgent string
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    cachedResult = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    return cachedResult;
  };
})();
