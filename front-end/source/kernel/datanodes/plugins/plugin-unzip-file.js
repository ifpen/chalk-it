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
        type_name: "Unzip_file_plugin",
        // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
        display_name: "Unzip file",
        // **icon_type** : icon of the datanode type displayed in data list
        icon_type: "file-reader.svg",
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        description: "unzip files",
        // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
        external_scripts: [""],
        // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
        settings: [{
            name: "data_path",
            display_name: "Data file",
            description: "Browse to select zipped file.",
            // **type "boolean"** : Will display a checkbox indicating a true/false setting.
            type: "unzip",
            required: true, //ABK
        }, ],
        // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
        // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
        // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
        // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
        newInstance: function(
            settings,
            newInstanceCallback,
            updateCallback,
            statusCallback
        ) {
            // unzipFilePlugin is defined below.
            newInstanceCallback(
                new unzipFilePlugin(settings, updateCallback, statusCallback)
            );
            if (error)
            //ABK
                return false;
            else return true;
        },
    });

    // ### Datanode Implementation
    //
    // -------------------
    // Here we implement the actual datanode plugin. We pass in the settings and updateCallback.
    var unzipFilePlugin = function(settings, updateCallback, statusCallback) {
        // initialize bad result value in case of error
        var badResult = null;
        //initialize error at new instance
        error = false;
        // Always a good idea...
        var self = this;

        // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
        var currentSettings = settings;
        // save past setting in case of cancelling modification in datanodeS
        var pastSettings = settings;
        var pastStatus = "None";

        // Parser results to memorize
        var fileStruct;

        // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
        self.onSettingsChanged = function(newSettings, status) {
            if (status === "OK") {
                pastStatus = status;
                pastSettings = currentSettings;
            }
            // Here we update our current settings with the variable that is passed in.
            currentSettings = newSettings;
            return self.isFileReadingSuccess();
        };

        self.isFileReadingSuccess = function() {
            statusCallback("Pending");
            fileStruct = self.readFileContent();
            if (fileStruct == badResult) {
                // case of bad parse at edition
                statusCallback("Error", "Error in file struct");
                return false;
            } else {
                pastSettings = currentSettings;
                return true;
            }
        };

        self.isSettingNameChanged = function(newName) {
            if (currentSettings.name != newName) return true;
            else return false;
        };

        self.getSavedSettings = function() {
            return [pastStatus, pastSettings];
        };

        // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
        self.updateNow = function() {
            pastStatus = "OK";
            statusCallback("OK");
            updateCallback(fileStruct); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
            return true;
        };

        // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
        self.onDispose = function() {};

        self.isSetValueValid = function() {
            return false;
        };

        self.isSetFileValid = function() {
            return true;
        };

        self.isInternetNeeded = function() {
            return false;
        };

        self.readFileContent = function() {
            if (!_.isUndefined(currentSettings.content)) {
                var newData = currentSettings.content;
                return newData;
            } else return badResult;
        };

        self.setFile = function(newContent) {
            currentSettings.content = newContent.content; // MBG 13/01/2022
            currentSettings.data_path = newContent.name; //AEF: fix big update the path in the data settings
            return self.isFileReadingSuccess();
        };

        // Parse file
        fileStruct = self.readFileContent();
        if (fileStruct == badResult) {
            // case of bad parse at creation
            error = true; //ABK
        } else {
            error = false; // MBG : reset error flag
        }
    };
})();