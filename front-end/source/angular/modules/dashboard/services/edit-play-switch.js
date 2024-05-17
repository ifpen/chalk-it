import _ from 'lodash';

import { gridMgr } from 'kernel/dashboard/edition/grid-mgr';
import { dashState } from 'angular/modules/dashboard/dashboard';
import { bFirstExec, tabWidgetsLoadedEvt, tabPlayLoadedEvt } from 'kernel/base/main-common';
import { getMedia } from 'kernel/dashboard/scaling/scaling-utils';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { runtimeSingletons } from 'kernel/runtime-singletons';
import { editorSingletons } from 'kernel/editor-singletons';

// FIXME
export const bRescaleNeededForModeSwitch = { value: false };
let currentDashboardScrollTop = 0;

export function showEditMode(bDoRescale, successCallback) {
  if (dashState.tabActive == 'widgets') {
    if (dashState.modeActive != 'edit-dashboard') {
      if (dashState.modeActive == 'play-dashboard') {
        currentDashboardScrollTop = $('#DropperDroitec').scrollTop();
      }
      $('#dashboard-preview-div').hide(0, function () {
        $('#dashboard-editor-div').show(0, function () {
          $('#dashboard-editor-div').removeClass('ng-hide');
          switchToEditMode(bDoRescale, successCallback);
          setIsPlayModeStatus(false);
        });
      });
    } else {
      switchToEditMode(bDoRescale, successCallback);
    }
  } else {
    console.log('showEditMode called while tabActive=' + dashState.tabActive);
  }
}

export function showPlayMode(bDoRescale) {
  switchToPlayMode(bDoRescale);
}

function switchToEditMode(bDoRescale, successCallback) {
  const widgetEditor = editorSingletons.widgetEditor;
  if (bFirstExec.value) {
    const val = getMedia();
    widgetEditor.setLastMedia(val);
  }
  if (bDoRescale) {
    widgetEditor.resizeDashboard();
  }
  gridMgr.updateGrid();
  // reset icons state because no widget is selected
  document.dispatchEvent(tabWidgetsLoadedEvt);
  if (bFirstExec.value) {
    bFirstExec.value = false;
    widgetEditor.computeDropperMaxWidth();
  }
  dashState.modeActive = 'edit-dashboard';
  if (!_.isUndefined(successCallback)) successCallback();

  $('#DropperDroite').scrollTop(currentDashboardScrollTop);
}

function switchToPlayMode() {
  const layoutMgr = editorSingletons.layoutMgr;
  const widgetEditor = editorSingletons.widgetEditor;
  let xprjson = {};
  if (dashState.modeActive == 'edit-dashboard') {
    widgetEditor.updateSnapshotDashZoneDims();
    xprjson = runtimeSingletons.xdash.serialize();
    currentDashboardScrollTop = $('#DropperDroite').scrollTop();
    widgetPreview.setScalingInformation(
      null,
      widgetEditor.getCurrentDashZoneDims().scalingMethod,
      layoutMgr.getRows(),
      layoutMgr.getCols()
    );
    widgetEditor.unselectAllWidgets(); // disable selection of last used widgets
  } else {
    console.log('bad modeActive : ' + dashState.modeActive + '. Unable to switch to Play mode');
    return;
  }
  $('#dashboard-editor-div').hide(0, function () {
    $('#dashboard-preview-div').show(0, function () {
      $('#dashboard-preview-div').removeClass('ng-hide'); // seems to be needed for correct maps rendering : bizarre ??
      try {
        widgetPreview.loadPlayMode(xprjson);
      } catch (e) {
        console.log(e);
      }
      editorSingletons.layoutMgr.makeColsTrasparent();
      dashState.modeActive = 'play-dashboard';
      setIsPlayModeStatus(true);
      $('#DropperDroitec').scrollTop(currentDashboardScrollTop);
      document.dispatchEvent(tabPlayLoadedEvt); // for some widgets (like Leaflet)
    });
  });
}

function setIsPlayModeStatus(bStatus) {
  const $rootScope = angular.element(document.body).scope().$root;
  if ($rootScope.bIsPlayMode != bStatus) {
    $rootScope.bIsPlayMode = bStatus;
    $rootScope.$apply();
  }
}

function setEditPlaySwitchDisableStatus(bStatus) {
  const $rootScope = angular.element(document.body).scope().$root;
  if ($rootScope.bDisableEditPlaySwitch != bStatus) {
    $rootScope.bDisableEditPlaySwitch = bStatus;
    $rootScope.$apply();
  }
}
