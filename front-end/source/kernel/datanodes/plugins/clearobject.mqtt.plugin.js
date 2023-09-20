(function () {
  // ### Datanode Definition
  // -------------------
  datanodesManager.loadDatanodePlugin({
    type_name: 'mqtt',
    display_name: 'MQTT',
    icon_type: 'mqtt.svg',
    // "description": "MQTT 3.1.1 is an ISO standard publish-subscribe based message protocol for fast and secure IoT communication over TCP/IP." +
    //     "<div style='text-transform:initial;padding:14px 0px;'> For a quick demo, try the <a href='https://quickstart.internetofthings.ibmcloud.com/iotsensor/' target='_blank'>IBM Watson IoT Quickstart</a>. Enter any name for this plugin, substitute the DEVICEID shown in the upper right of the quickstart in the topic setting, save, and then add a pane and text widget in datanodesManager to show the data returned from your datanode.<br>This opensource plugin is community supported with help from <a href='https://www.clearobject.com' target='_blank'>ClearObject</a>, <a href='https://www.eclipse.org/paho/' target='_blank'>Eclipse Paho</a>, and <a href='https://internetofthings.ibmcloud.com' target='_blank'>IBM Watson IoT</a>. Contact <a href='mailto:benjamin.chodroff@clearobject.com'>Benjamin Chodroff</a> for IoT assistance.</div>",
    description: 'MQTT (Message Queuing Telemetry Transport) ISO standard publish-subscribe',

    external_scripts: ['https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.js'],
    settings: [
      {
        name: 'topic',
        display_name: 'Topic',
        type: 'text',
        description:
          "For IBM quickstart, replace only DEVICEID with the device id string found in the upper right corner. For Watson IoT platform, replace DEVICEID with your specific device mac address or with '+' to listen to all devices in your organization. For all other MQTT servers, enter your own topic search string.",
        required: true,
        default_value: 'iot-2/type/+/id/DEVICEID/evt/+/fmt/json',
      },
      {
        name: 'server',
        display_name: 'Server',
        type: 'text',
        description:
          "For IBM quickstart use 'quickstart.internetofthings.ibmcloud.com', or type '[OrganizationID].messaging.internetofthings.ibmcloud.com' for Watson IoT, or enter any other MQTT server available.",
        required: true,
        default_value: 'quickstart.messaging.internetofthings.ibmcloud.com',
      },
      {
        name: 'port',
        display_name: 'Port',
        type: 'number',
        description: 'Typically either 8883 or 443 for secure, or 1883 for insecure communication.',
        required: true,
        default_value: 8883,
      },
      {
        name: 'use_encryption',
        display_name: 'Use Encryption',
        type: 'boolean',
        description:
          'Use TLS encryption to connect to the MQTT Server securely (datanodesManager.io requires all brokers to use encryption).',
        default_value: true,
      },
      {
        name: 'client_id',
        display_name: 'Client Id',
        type: 'text',
        default_value: 'quickstart',
        required: true,
        description:
          "For IBM quickstart, use default 'quickstart'. For Watson IoT, enter your Organization ID. For all other MQTT servers, set a clientID which will be passed as 'a:clientID:ApiKey:Timestamp'.",
      },
      {
        name: 'api_key',
        display_name: 'API Key/Username',
        description: 'Not required for IBM quickstart, required for Watson IoT Platform connections.',
        type: 'text',
        required: false,
        default_value: '',
      },
      {
        name: 'api_auth_token',
        display_name: 'API Auth Token/Password',
        description: 'Not required for IBM quickstart, required for Watson IoT Platform connections.',
        type: 'text',
        required: false,
        default_value: '',
      },
      {
        name: 'json_data',
        display_name: 'JSON messages?',
        type: 'boolean',
        description:
          'If the messages on your topic are in JSON format they will be parsed so the individual fields can be used in datanodesManager widgets.',
        default_value: true,
      },
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
      newInstanceCallback(new mqttDatanodePlugin(settings, updateCallback, statusCallback, notificationCallback));
    },
  });

  // ### Datanode Implementation
  //
  // -------------------
  var mqttDatanodePlugin = function (settings, updateCallback, statusCallback, notificationCallback) {
    //initialize error at new instance
    error = false;

    var self = this;
    var data = {};

    var currentSettings = settings;

    function onConnect() {
      console.log('Subscribing to topic: ' + currentSettings.topic);
      client.subscribe(currentSettings.topic);
    }

    function onConnectionLost(responseObject) {
      console.log('Connection Lost');
      if (responseObject.errorCode !== 0) console.log('onConnectionLost: ' + responseObject.errorMessage);
      var client = new Paho.MQTT.Client(
        currentSettings.server,
        currentSettings.port,
        'a:' + currentSettings.client_id + ':' + currentSettings.api_key + new Date().getTime().toString()
      );
      client.connect({
        onSuccess: onConnect,
        userName: currentSettings.api_key,
        password: currentSettings.api_auth_token,
        useSSL: currentSettings.use_encryption,
        timeout: 10,
        cleanSession: true,
        onFailure: function (message) {
          //AEF
          var text = 'Connection failed: ' + message.errorMessage;
          notificationCallback('error', currentSettings.name, text, 'JSON file parse error');
          //
          statusCallback('Error', 'Connection failed'); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
          updateCallback({}, 'Error');
        },
      });
    }

    function onMessageArrived(message) {
      var device = message.destinationName.split('/')[4];
      var msg = '';
      if (currentSettings.json_data) {
        msg = JSON.parse(message.payloadString);
      } else {
        msg = message.payloadString;
      }
      data[device] = msg;
      statusCallback('OK'); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
      updateCallback(data);
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function (newSettings) {
      var text = '';
      try {
        statusCallback('Pending');
        client.disconnect();
      } catch (err) {
        //AEF
        text = 'Could not disconnect client: ' + err;
        notificationCallback('error', currentSettings.name, text, 'JSON file parse error');
        //
        statusCallback('Error', 'Could not disconnect client'); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
        updateCallback({}, 'Error');
      }

      data = {};
      currentSettings = newSettings;
      var client = new Paho.MQTT.Client(
        currentSettings.server,
        currentSettings.port,
        'a:' + currentSettings.client_id + ':' + currentSettings.api_key + new Date().getTime().toString()
      );
      client.connect({
        onSuccess: onConnect,
        userName: currentSettings.api_key,
        password: currentSettings.api_auth_token,
        useSSL: currentSettings.use_encryption,
        timeout: 10,
        cleanSession: true,
        onFailure: function (message) {
          //AEF
          text = 'Connection failed: ' + message.errorMessage;
          notificationCallback('error', currentSettings.name, text, 'JSON file parse error');
          //
          statusCallback('Error', 'Connection failed'); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
          updateCallback({}, 'Error');
        },
      });
    };

    self.isSettingNameChanged = function (newName) {
      if (currentSettings.name != newName) return true;
      else return false;
    };

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
    self.updateNow = function () {
      var text = '';
      console.log('Forcing Update');
      statusCallback('Pending');
      try {
        client.disconnect();
      } catch (err) {
        //AEF
        text = 'Could not disconnect client: ' + err;
        notificationCallback('error', currentSettings.name, text, 'JSON file parse error');
        //
        statusCallback('Error', 'Could not disconnect client'); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
        updateCallback({}, 'Error');
      }
      var client = new Paho.MQTT.Client(
        currentSettings.server,
        currentSettings.port,
        'a:' + currentSettings.client_id + ':' + currentSettings.api_key + new Date().getTime().toString()
      );
      client.connect({
        onSuccess: onConnect,
        userName: currentSettings.api_key,
        password: currentSettings.api_auth_token,
        useSSL: currentSettings.use_encryption,
        timeout: 10,
        cleanSession: true,
        onFailure: function (message) {
          //AEF
          text = 'Connection failed: ' + message.errorMessage;
          notificationCallback('error', currentSettings.name, text, 'JSON file parse error');
          //
          statusCallback('Error', 'Connection failed'); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
          updateCallback({}, 'Error');
        },
      });
    };

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function () {
      if (client.isConnected()) {
        client.disconnect();
      }
      client = {};
    };

    self.isSetValueValid = function () {
      return false;
    };

    self.isSetFileValid = function () {
      return false;
    };

    self.isInternetNeeded = function () {
      return true;
    };

    console.log('Creating Paho client at timestamp=' + new Date().getTime().toString());
    var client = new Paho.MQTT.Client(
      currentSettings.server,
      currentSettings.port,
      'a:' + currentSettings.client_id + ':' + currentSettings.api_key + new Date().getTime().toString()
    );
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({
      onSuccess: onConnect,
      userName: currentSettings.api_key,
      password: currentSettings.api_auth_token,
      useSSL: currentSettings.use_encryption,
      timeout: 10,
      cleanSession: true,
      onFailure: function (message) {
        //AEF
        var text = 'Connection failed: ' + message.errorMessage;
        notificationCallback('error', currentSettings.name, text, 'JSON file parse error');
        //
        statusCallback('Error', 'Connection failed'); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
        updateCallback({}, 'Error');
      },
    });
  };
})();
