import { Xdash } from 'kernel/base/xdash-main';
import { XdashNotifications } from 'angular/modules/libs/notification/notification';
import { onResize, onOrientationChange, isAndroid, isTouchDevice } from 'kernel/base/main-common';

export const runtimeSingletons = {
  xdash: null,
  xdashNotifications: null,
};

export function initXdashRuntime() {
  /*--------On resize event--------*/
  $(window).on('resize', onResize);
  if (!(isAndroid || isTouchDevice)) {
    $(window).on('orientationchange', onOrientationChange);
  }

  runtimeSingletons.xdash = new Xdash();
  runtimeSingletons.xdashNotifications = new XdashNotifications(); // edit ?
}
