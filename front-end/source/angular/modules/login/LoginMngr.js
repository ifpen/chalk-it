var LoginMngrFct = function () {
  var IsAdmin = false;
  var UserName = '';
  var UserID = '';
  //=============================================================================================
  //  Login
  //=============================================================================================

  function Login(name, id) {
    UserName = name;
    UserID = id;
    GetPublicKey(GotPublicKey);
  } // Fin de Login

  //=============================================================================================
  //  GetPublicKey
  //=============================================================================================

  function GetPublicKey(callback) {
    var cmd = '';
    $.ajax({
      type: 'POST',
      contentType: 'application/json; charset=utf-8',
      data: cmd,
      dataType: 'json',
      crossDomain: true,
      url: AdminMngr.GetTokenServer() + 'GetPublicKey',
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (callback != null) callback(obj);
          else return null;
        } else {
          DisplayLoginMsg('GetPublicKey failed');
          return null;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        swal('Sorry, could not get PublicKey', textStatus + ' :\n' + jqXHR.responseText + '\n' + errorThrown, 'error');
      },
    });
  } // Fin de GetPublicKey

  //=============================================================================================
  //  GotPublicKey
  //=============================================================================================

  function GotPublicKey(obj) {
    var ok = false;

    if (obj != null) {
      if (obj.Success) {
        if (obj.Msg === '') DisplayLoginMsg('Unknown key');
        else {
          publicKey = obj;
          GetToken();
        }
      }
    }
    return ok;
  } // Fin de GotPublicKey

  //=============================================================================================
  //  GetToken
  //=============================================================================================

  function GetToken() {
    var rsa = new RSAKey();
    rsa.setPublic(publicKey.Modulus, publicKey.Exponent);
    var str = JSON.stringify({ ID: UserID, Name: UserName });
    var res = rsa.encrypt(str);
    ForgeToken(res, TokenForged);
  } // End of GetToken

  //=============================================================================================
  //  ForgeToken
  //=============================================================================================

  function ForgeToken(crypted, callback) {
    var cmd = JSON.stringify({ Crypted: crypted });
    $.ajax({
      type: 'POST',
      contentType: 'application/json; charset=utf-8',
      data: cmd,
      dataType: 'json',
      crossDomain: true,
      url: AdminMngr.GetTokenServer() + 'ForgeToken',
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (callback != null) callback(obj);
          else return null;
        } else {
          DisplayLoginMsg('ForgeToken failed');
          return null;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        swal(
          'Sorry, Token could not be forged',
          textStatus + ' :\n' + jqXHR.responseText + '\n' + errorThrown,
          'error'
        );
      },
    });
  } // Fin de ForgeToken

  //=============================================================================================
  //  TokenForged
  //=============================================================================================

  function TokenForged(obj, callback) {
    var ok = false;

    if (obj != null) {
      if (obj.Success) {
        if (obj.Msg === '') DisplayLoginMsg('Unknown User');
        else {
          SaveJwt(obj.Msg);
          CheckLogin(LoginChecked);
          ok = true;
        }
      } else DisplayLoginMsg('ForgeToken failed');
    }
    return ok;
  } // Fin de TokenForged

  //=============================================================================================
  //  CheckLogin
  //=============================================================================================

  function CheckLogin(callback) {
    var cmd = '';
    $.ajax({
      type: 'POST',
      contentType: 'application/json; charset=utf-8',
      data: cmd,
      dataType: 'json',
      crossDomain: true,
      url: AdminMngr.GetFileServer() + 'CheckUser',
      beforeSend: function (xhr) {
        // Add authorization header
        var token = GetSavedJwt();
        if (token) {
          xhr.setRequestHeader('Authorization', token);
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (callback != null) callback(obj);
          else return null;
        } else {
          DisplayLoginMsg('CheckUser failed');
          return null;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        swal('Sorry, could not check User ID', textStatus + ' :\n' + jqXHR.responseText + '\n' + errorThrown, 'error');
      },
    });
  } // Fin de CheckLogin

  //=============================================================================================
  //  LoginChecked
  //=============================================================================================

  function LoginChecked(obj) {
    var ok = false;

    if (obj != null) {
      if (obj.Success) {
        if (obj.Msg === '') DisplayLoginMsg('Unknown User');
        else {
          ok = true;
        }
      } else {
        if (obj.Msg === '') DisplayLoginMsg('CheckUser failed');
        else DisplayLoginMsg(obj.Msg);
      }
    }
    let $body = angular.element(document.body);
    let $rootScope = $body.scope().$root;
    $rootScope.checkResult(ok);
    return ok;
  } // End of LoginChecked

  //=============================================================================================
  //  SaveJwt
  //=============================================================================================

  function SaveJwt(token) {
    sessionStorage.setItem('authorizationToken', token);
    //        let $body = angular.element(document.body);
    //        let $rootScope = $body.scope().$root;
    //        $rootScope.jwt = obj.Msg;
  } // End of SaveJwt

  //=============================================================================================
  //  GetSavedJwt
  //=============================================================================================

  function GetSavedJwt() {
    return sessionStorage.getItem('authorizationToken');
    //       let $body = angular.element(document.body);
    //       let $rootScope = $body.scope().$root;
    //       return $rootScope.jwt;
  } // End of GetSavedJwt

  //=============================================================================================
  //  DisplayLoginMsg
  //=============================================================================================

  function DisplayLoginMsg(msg) {
    let $body = angular.element(document.body);
    let $rootScope = $body.scope().$root;
    $rootScope.errorAuthentication = msg;
  } // Fin de DisplayLoginMsg

  return {
    GetSavedJwt: GetSavedJwt,
    Login: Login,
  };
};

var LoginMngr = LoginMngrFct();
