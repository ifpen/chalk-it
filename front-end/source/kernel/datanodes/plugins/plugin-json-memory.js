(function () {
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
    type_name: 'JSON_memory_plugin',
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    display_name: 'Delay',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'delay.svg',
    // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
    description: 'JavaScript one-step delay operator',
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    external_scripts: [''],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    settings: [
      {
        name: 'json_init',
        display_name: 'init value',
        type: 'json',
        description: 'Initial value (JSON, array or primitive data type)',
      },
      {
        name: 'json_input',
        display_name: 'Input signal',
        type: 'calculated',
        description1: 'Write JavaScript formula to define JSON, array or primitive data type input to be delayed.',
        description2: 'Browse and select a dataNode from workspace to use it in the formula.' /*ABK*/,
      },
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback) {
      // jsonMemoryPlugin is defined below.
      newInstanceCallback(new jsonMemoryPlugin(settings, updateCallback, statusCallback));
      if (error) return false;
      else return true;
    },
  });

  // ### Datanode Implementation
  //
  // -------------------
  // Here we implement the actual datanode plugin. We pass in the settings and updateCallback.
  var jsonMemoryPlugin = function (settings, updateCallback, statusCallback) {
    //initialize error at new instance
    error = false;
    // Always a good idea...
    var self = this;
    var json_var_value = {};
    var save_json_var_value = {};
    var calculatedValue = {};
    var bFirstExec = true;

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    var currentSettings = settings;

    // save past setting in case of cancelling modification in datanodeS
    var pastSettings = settings;
    var pastStatus = 'None';
    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function (newSettings) {
      // Here we update our current settings with the variable that is passed in.
      currentSettings = newSettings;
      try {
        json_var_value = JSON.parse(currentSettings.json_init);
        pastSettings = currentSettings;
      } catch (err) {
        swal('JSON Parse error', err.message, 'error');
        statusCallback('Error');
        return false; //ABK
      }
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
    self.updateNow = function () {
      statusCallback('Pending');
      if (bFirstExec) {
        try {
          bFirstExec = false;
          json_var_value = JSON.parse(currentSettings.json_init);
        } catch (err) {
          swal('JSON Parse error', err.message, 'error');
          statusCallback('Error');
          updateCallback(undefined, 'Error');
          return false;
        }
      }

      save_json_var_value = json_var_value;
      if (typeof calculatedValue === 'object') {
        json_var_value = jQuery.extend(true, {}, calculatedValue);
      } else {
        json_var_value = calculatedValue;
      }
      statusCallback('OK');
      updateCallback(save_json_var_value);

      pastStatus = 'OK';
      pastSettings = currentSettings;

      return true;
    };
    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function () {};

    this.isSetValueValid = function () {
      return false;
    };

    self.isSetFileValid = function () {
      return false;
    };

    self.isInternetNeeded = function () {
      return false;
    };

    self.onCalculatedValueChanged = function (propertyName, val) {
      calculatedValue = val;
    };
  };
})();
