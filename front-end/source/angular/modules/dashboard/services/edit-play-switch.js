let bRescaleNeededForModeSwitch = false;
let currentDashboardScrollTop = 0;

function showEditMode(bDoRescale, successCallback) {
  if (tabActive == "widgets") {
    if (modeActive != "edit-dashboard") {
      if (modeActive == "play-dashboard") {
        currentDashboardScrollTop = $("#DropperDroitec").scrollTop();
      }
      $("#dashboard-preview-div").hide(0, function () {
        $("#dashboard-editor-div").show(0, function () {
          $("#dashboard-editor-div").removeClass("ng-hide");
          switchToEditMode(bDoRescale, successCallback);
          setIsPlayModeStatus(false);
        });
      });
    } else {
      switchToEditMode(bDoRescale, successCallback);
    }
  } else {
    console.log("showEditMode called while tabActive=" + tabActive);
  }
}

function showPlayMode(bDoRescale) {
  switchToPlayMode(bDoRescale);
}

function switchToEditMode(bDoRescale, successCallback) {
  if (bFirstExec) {
    const val = getMedia();
    widgetEditor.setLastMedia(val);
  }
  if (bDoRescale) {
    widgetEditor.resizeDashboard();
  }
  gridMgr.updateGrid();
  // reset icons state because no widget is selected
  document.dispatchEvent(tabWidgetsLoadedEvt);
  if (bFirstExec) {
    bFirstExec = false;
    widgetEditor.computeDropperMaxWidth();
  }
  modeActive = "edit-dashboard";
  if (!_.isUndefined(successCallback)) successCallback();

  $("#DropperDroite").scrollTop(currentDashboardScrollTop);
}

function switchToPlayMode() {
  let xprjson = {};
  if (modeActive == "edit-dashboard") {
    widgetEditor.updateSnapshotDashZoneDims();
    xprjson = xdash.serialize();
    currentDashboardScrollTop = $("#DropperDroite").scrollTop();
    widgetPreview.setScalingInformation(
      null,
      widgetEditor.getCurrentDashZoneDims().scalingMethod,
      layoutMgr.getRows(),
      layoutMgr.getCols()
    );
    widgetEditor.unselectAllWidgets(); // disable selection of last used widgets
  } else {
    console.log(
      "bad modeActive : " + modeActive + ". Unable to switch to Play mode"
    );
    return;
  }
  $("#dashboard-editor-div").hide(0, function () {
    $("#dashboard-preview-div").show(0, function () {
      $("#dashboard-preview-div").removeClass("ng-hide"); // seems to be needed for correct maps rendering : bizarre ??
      try {
        widgetPreview.loadPlayMode(xprjson);
      } catch (e) {
        console.log(e);
      }
      layoutMgr.makeColsTrasparent();
      modeActive = "play-dashboard";
      setIsPlayModeStatus(true);
      $("#DropperDroitec").scrollTop(currentDashboardScrollTop);
      document.dispatchEvent(tabPlayLoadedEvt); // for some widgets (like Leaflet)
    });
  });
}

function setIsPlayModeStatus(bStatus) {
  const $rootScope  = angular.element(document.body).scope().$root;
  if ($rootScope.bIsPlayMode != bStatus) {
    $rootScope.bIsPlayMode = bStatus;
    $rootScope.$apply();
  }
}

function setEditPlaySwitchDisableStatus(bStatus) {
  const $rootScope  = angular.element(document.body).scope().$root;
  if ($rootScope.bDisableEditPlaySwitch != bStatus) {
    $rootScope.bDisableEditPlaySwitch = bStatus;
    $rootScope.$apply();
  }
}
