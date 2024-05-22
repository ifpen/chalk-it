// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2023 IFPEN                                             │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) :  Mongi BEN GAID                                        │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.foliumMaps = {
  map: '',
};

// Parameters
modelsParameters.foliumMaps = {};

// Layout (default dimensions)
modelsLayout.foliumMaps = { height: '30vh', width: '30vw', minWidth: '50px', minHeight: '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function foliumWidgetPluginClass() {
  this.foliumMapWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.rescale = function () {
      this.render();
    };

    this.hasScrollBar = function (element) {
      return element.get(0).scrollHeight > element.get(0).clientHeight;
    };

    this.render = function () {
      let foliumDiv = document.createElement('div');
      let wId = 'folium-map' + idWidget;
      if (bInteractive) wId = wId + 'c';
      foliumDiv.setAttribute('id', wId);

      if (modelsHiddenParams[idInstance].map) {
        foliumDiv.innerHTML = modelsHiddenParams[idInstance].map;

        try {
          // Cleaning folium wrappers originally for Jupyter notebooks
          const div1 = foliumDiv.firstElementChild;
          if (div1.tagName == 'DIV') {
            div1.style.height = '100%';
            const div2 = div1.firstElementChild;
            if (div2.tagName == 'DIV') {
              div2.style.height = '100%';
              div2.style['padding-bottom'] = null;
              const div3 = div2.firstElementChild;
              if (div3.tagName == 'DIV') {
                div3.style.height = '100%';
              }
            }
          }
        } catch (ex) {
          console.log(ex);
        }
      }
      foliumDiv.setAttribute(
        'style',
        'width: inherit; height: inherit; background-color: rgba(0, 0, 0, 0)'
      );
      $('#' + idDivContainer).html(foliumDiv);
    };

    const _REPR_HTML_DESCRIPTOR = new WidgetActuatorDescription(
      '_repr_html_',
      'Folium Map _repr_html_',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    this.getActuatorDescriptions = function () {
      return [_REPR_HTML_DESCRIPTOR];
    };

    this._repr_html_ = {
      setValue: function (val) {
        modelsHiddenParams[idInstance].map = val;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].map;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.foliumMapWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'Maps',
    widgetsDefinitionList: {
      foliumMaps: { factory: 'foliumMapWidget', title: 'Folium maps', icn: 'folium', help: '' },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
foliumWidgetPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var foliumWidgetPlugin = new foliumWidgetPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(foliumWidgetPlugin);
