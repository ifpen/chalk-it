// ┌───────────────────────────────────────────────────────────────────────────────────┐ \\
// │ AvatarService                                                                     │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                       │ \\
// | Licensed under the Apache License, Version 2.0                                    │ \\
// ├───────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI                                                 │ \\
// └───────────────────────────────────────────────────────────────────────────────────┘ \\

angular.module("modules").service("AvatarService", [
  "$rootScope",
  function ($rootScope) {
    const self = this;

    /*---------- openAvatarManager ----------------*/
    self.openAvatarManager = function (vm) {
      vm.openUserAvatar = true;
    };

    /*---------- closeAvatarManager ----------------*/
    self.closeAvatarManager = function (vm) {
      vm.openUserAvatar = false;
      vm.userAvatar.text = "";
    };

    /*---------- selectAvatar ----------------*/
    self.selectAvatar = function () {
      $("#txtSelectAvatar").trigger("click");
    };

    /*---------- updateSelectedAvatar ----------------*/
    self.updateSelectedAvatar = function ($event, vm) {
      var files = $event.target.files;
      vm.userAvatar.text = files[0].name;
    };

    /*---------- sendAvatar ----------------*/
    self.sendAvatar = function (vm) {
      let txtSelectAvatar = $("#txtSelectAvatar")[0];
      if (vm.userAvatar.text != "") {
        var endAction = function (msg1, msg2, type) {
          if (type === "success") {
            new PNotify({
              title: "Avatar",
              text: "User avatar has been successfully uploaded!",
              type: type,
              styling: "bootstrap3",
            });
            var FileMngrInst = new FileMngrFct();
            FileMngrInst.ReadFile("avatar", null, _avatarCallback, "img");

            $rootScope.loadingBarStop();
          } else if (type === "error") {
            new PNotify({
              title: "Avatar",
              text: "Fail to update your avatar!",
              type: type,
              styling: "bootstrap3",
            });
          }
        };
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.SendFile("avatar", txtSelectAvatar.files[0], endAction);
      }
    };

    function _avatarCallback(msg1, msg2, type) {
      if (type === "success") {
        if (msg2 === "avatar") {
          let userAvatar;
          userAvatar = "data:image/png;base64," + msg1;
          sessionStorage.setItem("userAvatar", userAvatar);
          $rootScope.UserProfile.userAvatar = userAvatar;
        }
      }
    }

    /*---------- deleteAvatar ----------------*/
    self.deleteAvatar = function () {
      swal(
        {
          title: "Are you sure?",
          text: "Avatar will be deleted!",
          type: "warning",
          showCancelButton: true,
          showConfirmButton: false,
          showConfirmButton1: true,
          confirmButtonText: "Yes",
          cancelButtonText: "Abandon",
          closeOnConfirm: true,
          closeOnConfirm1: true,
          closeOnCancel: false,
        },
        function (isConfirm) {
          if (isConfirm) {
            var endAction = function (msg1, msg2, type) {
              if (type === "success") {
                new PNotify({
                  title: "Avatar",
                  text: "User avatar has been successfully deleted!",
                  type: type,
                  styling: "bootstrap3",
                });
                let userAvatar = "source/assets/img/flat-icon/user-m.png";
                $rootScope.UserProfile.userAvatar = userAvatar; //default
                sessionStorage.setItem("userAvatar", userAvatar);
                $rootScope.loadingBarStop();
              } else if (type === "error") {
                new PNotify({
                  title: "Avatar",
                  text: msg1,
                  type: type,
                  styling: "bootstrap3",
                });
              }
            };
            readSettingsData = "";
            var FileMngrInst = new FileMngrFct();
            FileMngrInst.DeleteFile("avatar", null, endAction, "img");
          } else swal.close();
        }
      );
    };
  },
]);
