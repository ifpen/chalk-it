// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ editor-events                                                         │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                │ \\
// └───────────────────────────────────────────────────────────────────────┘ \\

window.addEventListener('click', (event) => {
  var $body = angular.element(document.body);
  let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
  var $rootScope = $body.scope().$root;
  var vm = angular.element(document.getElementById('dashboard-editor')).scope().vm;
  var dataListDisplay = angular.element(document.getElementById('dataListDisplay')).scope();
  var isNavOpen_Project = angular.element(document.getElementById('isNavOpen_Project')).scope();
  var isExportOpen_Project = angular.element(document.getElementById('isExportOpen_Project')).scope();
  var isShareOpen_Page = angular.element(document.getElementById('isShareOpen_Page')).scope();
  var isLogoutOpen = angular.element(document.getElementById('isLogoutOpen')).scope();
  var isLogoutOpen_Project = angular.element(document.getElementById('isLogoutOpen_Project')).scope();
  var isDataSortNavOpen = angular.element(document.getElementById('isDataSortNavOpen')).scope();
  if (scopeDash.editorView.newDatanodePanel.view) {
    //AEF: unselect widget only when editing datanodes
    if (event.target.className !== 'widget-overlay') {
      widgetEditor.unselectAllWidgets();
    }
  }

  if (
    event.target.id !== 'showHideWidgetMenu' &&
    event.target.className !== 'introjs-button introjs-nextbutton' &&
    event.target.className !== 'introjs-button introjs-prevbutton' &&
    event.target.className !== 'introjs-showElement'
  ) {
    if (vm.menuWidgetVisible) {
      vm.menuWidgetVisible = false;
      $rootScope.safeApply();
    }
  }

  if (event.target.id !== 'isExportOpen_Project') {
    if (!_.isUndefined(isExportOpen_Project)) {
      if (isExportOpen_Project.isExportOpen === true) {
        isExportOpen_Project.isExportOpen = false;
        $rootScope.safeApply();
      }
    }
  }

  if (event.target.id !== 'isShareOpen_Page') {
    if (!_.isUndefined(isShareOpen_Page)) {
      if (isShareOpen_Page.isShareOpen === true) {
        isShareOpen_Page.isShareOpen = false;
        $rootScope.safeApply();
      }
    }
  }

  if (!_.isNull(event.target.parentElement)) {
    if (event.target.parentElement.id !== 'dataNavDisplay') {
      if ($rootScope.displayedNavIndex >= 0) {
        $rootScope.displayedNavIndex = -1;
        $rootScope.safeApply();
      }
    }
    if (event.target.parentElement.id !== 'dataListDisplay') {
      if (dataListDisplay.isDataListNavOpen === true) {
        dataListDisplay.isDataListNavOpen = false;
        $rootScope.safeApply();
      }
    }

    if (event.target.parentElement.id !== 'isNavOpen_Project') {
      if (isNavOpen_Project.isNavOpen === true) {
        isNavOpen_Project.isNavOpen = false;
        $rootScope.safeApply();
      }
    }

    if (event.target.id !== 'isLogoutOpen' && event.target.parentElement.id !== 'isLogoutOpen') {
      if (!_.isUndefined(isLogoutOpen)) {
        if (isLogoutOpen.isNavOpen === true) {
          isLogoutOpen.isNavOpen = false;
          $rootScope.safeApply();
        }
      }
    }

    if (event.target.id !== 'isLogoutOpen_Project' && event.target.parentElement.id !== 'isLogoutOpen_Project') {
      if (!_.isUndefined(isLogoutOpen_Project)) {
        if (isLogoutOpen_Project.isNavOpen === true) {
          isLogoutOpen_Project.isNavOpen = false;
          $rootScope.safeApply();
        }
      }
    }

    if (event.target.parentElement.id !== 'isDataSortNavOpen') {
      if (isDataSortNavOpen.isDataSortNavOpen === true) {
        isDataSortNavOpen.isDataSortNavOpen = false;
        $rootScope.safeApply();
      }
    }

    if (event.target.id !== 'tagDisplay' && event.target.parentElement.id !== 'tagDisplay') {
      if (!_.isUndefined($rootScope.displayedIndex)) {
        if ($rootScope.displayedIndex >= 0) {
          $rootScope.displayedIndex = -1;
          $rootScope.safeApply();
        }
      }

      if (!_.isUndefined($rootScope.displayedIndexG)) {
        for (let i = 0; i < $rootScope.displayedIndexG.length; i++) {
          if ($rootScope.displayedIndexG[i] >= 0) {
            $rootScope.displayedIndexG[i] = -1;
            $rootScope.displayedIndex = -1;
            $rootScope.safeApply();
          }
        }
      }
    }
  }

  var counter = 0; // MBG lint fix 19/10/2021. AEF : to check please
  if (angular.element(document.getElementById('my-personnal-projects-list')).scope()) {
    if (
      !_.isUndefined(angular.element(document.getElementById('my-personnal-projects-list')).scope().allFilesFiltred[0])
    )
      counter = angular.element(document.getElementById('my-personnal-projects-list')).scope().allFilesFiltred[0]
        .FileList.length;

    for (var i = 0; i < counter; i++) {
      var isNavOpen_Recent_All_Gallery = angular
        .element(document.getElementById('isNavOpen_Recent_All_Gallery' + i))
        .scope();
      if (!_.isUndefined(isNavOpen_Recent_All_Gallery)) {
        if (event.target.parentElement.id !== 'isNavOpen_Recent_All_Gallery' + i) {
          if (isNavOpen_Recent_All_Gallery.isNavOpen === true) {
            isNavOpen_Recent_All_Gallery.isNavOpen = false;
            $rootScope.safeApply();
          }
        }
      }
    }

    let grps = angular.element(document.getElementById('my-personnal-projects-list')).scope().grpFiles;
    for (const prop in grps) {
      if (typeof grps[prop] === 'string') continue;
      let counterG = grps[prop].length;
      for (let i = 0; i < counterG; i++) {
        let isNavOpen_Group = angular.element(document.getElementById('isNavOpen_Group_' + prop + i)).scope();
        if (!_.isUndefined(isNavOpen_Group)) {
          if (event.target.parentElement.id !== 'isNavOpen_Group_' + prop + i) {
            if (isNavOpen_Group.isNavOpen === true) {
              isNavOpen_Group.isNavOpen = false;
              $rootScope.safeApply();
            }
          }
        }
      }
    }
  }
});
