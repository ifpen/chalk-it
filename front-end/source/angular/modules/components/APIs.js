angular.module('xCLOUD').service('ApisFactory', [
  '$http',
  '$rootScope',
  function ($http, $rootScope) {
    function callxDashNodeServerAPI(method, url, data, params) {
      return $.ajax({
        type: method,
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify(data),
        dataType: 'json',
        crossDomain: true,
        url: urlxDashNodeServer + 'api/' + url,
      });
    }

    this.saveSettings = function (data) {
      return new Promise(function (resolve, reject) {
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.SendFile('settings', new Blob([JSON.stringify(data)], { type: 'application/json' }), resolve);
      }).then(
        function (result) {
          $rootScope.allSettings = data;
          return data;
        },
        function (result) {
          console.log('saveSettings error ' + result);
          return {
            error: true,
            status: 401,
            message: result,
          };
        }
      );
    };

    this.getSettings = function () {
      return new Promise(function (resolve, reject) {
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.ReadFile('settings', '', resolve);
      }).then(
        function (data) {
          if (data == 'File does not exist') {
            console.log('settings.usr file does not exist on server. Creating new one with default settings');
            return $rootScope.DefaultSettings;
          }
          var dataToReturn = {};
          try {
            dataToReturn = JSON.parse(data);
          } catch (exc) {
            if ($rootScope.xDashFullVersion) {
              swal('Unexpected error', 'unable to load settings.usr\n\n' + data, 'error');
            } else {
              swal('Please check and restart the command line', 'the Flask server is not responding', 'error');
            }

            return $rootScope.DefaultSettings;
          }
          return dataToReturn;
        },
        function (result) {
          console.log('getSettings error' + result);
          return {
            error: true,
            status: 401,
            message: result,
          };
        }
      );
    };

    this.postRequest = function (apiMethod, data) {
      $rootScope.loadingBarStart();

      return $http
        .post(xServConfig.urlApi + apiMethod, JSON.stringify(data), {
          contentType: 'application/json; charset=utf-8',
        })
        .then(
          function (msg) {
            $rootScope.loadingBarStop();
            return JSON.parse(msg.data.d);
          },
          function (erMs) {
            $rootScope.loadingBarStop();
            return erMs;
          }
        );
    };

    this.GetProjectByName = function (data) {
      $rootScope.loadingBarStart();
      return $http
        .post(xServConfig.urlApi + 'ReadProject', JSON.stringify(data), {
          contentType: 'application/json; charset=utf-8',
        })
        .then(
          function (msg) {
            $rootScope.loadingBarStop();
            return JSON.parse(msg.data.d);
          },
          function (erMs) {
            $rootScope.loadingBarStop();
            return erMs;
          }
        );
    };

    this.deleteFileFromServer = function (data, DeleteAction) {
      $rootScope.loadingBarStart();
      return $http
        .post(xServConfig.urlApi + DeleteAction, JSON.stringify(data), {
          contentType: 'application/json; charset=utf-8',
        })
        .then(
          function (msg) {
            $rootScope.loadingBarStop();
            return JSON.parse(msg.data.d);
          },
          function (erMs) {
            $rootScope.loadingBarStop();
            return erMs;
          }
        );
    };

    // add new API calls with the Chalk'it Node server
    this.sentResetPasswordRequest = function (email) {
      return callxDashNodeServerAPI('PUT', 'auth/updatepassword', {
        email: email,
      });
    };

    this.sentResetPasswordForm = function (userModel) {
      return callxDashNodeServerAPI('POST', 'auth/updatepassword', userModel);
    };

    this.registerRequest = function (userModel) {
      return callxDashNodeServerAPI('POST', 'auth/register', userModel);
    };

    this.loginWithEmailPasswordAction = function (userModel) {
      return callxDashNodeServerAPI('POST', 'auth/login', {
        email: userModel.email,
        password: userModel.password,
      });
    };

    this.getUserProfileByToken = function (token) {
      return callxDashNodeServerAPI('GET', 'users/me?Authorization=Bearer ' + token, {});
    };

    this.updatePassword = function (userModel) {
      return callxDashNodeServerAPI('POST', 'auth/updatepassword', {
        email: userModel.email,
        password: userModel.password,
      });
    };

    return this;
  },
]);
