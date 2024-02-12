(function () {
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
    type_name: 'taipy_link_plugin',
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    display_name: 'Taipy Link',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'json-variable.svg',
    // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
    description: "Chalk'it link to Taipy",
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    external_scripts: [''],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    settings: [
      {
        name: 'taipy_link',
        display_name: 'Taipy Link',
        type: 'json',
        description: 'JSON, array or primitive data type variable (with read/write permissions) to send to Taipy',
      },
    ],
    expose_as_files: [
      {
        key: 'json_var',
        nameSuffix: 'value.json',
      },
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback) {
      // taipyLinkPlugin is defined below.
      newInstanceCallback(new taipyLinkPlugin(settings, updateCallback, statusCallback));
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
  const taipyLinkPlugin = function (settings, updateCallback, statusCallback) {
    // Always a good idea...
    const self = this;

    let json_var_value = {};

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    self.currentSettings = settings;

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function (newSettings) {
      // Here we update our current settings with the variable that is passed in.
      if (self.isJsonParsingSuccess(newSettings)) {
        self.currentSettings = newSettings;
        return true;
      } else {
        return false;
      }
    };

    self.isJsonParsingSuccess = function (settings) {
      statusCallback('Pending');
      try {
        json_var_value = JSON.parse(settings.json_var);
        return true;
      } catch (err) {
        swal('JSON Parse error', err.message, 'error');
        statusCallback('Error', 'Error in JSON parse');
        return false; //ABK
      }
    };

    self.isSettingNameChanged = function (newName) {
      return self.currentSettings.name !== newName;
    };

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
    self.updateNow = function () {
      statusCallback('OK'); // MBG for scheduler : put statusCallback before updateCallback
      updateCallback(json_var_value);
      if ($rootScope.xDashLiteVersion) taipyManager.sendToTaipy(self.currentSettings.name, json_var_value);
      return true; //ABK
    };

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function () {};

    this.canSetValue = function () {
      return {
        acceptPath: true,
        hasPostProcess: false,
      };
    };

    self.isInternetNeeded = function () {
      return false;
    };

    // **setValue()** (optional)
    self.setValue = function (propertyNames, val) {
      if (propertyNames.length) {
        const lastIndex = propertyNames.length - 1;
        let target = json_var_value;
        for (let i = 0; i < lastIndex; i++) {
          target = target[propertyNames[i]];
        }
        target[propertyNames[lastIndex]] = val;
      } else {
        json_var_value = val;
      }

      // Ensure angular will detect a change for the preview, etc...
      if (Array.isArray(json_var_value)) json_var_value = [...json_var_value];
      else if (json_var_value && json_var_value.contructor === Object) json_var_value = { ...json_var_value };

      self.currentSettings.json_var = JSON.stringify(json_var_value);
    };

    // **getValue()** (optional)
    // MBG 28/10/2021 for dirty flag
    self.getValue = function (propertyNames) {
      let result = json_var_value;
      if (propertyNames) {
        for (const key of propertyNames) {
          result = result[key];
        }
      }
      return result;
    };

    self.isJsonParsingSuccess(self.currentSettings);
  };
})();
