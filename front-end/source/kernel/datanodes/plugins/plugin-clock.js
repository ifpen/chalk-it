(function () {
  var clockDatanode = function (settings, updateCallback, statusCallback) {
    //initialize error at new instance
    error = false;

    var self = this;
    var currentSettings = settings;
    // save past setting in case of cancelling modification in datanodeS
    var pastSettings = settings;
    var pastStatus = 'None';

    this.updateNow = function () {
      statusCallback('Pending');
      var date = new Date();

      var data = {
        numeric_value: date.getTime(),
        full_string_value: date.toLocaleString(),
        date_string_value: date.toLocaleDateString(),
        time_string_value: date.toLocaleTimeString(),
        date_object: date,
      };
      statusCallback('OK');
      updateCallback(data);

      return true; //ABK;
    };

    this.onDispose = function () {};

    this.onSettingsChanged = function (newSettings, status) {
      if (status === 'OK') {
        pastStatus = status;
        pastSettings = currentSettings;
      }
      currentSettings = newSettings;
      return true; //ABK
    };

    this.isSettingNameChanged = function (newName) {
      if (currentSettings.name != newName) return true;
      else return false;
    };

    // AEF comment here to inhibite memory of past values
    // self.getSavedSettings = function() {
    //     return [pastStatus, pastSettings];
    // };

    //AEF
    this.isSettingSampleTimeChanged = function (newSampleTime) {
      if (currentSettings.sampleTime != newSampleTime) return true;
      else return false;
    };

    self.canSetValue = function () {
      return false;
    };

    self.isInternetNeeded = function () {
      return false;
    };
  };

  var error = false;
  datanodesManager.loadDatanodePlugin({
    type_name: 'Clock_web-service',
    display_name: 'Clock',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'clock.svg',
    description: 'Clock trigger',
    settings: [
      {
        name: 'sampleTime',
        display_name: 'Sample time',
        type: 'number',
        suffix: 'seconds',
        default_value: 1,
      },
      {
        //ABK
        name: 'autoStart',
        display_name: 'AUTO START',
        description: 'Starts datanode automatically after dashboard play begins or after creation or modification.',
        type: 'boolean',
        default_value: true,
      },
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback) {
      newInstanceCallback(new clockDatanode(settings, updateCallback, statusCallback));
      if (error)
        //ABK
        return false;
      else return true;
    },
  });
})();
