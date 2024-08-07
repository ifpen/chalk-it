import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

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
    type_name: 'Memory_plugin',
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    display_name: 'Memory',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'memory.png',
    // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
    description: 'Memory operator (past value)',
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    external_scripts: [],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    settings: [
      {
        name: 'value_init',
        display_name: 'initial value',
        type: 'json',
        short_display: true,
        default_value: 0,
        description: 'Initial value (number, boolean, JSON or array)',
      },
      {
        name: 'datanode_origin',
        display_name: 'DataNode origin',
        type: 'option',
        from_datanode: true,
        options: [],
        description: 'Select the datanode origin for your past value',
      },
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback) {
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
    var var_value = {};
    var save_var_value = {};
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
        var_value = JSON.parse(currentSettings.value_init);
        pastSettings = currentSettings;
      } catch (err) {
        swal('JSON Parse error', err.message, 'error');
        statusCallback('Error');
        return false;
      }
      return true;
    };

    self.isSettingNameChanged = function (newName) {
      if (currentSettings.name != newName) return true;
      else return false;
    };

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
    self.updateNow = function () {
      statusCallback('Pending');
      if (bFirstExec) {
        try {
          bFirstExec = false;
          var_value = JSON.parse(currentSettings.value_init);
          statusCallback('OK');
          updateCallback(var_value);

          pastStatus = 'OK';
          pastSettings = currentSettings;

          return true;
        } catch (err) {
          swal('JSON Parse error', err.message, 'error');
          statusCallback('Error');
          updateCallback(undefined, 'Error');
          return false;
        }
      }
      save_var_value = var_value;

      let origin_name = currentSettings['datanode_origin'];
      if (!datanodesManager.foundDatanode(origin_name)) {
        const text = "DataNode '" + origin_name + "' does not exist in dataNodes list";
        datanodeModel.statusCallback('Error', text);
        datanodeModel.notificationCallback('error', datanodeModel.name(), text);
        return false;
      }

      let origin_value = datanodesManager.getDataNodeByName(origin_name).latestData();

      if (typeof origin_value === 'object') {
        var_value = jQuery.extend(true, {}, origin_value);
      } else {
        var_value = origin_value;
      }

      statusCallback('OK');
      updateCallback(var_value);

      pastStatus = 'OK';
      pastSettings = currentSettings;

      return true;
    };
    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function () {};

    this.canSetValue = function () {
      return true;
    };

    self.isInternetNeeded = function () {
      return false;
    };

    this.isSpecificExecution = function () {
      return true;
    };
    // **setValue()** (optional)
    this.setValue = function (propertyName, val) {
      bFirstExec = true;
      if (propertyName.length == 0) {
        var_value = val;
        currentSettings.value_init = JSON.stringify(var_value);
        return;
      } else if (propertyName.length == 1) {
        var_value[propertyName[0]] = val;
      } else {
        var varInter;
        for (var deep = 0; deep < propertyName.length - 1; deep++) {
          if (deep == 0) varInter = var_value[propertyName[deep]];
          else varInter = varInter[propertyName[deep]];
        }
        varInter[propertyName[propertyName.length - 1]] = val;
      }
      currentSettings.value_init = JSON.stringify(var_value);
    };
  };
})();
