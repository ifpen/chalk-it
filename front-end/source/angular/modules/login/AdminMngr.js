/* 
    AdminMngr.js

    Scripts de gestion des fichiers sur le serveur
*/

var AdminMngrFct = function () {
  // ---------------------------
  //
  // Internal servers management
  //
  // ---------------------------

  //=============================================================================================
  //  GetFileServer
  //=============================================================================================

  function getFileServer() {
    return GetServiceAddr('File_Service');
  } // Fin de GetFileServer

  //=============================================================================================
  //  GetTokenServer
  //=============================================================================================

  function getTokenServer() {
    return GetServiceAddr('Token_Service');
  } // Fin de GetTokenServer

  //=============================================================================================
  //  GetSurfaceServer
  //=============================================================================================

  function getSurfaceServer() {
    return GetServiceAddr('Surface_Service');
  } // Fin de GetSurfaceServer

  //=============================================================================================
  //  GetServiceAddr
  //=============================================================================================

  function GetServiceAddr(service) {
    var addrServer = GetServer();
    if (!addrServer) addrServer = '../';

    // Ajouter un slash à la fin, si nécessaire
    if (addrServer.slice(addrServer.length - 1) !== '/') addrServer = addrServer + '/';

    if (xDashConfig.xDashBasicVersion != 'true') {
      // Ajouter le nom du webservice
      addrServer = addrServer + service + '.asmx/';
    }

    return addrServer;
  } // Fin de GetServiceAddr

  //=============================================================================================
  //  GetServer
  //=============================================================================================

  function GetServer() {
    var addrPage = xServConfig.url;
    return addrPage;
  } // Fin de GetServer

  // -----------------------
  //
  // Miscellaneous functions
  //
  // -----------------------

  //=============================================================================================
  //  b64EncodeUnicode
  //=============================================================================================

  function b64EncodeUnicode(str) {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  } // Fin de b64EncodeUnicode

  //=============================================================================================
  //  b64DecodeUnicode
  //=============================================================================================

  function b64DecodeUnicode(str) {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(str), function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  } // Fin de b64DecodeUnicode

  //---------------------------------
  //
  //  Credential management functions
  //
  //---------------------------------

  //=============================================================================================
  // encrypt
  //=============================================================================================

  function encrypt(txt, short, callback) {
    var data = b64EncodeUnicode(txt);
    $.ajax({
      type: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      url: getFileServer() + 'EncryptText',
      data: JSON.stringify({ Data: data, Short: short }),
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader('Authorization', token);
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj.Success) {
          if (callback != null) callback(obj);
          else return true;
        } else {
          callback(obj);
          return false;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message) txtErr = jqXHR.responseJSON.Message;
        swal('Sorry, could not encrypt data', textStatus + ' :\n' + txtErr, 'error');
        return false;
      },
    });
  } // Fin de StartCrypt

  //=============================================================================================
  //  decrypt
  //=============================================================================================

  function decrypt(txt, short, callback) {
    $.ajax({
      type: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      url: getFileServer() + 'DecryptText',
      data: JSON.stringify({ Data: txt, Short: short }),
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader('Authorization', token);
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj.Success) {
          obj.Msg = decodeURIComponent(escape(window.atob(obj.Msg)));
          if (callback != null) callback(obj);
          else return true;
        } else {
          callback(obj);
          return false;
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message) txtErr = jqXHR.responseJSON.Message;
        swal('Sorry, could not decrypt data', textStatus + ' :\n' + txtErr, 'error');
        return false;
      },
    });
  } // Fin de StartDecrypt

  //------------------
  //
  //  Public functions
  //
  //------------------

  return {
    GetFileServer: getFileServer,
    GetTokenServer: getTokenServer,
    GetSurfaceServer: getSurfaceServer,
    Encrypt: encrypt,
    Decrypt: decrypt,
  };
};

var AdminMngr = AdminMngrFct();
