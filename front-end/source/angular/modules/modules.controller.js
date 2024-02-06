// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ modules.controller                                                               │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ameur HAMDOUNI, Abir EL FEKI                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\
import angular from 'angular';
import swal from 'sweetalert';
import FreeboardUI from 'kernel/base/gui/FreeboardUI';
import { startXdash, singletons } from 'kernel/runtime/xdash-runtime-main';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

angular.module('modules').controller('ModulesController', [
  '$scope',
  '$rootScope',
  '$state',
  '_settings',
  'ManagePageSharingService',
  'ManageDatanodeService',
  function ($scope, $rootScope, $state, _settings, ManagePgSharingService, ManageDatanodeService) {
    $rootScope.allSettings = _settings;

    //AEF TMP CHANGE FOR SETTINGS
    if ($rootScope.allSettings.length == 0) {
      $rootScope.allSettings = {
        info: {},
        settings: {},
        profile: { userName: 'Guest', Id: '-1' },
        help: { isDiscoverDone: false, displayHelp: true },
      };
    }

    $scope.displayedShowIndex = 0; //AEF: toggle window of dataNode result
    $rootScope.displayedNavIndex = -1; //AEF: toggle window of dataNode actions

    $rootScope.mySelectedPrj = {};

    $rootScope.readOnly = false;
    $rootScope.isPageExist = false;
    $rootScope.securedLink = 'False';

    $rootScope.infoPage = {
      isPrivatePage: false,
      isManagePageOpen: false,
      name: '',
      title: '',
      btnTxt: 'Save',
      exportPage: true,
    };

    $rootScope.info = {
      origin: 'create',
    };

    $rootScope.sharedUserEmail = {
      selected: undefined,
      typed: '',
      fileName: '',
      fileType: 'xprjson',
    };

    $rootScope.moduleOpened = false;

    $rootScope.selectedTags = [];
    $rootScope.categories = {
      tags: $rootScope.listAvailablesTags,
    };

    $rootScope.getAvailableState = function () {
      if ($rootScope.xDashFullVersion) {
        $rootScope.toggleMenuOptionDisplay('recent');
        $state.go('modules.cards.layout', { action: 'recent' });
      } else {
        $rootScope.toggleMenuOptionDisplay('discover');
        $state.go('modules.discover.layout');
      }
    };

    //AEF: toggle window of dataNode actions
    $scope.toggleDataNavDisplay = function (index) {
      if (index == $rootScope.displayedNavIndex) $rootScope.displayedNavIndex = -1;
      else $rootScope.displayedNavIndex = index;
    };

    $rootScope.moduleOpenedFunction = function (toEditor) {
      if (toEditor) {
        if ($rootScope.currentProject.name !== '') {
          $rootScope.moduleOpened = false;
          //AEF
          $rootScope.origin = 'backToEditor';
          $rootScope.toggleMenuOptionDisplay('none');
          //
          $state.go('modules', {});

          let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
          scopeDashDn.searchDatanodeByName = '';
          ManageDatanodeService.applyDatanodeFilter();

          if ($rootScope.xDashFullVersion) {
            ManagePgSharingService.verifyPageExistence($rootScope.currentProject.name);
          }
        }
      } else {
        if ($rootScope.currentPrjDirty === '') {
          $rootScope.getAvailableState();
        } else {
          swal(
            {
              title: 'Do you want to save your last changes?',
              text: '',
              type: 'warning',
              showCancelButton: true,
              showConfirmButton: false,
              showConfirmButton1: true,
              confirmButtonText: 'Yes',
              cancelButtonText: 'No',
              closeOnConfirm: true,
              closeOnConfirm1: true,
              closeOnCancel: true,
            },
            function (isConfirm) {
              if (isConfirm) {
                let name = $rootScope.currentProject.name;
                fileManager.getFileListExtended('project', name, null, undefined, true);
              }
              $rootScope.getAvailableState();
            }
          );
        }
      }
    };

    //AEF
    $rootScope.displayedId = 'none';
    $rootScope.toggleMenuOptionDisplay = function (id) {
      $rootScope.isSharePrjOpen = false;
      if (id == $rootScope.displayedId) $rootScope.displayedId = 'none';
      else $rootScope.displayedId = id;
    };
    //

    $rootScope.updateFlagDirty = function (state) {
      if (state) {
        $('.tab--active').addClass('changed');
        $rootScope.currentPrjDirty = ' *';
      } else {
        $('.tab--active').removeClass('changed');
        $rootScope.currentPrjDirty = '';
      }
    };

    const freeboardUIInst = new FreeboardUI();
    $rootScope.loadedTemplate = function () {
      setTimeout(()=>{
        startXdash();

        // End fix by Ghiles
        $rootScope.availableTags = $rootScope.listAvailablesTags;
        datanodesManager.initialize(false);
        $rootScope.currentProject = singletons.xdash.initMeta();
        $rootScope.alldatanodes = datanodesManager.getAllDataNodes();
        if (!$rootScope.xDashFullVersion && $rootScope.isDiscoverDone && !$rootScope.isTemplateOpen) {
          const sidebarController = angular.element(document.getElementById('sidebar-ctrl')).scope();
          sidebarController.newProject();
        }
        freeboardUIInst.showLoadingIndicator(false);
      }, 0);

    };
    window.loadedTemplate = $rootScope.loadedTemplate;

    $scope.$watch(
      function () {
        return $state.$current.name;
      },
      function (newVal, oldVal) {
        //do something with values
      }
    );

    if ($rootScope.origin === 'reload') {
      $rootScope.origin = 'reloaded';
      $rootScope.toggleMenuOptionDisplay('recent');
      $state.go('modules.cards.layout', { action: 'recent' });
    }
  },
]);
