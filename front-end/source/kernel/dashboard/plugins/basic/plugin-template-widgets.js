// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Benoit LEHMAN, Tristan BARTEMENT, Guillaume CORBELIN   │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// models
modelsHiddenParams.map3D = {

  };
  
  // Parameters
  modelsParameters.map3D = {

  };
  
  // Layout (default dimensions)
  modelsLayout.map3D = { height: '5vh', width: '19vw', minWidth: '100px', minHeight: '100px' };
  
  /*******************************************************************/
  /*************************** plugin code ***************************/
  /*******************************************************************/
  
  function map3DWidgetPluginClass() {
    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                         Calendar D3 widget                         | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
  
    this.map3DWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
      this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
  
      const self = this;
  
      this.enable = function () {};
      this.disable = function () {};
      this.updateValue = function (e) {
        self.SelectedDate.updateCallback(self.SelectedDate, self.SelectedDate.getValue());
      };
      this.rescale = function () {
        this.render();
      };
  
      this.render = function () {

        
      };
  
      self.render();
    };
  
    // Inherit from baseWidget class
    this.map3DWidget.prototype = baseWidget.prototype;
  
    // Plugin definition
    this.pluginDefinition = {
      name: 'map3D',
      widgetsDefinitionList: {
        map3D: {
          factory: 'map3DWidget',
          title: 'map 3D',
          icn: 'map',
          help: 'wdg/wdg-geo-time/#simple-clock',
        },
      },
    };
  
    this.constructor();
  }
  
  // Inherit from basePlugin class
  map3DWidgetPluginClass.prototype = basePlugin.prototype;

  // Instantiate plugin
  var map3DPlugin = new map3DWidgetPluginClass();
  
  /*******************************************************************/
  /************************ plugin declaration ***********************/
  /*******************************************************************/
  
  widgetsPluginsHandler.loadWidgetPlugin(map3DPlugin);
  