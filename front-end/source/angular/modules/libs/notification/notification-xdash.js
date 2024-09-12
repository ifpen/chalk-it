// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ notification-xdash                                                 │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import PNotify from 'pnotify';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

export const xdashNotifications = (function () {
  var PnotifyStatus = false;

  var $body = null;
  var $rootScope = null;

  function init() {
    if (!$body || !$rootScope) {
      $body = angular.element(document.body);
      $rootScope = $body.scope().$root;
      $rootScope.pageScalingMethod = 'ajustToTargetWindow';
    }
  }

  function Pnotify(notificationObject) {
    let notice = new PNotify({
      title: notificationObject.title,
      text: notificationObject.text,
      type: notificationObject.type,
      delay: 1800,
      styling: 'bootstrap3',
    });
    $('.ui-pnotify-container').on('click', function () {
      notice.remove();
    });
  }

  return {
    addNotification: function (notificationObject, pnotify) {
      init();
      if (!$rootScope.notificationsDisabled) {
        if (notificationObject.title && notificationObject.text && notificationObject.type) {
          $rootScope.PnotifyStatus = PnotifyStatus;
          $rootScope.listNotifications.unshift(notificationObject);
          $rootScope.nbNotifications++;
          if (!pnotify && !$rootScope.PnotifyStatus) {
            $rootScope.PnotifyStatus = true;
            setTimeout(function () {
              $rootScope.PnotifyStatus = false;
              Pnotify(notificationObject);
            }, 300);
          }
          $rootScope.safeApply();
        }
      }
    },
    manageNotification: function (notifType, dsSettingsName, msg, lastNotif) {
      init();
      if ($rootScope.navBarNotification) {
        var kind = 'dataNode';
        var type = '';
        var title = '';
        var img = '';
        var bNotify = true;

        switch (notifType) {
          case 'warning': {
            type = 'warning';
            title = 'Warning';
            img = 'source/assets/img/flat-icon/warning.png';
            break;
          }
          case 'success': {
            type = 'success';
            title = 'Success';
            img = 'source/assets/img/flat-icon/success.png';
            break;
          }
          case 'error': {
            type = 'error';
            title = 'Error';
            img = 'source/assets/img/flat-icon/error.png';
            break;
          }
          default: {
            type = 'info';
            title = 'Info';
            img = 'source/assets/img/flat-icon/info.png';
            break;
          }
        }

        if (!_.isUndefined(datanodesManager.getDataNodeByName(dsSettingsName))) {
          //AEF: error of parse on formula creation,
          if (_.isUndefined(datanodesManager.getDataNodeByName(dsSettingsName).__notifications)) {
            datanodesManager.getDataNodeByName(dsSettingsName).__notifications = [];
          }

          if (lastNotif) {
            // needed for formula to allow success notification only after error or warning
            bNotify = false;
            var lastNotificationType = 'none';
            if (datanodesManager.getDataNodeByName(dsSettingsName).__notifications.length > 0) {
              lastNotificationType =
                datanodesManager.getDataNodeByName(dsSettingsName).__notifications[
                  datanodesManager.getDataNodeByName(dsSettingsName).__notifications.length - 1
                ].type;
            }
            if (lastNotificationType === 'error' || lastNotificationType === 'warning') {
              bNotify = true;
            }
          }

          if (bNotify) {
            datanodesManager.getDataNodeByName(dsSettingsName).__notifications.push({
              type: type,
              title: title,
              text: msg,
              kind: kind,
              dataNode: dsSettingsName,
              img: img,
              time: new Date().timeNow(),
            });
            var pnotify = false;
            var origin = '';
            if (datanodesManager.getDataNodeByName(dsSettingsName).execInstance() !== null) {
              origin = datanodesManager.getDataNodeByName(dsSettingsName).execInstance().getSchedulerCallOrigin();
            }
            var period = datanodesManager.getDataNodeByName(dsSettingsName).sampleTime();
            if (period < '60' && origin == 'timer') {
              //AEF: popup is displayed starting from period=1min
              pnotify = true;
            }
            xdashNotifications.addNotification(
              {
                type: type,
                title: title,
                text: msg,
                kind: kind,
                dataNode: dsSettingsName,
                img: img,
                time: new Date().timeNow(),
              },
              pnotify
            );
          }
        }
      }
    },
    clearAllNotifications: function () {
      init();
      $rootScope.listNotifications = [];
      $rootScope.nbNotifications = 0;
      $rootScope.safeApply();
    },
  };
})();
