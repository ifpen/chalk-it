// ┌────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ editPlaySwitchService                                                              │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                        │ \\
// | Licensed under the Apache License, Version 2.0                                     │ \\
// ├────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mondher AJIMI                                   │ \\
// └────────────────────────────────────────────────────────────────────────────────────┘ \\
import { editorSingletons } from 'kernel/editor-singletons';
import { dashState } from 'angular/modules/dashboard/dashboard';
import { showPlayMode, showEditMode, bRescaleNeededForModeSwitch } from './edit-play-switch';

angular.module('modules.dashboard').service('EditPlaySwitchService', [
  '$rootScope',
  function ($rootScope) {
    const self = this;

    /*---------- Switch button    ----------------*/
    self.onEditPlaySwitch = function () {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

      $rootScope.bIsPlayMode = !scopeDash.editorView.checkboxModelView;
      if (dashState.tabActive !== 'widgets') return;
      if (!$rootScope.bIsPlayMode) {
        showEditMode(bRescaleNeededForModeSwitch.value);
      } else {
        showPlayMode(bRescaleNeededForModeSwitch.value);
      }
      editorSingletons.layoutMgr.updateDashBgColor(); // GHI issue #228
    };
  },
]);
