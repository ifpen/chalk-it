(function() {
    var error = false;

    // ## A Datanode Plugin
    //
    // -------------------
    // ### Datanode Definition
    //
    // -------------------
    // **datanodesManager.loadDatanodePlugin(definition)** tells datanodesManager that we are giving it a datanode plugin. It expects an object with the following:
    datanodesManager.loadDatanodePlugin({
        // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
        type_name: "JSON_formula_plugin",
        // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
        display_name: "Script (client-side)",
        // **icon_type** : icon of the datanode type displayed in data list
        icon_type: "json-formula.svg",
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        description: "JavaScript Script (client-side) plugin",
        // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
        external_scripts: [
            ""
        ],
        // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
        "settings": [{
                name: "autoStart",
                display_name: "AUTO START",
                description: "Start formula automatically after dashboard play begins or after creation or modification.",
                type: "boolean",
                default_value: true
            },
            {
                name: "explicitTrig",
                display_name: "Explicit trigger",
                description: "Execute formula only if triggered explicitly : no execution when predecessor dataNodes are modified.",
                type: "boolean",
                default_value: false
            },
            {
                name: "json_var_formula",
                display_name: "Javascript formula",
                type: "calculated",
                description1: "Write Javascript formula that returns a JSON, array or primitive data type ouptput",
                description2: "Browse and select a dataNode from workspace to use it in the formula." /*ABK*/
            },
        ],
        // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
        // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
        // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
        // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
        newInstance: function(settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
            // csvFilePlugin is defined below.
            if (!newInstanceCallback(new jsonFormulaPlugin(settings, updateCallback, statusCallback, notificationCallback)))
                if (error) //ABK
                    return false;
                else
                    return true;
        }
    });


    // ### Datanode Implementation
    //
    // -------------------
    // Here we implement the actual datanode plugin. We pass in the settings and updateCallback.
    var jsonFormulaPlugin = function(settings, updateCallback, statusCallback, notificationCallback) {
        //initialize error at new instance
        error = false;
        // Always a good idea...
        var self = this;
        var calculatedValue = {};

        // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
        var currentSettings = settings;

        // save past setting in case of cancelling modification in datanodeS
        var pastSettings = settings;
        var pastStatus = "None";
        // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
        self.onSettingsChanged = function(newSettings) {
            // Here we update our current settings with the variable that is passed in.			
            currentSettings = newSettings;
            return true;
        };

        self.isSettingNameChanged = function(newName) {
            if (currentSettings.name != newName)
                return true;
            else
                return false;
        };

        // AEF comment here to inhibite memory of past values
        self.getSavedSettings = function() {
            return [pastStatus, pastSettings];
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

            statusCallback("Pending");

            if (!_.isNull(calculatedValue) && !_.isUndefined(calculatedValue)) {
                if (_.isObject(calculatedValue) && _.isEmpty(calculatedValue) && (_.isEmpty(currentSettings.json_var_formula))) {
                    error = true;
                    text = "Formula is empty";
                    notificationCallback("warning", currentSettings.name, text, "Formula error");
                    statusCallback("Error", text);
                    updateCallback(calculatedValue, "Error");
                    return false;
                } else {
                    error = false;
                    pastStatus = "OK";
                    pastSettings = currentSettings;
                    statusCallback("OK");
                    updateCallback(calculatedValue);
                    return true;
                }
            } else {
                error = true;
                text = "Formula is null or undefined";
                statusCallback("Error", text);
                updateCallback(calculatedValue, "Error");

                return false;
            }

        };

        // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
        self.onDispose = function() {};

        this.isSetValueValid = function() {
            return false;
        };

        self.isSetFileValid = function() {
            return false;
        };

        self.isInternetNeeded = function() {
            return false;
        };

        self.onCalculatedValueChanged = function(propertyName, val) {
            calculatedValue = val;
        };
    };

}());