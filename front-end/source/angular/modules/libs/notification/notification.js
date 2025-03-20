import _ from 'lodash';
import PNotify from 'pnotify';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

import warningIcon from '../../../../assets/img/flat-icon/warning.png';
import successIcon from '../../../../assets/img/flat-icon/success.png';
import errorIcon from '../../../../assets/img/flat-icon/error.png';
import infoCustomIcon from '../../../../assets/img/flat-icon/info-custom.png';
import infoIcon from '../../../../assets/img/flat-icon/info.png';

export function XdashNotifications() {
  var $body = angular.element(document.body);
  var $rootScope = $body.scope().$root;
  $rootScope.PnotifyStatus = false;
  var enablePnotify = true;

  function Pnotify(notificationObject) {
    if ($rootScope.navBarNotification == false) {
      enablePnotify = false;
    }
    if (enablePnotify) {
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
  }

  const self = {
    addNotification: function (notificationObject, pnotify) {
      if (notificationObject.title && notificationObject.text && notificationObject.type) {
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
    },
    manageNotification: function (notifType, dsSettingsName, msg, lastNotif) {
      var kind = 'dataNode';
      var type = '';
      var title = '';
      var img = '';
      var bNotify = true;

      switch (notifType) {
        case 'warning': {
          type = 'warning';
          title = 'Warning';
          img = warningIcon;
          break;
        }
        case 'success': {
          type = 'success';
          title = 'Success';
          img = successIcon;
          break;
        }
        case 'error': {
          type = 'error';
          title = 'Error';
          img = errorIcon;
          break;
        }
        case 'info': {
          type = 'info';
          title = 'Info';
          img = infoCustomIcon;
          break;
        }
        default: {
          type = 'info';
          title = 'Info';
          img = infoIcon;
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
            lastNotificationType = datanodesManager.getDataNodeByName(dsSettingsName).__notifications[0].type;
          }
          if (
            lastNotificationType === 'error' ||
            lastNotificationType === 'warning' ||
            lastNotificationType === 'info'
          ) {
            bNotify = true;
          }
        }

        if (bNotify) {
          datanodesManager.getDataNodeByName(dsSettingsName).__notifications.unshift({
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
          self.addNotification(
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
      } else {
        console.log('notification is not possible before dataNode creation.');
      }
    },
    clearAllNotifications: function () {
      $rootScope.listNotifications = [];
      $rootScope.nbNotifications = 0;
      $rootScope.safeApply();
    },
  };
  return self;
}
