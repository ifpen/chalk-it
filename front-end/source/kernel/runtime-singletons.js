import { Xdash } from 'kernel/base/xdash-main';
import { XdashNotifications } from 'angular/modules/libs/notification/notification';

export const runtimeSingletons = {
  xdash: null,
  xdashNotifications: null,
};

export function initXdashRuntime() {
  runtimeSingletons.xdash = new Xdash();
  runtimeSingletons.xdashNotifications = new XdashNotifications(); // edit ?
}
