// +--------------------------------------------------------------------+ \\
// ¦ Updates by Mongi BEN GAID & Abir EL FEKI (IFPEN)                   ¦ \\
// +--------------------------------------------------------------------+ \\

(function () {
  var jsonDatanode = function (settings, updateCallback, statusCallback, bodyType, notificationCallback) {
    //initialize error at new instance
    error = false;

    var self = this;
    var currentSettings = settings;
    // save past setting in case of cancelling modification in datanodes
    var pastSettings = settings;
    var pastStatus = 'None';

    var reqDataType = 'JSON';
    var body = '';
    var requestURL = '';
    var jqXHR; //AEF
    var jqXHR_hash; //AEF
    var jbody = {};

    this.updateNow = function (bCalledFromOrchestrator, bForceAutoStart) {
      // explicit trig!
      if (!_.isUndefined(bCalledFromOrchestrator)) {
        if (!_.isUndefined(currentSettings.explicitTrig)) {
          if (currentSettings.explicitTrig) {
            if (bCalledFromOrchestrator == true) return { notTobeExecuted: true };
          }
        }
      }

      //Autostart
      if (!bForceAutoStart && currentSettings.autoStart === false) {
        return { notTobeExecuted: true };
      }
      if (bForceAutoStart && currentSettings.sampleTime > 0) {
        // when refresh change autostart in setting (needed for periodic datanodes)
        currentSettings.autoStart = true;
      }

      statusCallback('Pending');
      webserviceRequest(requestURL, reqDataType, body);
      return true; //ABK;
    };

    function WebserviceRequestSettings() {
      var targetURL = currentSettings.url;
      requestURL = currentSettings.url;

      switch (currentSettings.resp_data_type) {
        case 'JSON':
          reqDataType = 'json';
          break;
        case 'binary':
          reqDataType = 'binary';
          break;
        case 'text':
          reqDataType = 'text';
          break;
      }

      if (currentSettings.use_xproxy) {
        switch (currentSettings.method) {
          case 'GET':
            requestURL = xServConfig.urlxProxy + 'Get';
            break;
          case 'POST':
            requestURL = xServConfig.urlxProxy + 'Post';
            break;
          case 'PUT':
            requestURL = xServConfig.urlxProxy + 'Put';
            break;
          case 'DELETE':
            requestURL = xServConfig.urlxProxy + 'Delete';
            break;
          // MBG to be completed
        }
      }

      if (bodyType != 'calculated') {
        body = currentSettings.body;
      }

      // append urlAppend object of body in url, for GET reqs
      if (body) {
        try {
          jbody = JSON.parse(body);
          if (currentSettings.method == 'GET') {
            body = '';
          }
        } catch (e) {
          swal('JSON Parse error', e.message, 'error');
          return false;
        }
        if (!_.isUndefined(jbody) && !_.isNull(jbody))
          if (!_.isUndefined(jbody.urlAppend)) {
            if (currentSettings.use_xproxy) {
              targetURL = currentSettings.url + jbody.urlAppend;
            } else {
              requestURL = requestURL + jbody.urlAppend;
            }
          }
      }
      //}

      // format body
      if (currentSettings.use_xproxy) {
        var headers = {};
        _.each(currentSettings.headers, function (header) {
          var name = header.name;
          var value = header.value;
          headers[name] = value;
        });

        //AEF: to add headers from datanodes; e.g for token
        if (!_.isUndefined(jbody) && !_.isNull(jbody)) {
          if (!_.isUndefined(jbody.headersFromDataNodeWS)) {
            for (var param in jbody.headersFromDataNodeWS) {
              headers[param] = jbody.headersFromDataNodeWS[param];
            }
          }
        }
        //

        var tBody = '';
        if (body) {
          let tpbody = JSON.parse(body);
          if (!_.isUndefined(tpbody) && !_.isNull(tpbody)) {
            if (!_.isUndefined(tpbody.headersFromDataNodeWS)) {
              delete tpbody.headersFromDataNodeWS;
            }
          }
          if (!_.isUndefined(tpbody) && !_.isNull(tpbody)) {
            if (!_.isUndefined(tpbody.urlAppend)) {
              delete tpbody.urlAppend;
            }
          }
          tBody = JSON.stringify(tpbody);
        }

        body = {
          URL: targetURL,
          Body: tBody,
          Headers: JSON.stringify(headers),
        };
        body = JSON.stringify(body);
      } else {
        // Can the body be converted to JSON?
        if (body) {
          try {
            let tpbody = JSON.parse(body);
            if (!_.isUndefined(tpbody) && !_.isNull(tpbody)) {
              if (!_.isUndefined(tpbody.headersFromDataNodeWS)) {
                delete tpbody.headersFromDataNodeWS;
              }
            }
            if (!_.isUndefined(tpbody) && !_.isNull(tpbody)) {
              if (!_.isUndefined(tpbody.urlAppend)) {
                delete tpbody.urlAppend;
              }
            }
            body = JSON.stringify(tpbody);
            //body = JSON.stringify(JSON.parse(body)); // MBG added stringify. To keep?
          } catch (e) {
            swal('Data Parse error', e.message, 'error');
            return false;
          }
        }
      }

      // with xProxy we ask for JSON return, to get xProxy status and response headers (issue #154)
      if (currentSettings.use_xproxy) {
        reqDataType = 'json';
      }
      //-------------------------------------------------------
      //AEF:  secured xproxy
      function addHeaders() {
        let bodyObj = JSON.parse(body);
        let headers = JSON.parse(bodyObj.Headers);
        headers['ProxyCode-Hash'] = currentSettings.proxyHash;
        headers['ProxyCode-Sig'] = currentSettings.proxySig;
        bodyObj.Headers = JSON.stringify(headers);
        body = JSON.stringify(bodyObj);
      }
      if (currentSettings.use_xproxy) {
        if (_.isUndefined(currentSettings.proxyHash)) currentSettings.proxyHash = '';
        if (_.isUndefined(currentSettings.proxySig)) currentSettings.proxySig = '';

        let FileMngrInst = new FileMngrFct();
        // let bodyObj = JSON.parse(body);
        proxyHashTemp = FileMngrInst.Hash4Proxy(targetURL, 'xdash');

        if (currentSettings.proxyHash === '' || !currentSettings.proxyHash.localeCompare(proxyHashTemp)) {
          currentSettings.proxyHash = proxyHashTemp;

          let data = JSON.stringify({ Hash: currentSettings.proxyHash });
          jqXHR_hash = $.ajax({
            url: xServConfig.urlxProxy + 'Sign',
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            data: data,
            success: function (msg) {
              var obj = jQuery.parseJSON(msg.d);
              if (obj.Success) {
                currentSettings.proxySig = obj.Msg;
                //add headers to existing body
                addHeaders();
                return true;
              } else {
                swal('Proxy signing error', obj.Msg, 'error');
                currentSettings.proxySig = '';
                return false;
              }
            },
            error: function (xhr, status, err) {
              swal('Proxy signing error', xhr.statusText, 'error');
              currentSettings.proxySig = '';
              return false;
            },
          });
        } else {
          //add headers to existing body
          addHeaders();
        }
      }
      //-------------------------------------------------------
      return true; //ABK;
    }

    function webserviceRequest(requestURL, reqDataType, data) {
      //AEF
      if (jqXHR && jqXHR.readyState != 4) {
        jqXHR.abort();
      }
      //-------------------------------------------------------
      //AEF:  secured xproxy
      if (jqXHR_hash && jqXHR_hash.readyState != 4) {
        jqXHR_hash.done(function () {
          //wait for hash response
          data = body; //update body with hash
          callWebservice(requestURL, reqDataType, data);
        });
      } else {
        callWebservice(requestURL, reqDataType, data);
      }
      //-------------------------------------------------------
    }

    function callWebservice(requestURL, reqDataType, body) {
      let interval = null; //AEF
      const useMethod = currentSettings.use_xproxy ? 'POST' : currentSettings.method;
      jqXHR = $.ajax({
        url: requestURL,
        //headers: { "Content-Type": "application/json", "ProxyCode-Hash": proxyHash, "ProxyCode-Sig": proxySig },
        dataType: reqDataType,
        type: useMethod || 'GET',
        data: body,
        responseType: 'arraybuffer',

        beforeSend: function (xhr) {
          try {
            if (!currentSettings.use_xproxy) {
              _.each(currentSettings.headers, function (header) {
                var name = header.name;
                var value = header.value;

                if (!_.isUndefined(name) && !_.isUndefined(value)) {
                  xhr.setRequestHeader(name, value);
                }
              });
              //AEF: to add headers from datanodes; e.g for token
              if (!_.isUndefined(jbody) && !_.isNull(jbody)) {
                if (!_.isUndefined(jbody.headersFromDataNodeWS)) {
                  for (var param in jbody.headersFromDataNodeWS) {
                    xhr.setRequestHeader(param, jbody.headersFromDataNodeWS[param]);
                  }
                }
              }
              //
            } else {
              xhr.setRequestHeader('Content-Type', 'application/json');
              //  xhr.setRequestHeader("ProxyCode-Hash", currentSettings.proxyHash);
              //  xhr.setRequestHeader("ProxyCode-Sig", currentSettings.proxySig);
            }
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
          jqXHR = undefined; //AEF
          const respType = xhr.getResponseHeader('Content-Type');
          // handling asp.net servers
          if (reqDataType === 'json') {
            if (currentSettings.use_xproxy) {
              // xProxy handling
              const names = Object.keys(data);
              if (names.length === 1 && names[0] === 'd') {
                // data = data.d; // TODO MBG : infinite loop in matching box to solve
                try {
                  data = JSON.parseMore(data.d);
                } catch (err) {
                  statusCallback('Error', 'Data parse error');
                  pastStatus = 'Error';
                  notificationCallback('error', currentSettings.name, 'Data parse error : ' + err.message);
                  bFinishTick = true;
                  return;
                }

                if (data.Success) {
                  if (!_.isUndefined(data.Body)) {
                    // safety.  MBG : is it really needed ?
                    if (_.isUndefined(data.Headers['Content-Type'])) {
                      if (_.isNull(data.Body)) {
                        statusCallback('OK'); // MBG for scheduler
                        updateCallback(null);
                        notificationCallback('success', currentSettings.name, data.Message);
                        pastStatus = 'OK';
                        return true;
                      }
                    } else {
                      const wsrespType = data.Headers['Content-Type'];
                      const [type, charset] = decodeMimeType(wsrespType);
                      const mime = stripUndefined({ type, charset });
                      if (wsrespType.match('application/json')) {
                        try {
                          data = JSON.parseMore(data.Body);
                        } catch (err) {
                          statusCallback('Error', 'Data parse error');
                          pastStatus = 'Error';
                          notificationCallback('error', currentSettings.name, 'Data parse error : ' + err.message);
                          bFinishTick = true;
                          return;
                        }
                      } else if (wsrespType.startsWith('text')) {
                        data = { content: data.Body, ...mime };
                      } else {
                        const content = data.Body; // Already base 64
                        data = { content, isBinary: true, ...mime };
                      }
                      const text = `Response status ${xhr.status}: ${xhr.statusText}`;
                      notificationCallback('success', currentSettings.name, text);
                    }
                  }
                } else {
                  var ErrorMessage = '';
                  if (!_.isUndefined(data.Message)) {
                    ErrorMessage =
                      'xProxy returned error at dataNode "' + currentSettings.name + '" : "' + data.Message + '"';
                  } else {
                    ErrorMessage = 'xProxy returned error at dataNode "' + currentSettings.name + '"';
                  }
                  //AEF
                  const text = 'Response status ' + xhr.status + ' :' + ErrorMessage;
                  notificationCallback('error', currentSettings.name, text);
                  //
                  pastStatus = 'Error';
                  statusCallback('Error', text);
                  return false;
                }
              } else {
                const text = `Response status ${xhr.status}: ${xhr.statusText}`;
                notificationCallback('success', currentSettings.name, text);
              }
            } else {
              const text = `Response status ${xhr.status}: ${xhr.statusText}`;
              notificationCallback('success', currentSettings.name, text);
            }
          } else {
            // reqDataType is either 'text' or 'binary'
            const isBinary = reqDataType !== 'text';

            const [type, charset] = decodeMimeType(respType);
            const mime = stripUndefined({ type, charset });
            const content = isBinary ? base64ArrayBuffer(data) : data;
            data = { content, isBinary, ...mime };

            const text = `Response status ${xhr.status}: ${xhr.statusText}`;
            notificationCallback('success', currentSettings.name, text);
          }
          statusCallback('OK'); // MBG for scheduler
          updateCallback(data);
          pastStatus = 'OK';
          return true;
        },
        error: function (xhr, status, err) {
          //AEF
          var notifType = 'error';
          var statusType = 'Error';
          jqXHR = undefined;
          if (status === 'abort') {
            //it's an Abort request
            notifType = 'info';
            statusType = 'None';
          }
          //
          const text = `Response status ${xhr.status}: ${xhr.statusText}. Ajax status: ${status}.`;
          pastStatus = 'Error';
          if (!_.isUndefined(xhr.responseText)) {
            var errorMessage = '';
            var index1 = xhr.responseText.search('type');
            var index2 = xhr.responseText.search('>');
            if (index1 != -1 && index2 != -1) errorMessage = xhr.responseText.slice(index1, index2);
            else errorMessage = xhr.responseText;
            notificationCallback(notifType, currentSettings.name, text + '. ' + errorMessage);
          } else {
            notificationCallback(notifType, currentSettings.name, text);
          }

          statusCallback(statusType, text);
          updateCallback(undefined, statusType);
          return false;
          //
        },
        complete: function (xhr, status) {
          //AEF
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

    this.onDispose = function () {};

    this.onSettingsChanged = function (newSettings, status) {
      if (status === 'OK') {
        pastStatus = status;
        pastSettings = currentSettings;
      }
      // Here we update our current settings with the variable that is passed in.
      currentSettings = newSettings;
      for (var i = 0; i < currentSettings.headers.length; i++) {
        if (currentSettings.headers[i].name === '') {
          currentSettings.headers.splice(i, i + 1);
        }
      }

      var bool = WebserviceRequestSettings();
      if (bool) pastSettings = currentSettings;
      return bool; //ABK
    };

    this.isSettingNameChanged = function (newName) {
      if (currentSettings.name != newName) return true;
      else return false;
    };

    // AEF comment here to inhibite memory of past values
    // self.getSavedSettings = function() {
    //     return [pastStatus, pastSettings];
    // };

    //AEF
    this.isSettingSampleTimeChanged = function (newSampleTime) {
      if (currentSettings.sampleTime != newSampleTime) return true;
      else return false;
    };

    //AEF
    this.getXHR = function () {
      return jqXHR;
    };

    this.canSetValue = function () {
      return false;
    };

    self.isInternetNeeded = function () {
      return true;
    };

    if (WebserviceRequestSettings()) error = false;
    else error = true;

    if (bodyType == 'calculated') {
      self.onCalculatedValueChanged = function (propertyName, val) {
        body = JSON.stringify(val); // MBG temporary
        WebserviceRequestSettings();
      };
    }
  };

  function preFillHeaders() {
    if (!_.isUndefined($('input#table-row-value-headers0')[0])) {
      //FMI_web-service_from_JSON_editor
      var Objname = $('input#table-row-value-headers0');
      var Objval = $('input#table-row-value-headers1');

      switch ($('select#select-option-req_data_type').val()) {
        case 'JSON':
          Objname[0].value = 'Content-Type';
          Objval[0].value = 'application/json';
          break;
        case 'none':
          Objname[0].value = '';
          Objval[0].value = '';
          break;
      }

      var evt = new CustomEvent('change');
      $('input#table-row-value-headers0')[0].dispatchEvent(evt);
      $('input#table-row-value-headers1')[0].dispatchEvent(evt);
    } else {
      console.log('headers table is empty');
    }
  }

  var error = false;
  datanodesManager.loadDatanodePlugin({
    type_name: 'REST_web-service_from_datasource',
    display_name: 'REST Web-service',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'web-service-datasource.svg',
    description: 'REST Web-service from dataNode workspace',
    settings: [
      {
        name: 'url',
        display_name: 'URL',
        type: 'text',
        required: true, //ABK
      },
      {
        name: 'use_xproxy',
        display_name: 'Use xProxy',
        description:
          'xProxy allows your browser to call cross-domain REST APIs (which solves browser CORS policy issues). Keep this parameter to true, unless your distant REST API allows your browser to be called in a cross-origin context.',
        type: 'boolean',
        default_value: true,
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
        description: 'Start web-service automatically after dashboard play begins or after creation or modification.',
        type: 'boolean',
        default_value: true,
      },
      {
        name: 'explicitTrig',
        display_name: 'Explicit trigger',
        description:
          'Execute web-service only if triggered explicitly : no execution when predecessor dataNodes are modified.',
        type: 'boolean',
        default_value: false,
      },
      {
        name: 'req_data_type',
        display_name: 'Request data-type',
        type: 'option',
        description: 'Choose the web-service request data-type that prefill automatically the first header.',
        options: [
          {
            name: 'JSON',
            value: 'JSON',
          },
          {
            name: 'none',
            value: 'none',
          },
        ],
      },
      {
        name: 'resp_data_type',
        display_name: 'Response data-type',
        type: 'option',
        description: 'Choose the response data-type expected from the web-service.',
        options: [
          {
            name: 'JSON',
            value: 'JSON',
          },
          {
            name: 'binary',
            value: 'binary',
          },
          {
            name: 'text',
            value: 'text',
          },
        ],
      },
      {
        name: 'method',
        display_name: 'Method',
        type: 'option',
        options: [
          {
            name: 'GET',
            value: 'GET',
          },
          {
            name: 'POST',
            value: 'POST',
          },
          {
            name: 'PUT',
            value: 'PUT',
          },
          {
            name: 'DELETE',
            value: 'DELETE',
          },
        ],
      },
      {
        name: 'body',
        display_name: 'Body',
        type: 'calculated',
        //description: "The body of the request. Normally only used if method is POST"
        description1:
          'Insert the body of the request. Normally only used if method is POST. If the method is GET, the content of urlAppend object will be appended to the URL. The content of headersFromDataNodeWS will be injected to headers',
        description2: 'Browse and select a dataNode from workspace to use it in the body.',
      },
      {
        name: 'headers',
        display_name: 'Headers',
        type: 'array',
        settings: [
          {
            name: 'name',
            display_name: 'Name',
            type: 'text',
          },
          {
            name: 'value',
            display_name: 'Value',
            type: 'text',
          },
        ],
        default_value: [{ name: 'Content-Type', value: 'application/json' }],
        description: "The first header is 'READ ONLY' and reserved for Request Data-Type.",
      },
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
      newInstanceCallback(
        new jsonDatanode(settings, updateCallback, statusCallback, 'calculated', notificationCallback)
      );
      if (error)
        //ABK
        return false;
      else return true;
    },
    preFillBody: function preFillBody() {
      preFillHeaders();
    },
  });

  if (xDashConfig.jsonEditorDatanodes) {
    datanodesManager.loadDatanodePlugin({
      type_name: 'REST_web-service_from_JSON_editor',
      display_name: 'REST Web-service from JSON editor',
      // **icon_type** : icon of the datanode type displayed in data list
      icon_type: 'web-service-json-editor.svg',
      description: 'REST Web-service from JSON editor',
      settings: [
        {
          name: 'url',
          display_name: 'URL',
          type: 'text',
          required: true, //ABK
        },
        {
          name: 'use_xproxy',
          display_name: 'Use xProxy',
          description:
            'If that also fails due to CORS policy, you can use xProxy, which can solve many connection problems to APIs.',
          type: 'boolean',
          default_value: true,
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
          description: 'Start web-service automatically after dashboard play begins or after creation or modification.',
          type: 'boolean',
          default_value: true,
        },
        {
          name: 'req_data_type',
          display_name: 'Request data-type',
          type: 'option',
          description: 'Choose the web-service request data-type that prefill automatically the first header.',
          options: [
            {
              name: 'JSON',
              value: 'JSON',
            },
            {
              name: 'none',
              value: 'none',
            },
          ],
        },
        {
          name: 'resp_data_type',
          display_name: 'Response data-type',
          type: 'option',
          description: 'Choose the response data-type expected from the web-service.',
          options: [
            {
              name: 'JSON',
              value: 'JSON',
            },
            {
              name: 'binary',
              value: 'binary',
            },
            {
              name: 'text',
              value: 'text',
            },
          ],
        },

        {
          name: 'method',
          display_name: 'Method',
          type: 'option',
          options: [
            {
              name: 'GET',
              value: 'GET',
            },
            {
              name: 'POST',
              value: 'POST',
            },
            {
              name: 'PUT',
              value: 'PUT',
            },
            {
              name: 'DELETE',
              value: 'DELETE',
            },
          ],
        },
        {
          name: 'body',
          display_name: 'Body',
          type: 'json',
          description:
            'The body of the request. Normally only used if method is POST. If the method is GET, the content of "urlAppend" object it will be appended to the URL.',
        },
        {
          name: 'headers',
          display_name: 'Headers',
          type: 'array',
          settings: [
            {
              name: 'name',
              display_name: 'Name',
              type: 'text',
            },
            {
              name: 'value',
              display_name: 'Value',
              type: 'text',
            },
          ],
          default_value: [{ name: 'Content-Type', value: 'application/json' }],
          description: "The first header is 'READ ONLY' and reserved for Request Data-Type.",
        },
      ],
      newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
        newInstanceCallback(new jsonDatanode(settings, updateCallback, statusCallback, 'JSON', notificationCallback));
        if (error)
          //ABK
          return false;
        else return true;
      },
      preFillBody: function preFillBody() {
        preFillHeaders();
      },
    });
  }
})();
