(function() {
    var error = false; //ABK
    // ## A Datanode Plugin
    //
    // -------------------
    // ### Datanode Definition
    //
    // -------------------
    // **datanodesManager.loadDatanodePlugin(definition)** tells datanodesManager that we are giving it a datanode plugin. It expects an object with the following:
    datanodesManager.loadDatanodePlugin({
        // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
        "type_name": "JSON_var_plugin",
        // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
        "display_name": "Variable",
        // **icon_type** : icon of the datanode type displayed in data list
        "icon_type": "JSON_Variable.svg",
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        "description": "JavaScript workspace variable",
        // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
        "external_scripts": [
            ""
        ],
        // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
        "settings": [{
            name: "json_var",
            display_name: "Variable",
            type: "json",
            description: "JSON, array or primitive data type variable (with read/write permissions)"
        }],
        // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
        // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
        // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
        // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
        newInstance: function(settings, newInstanceCallback, updateCallback, statusCallback) {
            // jsonVarPlugin is defined below.
            newInstanceCallback(new jsonVarPlugin(settings, updateCallback, statusCallback));
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
    var jsonVarPlugin = function(settings, updateCallback, statusCallback) {
        //initialize error at new instance
        error = false;
        // Always a good idea...
        var self = this;
        var json_var_value = {};

        // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
        var currentSettings = settings;

        // save past setting in case of cancelling modification in datanodeS
        var pastSettings = settings;
        var pastStatus = "None";

        // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
        self.onSettingsChanged = function(newSettings) {
            // Here we update our current settings with the variable that is passed in.			
            currentSettings = newSettings;
            return self.isJsonParsingSuccess();
        };

        self.isJsonParsingSuccess = function() {
            statusCallback('Pending');
            try {
                json_var_value = JSON.parse(currentSettings.json_var);
                return true;
            } catch (err) {
                swal("JSON Parse error", err.message, "error");
                statusCallback("Error", "Error in JSON parse");
                return false; //ABK
            }
        };

        self.isSettingNameChanged = function(newName) {
            if (currentSettings.name != newName)
                return true;
            else
                return false;
        };

        // AEF don't comment here to inhibite memory of past values
        // needed when after error parse then cancel
        self.getSavedSettings = function() {
            return [pastStatus, pastSettings];
        };

        // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
        self.updateNow = function() {
            statusCallback('OK'); // MBG for scheduler : put statusCallback before updateCallback      
            pastStatus = 'OK';
            pastSettings = currentSettings;
            updateCallback(json_var_value);
            return true; //ABK
        };

        // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
        self.onDispose = function() {};

        this.isSetValueValid = function() {
            return true;
        };

        self.isSetFileValid = function() {
            return true;
        };

        self.isInternetNeeded = function() {
            return false;
        };

        self.setFile = function(newContent) {
            if (newContent.type === "application/json") {
                if (newContent.isBinary) {
                    currentSettings.json_var = atob(newContent.content);
                } else {
                    currentSettings.json_var = newContent.content;
                }
            } else {
                currentSettings.json_var = JSON.stringify(newContent);
            }
            return self.isJsonParsingSuccess();
        };

        // **setValue()** (optional)
        self.setValue = function(propertyName, val) {
            if (propertyName.length == 0) {
                json_var_value = val; // MBG 27/05/2020 for issue #271
                currentSettings.json_var = JSON.stringify(json_var_value); // MBG 25/11/2020
                return;
            } else if (propertyName.length == 1) {
                json_var_value[propertyName[0]] = val;
            } else {
                var varInter;
                for (var deep = 0; deep < propertyName.length - 1; deep++) {
                    if (deep == 0)
                        varInter = json_var_value[propertyName[deep]];
                    else
                        varInter = varInter[propertyName[deep]];
                }
                varInter[propertyName[propertyName.length - 1]] = val;

            }
            currentSettings.json_var = JSON.stringify(json_var_value);
        };

        // **getValue()** (optional)
        // MBG 28/10/2021 for dirty flag
        self.getValue = function(propertyName) {
            if (propertyName.length == 0) {
                return json_var_value;
            } else if (propertyName.length == 1) {
                return json_var_value[propertyName[0]];
            } else {
                var varInter;
                for (var deep = 0; deep < propertyName.length - 1; deep++) {
                    if (deep == 0)
                        varInter = json_var_value[propertyName[deep]];
                    else
                        varInter = varInter[propertyName[deep]];
                }
                return varInter[propertyName[propertyName.length - 1]];
            }
        };


        try {
            json_var_value = JSON.parse(currentSettings.json_var);
            error = false;
        } catch (err) {
            swal("JSON Parse error", err.message, "error");
            error = true;
        }
    };

}());