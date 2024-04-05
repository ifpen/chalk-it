// +--------------------------------------------------------------------¦ \\
// ¦ Licensed under the MIT license.                                    ¦ \\
// +--------------------------------------------------------------------+ \\
// ¦ Updates by Mongi BEN GAID & Abir EL FEKI (IFPEN)                   ¦ \\
// +--------------------------------------------------------------------+ \\

if (!_.isUndefined(xServConfig.urlApiFMI)) {
  if (xServConfig.urlApiFMI != null) {
    (function () {
      var fmiDatanode = function (settings, updateCallback, statusCallback, bodyType, notificationCallback) {
        //initialize error at new instance
        error = false;

        var self = this;
        var currentSettings = settings;

        var requestURL = '';
        var reqDataType = 'JSON';
        var body = '';
        var RestResponseData = '';
        var jqXHR; //AEF
        var FMIWebServiceUrl = xServConfig.urlApiFMI;
        var text = '';

        this.getRestResponseData = function () {
          return RestResponseData;
        };
        this.updateNow = function (bCalledFromOrchestrator, bForceAutoStart) {
          // explicit trig!
          //if explicittrig is true, no execution when triggered by predecessor, except triggered by force
          if (currentSettings.explicitTrig && bCalledFromOrchestrator) {
            return { notTobeExecuted: true };
          }

          //Autostart
          //if autostart is false, no auto execution at creat/edit/load, except if triggered by predecessor or by force
          if (!currentSettings.autoStart && !(bForceAutoStart || bCalledFromOrchestrator)) {
            return { notTobeExecuted: true };
          }

          if (bForceAutoStart && currentSettings.sampleTime > 0) {
            // when refresh change autostart in setting (needed for periodic datanodes)
            currentSettings.autoStart = true;
          }
          statusCallback('Pending');
          webserviceRequest(requestURL, reqDataType, body, endRun);
          return true;
        };

        function WebserviceRequestSettings() {
          requestURL = FMIWebServiceUrl + currentSettings.FMI_webservice;

          if (bodyType != 'calculated') {
            body = currentSettings.body;
          }

          // format body
          if (body) {
            try {
              body = JSON.stringify(JSON.parse(body));
            } catch (e) {
              swal('Data Parse error', e.message, 'error');
            }
          }
          return true;
        }

        function webserviceRequest(requestURL, reqDataType, body, ajaxCallback) {
          var interval = null;
          if (jqXHR && jqXHR.readyState != 4) {
            jqXHR.abort();
          }

          jqXHR = $.ajax({
            url: requestURL,
            dataType: reqDataType,
            type: 'POST' || 'GET',
            data: body,
            responseType: 'arraybuffer',

            beforeSend: function (xhr) {
              try {
                xhr.setRequestHeader('Content-Type', 'application/json');
              } catch (e) {
                swal('Error', e.message, 'error');
              }
            },
            success: function (data, status, xhr) {
              //AEF: add security, sometimes after abort, response passes through success instead of error
              //AEF: test may be removed (abort fct is fixed)
              if (datanodesManager.getDataNodeByName(currentSettings.name).schedulerStatus() == 'Stop') {
                statusCallback('None', 'Request is aborted');
                updateCallback(undefined, 'None');
                notificationCallback('info', currentSettings.name, 'Response status 0 : abort');
                return false;
              }
              jqXHR = undefined;
              var respType = xhr.getResponseHeader('Content-Type');
              var respHdr = xhr.getAllResponseHeaders();
              // handling asp.net servers
              if (respType.match('application/json')) {
                RestResponseData = data;
                var names = [];
                var i = 0;
                for (var prop in data) {
                  names[i] = prop;
                  i++;
                }
                if (names.length == 1 && names[0] == 'd') {
                  try {
                    data = JSON.parse(data.d);
                  } catch (err) {
                    swal('Data parse error', err.message, 'error');
                    return;
                  }

                  try {
                    var tmp2 = JSON.parse(body);
                    if (!_.isUndefined(tmp2.SessionID) && !_.isUndefined(data.SessionID)) {
                      if (tmp2.SessionID == '') {
                        tmp2.SessionID = data.SessionID;
                        body = JSON.stringify(tmp2);
                      }
                    }
                  } catch (err) {
                    swal('Data parse error', err.message, 'error');
                    return;
                  }
                }
              } else if (respType.match('image')) {
                var b64 = base64ArrayBuffer(data);
                data = 'base64ImageDetected' + b64;
              } else {
                text = 'Response status ' + xhr.status + ' : ' + xhr.statusText + '.';
                notificationCallback('error', currentSettings.name, text + xhr.responseText);
                statusCallback('Error', text);
                updateCallback(undefined, 'Error');
                pastStatus = 'Error';
                return false;
              }
              statusCallback('Running');
              updateCallback(data, 'Running');
              text = 'Response status ' + xhr.status + ' : ' + xhr.statusText;
              if (ajaxCallback != null) {
                ajaxCallback(requestURL, reqDataType, body, data);
              } else {
                notificationCallback('success', currentSettings.name, text);
              }
              return true;
            },
            error: function (xhr, status, err) {
              var notifType = 'error';
              var statusType = 'Error';
              jqXHR = undefined;
              if (status === 'abort') {
                // it's an Abort request
                notifType = 'info';
                statusType = 'None';
              }

              text = 'Response status ' + xhr.status + ' : ' + xhr.statusText;
              pastStatus = 'Error';
              if (!_.isUndefined(xhr.responseText)) {
                var errorMessage = xhr.responseText.slice(
                  xhr.responseText.search('type'),
                  xhr.responseText.search('>')
                );
                notificationCallback(notifType, currentSettings.name, text + '. ' + errorMessage);
              } else {
                notificationCallback(notifType, currentSettings.name, text);
              }
              statusCallback(statusType, text);
              updateCallback(undefined, statusType);
              return false;
            },
            complete: function (xhr, status) {
              //To clear the interval on Complete
              clearInterval(interval);
            },
          });

          //AEF: network check for every 1 second
          interval = setInterval(function () {
            var isOnLine = navigator.onLine;
            if (isOnLine) {
              // online
            } else {
              if (!_.isUndefined(jqXHR)) {
                datanodesManager.getDataNodeByName(currentSettings.name).completeExecution('NOP');
                datanodesManager.getDataNodeByName(currentSettings.name).schedulerStatus('Stop');
                notificationCallback(
                  'error',
                  currentSettings.name,
                  "Internet is disconnected. Request of '" + currentSettings.name + "' wil be aborted"
                );
                jqXHR.abort();
              }
            }
          }, 1000);
        }

        function endRun(requestURL, reqDataType, body, data) {
          var bFound = false;
          for (var i = 0; i < datanodesManager.getAllDataNodes().length; i++) {
            if (datanodesManager.getAllDataNodes()[i].name() == currentSettings.name) {
              bFound = true;
              break;
            }
          }
          if (bFound) {
            if (!_.isUndefined(datanodesManager.getAllDataNodes()[i].latestData())) {
              if (!_.isUndefined(datanodesManager.getAllDataNodes()[i].latestData().Error)) {
                // For FMI WebService
                if (!datanodesManager.getAllDataNodes()[i].latestData().Error) {
                  if (datanodesManager.getAllDataNodes()[i].latestData().Status == '4') {
                    statusCallback('OK');
                    updateCallback(data);
                    pastStatus = 'OK';
                  } else {
                    // Can the body be converted to JSON?
                    if (body) {
                      try {
                        var tmp2 = JSON.parse(body);
                        if (!_.isUndefined(tmp2.StartFMU)) {
                          if (tmp2.StartFMU == 'true') {
                            tmp2.StartFMU = 'false';
                            body = JSON.stringify(tmp2);
                          }
                        }
                      } catch (e) {
                        swal('Data Parse error', e.message, 'error');
                      }
                    }
                    setTimeout(function () {
                      webserviceRequest(requestURL, reqDataType, body, endRun);
                    }, 200);
                  }
                } else {
                  statusCallback('Error', 'Error in FMIWebService');
                  updateCallback(undefined, 'Error');
                  pastStatus = 'Error';
                }
              } else {
                notificationCallback('success', currentSettings.name, text);
                statusCallback('OK');
                updateCallback(data);
                pastStatus = 'OK';
              }
            }
          } else {
            notificationCallback('success', currentSettings.name, text);
            statusCallback('OK');
            updateCallback(data);
            pastStatus = 'OK';
          }
        }

        this.onDispose = function () {};

        this.onSettingsChanged = function (newSettings, status) {
          if (status === 'OK') {
            pastStatus = status;
            pastSettings = currentSettings;
          }
          // Here we update our current settings with the variable that is passed in.
          currentSettings = newSettings;

          var bool = WebserviceRequestSettings();
          if (bool) pastSettings = currentSettings;
          return bool;
        };

        this.isSettingNameChanged = function (newName) {
          if (currentSettings.name != newName) return true;
          else return false;
        };

        this.isSettingSampleTimeChanged = function (newSampleTime) {
          if (currentSettings.sampleTime != newSampleTime) return true;
          else return false;
        };

        if (WebserviceRequestSettings()) error = false;
        else error = true;
        if (bodyType == 'calculated') {
          self.onCalculatedValueChanged = function (propertyName, val) {
            body = JSON.stringify(val);
            WebserviceRequestSettings();
          };
        }

        this.getXHR = function () {
          return jqXHR;
        };
        this.isSetValueValid = function () {
          return false;
        };

        self.isSetFileValid = function () {
          return false;
        };
      };

      function preFillBodyFMI() {
        var myObj;
        if (!_.isUndefined($('input#body')[0])) {
          //FMI_web-service_from_JSON_editor
          myObj = $('input#body');
          var json = JSON.parse(myObj[0].value);
          var comment = '';
          switch ($('select#select-option-FMI_webservice').val()) {
            case 'FmiExec':
              comment =
                ' { "ID": "", "FmuName": "", "SessionID": "", "Output": "", "Step": "", "Start": "", "End": "", "StartFMU": "" }';
              break;
            case 'FmiGetParams':
              comment = ' { "ID": "", "FmuName": ""}';
              break;
            case 'FmiSetParams':
              comment = ' { "ID": "", "FmuName": "", "Parameters": ""}';
              break;
            case 'FmiStop':
              comment = ' { "ID": "", "FmuName": "", "SessionID": ""}';
              break;
            case 'FmiParUpload':
              comment = ' { "ID": "", "FmuName": "", "Path": "", "Offset": "", FileData": ""}';
          }
          json._comment = JSON.parse(comment);
          myObj[0].value = JSON.stringify(json);
        } else if (!_.isUndefined($('textarea.calculated-value-input')[0])) {
          //FMI_web-service_from_datanode
          myObj = $('textarea.calculated-value-input');
          var script = myObj[0].value;
          script = script.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/, '$1'); // to remove first comment between /* */ from script
          switch ($('select#select-option-FMI_webservice').val()) {
            case 'FmiExec':
              myObj[0].value =
                '/*return {\n "ID": [string],\n "FmuName": [string],\n "SessionID": [string],\n "Output": [string],\n "Step": [string],\n "Start": [string],\n "End": [string],\n "StartFMU": [boolean] \n};*/\n' +
                script;
              break;
            case 'FmiGetParams':
              myObj[0].value = '/*return {\n "ID": [string],\n "FmuName": [string]\n};*/\n' + script;
              break;
            case 'FmiSetParams':
              myObj[0].value =
                '/*return {\n "ID": [string],\n "FmuName": [string],\n "Parameters": [string]\n};*/\n' + script;
              break;
            case 'FmiStop':
              myObj[0].value =
                '/*return {\n "ID": [string],\n "FmuName": [string],\n "SessionID": [string]\n};*/\n' + script;
              break;
            case 'FmiParUpload':
              myObj[0].value =
                '/*return {\n "ID": [string],\n "FmuName": [string],\n "Path": [string],\n "Offset": [string],\n "FileData": [string]\n};*/\n' +
                script;
              break;
          }
        }

        var evt = new CustomEvent('change');
        $('textarea.calculated-value-input')[0].dispatchEvent(evt);
      }
      var error = false;
      datanodesManager.loadDatanodePlugin({
        type_name: 'FMI_web-service_from_datasource',
        display_name: 'FMI Web-service',
        icon_type: 'fmi.svg',
        description: 'FMI Web-service from dataNode workspace',
        settings: [
          {
            name: 'FMI_webservice',
            display_name: 'FMI Web-service',
            type: 'option',
            options: [
              {
                name: 'FmiExec',
                value: 'FmiExec',
              },
              {
                name: 'FmiGetParams',
                value: 'FmiGetParams',
              },
              {
                name: 'FmiSetParams',
                value: 'FmiSetParams',
              },
              {
                name: 'FmiStop',
                value: 'FmiStop',
              },
              {
                name: 'FmiParUpload',
                value: 'FmiParUpload',
              },
            ],
          },
          {
            name: 'sampleTime',
            display_name: 'Sample time',
            type: 'number',
            suffix: 'seconds',
            default_value: 0,
          },
          {
            name: 'autoStart',
            display_name: 'AUTO START',
            description: 'DataNode is executed automatically at start (project load, its creation/modification).',
            type: 'boolean',
            default_value: true,
          },
          {
            name: 'explicitTrig',
            display_name: 'Explicit trigger',
            description:
              'DataNode is executed only if triggered explicitly (no execution when its predecessors are updated). It is executed automatically once when AutoStart is “YES”.',
            type: 'boolean',
            default_value: false,
          },
          {
            name: 'bodyPrefill',
            display_name: 'Pre fill body',
            description: 'Pre fill the body with API FMI web-services help.',
            type: 'boolean',
            default_value: true,
          },
          {
            name: 'body',
            display_name: 'Body',
            type: 'calculated',
            description1: 'Insert the body of the request, method POST is used.',
            description2: 'Browse and select a dataNode from workspace to use it in the body.',
            default_value:
              '/*return {\n "ID": [string],\n "FmuName": [string],\n "SessionID": [string],\n "Output": [string],\n "Step": [string],\n "Start": [string],\n "End": [string],\n "StartFMU": [boolean] \n};*/',
          },
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
          newInstanceCallback(
            new fmiDatanode(settings, updateCallback, statusCallback, 'calculated', notificationCallback)
          );
          if (error) return false;
          else return true;
        },
        preFillBody: function preFillBody() {
          preFillBodyFMI();
        },
      });

      if (xDashConfig.jsonEditorDatanodes) {
        datanodesManager.loadDatanodePlugin({
          type_name: 'FMI_web-service_from_JSON_editor',
          display_name: 'FMI Web-service from JSON editor',
          description: 'FMI Web-service from JSON editor',
          settings: [
            {
              name: 'FMI_webservice',
              display_name: 'FMI Web-service',
              type: 'option',
              options: [
                {
                  name: 'FmiExec',
                  value: 'FmiExec',
                },
                {
                  name: 'FmiGetParams',
                  value: 'FmiGetParams',
                },
                {
                  name: 'FmiSetParams',
                  value: 'FmiSetParams',
                },
                {
                  name: 'FmiStop',
                  value: 'FmiStop',
                },
                {
                  name: 'FmiParUpload',
                  value: 'FmiParUpload',
                },
              ],
            },
            {
              name: 'sampleTime',
              display_name: 'Sample time',
              type: 'number',
              suffix: 'seconds',
              default_value: 0,
            },
            {
              name: 'autoStart',
              display_name: 'AUTO START',
              description: 'DataNode is executed automatically at start (project load, its creation/modification).',
              type: 'boolean',
              default_value: true,
            },
            {
              name: 'bodyPrefill',
              display_name: 'Pre fill body',
              description: 'Pre fill the body with API FMI web-services help.',
              type: 'boolean',
              default_value: true,
            },
            {
              name: 'body',
              display_name: 'Body',
              type: 'json',
              description: 'Insert the body of the request, method POST is used.',
              default_value:
                '{"_comment": { "ID": "", "FmuName": "", "SessionID": "", "Output": "", "Step": "", "Start": "", "End": "", "StartFMU": "" }}',
            },
          ],
          newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
            newInstanceCallback(
              new fmiDatanode(settings, updateCallback, statusCallback, 'JSON', notificationCallback)
            );
            if (error) return false;
            else return true;
          },
          preFillBody: function preFillBody() {
            preFillBodyFMI();
          },
        });
      }
    })();
  }
}
