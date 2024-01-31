/**
 * @author AR
 * @description
 * This datanode is used to get the geolocation coordinate of the device
 */
// // ### Datanode Implementation
//
// -------------------
/**
 * Plugin code for the geolocation datanode Plugin
 *
 * @param settings
 * @param updateCallback
 * @constructor
 */
if (!(xDashConfig.xDashBasicVersion == 'true')) {
  (function () {
    var Geolocation_Plugin = function (
      settings,
      updateCallback,
      statusCallback,
      notificationCallback,
      statusForSchedulerCallback
    ) {
      //initialize error at new instance
      error = false;
      var self = this;
      self.errorState = false;
      // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
      var currentSettings = settings;
      // save past setting in case of cancelling modification in datanodeS
      var pastSettings = settings;
      var pastStatus = 'None';
      var watchID;
      var geolocation;
      var geolocationMethod;
      var location = {
        lat: 0,
        lng: 0,
      };

      // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
      self.onSettingsChanged = function (newSettings, status) {
        if (status === 'OK') {
          pastStatus = status;
          pastSettings = currentSettings;
        }
        // Here we update our current settings with the variable that is passed in.
        currentSettings = newSettings;
        return true;
      };

      self.isSettingNameChanged = function (newName) {
        if (currentSettings.name != newName) return true;
        else return false;
      };

      self.getSavedSettings = function () {
        //statusCallback(pastStatus);
        return [pastStatus, pastSettings];
      };

      // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
      self.updateNow = function (bCalledFromOrchestrator, bForceAutoStart) {
        //Autostart
        if (!bForceAutoStart && currentSettings.autoStart === false) {
          return { notTobeExecuted: true };
        }
        // if (bForceAutoStart&&currentSettings.sampleTime>0) { // when refresh change autostart in setting (needed for periodic datanodes)
        //     currentSettings.autoStart = true;
        // }
        statusCallback('Pending');
        if (geolocationMethod == 'watchPosition') {
          statusCallback('OK');
          updateCallback(location);
        }
        // else if (geolocationMethod == "IPlocation") {
        //     IpGetlocation();
        // }
      };

      // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
      self.onDispose = function () {
        if (geolocationMethod == 'watchPosition') {
          geolocation.clearWatch(watchID);
        }
      };

      self.canSetValue = function () {
        return false;
      };

      //AEF
      // self.isSettingSampleTimeChanged = function(newSampleTime) {
      //     if (currentSettings.sampleTime != newSampleTime)
      //         return true;
      //     else
      //         return false;
      // };

      function showLocation(pos) {
        // it is triggered every coords change
        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        console.log(location);
        statusForSchedulerCallback('Ready');
      }

      function errorHandler(err) {
        var text;
        if (err.code == 1) {
          //retry with IP geolocation
          console.log('Error: Access is denied !');
          text = 'Error: Access is denied !';
          notificationCallback('error', currentSettings.name, text);
          statusForSchedulerCallback('NotReady');
        } else if (err.code == 2) {
          console.log('Error: Position is unavailable !');
          text = 'Error: Position is unavailable !';
          notificationCallback('error', currentSettings.name, text);
          statusForSchedulerCallback('NotReady');
        } else if (err.code == 3) {
          console.log('Error: Timeout expired !');
          text = 'Error: Timeout expired !';
          notificationCallback('error', currentSettings.name, text);
          statusForSchedulerCallback('NotReady');
        }
      }

      function initGeolocation() {
        geolocation = navigator.geolocation;
        if (geolocation) {
          statusForSchedulerCallback('Wait');
          var options = { maximumAge: 0, timeout: 5000, enableHighAccuracy: true };
          watchID = geolocation.watchPosition(showLocation, errorHandler, options);
          geolocationMethod = 'watchPosition';
        } else {
          console.log('Sorry, browser does not support geolocation');
          swal('Browser support', 'Sorry, browser does not support geolocation', 'error');
          errorState = true;
        }
      }

      initGeolocation();
    };
    var errorState = false;
    datanodesManager.loadDatanodePlugin({
      // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
      type_name: 'Geolocation-plugin',
      // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
      display_name: 'Geolocation',
      // **icon_type** : icon of the datanode type displayed in data list
      icon_type: 'geolocation.svg',
      // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
      description: 'A geolocation plugin',
      // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
      external_scripts: [''],
      // **settings** : An array of settings that will be displayed for this plugin when the user adds it
      settings: [
        //{
        //         name: "sampleTime",
        //         display_name: "Sample time",
        //         type: "number",
        //         required: false,
        //         default_value: 5,
        //         suffix: "seconds",
        //         description: "Refresh rate for getting new location."
        //     },
        {
          name: 'autoStart',
          display_name: 'Auto start',
          description: 'Start Geolocation automatically after dashboard play begins or after creation or modification.',
          type: 'boolean',
          default_value: true,
        },
      ],

      newInstance: function (
        settings,
        newInstanceCallback,
        updateCallback,
        statusCallback,
        notificationCallback,
        statusForSchedulerCallback
      ) {
        newInstanceCallback(
          new Geolocation_Plugin(
            settings,
            updateCallback,
            statusCallback,
            notificationCallback,
            statusForSchedulerCallback
          )
        );
        if (errorState) return false;
        else return true;
      },
    });
  })();
}
