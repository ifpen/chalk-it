// ┌────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ modules.notifications                                                              │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                                        │ \\
// | Licensed under the Apache License, Version 2.0                                     │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                             │ \\
// └────────────────────────────────────────────────────────────────────────────────────┘ \\

const DEFAULT_DELAY = 8000;
const DEFAULT_TYPE = 'info';

/**
 * Displays ephemeral notification messages on the page
 */
class UiNotifications {
  static TYPE_NOTICE = 'notice';
  static TYPE_INFO = 'info';
  static TYPE_SUCCESS = 'success';
  static TYPE_ERROR = 'error';

  /**
   * Displays a notification
   *
   * @param {string} title title of the notification
   * @param {string} text content of the notification
   * @param {('notice'|'info'|'success'|'error')} type one of {@link TYPE_NOTICE}, {@link TYPE_INFO}, {@link TYPE_SUCCESS} or {@link TYPE_ERROR}
   * @param {number} delay how long the message will be displayed in milliseconds
   * @param {*} dismissable if true, message can be dismissed with a click
   */
  notifyMessage(title, text, type = DEFAULT_TYPE, delay = DEFAULT_DELAY, dismissable = true) {
    this.notify({ title, text, type, delay }, dismissable);
  }

  /**
   * Low level PNotify access. Can be used to pass additional options to PNotify. {@link notifyMessage} should be prefered in most situations.
   *
   * @param {Object} notification PNotify configuration object.
   * @param {boolean} dismissable if true, message can be dismissed with a click
   */
  notify(notification, dismissable = true) {
    new PNotify({
      type: DEFAULT_TYPE,
      delay: DEFAULT_DELAY,
      styling: 'bootstrap3',
      ...notification,
    });

    if (dismissable) {
      // TODO operates on all current notifications
      $('.ui-pnotify-container').on('click', () => notice.remove());
    }
  }
}

angular.module('modules.dashboard').service('UiNotifications', [UiNotifications]);
