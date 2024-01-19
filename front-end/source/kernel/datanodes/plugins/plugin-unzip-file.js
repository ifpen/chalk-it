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
    type_name: 'Unzip_file_plugin',
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    display_name: 'Unzip file',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'file-reader.svg',
    // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
    description: 'unzip files',
    // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
    external_scripts: [''],
    // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
    settings: [
      {
        name: 'data_path',
        display_name: 'Data file',
        description: 'Browse to select zipped file.',
        type: 'browseBinary',
        accept: 'application/x-zip-compressed',
        required: true,
      },
    ],
    expose_as_files: [
      {
        key: 'content',
        nameSuffix: (settings) => settings?.content?.name ?? 'data.zip',
        getter: (settings) => settings.content.content,
        setter: (settings, value) => (settings.content = { ...settings.content, content: value }),
      },
    ],
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
      // unzipFilePlugin is defined below.
      newInstanceCallback(new unzipFilePlugin(settings, updateCallback, statusCallback, notificationCallback));
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
  var unzipFilePlugin = function (settings, updateCallback, statusCallback, notificationCallback) {
    // Always a good idea...
    const self = this;

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    let currentSettings = settings;

    // Parser results to memorize
    let fileStruct = undefined;

    // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
    self.onSettingsChanged = function (newSettings, status) {
      // Here we update our current settings with the variable that is passed in.
      currentSettings = newSettings;
      fileStruct = undefined;
      return true;
    };

    self.isSettingNameChanged = function (newName) {
      return currentSettings.name !== newName;
    };

    self.updateAsync = async function () {
      if (fileStruct === undefined) {
        try {
          await self.parseFile();
        } catch (error) {
          notificationCallback('error', currentSettings.name, error.message);
          fileStruct = null; // setting null will prevent unzipping bad data until we have a new value
        }
      }
      statusCallback(fileStruct ? 'OK' : 'Error');
      updateCallback(fileStruct); //AEF: always put statusCallback before updateCallback. Mandatory for scheduler.
    };

    // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
    self.updateNow = function () {
      self.updateAsync();
      return true;
    };

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function () {};

    self.canSetValue = function () {
      return {
        acceptPath: false,
        hasPostProcess: true,
      };
    };

    self.setValue = function (path, value) {
      if (value?.content && value?.isBinary) {
        currentSettings.content = { ...value };
        currentSettings.data_path = value?.name;
        fileStruct = undefined;
      }
      // TODO error ?
    };

    self.isInternetNeeded = function () {
      return false;
    };

    self.parseFile = async function () {
      if (currentSettings.content && Array.isArray(currentSettings.content.content)) {
        // Old conf.
        // TODO update data
        fileStruct = currentSettings.content;
      } else if (currentSettings.content) {
        const data = currentSettings.content;
        if (!data.content || !data.isBinary) {
          throw new Error('Error in file struct');
        }
        fileStruct = await self.parseContent(data);
      } else {
        throw new Error('No data');
      }
    };

    self.parseContent = async function (content) {
      return await zipToObject(content);
    };
  };
})();
