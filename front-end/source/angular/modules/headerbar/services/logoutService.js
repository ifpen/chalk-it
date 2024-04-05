// ┌────────────────────────────────────────────────────────────────────────┐ \\
// │ LogoutService                                                          │ \\
// ├────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                            │ \\
// | Licensed under the Apache License, Version 2.0                         │ \\
// ├────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Ameur HAMDOUNI                      │ \\
// └────────────────────────────────────────────────────────────────────────┘ \\

angular.module('modules.headerbar').service('LogoutService', [
  '$rootScope',
  '$state',
  function ($rootScope, $state) {
    const self = this;

    /*---------- logout ----------------*/
    self.logout = function () {
      swal(
        {
          title: 'Are you sure?',
          text: "You will be signed out of Taipy Designer.",
          type: 'warning',
          showConfirmButton: false,
          showConfirmButton1: true,
          showCancelButton: true,
          confirmButtonText: 'Yes',
          cancelButtonText: 'Abandon',
          closeOnConfirm1: true,
          closeOnCancel: true,
        },
        function (isConfirm) {
          if (isConfirm) {
            $(window).off('beforeunload');
            $rootScope.reloadLoginForm = true;
            userCode = null;
            sessionStorage.removeItem('userId');
            $rootScope.UserProfile = null;
            sessionStorage.removeItem('authorizationToken');
            $state.transitionTo('login.user', {});
            location.reload();
          }
        }
      );
    };
  },
]);
