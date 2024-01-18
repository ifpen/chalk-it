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
    type_name: 'Generic_file_reader_plugin',
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    display_name: 'Generic text file reader',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'text-file-reader.svg',
    // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
    description: 'Read text files',
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    external_scripts: [],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    settings: [
      {
        name: 'data_path',
        display_name: 'Data file',
        description: 'Browse to select file.',
        // **type "boolean"** : Will display a checkbox indicating a true/false setting.
        type: 'browseText',
        accept: 'text/plain',
        required: true, //ABK
      },
    ],
    expose_as_files: [
      {
        key: 'content',
        nameSuffix: (settings) => settings?.content?.name ?? 'content.txt',
        getter: (settings) => b64EncodeUnicode(settings.content.content),
        setter: (settings, value) => (settings.content = { ...settings.content, content: b64DecodeUnicode(value) }),
      },
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback) {
      // genericFilePlugin is defined below.
      newInstanceCallback(new genericFilePlugin(settings, updateCallback, statusCallback));
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
  var genericFilePlugin = function (settings, updateCallback, statusCallback) {
    // Always a good idea...
    const self = this;

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    let currentSettings = settings;

    function checkValue(value) {
      return value?.content && !value?.isBinary;
    }

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function (newSettings, status) {
      // Here we update our current settings with the variable that is passed in.
      if (checkValue(newSettings?.content)) {
        currentSettings = newSettings;
        return true;
      } else {
        return false;
      }
    };

    self.isSettingNameChanged = function (newName) {
      return currentSettings.name != newName;
    };

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
    self.updateNow = function () {
      statusCallback('OK');
      updateCallback(currentSettings.content); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
      return true;
    };

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function () {};

    this.canSetValue = function () {
      return {
        acceptPath: false,
        hasPostProcess: false,
      };
    };

    self.setValue = function (path, value) {
      if (checkValue(value)) {
        currentSettings.content = { ...value };
        currentSettings.data_path = value?.name;
      }
    };

    self.isInternetNeeded = function () {
      return false;
    };
  };
})();
