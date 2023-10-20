// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Tristan BARTEMENT             │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Parameters
modelsParameters.vegaGeneric = {
  inheritWidthAndHeight: true,
};

modelsHiddenParams.vegaGeneric = {
  spec: {
    //"$schema": "https://vega.github.io/schema/vega/v5.json",  // GHI issue #250
    marks: [
      {
        type: "text",
        encode: {
          update: {
            text: { value: "Write then connect your Vega spec" },
          },
        },
      },
    ],
  },
};

// Layout (default dimensions)
modelsLayout.vegaGeneric = {
  height: "30vh",
  width: "30vw",
  minWidth: "50px",
  minHeight: "32px",
};

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function vegaWidgetsPluginClass() {
  /**
   * Starts `undefined`, is `null` while loading and finally constains the schema's text when/if available.
   */
  let _JSON_SCHEMA;
  function _fetchSchema() {
    const editorExists = window["xdash"] !== undefined;
    if (editorExists && _JSON_SCHEMA === undefined) {
      _JSON_SCHEMA = null;
      fetch("source/assets/data/vega_json_schema_v5.json")
        .then((response) => response.json())
        .then((json) => {
          _JSON_SCHEMA = json;
          _JSON_SCHEMA.$id =
            WidgetPrototypesManager.ID_URI_SCHEME + "xdash:vega";
        })
        .catch((err) => console.error(err));
    }
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                          createVegaDiv                             | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  function createVegaDiv(idDivContainer, pId, bInteractive) {
    var widgetHtml = document.createElement("div");
    var idDivVega = "vega" + pId;
    if (bInteractive) {
      idDivVega = idDivVega + "c";
    }
    widgetHtml.setAttribute("id", idDivVega);
    widgetHtml.setAttribute(
      "style",
      "text-align:center; height: inherit; width: inherit; background-color: transparent"
    );
    $("#" + idDivContainer).html(widgetHtml);
  }

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                           Vega Generic                             | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.genericVegaWidget = function (
    idDivContainer,
    idWidget,
    idInstance,
    bInteractive
  ) {
    _fetchSchema();

    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    this.rescale = function () {
      //this.render();
    };

    this.render = function () {
      var specif = JSON.parse(
        JSON.stringify(modelsHiddenParams[idInstance].spec)
      ); // solving issue of infinite loop with graphs

      createVegaDiv(idDivContainer, idWidget, bInteractive);

      if (modelsParameters[idInstance].inheritWidthAndHeight) {
        if (bInteractive) {
          specif.width = $("#vega" + idWidget + "c").width();
          specif.height = $("#vega" + idWidget + "c").height();
        } else {
          specif.width = $("#vega" + idWidget).width();
          specif.height = $("#vega" + idWidget).height();
        }
      }

      if (bInteractive) {
        var view = new vega.View(vega.parse(specif), {
          renderer: "canvas", // renderer (canvas or svg)
          container: "#vega" + idWidget + "c", // parent DOM container
          hover: true, // enable hover processing
        });
        return view.runAsync();
        /*vegaEmbed(
                    '#vega' + idWidget + 'c',
                    specif
                );*/
      } else {
        // create a new view instance for a given Vega JSON spec
        var view = new vega.View(vega.parse(specif), { renderer: "none" });

        // generate a static PNG image
        view
          .toCanvas()
          .then(function (canvas) {
            // process node-canvas instance
            // for example, generate a PNG stream to write
            var preview = canvas.toDataURL("image/png");
            $("#vega" + idWidget).html('<img src="' + preview + '"/>');
          })
          .catch(function (err) {
            console.error(err);
          });
      }
    };

    const _DESCRIPTION = new WidgetActuatorDescription(
      "spec",
      "Vega JSON specification",
      WidgetActuatorDescription.READ,
      _JSON_SCHEMA
    );
    this.getActuatorDescriptions = function () {
      return [_DESCRIPTION];
    };

    this.spec = {
      setValue: function (val) {
        if (val != modelsHiddenParams[idInstance].spec) {
          modelsHiddenParams[idInstance].spec = JSON.parse(JSON.stringify(val)); // eliminate circular dependencies
          self.render();
        }
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].spec;
      },
      addValueChangedHandler: function (n) {},
      removeValueChangedHandler: function (n) {},
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.genericVegaWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: "vega",
    widgetsDefinitionList: {
      vegaGeneric: {
        factory: "genericVegaWidget",
        title: "Vega generic",
        icn: "vega-generic-javascript",
        help: "wdg/wdg-plots/#vega",
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
vegaWidgetsPluginClass.prototype = basePlugin.prototype;

var vegaWidgetsPlugin = new vegaWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(vegaWidgetsPlugin);
