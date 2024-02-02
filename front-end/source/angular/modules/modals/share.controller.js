// ┌───────────────────────────────────────────────────────────────────────────────┐ \\
// │ share.controller                                                              │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                   │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                             │ \\
// └───────────────────────────────────────────────────────────────────────────────┘ \\
import { FileMngrFct } from 'kernel/general/backend/FileMngr';
import swal from 'sweetalert';
import { modalsModule } from './modals';

modalsModule.controller('ShareController', [
  '$scope',
  '$rootScope',
  function ($scope, $rootScope) {
    /*----------  Close btn ----------------*/
    $scope.resetShareLink = function () {
      let scopeDash = angular.element(document.getElementById('cards-ctrl')).scope();

      scopeDash.showShareLink = false;
      $scope.publicHtmlLink = '';
    };
    $scope.resetShareLink();

    /*----------  CopyUrl btn ----------------*/
    $scope.copyURLtoClipboard = function () {
      $('#pLink')[0].select();
      document.execCommand('copy');
    };

    /*----------  RenewLink btn ----------------*/
    $scope.renewShareLink = function () {
      swal(
        {
          title: 'Are you sure?',
          text: 'Your current link will be changed!',
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
            $scope.publicHtmlLink = '';
            var FileMngrInst = new FileMngrFct();
            FileMngrInst.GetThumbnailURL(
              'page',
              $scope.pageName + '.html',
              function (msg1, msg2) {
                if (msg1) {
                  $scope.publicHtmlLink = encodeURI(msg2);
                  $('#pLink').attr('placeholder', msg2);
                }
              },
              true
            );
          } else {
            //nothing
          }
        }
      );
    };
  },
]);
