// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ info_project.controller                                                          │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                                │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'underscore';
import swal from 'sweetalert';
import { modalsModule } from './modals';
import { fileManager } from 'kernel/general/backend/file-management';
import { FileMngrFct } from 'kernel/general/backend/FileMngr';

modalsModule.controller('InfoProjectController', [
  '$scope',
  '$rootScope',
  '$state',
  function ($scope, $rootScope, $state) {
    $scope.notificationFilerValue = 'all';

    /*---------- load Tags List ----------------*/
    $scope.loadTagsList = function (query) {
      const list = [];
      $rootScope.userList.every(isIncluded);

      function isIncluded(el) {
        if (el.includes(query.toLowerCase())) {
          list.push(el);
          return el;
        } else {
          return -1;
        }
      }
      return list;
    };

    /*---------- Save info project at creation and in editor ----------------*/
    $scope.saveInfoProject = function (name) {
      if ($rootScope.info.origin == 'create') {
        _saveInfoProjectAtCreation(name);
      } else if ($rootScope.info.origin == 'editor') {
        _saveInfoProjectEditor();
      } else if ($rootScope.info.origin == 'cards' || $rootScope.info.origin == 'template') {
        _saveInfoProjectCards(name);
      }
    };

    function _saveInfoProjectAtCreation(name) {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

      let later = false;
      let is_defaultOverwrite = false;
      scopeDash.projectFormSubmitted = true;
      if ($scope.form.projectForm2.$valid) {
        scopeDash.projectFormSubmitted = false;
      } else {
        scopeDash.projectFormSubmitted = true;
      }
      // do it later button
      if ((_.isUndefined(name) || name == '') && scopeDash.info.checkboxModelLater) {
        name = 'Untitled';
        later = true;
        is_defaultOverwrite = true;
      }
      //
      if (!scopeDash.projectFormSubmitted || later) {
        $rootScope.currentProject = angular.copy($rootScope.currentInfoProject);

        $rootScope.currentProject.name = name; //important here for Untitled
        $('#projectName')[0].value = $rootScope.xDashFullVersion
          ? $rootScope.currentInfoProject.name
          : $rootScope.currentProject.name;

        if ($rootScope.xDashFullVersion) {
          fileManager.getFileListExtended('project', name, undefined, undefined, is_defaultOverwrite);
        }

        scopeDash.info.openProjectInfo = false; // reset display info
        scopeDash.projectFormSubmitted = false; // reset form
        scopeDash.info.checkboxModelLater = false; // reset checkbox
      }
    }

    function _saveInfoProjectEditor() {
      const scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();

      if ($rootScope.xDashFullVersion && scopeDash.info.pastName != $rootScope.currentInfoProject.name) {
        //name is disabled so security no needed anymore
        alert('name changed ' + scopeDash.info.pastName + ' <--' + $rootScope.currentInfoProject.name);
        $rootScope.currentInfoProject.name = scopeDash.info.pastName;
      }

      scopeDash.info.openProjectInfo = false; // reset display info
      scopeDash.projectFormSubmitted = false; // reset form
      scopeDash.info.checkboxModelLater = false; // reset checkbox*
      if ($scope.form.projectForm2.$dirty) {
        $rootScope.currentProject = angular.copy($rootScope.currentInfoProject);
        $rootScope.updateFlagDirty(true);
      }
    }

    function _saveInfoProjectCards(name) {
      let scopeCards = angular.element(document.getElementById('cards-ctrl')).scope();

      if (scopeCards.info.pastName != $rootScope.currentInfoProject.name) {
        //name is disabled so security no needed anymore
        alert('name changed ' + scopeCards.info.pastName + ' <--' + $rootScope.currentInfoProject.name);
        $rootScope.currentInfoProject.name = scopeCards.info.pastName;
      }

      scopeCards.projectFormSubmitted = true;
      if ($scope.form.projectForm1.$valid) {
        scopeCards.projectFormSubmitted = false;
      } else {
        scopeCards.projectFormSubmitted = true;
      }
      if (!scopeCards.projectFormSubmitted) {
        if ($scope.form.projectForm1.$dirty) {
          if ($rootScope.currentProject.name === name && $rootScope.currentPrjDirty !== '') {
            swal(
              {
                title: 'Are you sure?',
                text: 'Your current project will be saved first.',
                type: 'warning',
                showCancelButton: true,
                showConfirmButton: false,
                showConfirmButton1: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'Abandon',
                closeOnConfirm: true,
                closeOnConfirm1: true,
                closeOnCancel: true,
              },
              function (isConfirm) {
                if (isConfirm) {
                  const endAction = function () {
                    getDataProject(name, scopeCards.fileType, _updateMetaProject);
                  };
                  //save current project
                  fileManager.getFileListExtended('project', name, undefined, endAction, true);
                } else {
                  //nothing
                }
              }
            );
          } else {
            getDataProject(name, scopeCards.fileType, _updateMetaProject);
          }
        } else {
          scopeCards.info.openProjectInfo = false; // reset display info
          scopeCards.projectFormSubmitted = false; // reset form
          $rootScope.updateView();
        }
      }
    }

    function _updateMetaProject(name, msg) {
      const endAction = function () {
        if ($rootScope.currentProject.name === name) {
          $rootScope.currentProject = angular.copy($rootScope.currentInfoProject);
        } else {
          //close project after meta update and only if not already opened in edition
          const FileMngrInst = new FileMngrFct();
          FileMngrInst.Close('project', $rootScope.currentInfoProject.name, function (msg1, msg2, type) {
            if (type == 'error') {
              swal(msg1, msg2, type);
            }
          });
        }

        $scope.info.openProjectInfo = false; // reset display info
        $scope.projectFormSubmitted = false; // reset form
        $rootScope.updateView();
      };
      let data = JSON.parse(msg);
      data.meta.name = $rootScope.currentInfoProject.name;
      data.meta.description = $rootScope.currentInfoProject.description;
      data.meta.groupName = $rootScope.currentInfoProject.groupName;
      let temp = $rootScope.currentInfoProject.tags;
      data.meta.tags = temp.filter((tag) => tag.text != 'SHaReD');

      let newData = JSON.stringify(data);
      let is_defaultOverwrite = true;
      fileManager.getFileListExtended('project', name, newData, endAction, is_defaultOverwrite);
    }

    /*---------- Cancel info project ----------------*/
    $scope.cancelInfoProject = function () {
      let scopeDash = angular.element(document.getElementById('dash-ctrl')).scope();
      let scopeCards = angular.element(document.getElementById('cards-ctrl')).scope();

      if ($rootScope.info.origin == 'cards' || $rootScope.info.origin == 'template') {
        scopeCards.info.openProjectInfo = false; //close info window
      } else {
        if ($rootScope.info.origin == 'create') {
          $rootScope.toggleMenuOptionDisplay('cards');
          $state.go('modules.cards.layout', { action: 'myProjects' });
        }
        $rootScope.currentProject = angular.copy(scopeDash.info.tmp);
        scopeDash.info.openProjectInfo = false; // reset display info
        scopeDash.info.checkboxModelLater = false; // reset checkbox
      }
    };
  },
]);
