// +--------------------------------------------------------------------+ \\
// ¦ FileMngr.js : Scripts de gestion des fichiers sur le serveur       ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Copyright © 2017-2023 IFPEN                                        ¦ \\
// ¦ Licensed under the Apache License, Version 2.0                     ¦ \\
// +--------------------------------------------------------------------¦ \\
// ¦ Original authors(s): Bruno LETY                                    ¦ \\
// +--------------------------------------------------------------------+ \\


if (xDashConfig.xDashBasicVersion == "true") {
  var AdminMngrFct = function() {
    function GetFileServer() {
      return xServConfig.url;
    }
  return {GetFileServer};  
  }

  var AdminMngr = AdminMngrFct();
}

var FileMngrFct = function () {
  //===============================
  // Values for type : fmi, project
  //===============================

  var fileType;
  var file2Send;
  var data2Send;
  var returnMsg = "";
  var endCallback = null;
  var endCallbackParam1 = null;
  var endCallbackParam2 = null;
  var readProjectData = "";
  var write2File = false;
  var readArray = null;
  var mostRecents = false; //BL
  var endAction;
  const MaxNbFiles = 10;

  // Map for callbacks
  var callBackMap = new Map();

  // --------------
  //
  // Send to server
  //
  // --------------

  //=============================================================================================
  //  SendFile
  //=============================================================================================

  function sendFile(type, file, callback, progress) {
    endCallback = callback;
    endCallbackParam1 = null;
    endCallbackParam2 = null;

    if (SetFileType(type)) {
      if (file) {
        file2Send = file;
        var fileName = file.name;
        var remaining = file.size;
        if (remaining === 0)
          returnMsg = "Length of file is null";
        else {
          PushCallBack(callback, "Send", type, fileName);
          Send(fileName, 0, -1, remaining, true, progress);
        }
      } else EndOfOperation("Invalid file to send", "", "error", callback);
    } else EndOfOperation("Unknown file type", "", "error", callback);

    return returnMsg;
  } // Fin de sendFile

  //=============================================================================================
  //  sendText
  //=============================================================================================

  function sendText(type, name, data, callback, progress) {
    endCallback = callback;
    endCallbackParam1 = null;
    endCallbackParam2 = null;

    if (SetFileType(type)) {
      if (name) {
        var fileName = CheckExtension(name);
        data2Send = JSON.parse(JSON.stringify(data));
        var remaining = data2Send.length;
        if (remaining === 0) returnMsg = "Length of data is null";
        else {
          PushCallBack(callback, "Send", type, fileName);
          Send(fileName, 0, -1, remaining, false, progress);
        }
      } else EndOfOperation("Invalid file name", "", "error", callback);
    } else EndOfOperation("Unknown data type", "", "error", callback);
  } // Fin de sendText

  //=============================================================================================
  //  ReadChunk
  //=============================================================================================

  function ReadChunk(name, start, length, remaining, callback, fromFile) {
    var blob;
    if (fromFile) {
      // Lecture d'une partie du fichier binaire
      blob = file2Send.slice(start, length + start);
      var fr = new FileReader();
      fr.onload = function (event) {
        var data = event.target.result.split(",")[1];
        UseReadChunk(name, start, length, remaining, data, fromFile, callback);
      };
      fr.readAsDataURL(blob); // Pour lecture en base 64 bits
    } else {
      // Lecture d'une partie de la chaîne
      blob = data2Send.slice(start, length + start);
      //var data = btoa(unescape(encodeURIComponent(blob)));                                  // escape & unescape functions are deprecated
      var data = b64EncodeUnicode(blob);
      UseReadChunk(name, start, length, remaining, data, fromFile, callback);
    }
  } // Fin de ReadChunk

  //=============================================================================================
  //  UseReadChunk
  //=============================================================================================

  function UseReadChunk(
    name,
    start,
    length,
    remaining,
    data,
    fromFile,
    callback
  ) {
    if (data !== "" && callback !== null) {
      callback(name, start, length, remaining, data, ChunkSent, fromFile);
    }
  } // Fin de UseReadChunk

  //=============================================================================================
  //  Send
  //=============================================================================================

  function Send(name, start, length, remaining, fromFile, progress) {
    // Gestion du transfert du fichier binaire
    var long = remaining;
    var chunk = 1000 * 1000 * 10;
    if (long > chunk) long = chunk;
    var reste = remaining - long;

    const doSendProgress = (
      name,
      start,
      length,
      remaining,
      data,
      callback,
      fromFile
    ) =>
      DoSend(
        name,
        start,
        length,
        remaining,
        data,
        callback,
        fromFile,
        progress
      );
    if (length == -1) ReadChunk(name, 0, long, reste, doSendProgress, fromFile);
    // Début du fichier
    else if (long > 0) {
      var debut = start + length;
      ReadChunk(name, debut, long, reste, doSendProgress, fromFile); // Suite du fichier
    } else {
      if (fileType === "fmi" && fromFile)
        DoSend(name, -1, 0, 0, "", ChunkSent, fromFile, progress);
      // Décompression du fichier, seulement pour le FMI
      else if (fileType === "page" || fileType === "project")
        DoSend(name, -1, 0, 0, "", ChunkSent, fromFile, progress);
      // Capture de l'imagette
      else SendFinished(name);
    }
  } // Fin de Send

  //=============================================================================================
  //  DoSend
  //=============================================================================================

  function DoSend(
    name,
    start,
    length,
    remaining,
    data,
    callback,
    fromFile,
    progress
  ) {
    if (progress) {
      progress(start / (start + length + remaining));
    }

    var cmd = PrepareSendData(name, start, data);

    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: cmd,
      dataType: "json",
      crossDomain: true,
      url: GetSendFct(),
      beforeSend: function (xhr) {
        if (xDashConfig.xDashBasicVersion != "true") {
          // Add authorization header
          var token = LoginMngr.GetSavedJwt();
          if (token) {
            xhr.setRequestHeader("Authorization", token);
          }
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (obj.Success) {
            if (callback !== null)
              callback(name, start, length, remaining, fromFile, progress);
          } else {
            let l_callback = PopCallBack("Send", fileType, name);
            EndOfOperation(obj.Msg, "", "error", l_callback);
          }
        } else {
          let l_callback = PopCallBack("Send", fileType, name);
          EndOfOperation(
            "Error while uploading the file",
            "",
            "error",
            l_callback
          );
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        let l_callback = PopCallBack("Send", fileType, name);
        EndOfOperation(
          "Sorry, could not upload the selected file",
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      },
    });
  } // Fin de DoSend

  //=============================================================================================
  //  ChunkSent
  //=============================================================================================

  function ChunkSent(name, start, length, remaining, fromFile, progress) {
    // La partie du fichier binaire a été correctement transférée
    if (length > 0) Send(name, start, length, remaining, fromFile, progress);
    else SendFinished(name);
  } // Fin de ChunkSent

  //=============================================================================================
  //  SendFinished
  //=============================================================================================

  function SendFinished(name) {
    var str = GetEndMsg();
    if (fileType === "page") {
      GetPage(name, getPageCallback);
    } else {
      var l_callback = PopCallBack("Send", fileType, name);
      EndOfOperation(str, fileType, "success", l_callback);

      if (fileType === "project") {
        var $body = angular.element(document.body); // 1
        var $rootScope = $body.scope().$root;
        if ((name === $rootScope.currentProject.name + ".xprjson") || !$rootScope.xDashFullVersion)
          $rootScope.updateFlagDirty(false);
      }
    }
  } // Fin de SendFinished

  //=============================================================================================
  //  getPageCallback
  //=============================================================================================

  function getPageCallback(obj, name) {
    let $body = angular.element(document.body);
    let $rootScope = $body.scope().$root;
    let urlContent = "";
    let manageShareBtn = false;
    datanodesManager.showLoadingIndicator(false);
    if (obj) {
      if (obj.Success) {
        urlContent = obj.Msg;
      } else {
        url = "ERROR: URL page could not be copied";
        showCopyBtn = false;
      }
      $rootScope.isPageExist = true;
      $rootScope.securedLink = $rootScope.infoPage.isPrivatePage
        ? "True"
        : "False";
      if ($rootScope.infoPage.isPrivatePage) {
        manageShareBtn = true;
      }
      //  console.log("avant " + $rootScope.securedLink);
      setPageAccess(name, "page", $rootScope.securedLink, function () {
        swal(
          {
            title: "HTML page uploaded",
            type: "success",
            animation: "popSlow",
            confirmButtonText: "Get link",
            showCancelButton: manageShareBtn,
            cancelButtonText: "Manage sharing",
            showCloseButton: true,
            closeOnCancel: true,
            closeOnConfirm: false,
          },
          function (isConfirm) {
            if (isConfirm) {
              setTimeout(function () {
                let $body = angular.element(document.body);
                let $rootScope = $body.scope().$root;
                if (
                  (urlContent.includes("OpenPage") &&
                    $rootScope.infoPage.isPrivatePage) ||
                  (urlContent.includes("AccessPage") &&
                    !$rootScope.infoPage.isPrivatePage)
                ) {
                  //detect change page access
                  GetPage(name, function (obj, name) {
                    if (obj) {
                      if (obj.Success) {
                        urlContent = obj.Msg;
                        getPageLinkCallback({ Success: true, Msg: urlContent });
                      }
                    }
                  });
                }
                getPageLinkCallback(
                  { Success: true, Msg: urlContent },
                  function () {
                    if (!_.isUndefined(endAction)) {
                      endAction();
                      endAction = undefined;
                    }
                  }
                );
              }, 500);
            } else {
              let fileName = RemoveExtension(name);
              let scopeDashContent = angular
                .element(document.getElementById("dash-content-top-ctrl"))
                .scope();
              scopeDashContent.shareProject(fileName, "html");
            }
          }
        );
      });
    }
  }

  function setPageAccessCallback(name, manageShareBtn, urlContent) {
    swal(
      {
        title: "HTML page uploaded",
        type: "success",
        animation: "popSlow",
        confirmButtonText: "Get link",
        showCancelButton: manageShareBtn,
        cancelButtonText: "Manage sharing",
        showCloseButton: true,
        closeOnCancel: true,
        closeOnConfirm: false,
      },
      function (isConfirm) {
        if (isConfirm) {
          setTimeout(function () {
            let $body = angular.element(document.body);
            let $rootScope = $body.scope().$root;
            if (
              urlContent.includes("OpenPage") &&
              $rootScope.infoPage.isPrivatePage
            ) {
              GetPage(name, function (obj, name) {
                if (obj) {
                  if (obj.Success) {
                    urlContent = obj.Msg;
                    getPageLinkCallback({ Success: true, Msg: urlContent });
                  }
                }
              });
              urlContent = GetPageLink(Name);
            }
            getPageLinkCallback(
              { Success: true, Msg: urlContent },
              function () {
                if (!_.isUndefined(endAction)) {
                  endAction();
                  endAction = undefined;
                }
              }
            );
          }, 500);
        } else {
          let fileName = RemoveExtension(name);
          let scopeDashContent = angular
            .element(document.getElementById("dash-content-top-ctrl"))
            .scope();
          scopeDashContent.shareProject(fileName, "html");
        }
      }
    );
  }

  //=============================================================================================
  // addPythonInfo
  //=============================================================================================

  function addPythonInfo(
    Id,
    callback,
    BaseImage,
    Hash,
    Name,
    Description,
    NameOfFile,
    SizeOfFile
  ) {
    endCallback = callback;
    if (_.isUndefined(Description)) Description = "";
    if (_.isUndefined(Hash)) Hash = "";

    var cmd = JSON.stringify({
      BaseImage: BaseImage,
      FileName: Id,
      Hash: Hash,
      Name: Name,
      Description: Description,
      NameOfFile: NameOfFile,
      SizeOfFile: SizeOfFile,
    });
    var fct = AdminMngr.GetFileServer() + "AddPythonInfo";
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: cmd,
      dataType: "json",
      crossDomain: true,
      url: fct,
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (obj.Success) {
            EndOfOperation("Python information successfully added", "success");
          } else EndOfOperation(obj.Msg, "", "error");
        } else
          EndOfOperation("Error while adding python information", "", "error");
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        EndOfOperation(
          "Sorry, could not add python information",
          textStatus + " :\n" + txtErr,
          "error"
        );
      },
    });
  } // Fin de addPythonInfo

  // -----------------------------
  //
  // Get list of files from server
  //
  // -----------------------------

  //=============================================================================================
  //  getFileList
  //=============================================================================================

  function getFileList(
    type,
    callback,
    recents,
    param1Callback,
    param2Callback
  ) {
    endCallback = callback;
    endCallbackParam1 =
      typeof param1Callback !== "undefined" ? param1Callback : null;
    endCallbackParam2 =
      typeof param2Callback !== "undefined" ? param2Callback : null;
    mostRecents = recents;

    if (_.isUndefined(mostRecents)) {
      mostRecents = false;
    }

    if (SetFileType(type)) {
      PushCallBack(callback, "GetList", fileType, "");
      if (type === "pydata") GetPythonList(GotTheList);
      else GetList(GotTheList);
    } else EndOfOperation("Unknown file type", "", "error", callback);
  } // Fin de getFileList

  //=============================================================================================
  //  GetList
  //=============================================================================================

  function GetList(callback) {
    var jsonData;
    var fct = GetFilesFct();
    if (mostRecents)
      jsonData = JSON.stringify({ FileType: fileType, MaxNbFiles: MaxNbFiles });
    else jsonData = JSON.stringify({ FileType: fileType });
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: jsonData,
      url: fct,
      beforeSend: function (xhr) {
        if (xDashConfig.xDashBasicVersion != "true") {
          // Add authorization header
          var token = LoginMngr.GetSavedJwt();
          if (token) {
            xhr.setRequestHeader("Authorization", token);
          }
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (callback !== null) callback(obj);
        } else {
          var l_callback = PopCallBack("GetList", fileType, "");
          EndOfOperation("No file found", "", "error", l_callback);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        var l_callback = PopCallBack("GetList", fileType, "");
        EndOfOperation(
          "Sorry, could not get the list of available files",
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      },
    });
  } // Fin de GetList

  //=============================================================================================
  //  GetPythonList
  //=============================================================================================

  function GetPythonList(callback) {
    let cmd = "";
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      data: cmd,
      url: GetFilesFct(),
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (callback !== null) callback(obj);
        } else {
          var l_callback = PopCallBack("GetList", fileType, "");
          EndOfOperation("No file found", "", "error", l_callback);
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        var l_callback = PopCallBack("GetList", fileType, "");
        EndOfOperation(
          "Sorry, could not get the list of available python files",
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      },
    });
  } // Fin de GetPythonList

  //=============================================================================================
  //  GotTheList
  //=============================================================================================

  function GotTheList(obj) {
    var l_callback = PopCallBack("GetList", fileType, "");
    EndOfOperation(obj, fileType, "success", l_callback);
  } // Fin de GotTheList

  // ----------------
  //
  // Read from server
  //
  // ----------------

  //=============================================================================================
  //  readFile
  //=============================================================================================

  function readFile(type, name, callback, write) {
    endCallback = callback;
    endCallbackParam1 = null;
    endCallbackParam2 = null;
    write2File = typeof write !== "undefined" ? write : false;

    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      readProjectData = "";
      readArray = null;
      PushCallBack(callback, "Read", type, fileName);
      Read(fileName, 0);
    } else EndOfOperation("Unknown data type", "", "error", callback);
  } // Fin de readFile

  //=============================================================================================
  //  Read
  //=============================================================================================

  function Read(name, offset) {
    if (fileType === "fmi") ReadData(name, offset, FmiChunkReceived);
    else if (fileType === "image" || fileType === "avatar")
      ReadData(name, offset, ImageChunkReceived);
    else if (fileType === "pydata") ReadData(name, offset, PythonChunkReceived);
    else ReadData(name, offset, ChunkReceived);
  } // Fin de Read

  //=============================================================================================
  //  ReadData
  //=============================================================================================

  function ReadData(name, start, callback) {
    var cmd = PrepareReadData(name, start);
    var fct = GetReadFct();

    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: cmd,
      dataType: "json",
      crossDomain: true,
      url: fct,
      beforeSend: function (xhr) {
        if (xDashConfig.xDashBasicVersion != "true") {
          // Add authorization header
          var token = LoginMngr.GetSavedJwt();
          if (token) {
            xhr.setRequestHeader("Authorization", token);
          }
        }
      },
      success: function (msg) {
        var $body = angular.element(document.body); // 1
        var $rootScope = $body.scope().$root;
        $rootScope.loadingBarStop();
        var cmdp = JSON.parse(cmd);

        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (obj.Success) {
            // if ((fileType != "settings") && (fileType != "pydata")) {
            //     if (fileType == 'project') {
            //         new PNotify({
            //             title: cmdp.ProjectName,
            //             text: 'your file ' + cmdp.ProjectName + ' has been successfully downloaded',
            //             type: 'success',
            //             styling: 'bootstrap3'
            //         });
            //     } else {
            //         new PNotify({
            //             title: cmdp.FileName,
            //             text: 'your file ' + cmdp.FileName + ' has been successfully downloaded',
            //             type: 'success',
            //             styling: 'bootstrap3'
            //         });
            //     }
            // }
            if (callback != null) callback(name, start, obj);
          } else {
            let l_callback = PopCallBack("Read", fileType, name);
            EndOfOperation(obj.Msg, "", "error", l_callback);
          }
        } else {
          let l_callback = PopCallBack("Read", fileType, name);
          EndOfOperation(
            "Error while downloading the file",
            "",
            "error",
            l_callback
          );
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        let l_callback = PopCallBack("Read", fileType, name);
        EndOfOperation(
          "Sorry, could not download the selected file",
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      }
    });
  } // Fin de ReadData

  //=============================================================================================
  //  ChunkReceived
  //=============================================================================================

  function ChunkReceived(name, start, jsonData) {
    // La partie du fichier binaire a été correctement transférée
    if (jsonData.NbBytes > 0) {
      var str = decodeURIComponent(escape(window.atob(jsonData.FileData)));
      if (str !== "") readProjectData = readProjectData + str;

      if (jsonData.LastChunk) {
        var l_callback = PopCallBack("Read", fileType, name);
        if (write2File) {
          var b = new Blob([readProjectData], {
            type: "application/octet-stream",
          });
          if (b) {
            var ext = GetFileExt();
            var fileName = name;
            if (!name.endsWith(ext)) fileName = fileName + ext;
            saveAs(b, fileName);
          }
          EndOfOperation(null, fileType, "success", l_callback);
        } else EndOfOperation(readProjectData, fileType, "success", l_callback);
      } else {
        let chunk = 1000 * 1000 * 10;
        Read(name, jsonData.Offset + chunk);
      }
    }
  } // Fin de ChunkReceived

  //=============================================================================================
  //  ImageChunkReceived
  //=============================================================================================

  function ImageChunkReceived(name, start, jsonData) {
    // La partie du fichier binaire a été correctement transférée
    if (jsonData.NbBytes > 0) {
      if (jsonData.FileData !== "")
        readProjectData = readProjectData + jsonData.FileData;

      if (jsonData.LastChunk) {
        var l_callback = PopCallBack("Read", fileType, name);
        EndOfOperation(readProjectData, fileType, "success", l_callback);
      } else Read(name, jsonData.Offset + jsonData.NbBytes);
    }
  } // Fin de ImageChunkReceived

  //=============================================================================================
  //  PythonChunkReceived
  //=============================================================================================

  function PythonChunkReceived(name, start, jsonData) {
    var str;
    if (jsonData.NbBytes > 0) {
      var str = jsonData.FileData;
      if (str !== "") readProjectData = readProjectData + str;

      if (jsonData.LastChunk) {
        var l_callback = PopCallBack("Read", fileType, name);
        if (write2File) {
          if (name.endsWith("zip")) {
            // La cible est un fichier ZIP
            var typData = "data:application/zip";
            var byteString = atob(readProjectData);
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);

            for (var i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }

            var b = new Blob([ab], { type: typData });
            if (b) {
              saveAs(b, name);
            }
          } else {
            // La cible est un fichier standard (texte par exemple)
            var typData = "data:text/plain;base64,";
            var element = document.createElement("a");
            element.setAttribute("href", typData + readProjectData);
            element.setAttribute("download", name);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }
          EndOfOperation(
            "Python data file downloaded",
            fileType,
            "success",
            l_callback
          );
        } else EndOfOperation(readProjectData, fileType, "success", l_callback);
      } else Read(name, jsonData.Offset + jsonData.NbBytes);
    }
  } // Fin de PythonChunkReceived

  //=============================================================================================
  //  FmiChunkReceived
  //=============================================================================================

  function FmiChunkReceived(name, start, jsonData) {
    // La partie du fichier binaire a été correctement transférée
    if (jsonData.Array && jsonData.NbBytes > 0) {
      if (readArray) $.merge(readArray, jsonData.Array);
      else readArray = jsonData.Array;

      if (jsonData.LastChunk) {
        var l_callback = PopCallBack("Read", fileType, name);
        if (write2File) {
          var b = new Blob([new Uint8Array(readArray)], {
            type: "application/octet-stream",
          });
          if (b) {
            var ext = GetFileExt();
            var fileName = name;
            if (!name.endsWith(ext)) fileName = fileName + ext;
            saveAs(b, fileName);
            EndOfOperation(null, fileType, "success", l_callback);
          }
        } else EndOfOperation(readArray, fileType, "success", l_callback);
      } else Read(name, jsonData.Offset + jsonData.NbBytes);
    }
  } // Fin de FmiChunkReceived

  // --------------------
  //
  // Close file on server
  //
  // --------------------

  //=============================================================================================
  // Close
  //=============================================================================================

  function close(type, name, callback) {
    endCallback = callback;
    endCallbackParam1 = null;
    endCallbackParam2 = null;

    if (xDashConfig.xDashBasicVersion != "true") {
      if (SetFileType(type)) {
        if (type === "project") {
          var fileName = CheckExtension(name);
          CloseData(fileName, Closed);
        }
      }
    }
  } // Fin de Close

  //=============================================================================================
  // CloseData
  //=============================================================================================

  function CloseData(name, callback) {
    var cmd = JSON.stringify({ FileName: name });
    var fct = AdminMngr.GetFileServer() + "CloseProject";
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: cmd,
      dataType: "json",
      crossDomain: true,
      url: fct,
      beforeSend: function (xhr) {
        if (xDashConfig.xDashBasicVersion != "true") {
          // Add authorization header
          var token = LoginMngr.GetSavedJwt();
          if (token) {
            xhr.setRequestHeader("Authorization", token);
          }
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (obj.Success) callback(obj);
          else EndOfOperation(obj.Msg, "", "error");
        } else EndOfOperation("Error while closing the project", "", "error");
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        EndOfOperation(
          "Sorry, could not close the selected project",
          textStatus + " :\n" + txtErr,
          "error"
        );
      }
    });
  } // Fin de CloseData

  //=============================================================================================
  // Closed
  //=============================================================================================

  function Closed(obj) {
    EndOfOperation("", fileType, "success");
  } // Fin de Closed

  // -----------------------
  //
  // Delete file from server
  //
  // -----------------------

  //=============================================================================================
  //  deleteFile
  //=============================================================================================

  function deleteFile(type, name, callback) {
    endCallback = callback;
    endCallbackParam1 = null;
    endCallbackParam2 = null;

    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      PushCallBack(callback, "Delete", type, fileName);
      Delete(fileName, Deleted);
    } else EndOfOperation("Unknown data type", "", "error");
  } // Fin de deleteFile

  //=============================================================================================
  //  Delete
  //=============================================================================================

  function Delete(name, callback) {
    var cmd = PrepareDeleteData(name);

    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: cmd,
      dataType: "json",
      crossDomain: true,
      url: GetDeleteFct(),
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (obj.Success) {
            if (callback != null) callback(obj, name);
          } else {
            let l_callback = PopCallBack("Delete", fileType, name);
            EndOfOperation(obj.Msg, "", "error", l_callback);
          }
        } else {
          let l_callback = PopCallBack("Delete", fileType, name);
          EndOfOperation(
            "Error while deleting the file",
            "",
            "error",
            l_callback
          );
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        let l_callback = PopCallBack("Delete", fileType, name);
        EndOfOperation(
          "Sorry, could not delete the selected file",
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      },
    });
  } // Fin de Delete

  //=============================================================================================
  //  Deleted
  //=============================================================================================

  function Deleted(obj, name) {
    var l_callback = PopCallBack("Delete", fileType, name);
    EndOfOperation(obj, fileType, "success", l_callback);
  } // Fin de Deleted

  // --------------------------
  //
  // Rename Project
  //
  // --------------------------

  //=============================================================================================
  //  renameFile
  //=============================================================================================

  function renameFile(type, name, newName, callback) {
    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      var newFileName = CheckExtension(newName);
      endCallback = callback;
      PushCallBack(callback, "Rename", type, fileName);
      Rename(fileName, newFileName, Renamed);
    }
  } // Fin de renameFile

  //=============================================================================================
  //  Rename
  //=============================================================================================

  function Rename(name, newName, callback) {
    var cmd = JSON.stringify({ FileName: name, NewFileName: newName });

    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: cmd,
      dataType: "json",
      crossDomain: true,
      url: GetRenameFct(),
      beforeSend: function (xhr) {
        if (xDashConfig.xDashBasicVersion != "true") {
          // Add authorization header
          var token = LoginMngr.GetSavedJwt();
          if (token) {
            xhr.setRequestHeader("Authorization", token);
          }
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (obj.Success) {
            if (callback != null) callback(obj, name);
          } else {
            let l_callback = PopCallBack("Rename", fileType, name);
            EndOfOperation(obj.Msg, "", "error", l_callback);
          }
        } else {
          let l_callback = PopCallBack("Rename", fileType, name);
          EndOfOperation(
            "Error while deleting the file",
            "",
            "error",
            l_callback
          );
        }
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        let l_callback = PopCallBack("Rename", fileType, name);
        EndOfOperation(
          "Sorry, could not delete the selected file",
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      }
    });
  } // Fin de Rename

  //=============================================================================================
  //  Renamed
  //=============================================================================================

  function Renamed(obj, name) {
    var l_callback = PopCallBack("Rename", fileType, name);
    EndOfOperation(obj, fileType, "success", l_callback);
  } // Fin de Renamed

  // --------------------------
  //
  // Get Thumbnail URL
  //
  // --------------------------

  //=============================================================================================
  //  getThumbnailURL
  //=============================================================================================

  function getThumbnailURL(type, name, callback, renewlink) {
    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      endCallback = callback;
      PushCallBack(callback, "GetURL", type, name);
      GetURL(fileName, GotURL, renewlink);
    }
  } // Fin de getThumbnailURL

  //=============================================================================================
  //  GetURL
  //=============================================================================================

  function GetURL(name, callback, renewlink) {
    var cmd;
    var url = GetPageFct();
    var strRenew = renewlink ? "true" : "false";
    if (fileType === "page")
      cmd = JSON.stringify({
        FileType: fileType,
        FileName: name,
        RenewLink: strRenew,
      });
    else cmd = JSON.stringify({ FileType: fileType, FileName: name });

    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      data: cmd,
      dataType: "json",
      crossDomain: true,
      url: url,
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (obj) {
          if (obj.Success) {
            callback(true, obj.Msg, name);
          } else callback(false, obj.Msg, name);
        } else callback(false, "Error while getting the thumbnail URL");
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        callback(
          false,
          "Sorry, could not get the thumbnail URL\n" +
            textStatus +
            " :\n" +
            txtErr,
          name
        );
      },
    });
  } // Fin de GetURL

  //=============================================================================================
  //  GotURL
  //=============================================================================================

  function GotURL(msg1, msg2, name) {
    var l_callback = PopCallBack("GetURL", fileType, name);
    if (l_callback != null) l_callback(msg1, msg2);
  } // Fin de GotURL

  // --------------------------
  //
  // View HTML page from server
  //
  // --------------------------

  //=============================================================================================
  //  viewPage
  //=============================================================================================

  function viewPage(type, name, callback) {
    endCallback = callback;

    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      PushCallBack(callback, "GetPage", fileType, fileName);
      GetPage(fileName, GotPage);
    } else EndOfOperation("Unknown data type", "", "error");
  } // Fin de viewPage

  //=============================================================================================
  //  getPage
  //=============================================================================================

  function getPage(Name, callback) {
    SetFileType("page");
    if (_.isUndefined(callback)) callback = getPageLinkCallback;
    GetPage(Name, callback);
  }

  //=============================================================================================
  //  GetPage
  //=============================================================================================

  function GetPage(Name, callback) {
    var cmd;
    var url = GetPageFct();
    var strRenew = "false";
    cmd = JSON.stringify({
      FileType: "page",
      FileName: Name,
      RenewLink: strRenew,
    });

    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: url,
      data: cmd,
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = jQuery.parseJSON(msg.d);
        if (callback != null) callback(obj, Name);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        var l_callback = PopCallBack("GetPage", fileType, Name);
        EndOfOperation(
          "Sorry, could not get the selected page",
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      },
    });
  } // Fin de GetPage

  //=============================================================================================
  //  GetPageLink
  //=============================================================================================

  function getPageLinkCallback(msg, finishCallback) {
    if (msg.Success) {
      var encodedUri = encodeURI(msg.Msg);
      swal(
        {
          title: "HTML page link",
          type: "input",
          closeOnConfirm: true,
          showCopyButton: true,
          inputValue: encodedUri,
        },
        function (inputValue) {
          if (_.isFunction(finishCallback)) finishCallback();
        }
      );
    }
  }

  //=============================================================================================
  //  GetPageLink
  //=============================================================================================

  function GetPageLink(Name) {
    return FileMngr.GetPage(Name, function (msg, e) {
      if (msg.Success) return msg.Msg;
    });
  } // Fin de GetPageLink

  //=============================================================================================
  //  ShowPageLink
  //=============================================================================================

  function ShowPageLink(Name) {
    FileMngr.GetPage(Name, getPageLinkCallback);
  } // Fin de ShowPageLink

  //=============================================================================================
  //  GotPage
  //=============================================================================================

  function GotPage(obj, name) {
    if (obj) {
      var l_callback = PopCallBack("GetPage", fileType, name);
      if (obj.Success) EndOfOperation(obj, name, "success", l_callback);
      else EndOfOperation(obj.Msg, "", "error", l_callback);
    }
  } // Fin de GotPage

  // ----------------------
  //
  // Manage Project Sharing
  //
  // ----------------------

  //=============================================================================================
  //  GetSharing
  //=============================================================================================

  function getSharing(name, type, callback) {
    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      endCallback = callback;
      if (type == "project" || type == "page") {
        PushCallBack(callback, "ProjectSharing", type, fileName);
        DoGetProjectSharing(fileName, EndOfProjectSharing);
      }
    }
  } // Fin de GetSharing

  //=============================================================================================
  //  DoGetProjectSharing
  //=============================================================================================

  function DoGetProjectSharing(name, callback) {
    var fct = fileType === "page" ? "GetPageSharing" : "GetProjectSharing";
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: AdminMngr.GetFileServer() + fct,
      data: JSON.stringify({ FileName: name }),
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = JSON.parse(msg.d);
        if (callback != null) callback(obj, name);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        var l_callback = PopCallBack("ProjectSharing", fileType, name);
        EndOfOperation(
          "Sorry, could not get the selected " + fileType,
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      },
    });
  } // Fin de DoGetProjectSharing

  //=============================================================================================
  //  EndOfProjectSharing
  //=============================================================================================

  function EndOfProjectSharing(obj, name) {
    if (obj) {
      var l_callback = PopCallBack("ProjectSharing", fileType, name);
      if (obj.Success) EndOfOperation(obj, name, "success", l_callback);
      else EndOfOperation(obj.Msg, "", "error", l_callback);
    }
  } // Fin de EndOfProjectSharing

  //=============================================================================================
  //  ShareProject
  //=============================================================================================
  function shareProject(name, type, email, isShared, callback) {
    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      endCallback = callback;
      if (type == "project" || type == "page") {
        PushCallBack(callback, "ShareProject", type, fileName);
        DoShareProject(fileName, email, isShared, ProjectShared);
      }
    }
  } // Fin de ShareProject

  //=============================================================================================
  //  ProjectShared
  //=============================================================================================

  function ProjectShared(obj, name, isShared) {
    if (obj) {
      var l_callback = PopCallBack("ShareProject", fileType, name);
      if (obj.Success) {
        var str = RemoveFileExtension(name);
        if (obj.Msg == "KO")
          EndOfOperation(
            '"' + str + '" is already in use',
            str,
            "warning",
            l_callback
          );
        else {
          var obj = fileType === "page" ? "Page" : "Project";
          var txt =
            obj +
            (isShared ? " successfully shared" : " successfully unshared");
          EndOfOperation(txt, str, "success", l_callback);
        }
      } else EndOfOperation(obj.Msg, name, "error", l_callback);
    }
  } // Fin de ProjectShared

  //=============================================================================================
  //  DoShareProject
  //=============================================================================================

  function DoShareProject(name, email, isShared, callback) {
    var fct = fileType === "page" ? "SharePage" : "ShareProject";
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: AdminMngr.GetFileServer() + fct,
      data: JSON.stringify({ FileName: name, Email: email, Shared: isShared }),
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = JSON.parse(msg.d);
        if (callback != null) callback(obj, name, isShared);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        var l_callback = PopCallBack("ShareProject", fileType, name);
        EndOfOperation(
          "Sorry, could not get the selected " + fileType,
          textStatus + " :\n" + txtErr,
          "error",
          l_callback
        );
      },
    });
  } // Fin de DoShareProject

  //=============================================================================================
  // SetPageAccess
  //=============================================================================================

  function setPageAccess(name, type, securedLink, callback) {
    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      endCallback = callback;
      if (type == "page") {
        DoSetPageAccess(fileName, securedLink, PageAccessSet);
      }
    }
  } // Fin de SetPageAccess

  //=============================================================================================
  // DoSetPageAccess
  //=============================================================================================

  function DoSetPageAccess(name, securedLink, callback) {
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: AdminMngr.GetFileServer() + "SetPageAccess",
      data: JSON.stringify({ FileName: name, Secured: securedLink }),
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = JSON.parse(msg.d);
        if (callback != null) callback(obj, name);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        EndOfOperation(
          "Sorry, could not access the selected " + fileType,
          textStatus + " :\n" + txtErr,
          "error"
        );
      },
    });
  } // Fin de DoSetPageAccess

  //=============================================================================================
  // PageAccessSet
  //=============================================================================================

  function PageAccessSet(obj, name) {
    if (obj) {
      if (obj.Success)
        EndOfOperation("Page access successfully set", name, "success");
      else EndOfOperation(obj.Msg, "", "error");
    }
  } // Fin de PageAccessSet

  //=============================================================================================
  //  CheckNewProjectName
  //=============================================================================================

  function checkNewProjectName(name, newName, type, email, callback) {
    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      var newFileName = CheckExtension(newName);
      endCallback = callback;
      if (type == "project" || type == "page") {
        DoCheckNewProjectName(fileName, newFileName, email, ProjectChecked);
      }
    }
  } // Fin de ShareProject

  //=============================================================================================
  //  DoCheckNewProjectName
  //=============================================================================================

  function DoCheckNewProjectName(name, newName, email, callback) {
    var fct = fileType === "page" ? "CheckNewPageName" : "CheckNewProjectName";
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: AdminMngr.GetFileServer() + fct,
      data: JSON.stringify({
        FileName: name,
        NewFileName: newName,
        Email: email,
      }),
      beforeSend: function (xhr) {
        if (xDashConfig.xDashBasicVersion != "true") {
          // Add authorization header
          var token = LoginMngr.GetSavedJwt();
          if (token) {
            xhr.setRequestHeader("Authorization", token);
          }
        }
      },
      success: function (msg) {
        var obj = JSON.parse(msg.d);
        if (callback != null) callback(obj, newName);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        EndOfOperation(
          "Sorry, could not check the selected " + fileType,
          textStatus + " :\n" + txtErr,
          "error"
        );
      }
    });
  } // Fin de DoCheckNewProjectName

  //=============================================================================================
  //  ProjectChecked
  //=============================================================================================

  function ProjectChecked(obj, name) {
    if (obj) {
      if (obj.Success) {
        var str = RemoveFileExtension(name);
        if (obj.Msg == "KO")
          EndOfOperation('"' + str + '" is already in use', str, "warning");
        else {
          EndOfOperation(obj, str, "success");
        }
      } else EndOfOperation(obj.Msg, "", "error");
    }
  } // Fin de ProjectChecked

  //=============================================================================================
  // GetStatus
  //=============================================================================================

  function getStatus(name, type, callback) {
    if (SetFileType(type)) {
      var fileName = CheckExtension(name);
      endCallback = callback;
      if (type == "project" || type == "page") {
        DoGetStatus(fileName, EndOfGetStatus);
      }
    }
  } // Fin de GetStatus

  //=============================================================================================
  // DoGetStatus
  //=============================================================================================

  function DoGetStatus(name, callback) {
    var fct = fileType === "page" ? "GetPageStatus" : "GetProjectStatus";
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: AdminMngr.GetFileServer() + fct,
      data: JSON.stringify({ FileName: name }),
      beforeSend: function (xhr) {
        if (xDashConfig.xDashBasicVersion != "true") {
          // Add authorization header
          var token = LoginMngr.GetSavedJwt();
          if (token) {
            xhr.setRequestHeader("Authorization", token);
          }
        }
      },
      success: function (msg) {
        var obj = JSON.parse(msg.d);
        if (callback != null) callback(obj, name);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        EndOfOperation(
          "Sorry, could not get the read-only status",
          textStatus + " :\n" + txtErr,
          "error"
        );
      }
    });
  } // Fin de DoGetStatus

  //=============================================================================================
  // EndOfGetStatus
  //=============================================================================================

  function EndOfGetStatus(obj, name) {
    if (obj) {
      if (obj.Success) EndOfOperation(obj, name, "success");
      else EndOfOperation(obj.Msg, "", "error");
    }
  } // Fin de EndOfGetStatus

  //=============================================================================================
  // GetMaintenanceInfo
  //=============================================================================================

  function getMaintenanceInfo(callback) {
    endCallback = callback;
    DoGetInfo(GotInfo);
  } // Fin de GetMaintenanceInfo

  //=============================================================================================
  // DoGetInfo
  //=============================================================================================

  function DoGetInfo(callback) {
    $.ajax({
      type: "POST",
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: AdminMngr.GetFileServer() + "GetInfoMessage",
      data: "",
      beforeSend: function (xhr) {
        // Add authorization header
        var token = LoginMngr.GetSavedJwt();
        if (token) {
          xhr.setRequestHeader("Authorization", token);
        }
      },
      success: function (msg) {
        var obj = JSON.parse(msg.d);
        if (callback != null) callback(obj);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        var txtErr = errorThrown;
        if (jqXHR.responseJSON && jqXHR.responseJSON.Message)
          txtErr = jqXHR.responseJSON.Message;
        EndOfOperation(
          "Sorry, could not get the maintenance message",
          textStatus + " :\n" + txtErr,
          "error"
        );
      },
    });
  } // Fin de DoGetInfo

  //=============================================================================================
  // GotInfo
  //=============================================================================================

  function GotInfo(obj) {
    if (obj) {
      if (obj.Success) EndOfOperation(obj, "", "success");
      else EndOfOperation(obj.Msg, "", "error");
    }
  } // Fin de GotInfo

  // -----------------------
  //
  // Miscellaneous functions
  //
  // -----------------------

  //=============================================================================================
  //  CheckExtension
  //=============================================================================================

  function CheckExtension(name) {
    var fileName = name;
    if (!_.isNull(fileName) && fileName !== "") {
      var ext = GetFileExt();
      if (!name.endsWith(ext)) fileName = fileName + ext;
    }
    return fileName;
  } // Fin de CheckExtension

  //=============================================================================================
  //  RemoveExtension: AEF
  //=============================================================================================

  function RemoveExtension(name) {
    var fileName = name;
    if (!_.isNull(fileName) && fileName !== "") {
      var ext = GetFileExt();
      if (name.endsWith(ext)) fileName = fileName.replace(ext, "");
    }
    return fileName;
  } // Fin de RemoveExtension

  //=============================================================================================
  //  SetFileType
  //=============================================================================================

  function SetFileType(type) {
    if (
      type === "fmi" ||
      type === "project" ||
      type === "datanode" ||
      type === "page" ||
      type === "settings" ||
      type === "avatar" ||
      type === "image" ||
      type === "pydata" ||
      type === "datanode" ||
      type === "template" ||
      type === "templateAdmin"
    ) {
      fileType = type;

      if (fileType === "templateAdmin") fileType = "template";
      return true;
    }

    fileType = null;
    return false;
  } // Fin de SetFileType

  //=============================================================================================
  //  PrepareSendData
  //=============================================================================================

  function PrepareSendData(name, start, data) {
    var json = "";

    if (fileType === "settings")
      json = JSON.stringify({ Offset: start, FileData: data });
    else
      json = JSON.stringify({ FileName: name, Offset: start, FileData: data });

    return json;
  } // Fin de PrepareSendData

  //=============================================================================================
  //  PrepareReadData
  //=============================================================================================

  function PrepareReadData(name, start) {
    var json = "";

    if (fileType === "settings" || fileType === "avatar")
      json = JSON.stringify({ Offset: start });
    else json = JSON.stringify({ FileName: name, Offset: start });

    return json;
  } // Fin de PrepareReadData

  //=============================================================================================
  //  PrepareDeleteData
  //=============================================================================================

  function PrepareDeleteData(name) {
    var json = "";

    if (fileType === "settings" || fileType === "avatar") json = "";
    else json = JSON.stringify({ FileName: name });

    return json;
  } // Fin de PrepareDeleteData

  //=============================================================================================
  //  GetEndMsg
  //=============================================================================================

  function GetEndMsg() {
    var res = "";

    if (fileType === "fmi") res = "FMI uploaded and unzipped";
    else if (fileType === "project") res = "Chalk'it project uploaded";
    else if (fileType === "settings") res = "User settings uploaded";
    else if (fileType === "avatar") res = "User avatar uploaded";
    else if (fileType === "datanode") res = "Datanode file uploaded";
    else if (fileType === "template") res = "Template file uploaded";
    else if (fileType === "page") res = "HTML page uploaded";
    else if (fileType === "pydata") res = "Python data file uploaded";

    return res;
  } // Fin de GetEndMsg

  //=============================================================================================
  //  GetServer
  //=============================================================================================

  function GetServer() {
    var addrPage = "../";
    var currentPage = window.location.href;
    if (currentPage && currentPage !== "") {
      addrPage = xServConfig.url;
    }
    return addrPage;
  } // Fin de GetServer

  //=============================================================================================
  //  GetServerAddr
  //=============================================================================================

  function GetServerAddr() {
    // Déterminer l'adresse du serveur
    var addrServer = GetServer();
    if (!addrServer) addrServer = "../";

    // Ajouter un slash à la fin, si nécessaire
    if (addrServer.slice(addrServer.length - 1) !== "/")
      addrServer = addrServer + "/";

    // Ajouter le nom du webservice
    // addrServer = addrServer + "xMAAS_Service.asmx/";
    addrServer = addrServer + "file_Service.asmx/";
    return addrServer;
  } // Fin de GetServerAddr

  //=============================================================================================
  //  GetSendFct
  //=============================================================================================

  function GetSendFct() {
    var res = AdminMngr.GetFileServer();
    var fct = "";

    if (fileType === "fmi") fct = "FmiUpload";
    else if (fileType === "project") fct = "SaveProject";
    else if (fileType === "datanode") fct = "SaveData";
    else if (fileType === "template") fct = "SaveTemplate";
    else if (fileType === "page") fct = "SavePage";
    else if (fileType === "settings") fct = "SaveSettings";
    else if (fileType === "avatar") fct = "SaveAvatar";
    else if (fileType === "pydata") fct = "SavePythonData";

    if (fct !== "") res = res + fct;

    return res;
  } // Fin de GetSendFct

  //=============================================================================================
  //  GetReadFct
  //=============================================================================================

  function GetReadFct() {
    var res = AdminMngr.GetFileServer();
    var fct = "";

    if (fileType === "fmi") fct = "FmiDownload";
    else if (fileType === "project") fct = "ReadProject";
    else if (fileType === "datanode") fct = "ReadData";
    else if (fileType === "template") fct = "ReadTemplate";
    else if (fileType === "page") fct = "ReadPage";
    else if (fileType === "settings") fct = "ReadSettings";
    else if (fileType === "avatar") fct = "ReadAvatar";
    else if (fileType === "image") fct = "ReadThumbnail";
    else if (fileType === "pydata") fct = "ReadPythonData";

    if (fct !== "") res = res + fct;

    return res;
  } // Fin de GetReadFct

  //=============================================================================================
  //  GetDeleteFct
  //=============================================================================================

  function GetDeleteFct() {
    var res = AdminMngr.GetFileServer();
    var fct = "";

    if (fileType === "fmi") fct = "FmiDelete";
    else if (fileType === "project") fct = "DeleteProject";
    else if (fileType === "datanode") fct = "DeleteData";
    else if (fileType === "template") fct = "DeleteTemplate";
    else if (fileType === "page") fct = "DeletePage";
    else if (fileType === "settings") fct = "DeleteSettings";
    else if (fileType === "avatar") fct = "DeleteAvatar";
    else if (fileType === "pydata") fct = "DeletePythonData";

    if (fct !== "") res = res + fct;

    return res;
  } // Fin de GetDeleteFct

  //=============================================================================================
  //  GetRenameFct
  //=============================================================================================

  function GetRenameFct() {
    var res = AdminMngr.GetFileServer();
    var fct = "";

    if (fileType === "project") fct = "RenameProject";
    else if (fileType === "page") fct = "RenamePage";
    if (fct !== "") res = res + fct;

    return res;
  } // Fin de GetRenameFct

  //=============================================================================================
  //  GetFileExt
  //=============================================================================================

  function GetFileExt(type) {
    var res = "";
    var typ = typeof type !== "undefined" ? type : fileType; // Utilisation du paramètre d'appel ou de la valeur stockée

    if (typ === "fmi") res = ".fmu";
    else if (typ === "project") res = ".xprjson";
    else if (typ === "datanode") res = ".xdsjson";
    else if (typ === "template") res = ".xprjson";
    else if (typ === "page") res = ".html";
    else if (typ === "settings") res = ".usr";
    else if (typ === "image") res = ".png";

    return res;
  } // Fin de GetFileExt

  //=============================================================================================
  //  GetFileMask
  //=============================================================================================

  function GetFileMask() {
    var res = GetFileExt();
    if (res !== "") res = "*" + res;

    var folder = GetSubFolder();
    if (folder !== "") res = folder + res;

    return res;
  } // Fin de GetFileMask

  //=============================================================================================
  //  GetSubFolder
  //=============================================================================================

  function GetSubFolder() {
    var res = "";
    if (fileType === "fmi") res = "FMU\\";
    else if (fileType === "project" || fileType === "datanode") res = "DASH\\";
    else if (fileType === "page") res = "HTML\\";
    else if (fileType === "image") res = "IMAGE\\";

    return res;
  } // Fin de GetSubFolder

  //=============================================================================================
  //  GetFilesFct
  //=============================================================================================

  function GetFilesFct() {
    var res = AdminMngr.GetFileServer();
    var fct = "";

    if (fileType === "pydata") fct = "GetPythonDataList";
    else {
      if (mostRecents) fct = "GetMostRecentFiles";
      else fct = "GetFiles";
    }

    if (fct !== "") res = res + fct;

    return res;
  } // Fin de GetFilesFct

  //=============================================================================================
  //  GetPageFct
  //=============================================================================================

  function GetPageFct() {
    var res = AdminMngr.GetFileServer();
    if (fileType === "page")
      // res = res + "GetPageAddress";
      res = res + "GetProtectedPageAddress";
    else res = res + "GetThumbnailAddress";
    return res;
  } // Fin de GetPageFct

  //=============================================================================================
  //  GetThumbnailFct
  //=============================================================================================

  function GetThumbnailFct() {
    var res = AdminMngr.GetFileServer();
    res = res + "GetThumbnailAddress";
    return res;
  } // Fin de GetThumbnailFct

  //=============================================================================================
  //  PushCallBack
  //=============================================================================================

  function PushCallBack(callback, fctName, type, param) {
    var key = fctName + "_" + type;
    if (param !== "") {
      key += "_" + param;
    }

    callBackMap.set(key, callback);
  } // Fin de PushCallBack

  //=============================================================================================
  //  PopCallBack
  //=============================================================================================

  function PopCallBack(fctName, type, param) {
    var key = fctName + "_" + type;
    if (param !== "") {
      key += "_" + param;
    }

    var l_callback = callBackMap.get(key);
    if (!_.isUndefined(l_callback)) callBackMap.delete(key);
    else console.log("lcallback undefined");

    return l_callback;
  } // Fin de PopCallBack

  //=============================================================================================
  //  EndOfOperation
  //=============================================================================================

  function EndOfOperation(msg1, msg2, type, callback) {
    var l_callback = null;
    if (_.isUndefined(callback)) l_callback = endCallback;
    else l_callback = callback;

    if (l_callback) {
      // Change capture error into warning
      var localType = type;
      if (localType === "error" && msg1.toLowerCase().includes("warning : "))
        localType = "warning";

      if (endCallbackParam1 != null) {
        if (endCallbackParam2 != null)
          l_callback(
            msg1,
            msg2,
            localType,
            endCallbackParam1,
            endCallbackParam2
          );
        else l_callback(msg1, msg2, localType, endCallbackParam1);
      } else l_callback(msg1, msg2, localType);
    }
  } // Fin de EndOfOperation
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
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } // Fin de b64DecodeUnicode

  //=============================================================================================
  // RemoveFileExtension
  //=============================================================================================

  function RemoveFileExtension(x) {
    return x.substring(0, x.lastIndexOf("."));
  } // Fin de RemoveFileExtension

  //=============================================================================================
  // Hash
  //=============================================================================================

  function Hash(Address, Host) {
    var data = JSON.stringify({
      Address: Address,
      Host: Host,
    });

    return b64EncodeUnicode(data);
  } // Fin de Hash

  //=============================================================================================
  //  String2Uint8Array
  //=============================================================================================

  function String2Uint8Array(s) {
    var bytes = new Uint8Array(s.length);
    for (var index = 0; index < s.length; index++) {
      bytes.set([s.charCodeAt(index)], index);
    }

    return bytes;
  } // Fin de String2Uint8Array

  //------------------
  //
  //  Public functions
  //
  //------------------

  return {
    SendFile: sendFile,
    SendText: sendText,
    GetFileList: getFileList,
    ReadFile: readFile,
    DeleteFile: deleteFile,
    RenameFile: renameFile,
    GetServerAddr: GetServerAddr,
    GetFileExt: GetFileExt,
    ViewPage: viewPage,
    Close: close,
    GetPage: getPage,
    GetPageLink: GetPageLink,
    ShowPageLink: ShowPageLink,
    GetThumbnailURL: getThumbnailURL,
    GetSharing: getSharing,
    ShareProject: shareProject,
    CheckNewProjectName: checkNewProjectName,
    GetStatus: getStatus,
    SetPageAccess: setPageAccess,
    GetMaintenanceInfo: getMaintenanceInfo,
    Hash4Proxy: Hash,
    AddPythonInfo: addPythonInfo,
    setEndAction: function (endAct) {
      endAction = endAct;
    },
  };
};

var FileMngr = FileMngrFct();
