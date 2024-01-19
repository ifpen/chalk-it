angular
  .module('loginuser')
  .config([
    '$stateProvider',
    function ($stateProvider) {
      $stateProvider.state('login.user', {
        userNotAuthenticated: true,
        userAuthenticated: false,
        url: '/',
        templateUrl: 'source/angular/modules/login/login.html',
        controller: 'LoginController',
      });
    },
  ])
  //AEF: add ng-enter to login
  .directive('ngEnter', function () {
    return function (scope, element, attrs) {
      element.bind('keydown keypress', function (event) {
        if (event.which === 13) {
          scope.$apply(function () {
            scope.$eval(attrs.ngEnter);
          });
          event.preventDefault();
        }
      });
    };
  })
  .controller('LoginController', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    '$window',
    'ApisFactory',
    function ($scope, $rootScope, $state, $http, $window, ApisFactory) {
      $scope.copyright = xDashConfig.copyright;
      $scope.errorMessages = [];
      $scope.errorMessagesMapping = [];
      $rootScope.contentType = 'login';
      $rootScope.errorAuthentication = '';

      $scope.userModel = {
        email: '',
        password: '',
      };

      $scope.UserRegisterModel = {
        password: '',
        repeatpassword: '',
        username: '',
        email: '',
        role: '',
        fname: '',
        lname: '',
        xdashId: '',
      };

      $scope.UserRequestResetPassword = {
        email: '',
      };

      $scope.UserResetPasswordForm = {
        email: '',
        password: '',
        repeatpassword: '',
      };

      $rootScope.verifyPassword = function (password) {
        var dummyPassword = document.getElementById('password');
        var resultMessage = {
          success: true,
          message: 'Strong password',
          code: 0,
        };
        $scope.errorMessagesMapping.password = {
          param: 'password',
          msg: resultMessage.message,
        };
        if (!password && document.activeElement === dummyPassword) {
          resultMessage.success = false;
          resultMessage.message = 'Password can not be empty';
          resultMessage.code = 1;
          $scope.errorMessagesMapping.password.msg = resultMessage.message;
          return resultMessage;
        }
        if (password) {
          //&& repeatpassword
          if (password.length < 10) {
            resultMessage.success = false;
            resultMessage.message = 'Too short password. Must be greater than 10 characters';
            resultMessage.code = 4;
            $scope.errorMessagesMapping.password.msg = resultMessage.message;
            return resultMessage;
          }
          if (password.length > 20) {
            resultMessage.success = false;
            resultMessage.message = 'Too long password. Must be smaller than 20 characters';
            resultMessage.code = 5;
            $scope.errorMessagesMapping.password.msg = resultMessage.message;
            return resultMessage;
          }
        }
        var strongRegex = new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{10,20}$/);

        if (!strongRegex.test(password) && document.activeElement === dummyPassword) {
          resultMessage.success = false;
          resultMessage.message =
            'Weak password : required 10 to 20 characters which contain at least 1 lowercase letter, 1 uppercase letter, 1 numeric digit, and 1 special character';
          resultMessage.code = 6;
          $scope.errorMessagesMapping.password.msg = resultMessage.message;
          return resultMessage;
        }
        return resultMessage;
      };

      $rootScope.verifyRepeatPassword = function (repeatpassword, password) {
        var dummyRepeat = document.getElementById('repeatpassword');
        var resultMessage = {
          success: true,
          message: 'Both passwords match',
          code: 0,
        };
        $scope.errorMessagesMapping.repeatpassword = {
          param: 'repeatpassword',
          msg: resultMessage.message,
        };
        if (!repeatpassword && document.activeElement === dummyRepeat) {
          resultMessage.success = false;
          resultMessage.message = 'Repeat password can not be empty';
          resultMessage.code = 1;
          $scope.errorMessagesMapping.repeatpassword.msg = resultMessage.message;
          return resultMessage;
        }
        if (password !== repeatpassword) {
          resultMessage.success = false;
          resultMessage.message = 'Password and repeat password do not match';
          resultMessage.code = 3;
          $scope.errorMessagesMapping.repeatpassword.msg = resultMessage.message;
          return resultMessage;
        }
        return resultMessage;
      };

      $rootScope.verifyEmail = function (email) {
        var dummyEmail = document.getElementById('email');
        var resultMessage = {
          success: true,
          message: 'Valid email',
          code: 0,
        };
        $scope.errorMessagesMapping.email = {
          param: 'email',
          msg: resultMessage.message,
        };
        if (!email && document.activeElement === dummyEmail) {
          resultMessage.success = false;
          resultMessage.message = 'Email cannot be empty';
          resultMessage.code = 1;
          $scope.errorMessagesMapping.email.msg = resultMessage.message;
          return resultMessage;
        }

        var strongRegex = new RegExp(
          /^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );

        if (!strongRegex.test(email) && document.activeElement === dummyEmail) {
          resultMessage.success = false;
          resultMessage.message = '';
          resultMessage.code = 7;
          $scope.errorMessagesMapping.email.msg = resultMessage.message;
          return resultMessage;
        }
        return resultMessage;
      };

      $rootScope.togglePasswordClickedAction = function (password) {
        const x = document.getElementById(password);
        var childNodes =
          password == 'password'
            ? document.getElementsByClassName('form-group has-warning has-feedback password')[0].childNodes
            : document.getElementsByClassName('form-group has-warning has-feedback repeatpassword')[0].childNodes;
        var childNode = null;
        for (var i = 0, childNode; i <= childNodes.length; i++) {
          childNode = childNodes[i];
          if (/fa fa-lock/.test(childNode.className) || /fa fa-unlock-alt/.test(childNode.className)) {
            if (x.type === 'password') {
              x.type = 'text';
              childNode.className = 'fa fa-unlock-alt';
            } else {
              x.type = 'password';
              childNode.className = 'fa fa-lock';
            }
            break;
          }
        }
      };

      $rootScope.changeContentType = function (content) {
        $rootScope.contentType = content;
        $rootScope.resetPasswordRequestSuccess = '';
        $rootScope.resetPasswordRequestError = '';
        $rootScope.errorAuthentication = '';
        $scope.errorRegisterMessage = '';
      };

      function changeUrl() {
        var url_string = window.location.href;
        var url = new URL(url_string);
        window.location.href = url.origin;
      }

      function getParamValueQueryString(paramName) {
        var url_string = window.location.href;
        var url = new URL(url_string);
        var c = url.searchParams.get(paramName);
        return c;
      }

      function avatarCallback(msg1, msg2, type) {
        if (type === 'success') {
          if (msg2 === 'avatar') {
            let userAvatar;
            userAvatar = 'data:image/png;base64,' + msg1;
            sessionStorage.setItem('userAvatar', userAvatar);
            $rootScope.UserProfile.userAvatar = userAvatar;
          }
        }
      }

      function updateUserProfile(data) {
        $rootScope.userProfileFromxDashNodeServer = data;
        $scope.userId = $rootScope.userProfileFromxDashNodeServer.xdashId;

        var userAvatar = 'source/assets/img/flat-icon/user-m.png'; //AEF: can be taken from obj.MSG if this preference is stored in cloud
        userCode = $scope.userId;
        $rootScope.UserProfile = {};
        sessionStorage.setItem('userId', $scope.userId);
        sessionStorage.setItem('userName', $rootScope.userProfileFromxDashNodeServer.username);
        sessionStorage.setItem('userEmail', data.email);
        sessionStorage.setItem('userAvatar', userAvatar);
        sessionStorage.setItem('authorizationToken', authorizationToken);

        $rootScope.UserProfile.userName = $rootScope.userProfileFromxDashNodeServer.username;
        $rootScope.UserProfile.userId = $scope.userId;
        $rootScope.UserProfile.userAvatar = userAvatar;
        sessionStorage.setItem('userAvatar', userAvatar);
        var FileMngrInst = new FileMngrFct();
        FileMngrInst.ReadFile('avatar', null, avatarCallback, 'img');
      }

      function getUserProfileByToken(authorizationToken) {
        ApisFactory.getUserProfileByToken(authorizationToken).then(
          function (data) {
            updateUserProfile(data);
            changeUrl();
            $rootScope.loadingBarStop();
            $state.transitionTo('modules');
          },
          function (errors) {
            changeUrl();
            $rootScope.loadingBarStop();
            if (errors.responseJSON === undefined)
              $rootScope.errorAuthentication = 'No response from Backend. Please contact the administrator';
            else $rootScope.errorAuthentication = errors.responseJSON.message;
          }
        );
      }

      var authorizationToken = getParamValueQueryString('authorizationToken');
      var resetpasswordtoken = getParamValueQueryString('passwordreset');
      var useremail = getParamValueQueryString('signupended');
      if (resetpasswordtoken) {
        $rootScope.contentType = 'resetPasswordForm';
        var email = getParamValueQueryString('email');
        $scope.UserResetPasswordForm.email = email;
      }
      if (useremail) {
        $rootScope.contentType = 'login';
        $scope.userModel.email = useremail;
      } else {
        var lastuseremail = sessionStorage.getItem('userEmail');
        if (lastuseremail) {
          $rootScope.contentType = 'login';
          $scope.userModel.email = lastuseremail;
        }
      }
      if (authorizationToken) {
        var tokenSaved = sessionStorage.getItem('authorizationToken');
        if (authorizationToken !== tokenSaved) getUserProfileByToken(authorizationToken);
        else {
          changeUrl();
          $rootScope.loadingBarStop();
          $state.transitionTo('modules');
        }
      } else {
        if ($rootScope.reloadLoginForm) {
          $window.location.reload();
        } else {
          $rootScope.loginWithEmailPasswordAction = function () {
            if ($scope.userModel.email && $scope.userModel.password) {
              ApisFactory.loginWithEmailPasswordAction($scope.userModel).then(
                function (result) {
                  ApisFactory.getUserProfileByToken(result.authorizationToken).then(
                    function (data) {
                      userCode = data.xdashId;
                      $rootScope.UserProfile = {};
                      var userAvatar = 'source/assets/img/flat-icon/user-m.png';
                      sessionStorage.setItem('userId', data.xdashId);
                      sessionStorage.setItem('userName', data.username);
                      sessionStorage.setItem('userEmail', data.email);
                      sessionStorage.setItem('userAvatar', userAvatar);
                      sessionStorage.setItem('authorizationToken', result.authorizationToken);
                      $rootScope.UserProfile.userName = data.username;
                      $rootScope.UserProfile.userId = data.xdashId;
                      $rootScope.UserProfile.userAvatar = userAvatar;

                      //issue#78
                      sessionStorage.setItem('userAvatar', userAvatar);
                      var FileMngrInst = new FileMngrFct();
                      FileMngrInst.ReadFile('avatar', null, avatarCallback, 'img');
                      //
                      $rootScope.loadingBarStop();
                      $state.transitionTo('modules');
                    },
                    function (errors) {
                      $rootScope.loadingBarStop();
                      if (errors.responseJSON === undefined)
                        $rootScope.errorAuthentication = 'No response from Backend. Please contact the admnistrator';
                      else $rootScope.errorAuthentication = errors.responseJSON.message;
                    }
                  );
                },
                function (errors) {
                  $rootScope.loadingBarStop();
                  if (errors.responseJSON === undefined)
                    $rootScope.errorAuthentication = 'No response from Backend. Please contact the administrator';
                  else $rootScope.errorAuthentication = errors.responseJSON.message;
                }
              );
            } else {
            }
          };

          $scope.successRegisterMessage = '';
          $scope.errorRegisterMessage = '';
          $rootScope.registerAction = function () {
            $rootScope.loadingBarStart();
            $scope.errorRegisterMessage = '';
            $scope.UserRequestResetPassword = [];
            $scope.formRegisterSubmitted = true;
            if ($rootScope.reloadLoginForm) {
              $rootScope.loadingBarStop();
            } else {
              ApisFactory.registerRequest($scope.UserRegisterModel).then(
                function (result) {
                  $scope.errorRegisterMessage = '';
                  $scope.successRegisterMessage = result.message;
                  $rootScope.loadingBarStop();
                },
                function (errors) {
                  $rootScope.loadingBarStop();
                  $scope.successRegisterMessage = '';
                  $scope.errorRegisterMessage = errors.responseJSON.message;
                }
              );
            }
            window.scroll({
              top: 0,
              left: 0,
              behavior: 'smooth',
            });
          };

          $rootScope.resetPasswordRequestSuccess = '';
          $rootScope.resetPasswordRequestError = '';
          $scope.UserRequestResetPassword.email = sessionStorage.getItem('userEmail');
          $rootScope.resetPasswordRequest = function () {
            $rootScope.loadingBarStart();
            ApisFactory.sentResetPasswordRequest($scope.UserRequestResetPassword.email).then(
              function (result) {
                $rootScope.loadingBarStop();
                $rootScope.resetPasswordRequestSuccess = result.message;
                $rootScope.resetPasswordRequestError = '';
              },
              function (errors) {
                $rootScope.loadingBarStop();
                $rootScope.resetPasswordRequestSuccess = '';
                $rootScope.resetPasswordRequestError = errors.responseJSON.message;
              }
            );
          };

          $rootScope.resetPasswordFormSuccess = '';
          $rootScope.resetPasswordFormError = '';

          $rootScope.resetPasswordForm = function () {
            $rootScope.loadingBarStart();
            ApisFactory.sentResetPasswordForm($scope.UserResetPasswordForm).then(
              function (result) {
                $rootScope.loadingBarStop();
                $rootScope.resetPasswordFormSuccess = result.message || 'Password was successfully reset';
                $rootScope.resetPasswordFormError = '';
                $scope.userModel.email = $scope.UserResetPasswordForm.email;
                setTimeout(function () {
                  $rootScope.contentType = 'login';
                }, 2000);
              },
              function (errors) {
                $rootScope.loadingBarStop();
                $rootScope.resetPasswordFormSuccess = '';
                $rootScope.resetPasswordFormError = errors.responseJSON.message;
              }
            );
          };
        }
      }
    },
  ]);
