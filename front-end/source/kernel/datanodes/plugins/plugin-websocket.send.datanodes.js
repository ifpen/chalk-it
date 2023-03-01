/**
 * @author AR
 * @description
 * This Datanode is used to send dat through Web socket. It's allow Chalk'it to send data
 */
// ### Datanode Definition
//
// -------------------
/**
 * Plugin code for the Websocket send Datanode Plugin
 *
 * @param settings
 * @param updateCallback
 * @constructor
 */
(function() {
    var dataObj = {};
    var Websocket_send_Plugin = function(settings, updateCallback, statusCallback, notificationCallback, statusForSchedulerCallback) {
        var self = this;
        var wsUri = "";

        // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
        var currentSettings = settings;
        // save past setting in case of cancelling modification in datanodes
        var pastSettings = settings;
        var pastStatus = "None";
        var wsConn;
        var debug = true;
        var bFirstExec = true;
        var calculatedValue = {};
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
            //send(data: string | ArrayBuffer | Blob | ArrayBufferView)
            binaryType: 'arraybuffer'
        };

        /*
         * Handle WebSocket connection
         */
        var onOpen = function() {
            console.info("Connected to server ", wsUri);
            notificationCallback("success", currentSettings.name, "Connected to server " + wsUri);
            oneErrorNotif = true;
            _socketReady = true;
            if (!_.isUndefined(currentSettings.init_value))
                bFirstExec = true;
            //transmitted the initial value to the network
            statusForSchedulerCallback("Ready");
        };

        var onClose = function() {
            console.info("WebSocket Connection is closed...");
            notificationCallback("info", currentSettings.name, "WebSocket Connection is closed...");
            if (_socketReady) { // in case of a close and not after an error
                statusForSchedulerCallback("Stop");
            }
            _socketReady = false;
        };

        var onError = function(error) {
            if (debug) console.debug('WebSocket  (%s) OnError ', wsUri, error);
            if (oneErrorNotif) {
                notificationCallback("error", currentSettings.name, "WebSocket  (" + wsUri + ") error");
                oneErrorNotif = false;
            }
            statusForSchedulerCallback("NotReady");
        };

        var onMessage = function(event) {
            return; // nothing to do
        };

        // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
        self.onSettingsChanged = function(newSettings, status) {
            if (status === 'OK') {
                pastStatus = status;
                pastSettings = currentSettings;
            }


            if ((currentSettings.host != newSettings.host) || (currentSettings.port != newSettings.port) || !_socketReady ||
                ((!_.isUndefined(newSettings.init_value)) && (currentSettings.init_value != newSettings.init_value))) { // create a new socket if needed
                currentSettings = newSettings;
                statusForSchedulerCallback("Wait");
                createWebSocket();
            } else {
                currentSettings = newSettings;
            }
            pastSettings = currentSettings;
            return true;
        };

        self.isSettingNameChanged = function(newName) {
            if (currentSettings.name != newName)
                return true;
            else
                return false;
        };

        // AEF comment here to inhibite memory of past values
        // self.getSavedSettings = function() {
        //     return [pastStatus, pastSettings];
        // };

        //AEF
        self.isSettingSampleTimeChanged = function(newSampleTime) {
            if (currentSettings.sampleTime != newSampleTime)
                return true;
            else
                return false;
        };

        // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
        self.updateNow = function(bCalledFromOrchestrator, bForceAutoStart) {
            // explicit trig!
            if (!_.isUndefined(bCalledFromOrchestrator)) {
                if (!_.isUndefined(currentSettings.explicitTrig)) {
                    if (currentSettings.explicitTrig) {
                        if (bCalledFromOrchestrator == true) return { "notTobeExecuted": true };
                    }
                }
            }

            //Autostart
            if (!bForceAutoStart && currentSettings.autoStart === false) {
                return { "notTobeExecuted": true };
            }
            if (bForceAutoStart && currentSettings.sampleTime > 0) { // when refresh change autostart in setting (needed for periodic datanodeS)
                currentSettings.autoStart = true;
            }

            var init_value;

            if (wsConn.readyState === 1) { //always be true because it is called after connection succeeded
                statusCallback('Pending');
                if (!_.isUndefined(currentSettings.init_value)) {
                    if (bFirstExec) {
                        bFirstExec = false;
                        if (currentSettings.init_value != "none") {
                            if (!IsJsonString(currentSettings.init_value)) {
                                init_value = currentSettings.init_value;
                                //transmitted to the network
                                sendData(init_value, false);
                            } else {
                                try {
                                    init_value = jQuery.extend(true, {}, JSON.parse(currentSettings.init_value));
                                } catch (err) {
                                    notificationCallback("error", currentSettings.name, 'Data Parse error' + err.message);
                                    statusCallback('Error', 'Data Parse error');
                                    updateCallback(undefined, "Error");
                                    return false;
                                }
                                //transmitted to the network
                                sendData(init_value, true);
                            }
                        }
                    }
                }
                if ((!_.isNull(calculatedValue)) && (!_.isUndefined(calculatedValue))) {
                    if (_.isObject(calculatedValue) && _.isEmpty(calculatedValue) && (_.isEmpty(currentSettings.json_input))) {
                        statusCallback("Error", "JS script error");
                        error = true;
                        notificationCallback("error", currentSettings.name, "JS script error: script cannot be empty.");
                        return false;
                    } else {
                        //transmitted to the network
                        sendData(calculatedValue);
                        // update new data to MyViz widgets
                        statusCallback('OK');
                        updateCallback(calculatedValue);
                    }
                } else {
                    statusCallback('Error', "script is null or undefined");
                    notificationCallback("error", currentSettings.name, "script is null or undefined.");
                    return false;
                }
            }

            return true;
        };

        // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
        self.onDispose = function() {
            // Stop responding to messages
            if (wsConn) wsConn.close();
        };

        // **onstop()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
        self.onstop = function() {
            // Stop responding to messages
            if (wsConn) wsConn.close();
        };

        self.isSetValueValid = function() {
            return false;
        };

        self.isSetFileValid = function() {
            return false;
        };

        self.isInternetNeeded = function() {
            return true;
        };

        self.onCalculatedValueChanged = function(propertyName, val) {
            calculatedValue = JSON.stringify(val);
        };
        statusForSchedulerCallback("Wait");
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
            if ((!_.isUndefined(wsConn)) && (wsConn.readyState === 1)) {
                /*
                                if (bJSON == true)
                                    wsConn.send(JSON.stringify(data));
                                else
                                    wsConn.send(data);
                */
                wsConn.send(data);
            }
        }

    };

    var error = false;
    datanodesManager.loadDatanodePlugin({
        // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
        type_name: "WS-send-plugin",
        // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
        display_name: "WebSocket Send",
        // **icon_type** : icon of the datanode type displayed in data list
        icon_type: "Websocket.svg",
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        description: "Websocket client to send data to Chalk'it",
        // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
        external_scripts: [""],
        // **settings** : An array of settings that will be displayed for this plugin when the user adds it
        settings: [{
                name: "host",
                display_name: "Remote IP address",
                type: "text",
                description: "IP address or hostname of your remote WebSocket receiver.",
                required: true
            },
            {
                name: "port",
                display_name: "Remote IP port",
                type: "number",
                description: "The port to connect to your remote WebSocket receiver.",
                required: true
            },
            {
                name: "sampleTime",
                display_name: "Sample time",
                type: "number",
                default_value: 0,
                suffix: "seconds",
                description: "Refresh rate for sending data. Data will be sent even if control values are not changed"
            },
            {
                name: "autoStart",
                display_name: "AUTO START",
                description: 'Start websocket send automatically after dashboard play begins or after creation or modification.',
                type: "boolean",
                default_value: true
            },
            {
                name: "explicitTrig",
                display_name: "Explicit trigger",
                description: 'Execute web-socket only if triggered explicitly : no execution when predecessor dataNodes are modified.',
                type: "boolean",
                default_value: false
            },
            {
                name: "init_value",
                display_name: "initializing token",
                type: "option",
                description: "This token is sent before the exchange begin. Normally only used if exchange with xMOD",
                options: [{
                        name: "None",
                        value: "none"
                    },
                    {
                        name: "xMOD",
                        value: "ws_init"
                    },
                ]
            },
            {
                name: "json_input",
                display_name: "JSON/Javascript input",
                type: "calculated",
                description1: "Can be literal JSON. Input to be sent.",
                description2: "Browse and select a dataNode from workspace to send it by web socket."
            },
        ],

        newInstance: function(settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback, statusForSchedulerCallback) {
            newInstanceCallback(new Websocket_send_Plugin(settings, updateCallback, statusCallback, notificationCallback, statusForSchedulerCallback));
            if (error)
                return false;
            else
                return true;
        }
    });
}());