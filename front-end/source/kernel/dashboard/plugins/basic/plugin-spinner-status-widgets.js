// ┌──────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                              │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2024 IFPEN                                                       │ \\
// | Licensed under the Apache License, Version 2.0                               │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Ghiles HIDEUR                                          │ \\
// └──────────────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Parameters
modelsParameters.spinnerStatus = {
  fontsize: 1,
  color: 'var(--widget-color)',
  backgroundColor: 'var(--disabled-color-opacity)',
};

// Layout (default dimensions)
modelsLayout.spinnerStatus = {
  height: '15vh',
  width: '10vw',
  minWidth: '60px',
  minHeight: '60px',
};

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function spinnerStatusWidgetsPluginClass() {
  this.spinnerStatusWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    this.enable = function () {};
    this.disable = function () {};

    this.addSpinner = function () {
      const widgetContainer = document.getElementById('spinner-status-widget-html' + idWidget);
      if (widgetContainer.hasChildNodes()) return;
      const divElement = document.createElement('div');
      const iElement = document.createElement('i');

      divElement.setAttribute('id', 'icon-wrapper' + idWidget);
      divElement.setAttribute('class', 'spinner-wrapper');
      iElement.setAttribute('class', 'fa fa-spinner fa-spin');

      divElement.style.backgroundColor = modelsParameters[idInstance].backgroundColor;
      divElement.style.color = modelsParameters[idInstance].color;
      iElement.style.cssText = self.fontSize();

      divElement.append(iElement);
      widgetContainer.append(divElement);
    };

    this.removeSpinner = function () {
      const divElement = document.getElementById('icon-wrapper' + idWidget);
      divElement?.remove();
    };

    this.render = function () {
      const widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'spinner-status-widget-html' + idWidget);
      widgetHtml.setAttribute('class', 'spinner-status-widget-html');
      $('#' + idDivContainer).html(widgetHtml);

      if (!bInteractive) {
        self.addSpinner();
      }
    };

    const _DATANODE_DESCRIPTOR = new WidgetActuatorDescription(
      'trigger',
      'Node to listen',
      WidgetActuatorDescription.TRIGGER,
      WidgetPrototypesManager.SCHEMA_ANYTHING
    );

    this.getActuatorDescriptions = function () {
      return [_DATANODE_DESCRIPTOR];
    };

    this.trigger = {
      updateCallback: function () {},
      setValue: function (val) {
        const dnName = widgetConnector.widgetsConnection[idInstance].sliders['trigger'].dataNode;
        const dataNode = datanodesManager.getDataNodeByName(dnName);

        dataNode.status.subscribe((newStatus) => {
          if (newStatus == 'Pending') {
            self.render();
            self.addSpinner();
          } else {
            self.removeSpinner();
          }
        });
      },
      getValue: function () {},
      updateCallback: function () {},
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
      setCaption: function (caption, bCaptionManuallyChanged) {},
      clearCaption: function () {},
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.spinnerStatusWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'spinnerStatus',
    widgetsDefinitionList: {
      spinnerStatus: {
        factory: 'spinnerStatusWidget',
        title: 'Spinner status',
        icn: 'status',
        help: 'wdg/wdg-basics/#spinner-status',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
spinnerStatusWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
const spinnerStatusWidgetsPlugin = new spinnerStatusWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(spinnerStatusWidgetsPlugin);
