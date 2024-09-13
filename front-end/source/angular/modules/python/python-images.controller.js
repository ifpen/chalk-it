// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ PythonImagesListControler                                                        │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Tristan BARTEMENT                                           │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import template from 'angular/modules/python/python-images.html';
import { formatDataSize } from 'kernel/datanodes/plugins/thirdparty/utils';

angular
  .module('modules.python-images')
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('modules.python-images.list', {
        userNotAuthenticated: true,
        userAuthenticated: false,
        url: '/',
        template,
        controller: 'PythonImagesListControler',
        resolve: {
          _images: [
            'PythonImagesManager',
            '$rootScope',
            function (PythonImagesManager, $rootScope) {
              return PythonImagesManager.getImages($rootScope.UserProfile.userId);
            },
          ],
        },
        params: {
          action: null,
        },
      });
    },
  ])

  .controller('PythonImagesListControler', [
    '$scope',
    '$state',
    'PythonImagesManager',
    '_images',
    function ($scope, $state, PythonImagesManager, _images) {
      $scope.images = _images;
      $scope.states = {};
      $scope.uploads = {};

      const POLLING_DELAY = 5000;

      function setProgress(id, value) {
        $scope.uploads[id] = value === -1 ? -1 : value * 100;
        if (value != 0) $scope.$apply();
      }

      $scope.applyImgEditor = function () {
        let image = $scope.editImg; //at update
        let imageOld = $scope.img; //at update
        if (_.isUndefined(image))
          // at creation
          image = $scope.img;

        var fileInfo = $scope.fileInfo;
        if (!PythonImagesManager.checkImageValidity(image, fileInfo)) {
          return true;
        }
        $scope.openedImgEditor = false;
        $('#editForm').html('');
        if ($scope.imgEditorBtn == 'Create') {
          PythonImagesManager.createImage($scope.img, $scope.fileInfo, (p) => setProgress($scope.img.Id, p)).finally(
            () => {
              delete $scope.uploads[$scope.img.Id];
              $scope.$apply();
            }
          );
          $scope.images.push($scope.img);
        } else if ($scope.imgEditorBtn == 'Update') {
          PythonImagesManager.updateImage(image, imageOld, fileInfo, (p) => setProgress(image.Id, p)).finally(() => {
            delete $scope.uploads[image.Id];
            $scope.$apply();
          });
          $scope.images = $scope.images.map((i) => (i.Id === image.Id ? image : i));
        }
      };

      $scope.closeImgEditor = function () {
        $scope.openedImgEditor = false;
        $scope.userAvatar.text = '';
        $('#editForm').html('');
      };

      $scope.newImage = () => {
        $scope.imgEditorBtn = 'Create';
        $scope.imgEditorTitle = 'New python image';
        $scope.openedImgEditor = true;
        [$scope.img, $scope.fileInfo] = PythonImagesManager.openNewImageDialog();
      };

      $scope.editImage = (image) => {
        $scope.imgEditorBtn = 'Update';
        $scope.imgEditorTitle = 'Edit python image';
        $scope.openedImgEditor = true;
        [$scope.editImg, $scope.fileInfo] = PythonImagesManager.openEditImageDialog(image);
        $scope.img = image;
      };

      $scope.removeImage = (image) => {
        swal(
          {
            title: 'Are you sure?',
            text: 'You will delete definitely your python image!',
            type: 'warning',
            showCancelButton: true,
            showConfirmButton: false,
            showConfirmButton1: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Abandon',
            closeOnConfirm1: true,
            closeOnCancel: true,
          },
          function (isConfirm) {
            if (isConfirm) {
              PythonImagesManager.deleteImage(image);
              $scope.images = $scope.images.filter((i) => i.Id !== image.Id);
            }
          }
        );
      };

      $scope.showBuildOutput = async (image) => {
        PythonImagesManager.openOutputDialog(image.Id);
      };

      $scope.buildImage = async (image) => {
        const result = await PythonImagesManager.buildImage(image);
        $scope.states[image.Id] = {
          status: result.status,
          hash: result.hash,
        };

        if (image.Hash !== result.hash) {
          image.Hash = result.hash;
          PythonImagesManager.updateImage(image);
        }
        PythonImagesManager.updateImage(image);

        if (result.status === 'building') {
          const id = image.Id;
          const updateFct = async () => {
            const statuses = await PythonImagesManager.getImagesStatus([id]);
            if (statuses.length === 1) {
              const status = statuses[0].status;
              const size = statuses[0].size;
              const state = $scope.states[id];
              if (state.status !== status || state.size !== size) {
                state.status = status;
                state.size = size;
                $scope.$apply();
              }
              if (status === 'building') {
                setTimeout(updateFct, POLLING_DELAY);
              }
            }
          };
          setTimeout(updateFct, POLLING_DELAY);
        }
      };

      $scope.getSize = (image) => {
        if ($scope.states.hasOwnProperty(image.Id)) {
          const state = $scope.states[image.Id];
          return formatDataSize(state.size);
        } else {
          return undefined;
        }
      };

      $scope.getStatus = (image) => {
        if ($scope.states.hasOwnProperty(image.Id)) {
          const state = $scope.states[image.Id];
          if (state.status === 'building') {
            return 'Building';
          } else if (state.status === 'ready') {
            return state.hash === image.Hash ? 'Ready' : 'Outdated';
          } else if (state.status === 'error') {
            return 'Build failed';
          } else if (state.status === 'deleted') {
            return 'Deleting...';
          } else {
            return 'Unknown';
          }
        } else {
          return 'No image';
        }
      };

      $scope.errorValues = ['Build failed', 'Unknown', 'No image', 'Outdated'];
      $scope.pendingValues = ['Building', 'Deleting...'];

      $scope.showBuildButton = (image) => {
        if (!image.Hash) {
          return true;
        }
        if (!$scope.states.hasOwnProperty(image.Id)) {
          return true;
        }

        const state = $scope.states[image.Id];
        return state.status === 'error' || state.hash !== image.Hash;
      };

      $scope.showOutputButton = (image) => {
        if ($scope.states.hasOwnProperty(image.Id)) {
          const state = $scope.states[image.Id];
          return state.status === 'building' || state.status === 'ready' || state.status === 'error';
        }
        return false;
      };

      $scope.refreshStates = async () => {
        const result = {};
        const statuses = await PythonImagesManager.getImagesStatus($scope.images.map((image) => image.Id));
        statuses.forEach((s) => {
          result[s.id] = s;
        });

        $scope.states = result;
      };

      $scope.refreshStates();

      if ($state.params.action === 'create') {
        $scope.newImage();
      }
    },
  ]);
