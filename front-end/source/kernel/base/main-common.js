﻿// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ main-common                                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// AEF: issue#304
// disableSchedulerLog is defined in env to disable scheduler log in public xdash. true by default
// offSchedLogUser is defined in xprjson to disable/enable scheduler log. To be used by developer and intern user expert.
// Only active when disableSchedulerLog is false
var offSchedLogUser = true; //AEF: can be set to xDashConfig.disableSchedulerLog by default.

var ratioScroll = 0;
// Models
var models = {};
// Hidden parameters
modelsHiddenParams = {};
// Temporary parameters not to be serialized
modelsTempParams = {};
// Default parameters
modelsParameters = {};
// Default dimensions
modelsLayout = {};

try {
  // MBG for IE11
  var tabWidgetsLoadedEvt = new Event('widgets-tab-loaded');
  var tabPlayLoadedEvt = new Event('play-tab-loaded');
} catch (exc) {}

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

var bFirstExec = true;

// MBG detecting Android for handling issue #93
var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf('android') > -1; //&& ua.indexOf("mobile");

function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

var isTouchDevice = isTouchDevice();

function activeTab() {
  tabActive = 'widgets';
  setEditPlaySwitchDisableStatus(false);
  if (modeActive == 'no-dashboard') {
    bRescaleNeededForModeSwitch = true;
    showEditMode(true, function () {});
  } else {
    console.log('tabActive=' + tabActive + '. modeActive=' + modeActive);
  }
}

/*--------On resize event--------*/
$(function () {
  $(window).on('resize', function () {
    var $body = angular.element(document.body);
    var $rootScope = $body.scope().$root;
    if (tabActive == 'play') {
      if (!(isAndroid || isTouchDevice)) {
        widgetPreview.resizeDashboard();
      }
    } else if (!$rootScope.moduleOpened) {
      if (tabActive == 'widgets') {
        if (modeActive == 'edit-dashboard') {
          widgetEditor.resizeDashboard();
          gridMgr.updateGrid();
        } else if (modeActive == 'play-dashboard') {
          widgetPreview.resizeDashboard();
        }
      }
    }
  });
  if (!(isAndroid || isTouchDevice)) {
    $(window).on('orientationchange', function () {
      if (tabActive == 'play') {
        widgetPreview.resizeDashboard();
      }
    });
  }
});

/*--------Rescale Widget--------*/
function rescaleWidget(widget, instanceId) {
  widget[instanceId].rescale();
}

/**
 * Sets the dirty flag in context when call can be from editor or runtime
 * Dirty flag only applies in runtime context
 * */
function setDirtyFlagSafe(bDirty) {
  try {
    if (typeof execOutsideEditor != 'undefined') {
      if (!execOutsideEditor) {
        var $body = angular.element(document.body); // 1
        var $rootScope = $body.scope().$root;
        $rootScope.updateFlagDirty(bDirty);
      }
    } else {
      var $body = angular.element(document.body); // 1
      var $rootScope = $body.scope().$root;
      $rootScope.updateFlagDirty(bDirty);
    }
  } catch (ex) {
    // handling very old pages
  }
}

/*--------mobileAndTabletCheck Media--------*/
window.mobileAndTabletCheck = function () {
  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent || navigator.vendor || window.opera);
  return check;
};
