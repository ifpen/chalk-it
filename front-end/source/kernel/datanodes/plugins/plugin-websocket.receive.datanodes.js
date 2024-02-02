/**
 * @author AR
 * @description
 * This Datanode is used to receive data through Web socket. It's allow Chalk'it to retrieve data
 */

import _ from 'underscore';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

// ### Datanode Definition
//
// -------------------
/**
 * Plugin code for the Websocket receive datanode Plugin
 *
 * @param settings
 * @param updateCallback
 * @constructor
 */
(function () {
  var Websocket_receive_Plugin = function (
    settings,
    updateCallback,
    statusCallback,
    notificationCallback,
    statusForSchedulerCallback
  ) {
    var self = this;
    var wsUri = '';
    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    var currentSettings = settings;
    // save past setting in case of cancelling modification in datanodes
    var pastSettings = settings;
    var pastStatus = 'None';

    var wsConn;
    var debug = true;
    var bFirstExec = true;
    var new_data = new Array();
    var bFirstTime = true;
    var last_received_data = '';
    var _socketReady = false;
    var oneErrorNotif = true;
    // Default WS settings
    var WSOptions = {
      /** Whether this instance should log debug messages. */
      debug: true,

      /** Whether or not the websocket should attempt to connect immediately upon instantiation. */
      automaticOpen: true,

      /** The number of milliseconds to delay before attempting to reconnect. */
      reconnectInterval: 1000,
      /** The maximum number of milliseconds to delay a reconnection attempt. */
      maxReconnectInterval: 30000,
      /** The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. */
      reconnectDecay: 1.5,

      /** The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. */
      timeoutInterval: 2000,

      /** The maximum number of reconnection attempts to make. Unlimited if null. */
      maxReconnectAttempts: 4,

      /** The binary type, possible values 'blob' or 'arraybuffer', default 'arraybuffer'. */
      binaryType: 'arraybuffer',
    };

    var onOpen = function () {
      console.info('Connected to server ', wsUri);
      notificationCallback('success', currentSettings.name, 'Connected to server ' + wsUri);
      _socketReady = true;
      oneErrorNotif = true;
      if (!_.isUndefined(currentSettings.init_value)) bFirstExec = true;
      //transmitted the initial value to the network
      statusForSchedulerCallback('Ready');
    };

    var onClose = function () {
      console.info('WebSocket Connection is closed...');
      notificationCallback('info', currentSettings.name, 'WebSocket Connection is closed...');
      if (_socketReady) {
        // in case of a close and not after an error
        statusForSchedulerCallback('Stop');
      }
      _socketReady = false;
    };

    var onError = function (error) {
      if (debug) console.debug('WebSocket  (%s) OnError ', wsUri, error);
      if (oneErrorNotif) {
        notificationCallback('error', currentSettings.name, 'WebSocket  (' + wsUri + ') error');
        oneErrorNotif = false;
      }
      statusForSchedulerCallback('NotReady');
      _socketReady = false;
    };

    var onMessage = function (event) {
      last_received_data = event.data;
      if (bFirstTime) {
        //in init state
        bFirstTime = false;
        if (debug) console.info('WebSocket received ', event.data);
        if (typeof event.data === 'string' || event.data instanceof String) {
          new_data = event.data;
        } else new_data = processedData(event.data, currentSettings.decoding_options);
        // update new data to MyViz widgets
        statusCallback('OK');
        updateCallback(new_data);
        if (debug) console.info('Data processed ', new_data);
      } else {
        statusForSchedulerCallback('Ready'); // to trigger scheduler
      }
    };

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function (newSettings, status) {
      if (status === 'OK') {
        pastStatus = status;
        pastSettings = currentSettings;
      }

      if (
        currentSettings.host != newSettings.host ||
        currentSettings.port != newSettings.port ||
        !_socketReady ||
        (!_.isUndefined(newSettings.init_value) && currentSettings.init_value != newSettings.init_value)
      ) {
        // create a new socket if needed
        currentSettings = newSettings;
        bFirstTime = true;
        statusForSchedulerCallback('Wait');
        createWebSocket();
      } else {
        currentSettings = newSettings;
      }
      pastSettings = currentSettings;
      return true;
    };

    self.isSettingNameChanged = function (newName) {
      if (currentSettings.name != newName) return true;
      else return false;
    };

    // AEF comment here to inhibite memory of past values
    // self.getSavedSettings = function() {
    //     return [pastStatus, pastSettings];
    // };

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
    self.updateNow = function (bCalledFromOrchestrator, bForceAutoStart) {
      //Autostart
      if (!bForceAutoStart && currentSettings.autoStart === false) {
        return { notTobeExecuted: true };
      }
      if (bForceAutoStart) {
        // when refresh change autostart in setting (needed because behaviour it similar to periodic datanodeS)
        currentSettings.autoStart = true;
      }
      //

      var init_value;
      if (bFirstTime) {
        if (wsConn.readyState === 1) {
          //always be true because it is called after connection succeeded
          statusCallback('Pending');
          if (!_.isUndefined(currentSettings.init_value)) {
            if (bFirstExec) {
              bFirstExec = false;
              if (currentSettings.init_value != 'none') {
                if (!IsJsonString(currentSettings.init_value)) {
                  init_value = currentSettings.init_value;
                  //transmitted to the network
                  sendData(init_value, false);
                } else {
                  try {
                    init_value = jQuery.extend(true, {}, JSON.parse(currentSettings.init_value));
                  } catch (err) {
                    notificationCallback('error', currentSettings.name, 'JSON Parse error' + err.message);
                    statusCallback('Error', 'JSON Parse error');
                    updateCallback(undefined, 'Error');
                    return false;
                  }
                  //transmitted to the network
                  sendData(init_value, true);
                }
              }
            }
          }
        }
      } else {
        statusCallback('Pending');
        if (debug) console.info('WebSocket received ', last_received_data);
        if (typeof last_received_data === 'string' || last_received_data instanceof String) {
          new_data = last_received_data;
        } else new_data = processedData(last_received_data, currentSettings.decoding_options);
        // update new data to MyViz widgets
        statusCallback('OK');
        updateCallback(new_data);
        if (debug) console.info('Data processed ', new_data);
      }
      return true;
    };

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function () {
      // Stop responding to messages
      if (wsConn) wsConn.close();
    };

    // **onstop()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onstop = function () {
      // Stop responding to messages
      if (wsConn) wsConn.close();
    };

    self.canSetValue = function () {
      return false;
    };

    statusForSchedulerCallback('Wait');
    bFirstTime = true;
    createWebSocket();

    // WebSocket connection that will automatically reconnect if the connection is dropped.
    function createWebSocket() {
      if (wsConn) wsConn.close();
      console.log(currentSettings);
      wsUri = 'ws://' + currentSettings.host + ':' + currentSettings.port;
      //var wsUri = "ws://10.5.3.209:3000"; //'ws://' + host + ':' + port;
      // reconnecting websocket allows to reconnect automatically the lost ws connection
      wsConn = new ReconnectingWebSocket(wsUri, [], WSOptions);
      wsConn.onopen = onOpen;
      wsConn.onerror = onError;
      wsConn.onmessage = onMessage;
      wsConn.onclose = onClose;
    }

    // check if the string is match JSON format
    function IsJsonString(str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    }

    // Send data to the network using the websocket
    function sendData(data, bJSON = true) {
      if (!_.isUndefined(wsConn) && wsConn.readyState === 1) {
        if (bJSON == true) wsConn.send(JSON.stringify(data));
        else wsConn.send(data);
      }
    }

    //treatment of data receive according to declared format by user
    function processedData(arrayBuffer, decoding_options) {
      if (decoding_options.toUpperCase() === 'JSON') {
        //=== "JSON"
        try {
          arrayBuffer = JSON.parse(arrayBuffer);
        } catch (ex) {
          console.log(ex);
        }
        return arrayBuffer;
      }

      var len;
      var byteLength = arrayBuffer.byteLength;
      var dataView = new DataView(arrayBuffer);
      var temp_arr;
      var size;
      var i = 0,
        j = 0;
      switch (decoding_options.toUpperCase()) {
        case 'ARRAYBUFFER2STRING': //this feature show how ArrayBuffer is convert to String
          temp_arr = String.fromCharCode.apply(null, new Uint8Array(arrayBuffer));
          break;
        case 'INT8ARRAY':
          size = Int8Array.BYTES_PER_ELEMENT;
          len = byteLength / Int8Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getInt8(j);
          }
          break;
        case 'UINT8ARRAY':
          size = Uint8Array.BYTES_PER_ELEMENT;
          len = byteLength / Uint8Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getUint8(j);
          }
          break;
        case 'INT16ARRAY':
          size = Int16Array.BYTES_PER_ELEMENT;
          len = byteLength / Int16Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getInt16(j, true); // With little-endian byte ordering. using dataView.getInt16(j, true);
          }
          break;
        case 'UINT16ARRAY':
          size = Uint16Array.BYTES_PER_ELEMENT;
          len = byteLength / Uint16Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getUint16(j, true); // With little-endian byte ordering. using dataView.getUint16(j, true);
          }
          break;
        case 'INT32ARRAY':
          size = Int32Array.BYTES_PER_ELEMENT;
          len = byteLength / Int32Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getInt32(j, true); // With little-endian byte ordering. using dataView.getInt32(j, true);
          }
          break;
        case 'UINT32ARRAY':
          size = Uint32Array.BYTES_PER_ELEMENT;
          len = byteLength / Uint32Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getUint32(j, true); // With little-endian byte ordering. using dataView.getUint32(j, true);
          }
          break;
        case 'FLOAT32ARRAY':
          size = Float32Array.BYTES_PER_ELEMENT;
          len = byteLength / Float32Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getFloat32(j, true); // With little-endian byte ordering. using dataView.getFloat32(j, true);
          }
          break;
        case 'FLOAT64ARRAY':
          size = Float64Array.BYTES_PER_ELEMENT;
          len = byteLength / Float64Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getFloat64(j, true); // With little-endian byte ordering. using dataView.getFloat64(j, true);
          }
          break;
        default:
          size = Uint8Array.BYTES_PER_ELEMENT;
          len = byteLength / Uint8Array.BYTES_PER_ELEMENT;
          len = Math.floor(len);
          temp_arr = new Array(len);
          for (i = 0, j = 0; i < len; i++, j += size) {
            temp_arr[i] = dataView.getUint8(j);
          }
          break;
      }
      return temp_arr;
    }
  };

  var error = false;
  datanodesManager.loadDatanodePlugin({
    // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
    type_name: 'WS-receive-plugin',
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    display_name: 'WebSocket Receive',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'websocket.svg',
    // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
    description: "Websocket client to receive data in Chalk'it",
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    external_scripts: [],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it
    settings: [
      {
        name: 'host',
        display_name: 'Remote IP address',
        type: 'text',
        description: 'IP address or hostname of your remote WebSocket sender.',
        required: true,
      },
      {
        name: 'port',
        display_name: 'Remote IP port',
        type: 'number',
        description: 'The port to connect to your remote WebSocket sender.',
        required: true,
      },
      {
        name: 'autoStart',
        display_name: 'AUTO START',
        description:
          'Start websocket receive automatically after dashboard play begins or after creation or modification.',
        type: 'boolean',
        default_value: true,
      },
      {
        name: 'init_value',
        display_name: 'initializing token',
        type: 'option',
        description: 'This token is sent before the exchange begin. Normally only used if send to xMOD',
        options: [
          {
            name: 'None',
            value: 'none',
          },
          {
            name: 'xMOD',
            value: 'ws_init',
          },
        ],
      },
      {
        name: 'decoding_options',
        display_name: 'Decoding options',
        description: 'Decoding options applied on Response data.',
        type: 'option',
        options: [
          {
            //name (required) : The text to be displayed in the dropdown.
            name: 'JSON',
            //value : The value of the option. If not specified, the name parameter will be used.
            value: 'JSON',
          },
          {
            name: 'Int8Array',
            value: 'Int8Array',
          },
          {
            name: 'Uint8Array',
            value: 'Uint8Array',
          },
          {
            name: 'Int16Array',
            value: 'Int16Array',
          },
          {
            name: 'Uint16Array',
            value: 'Uint16Array',
          },
          {
            name: 'Int32Array',
            value: 'Int32Array',
          },
          {
            name: 'Uint32Array',
            value: 'Uint32Array',
          },
          {
            name: 'Float32Array',
            value: 'Float32Array',
          },
          {
            name: 'Float64Array',
            value: 'Float64Array',
          },
          {
            name: 'Text',
            value: 'Text',
          },
          {
            name: 'ArrayBuffer2String',
            value: 'ArrayBuffer2String',
          },
        ],
      },
    ],

    newInstance: function (
      settings,
      newInstanceCallback,
      updateCallback,
      statusCallback,
      notificationCallback,
      statusForSchedulerCallback
    ) {
      newInstanceCallback(
        new Websocket_receive_Plugin(
          settings,
          updateCallback,
          statusCallback,
          notificationCallback,
          statusForSchedulerCallback
        )
      );
      if (error) return false;
      else return true;
    },
  });
})();
