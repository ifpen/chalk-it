// ┌──────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                              │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                                  │ \\
// | Licensed under the Apache License, Version 2.0                               │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Ghiles HIDEUR, Tristan BARTEMENT, Guillaume CORBELIN   │ \\                                              │ \\
// └──────────────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Parameters
modelsParameters.loadFile = {
  label: "Choose a file",
  displayLabel: true,
  labelFontSize: 0.1,
  labelColor: "var(--widget-label-color)",
  labelFontFamily: "var(--widget-font-family)",
  labelAlign: "left",
  textColor: "var(--widget-color)",
  subTextColor: "var(--widget-color)",
  textSize: 0.1,
  binaryFileInput: false,
  displayBorder: true,
  borderColor: "var(--widget-border-color)",
  backgroundColor: "var(--widget-dropzone-background-color)",
  labelBackgroundColor: "var(--widget-dropzone-label-background-color)",
  browseButtonTextColor: "var(--widget-button-text)",
  browseButtonDefaultColor: "var(--widget-button-color)",
  browseButtonActiveColor: "var(--widget-button-active-color)",
  browseButtonHoverColor: "var(--widget-button-hover-color)",
  deleteButtonDefaultColor: "var(--widget-delete-button-default-color)",
  deleteButtonActiveColor: "var(--widget-delete-button-active-color)",
  deleteButtonHoverColor: "var(--widget-delete-button-hover-color)",
  deleteButtonIconColor: "var(--widget-delete-button-icon-color)",
  deleteButtonIconHoverColor: "var(--widget-delete-button-icon-hover-color)",
};

// Layout (default dimensions)
modelsLayout.loadFile = {
  height: "19.75vh",
  width: "22vw",
  minWidth: "420px",
  minHeight: "70px",
};

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function loadFileWidgetsPluginClass() {
  this.loadFileWidget = function (
    idDivContainer,
    idWidget,
    idInstance,
    bInteractive
  ) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.getFileSize = function (fileSize) {
      if (fileSize < 1024) {
        return `${fileSize} bytes`;
      } else if (fileSize >= 1024 && fileSize < 1_048_576) {
        return `${(fileSize / 1024).toFixed(1)} KB`;
      } else if (fileSize >= 1_048_576) {
        return `${(fileSize / 1_048_576).toFixed(1)} MB`;
      }
    };

    this.readFile = function (file) {
      if (file.size > 209_715_200) {
        // 209_715_200 bytes = 200 MB
        let notice = new PNotify({
          title: "Loading file",
          text: "Could not load file due to large size",
          type: "error",
          styling: "bootstrap3",
        });
        $(".ui-pnotify-container").on("click", function () {
          notice.remove();
        });
        return;
      }

      const result = {
        type: file.type,
        size: self.getFileSize(file.size),
        name: file.name,
        content: "",
      };

      const reader = new FileReader();
      reader.addEventListener("load", function (event) {
        const data = event.target.result;
        if (data instanceof ArrayBuffer) {
          result.content = btoa(
            [].reduce.call(
              new Uint8Array(data),
              function (p, c) {
                return p + String.fromCharCode(c);
              },
              ""
            )
          );
          result.isBinary = true;
        } else {
          result.content = data;
          result.isBinary = false;
        }
        self.notifyNewValue(result);
      });

      if (modelsParameters[idInstance].binaryFileInput) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    };

    this.notifyNewValue = function (value) {
      modelsTempParams[idInstance].outputFile = value;
      self.outputFile.updateCallback(self.outputFile);
      self.updateFileDisplay();
    }

    this.rescale = function () {
      this.render();
    };

    this.updateFileDisplay = function () {
      const file = modelsTempParams[idInstance].outputFile;
      if(file && file.content && typeof file.content === "string") {
        const name = file.name ?? "";
        const sizeBytes = file.isBinary ? b64StrSize(file.content) : file.content.length;
        const sizeTxt = self.getFileSize(sizeBytes);

        if ($("#file-content-" + idWidget).length) {
          $("#file-name-" + idWidget).text(name);
          $("#file-size-" + idWidget).text(sizeTxt);
        } else {
          self.getDivFile(name, sizeBytes);
        }
      }
    };

    this.render = function () {
      const widgetHtml = document.createElement("div");
      widgetHtml.setAttribute("id", "load-file-widget-html" + idWidget);

      if (modelsParameters[idInstance].displayBorder) {
        widgetHtml.setAttribute(
          "class",
          "load-file-widget-html load-file-widget-html--border"
        );
      } else {
        widgetHtml.setAttribute("class", "load-file-widget-html");
      }

      let divContent = "";

      if (modelsParameters[idInstance].displayLabel) {
        divContent =
          divContent +
          '<div class="label-container" style="' +
          this.labelFontSize() +
          this.labelColor() +
          this.labelFontFamily() +
          " text-align: " +
          modelsParameters[idInstance].labelAlign +
          '">';
        divContent =
          divContent + "<p>" + modelsParameters[idInstance].label + "</p>";
        divContent = divContent + "</div>";
      }

      divContent =
        divContent + '<div id="drag-area-' + idWidget + '" class="drag-area">';

      divContent = divContent + '<div class="drag-area__icon">';
      divContent =
        divContent +
        `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor">
          <path d="M28.992 21.44c-0.704-0.512-1.536-0.768-2.176-0.896v-10.752c0-0.192-0.064-0.32-0.192-0.448l-8.512-8.448c-0.128-0.128-0.256-0.192-0.448-0.192h-11.84c-0.32 0-0.64 0.256-0.64 0.64v29.312c0 0.32 0.256 0.576 0.64 0.576h20.352c0.32 0 0.64-0.256 0.64-0.576v-2.624h0.704c0.512 0 1.344-0.192 1.984-0.768 0.704-0.576 1.152-1.472 1.152-2.88-0.064-1.344-0.768-2.368-1.664-2.944zM24.704 9.088h-6.912v-6.912l6.912 6.912zM25.664 30.208h-19.392v-28.352h10.432v7.68c0 0.32 0.256 0.576 0.64 0.576h8.32v7.872c-0.064-0.064-0.064-0.128-0.128-0.192-0.896-1.28-2.432-2.368-4.992-2.368-3.712 0-5.44 2.048-6.016 3.456-2.624 0.192-4.864 1.92-4.864 4.352s1.792 4.736 4.8 4.736h11.2v2.24zM28.736 26.496c-0.448 0.384-0.96 0.512-1.28 0.512h-12.928c-2.368 0-3.712-1.792-3.712-3.712 0-1.728 1.792-3.264 4.16-3.264 0.256 0 0.512-0.192 0.576-0.448 0.256-0.96 1.6-3.008 5.056-3.008 2.112 0 3.392 0.896 4.096 1.92 0.768 1.024 0.96 2.176 0.96 2.496 0 0.064 0 0.128 0.064 0.192 0.064 0.192 0.256 0.384 0.512 0.384 0.192 0 0.384 0.064 0.576 0.128 0.512 0.128 1.088 0.32 1.6 0.64 0.704 0.448 1.152 1.152 1.152 2.112-0.064 1.088-0.384 1.728-0.832 2.048z"></path>
          <path d="M20.992 19.712c-0.192-0.192-0.576-0.192-0.768 0l-2.048 2.048c-0.192 0.192-0.192 0.576 0 0.768s0.576 0.192 0.768 0l1.088-1.088v3.648c0 0.32 0.256 0.576 0.576 0.576s0.512-0.256 0.512-0.576v-3.648l1.088 1.088c0.192 0.192 0.576 0.192 0.768 0s0.192-0.576 0-0.768l-1.984-2.048z"></path>
        </svg>`;
      divContent = divContent + "</div>";

      divContent = divContent + '<div class="drag-area__text">';
      divContent =
        divContent +
        '<span style="' +
        this.labelFontFamily() +
        this.textSize() +
        this.textColor() +
        '">Drag and drop file here</span>';
      divContent =
        divContent +
        '<span style="' +
        this.labelFontFamily() +
        this.textSize() +
        this.subTextColor() +
        '">Limit 200MB per file</span>';
      divContent = divContent + "</div>";

      divContent = divContent + '<div class="drag-area__browse-btn">';
      divContent =
        divContent +
        '<input type="file" name="file" id="button_' +
        idWidget +
        '_select_file" />';
      divContent =
        divContent +
        '<label id="button_label_' +
        idWidget +
        '" style="' +
        this.labelFontFamily() +
        this.textSize() +
        this.browseButtonTextColor() +
        '" for="button_' +
        idWidget +
        '_select_file">Browse files</label>';
      divContent = divContent + "</div>";

      divContent = divContent + "</div>";

      widgetHtml.innerHTML = divContent;
      $("#" + idDivContainer).html(widgetHtml);

      document.styleSheets[0].addRule(
        "#drag-area-" + idWidget,
        " background-color: " + modelsParameters[idInstance].backgroundColor
      );
      document.styleSheets[0].addRule(
        "#load-file-widget-html" + idWidget,
        " border-color: " + modelsParameters[idInstance].borderColor
      );
      document.styleSheets[0].addRule(
        "#load-file-widget-html" + idWidget,
        " background-color: " +
          modelsParameters[idInstance].labelBackgroundColor
      );
      document.styleSheets[0].addRule(
        "#button_label_" + idWidget,
        this.browseButtonDefaultColor()
      );
      document.styleSheets[0].addRule(
        "#button_label_" + idWidget + ":hover",
        this.browseButtonHoverColor()
      );
      document.styleSheets[0].addRule(
        "#button_label_" + idWidget + ":active",
        this.browseButtonActiveColor()
      );

      this.getDivFile = function (name, size) {
        let divFile =
          '<div id="file-content-' + idWidget + '" class="loaded-file">';

        divFile = divFile + '<div class="loaded-file__icon">';
        divFile =
          divFile +
          '<i class="fa fa-file" aria-hidden="true" style="padding: 0.1rem 0 0 0.5rem; font-size: 1.5rem"></i>';
        divFile = divFile + "</div>";

        divFile = divFile + '<div class="loaded-file__info-file">';
        divFile =
          divFile +
          '<span id="file-name-' +
          idWidget +
          '" title="' +
          name +
          '" class="loaded-file__info-file__name" style="' +
          this.labelFontFamily() +
          this.textSize() +
          this.textColor() +
          '">' +
          name +
          "</span>";
        divFile =
          divFile +
          '<span id="file-size-' +
          idWidget +
          '" title="' +
          size +
          '" class="loaded-file__info-file__size" style="' +
          this.labelFontFamily() +
          this.textSize() +
          this.subTextColor() +
          '">' +
          size +
          "</span>";
        divFile = divFile + "</div>";

        divFile =
          divFile +
          '<div class="loaded-file__close-btn" id="close-file-btn-' +
          idWidget +
          '">';
        divFile = divFile + '<i class="fa fa-times" aria-hidden="true"></i>';
        divFile = divFile + "</div>";

        divFile = divFile + "</div>";

        $("#load-file-widget-html" + idWidget).append(divFile);

        document.styleSheets[0].addRule(
          "#close-file-btn-" + idWidget + " > i",
          this.deleteButtonDefaultColor()
        );
        document.styleSheets[0].addRule(
          "#close-file-btn-" + idWidget + " > i:hover",
          this.deleteButtonHoverColor()
        );
        document.styleSheets[0].addRule(
          "#close-file-btn-" + idWidget + " > i:active",
          this.deleteButtonActiveColor()
        );

        document.styleSheets[0].addRule(
          "#close-file-btn-" + idWidget + " > i",
          "color: " + modelsParameters[idInstance].deleteButtonIconColor
        );
        document.styleSheets[0].addRule(
          "#close-file-btn-" + idWidget + " > i:hover",
          "color: " + modelsParameters[idInstance].deleteButtonIconHoverColor
        );

        $("#close-file-btn-" + idWidget).on("click", function () {
          self.outputFile.setValue({});
          self.outputFile.updateCallback(self.outputFile);
        });
      };

      if (!_.isUndefined(modelsTempParams[idInstance].outputFile)) {
        self.updateFileDisplay();
      }

      this.displayFile = function () {
        modelsTempParams[idInstance].counter = 0;

        $("#drag-area-" + idWidget).on("dragenter", function (event) {
          event.preventDefault();
          event.stopPropagation();
          modelsTempParams[idInstance].counter++;
          // set opacity to 50%
          $("#drag-area-" + idWidget).css({ opacity: ".5" });
        });

        $("#drag-area-" + idWidget).on("dragover", function (event) {
          event.preventDefault();
          event.stopPropagation();
        });

        $("#drag-area-" + idWidget).on("dragleave", function (event) {
          event.preventDefault();
          event.stopPropagation();
          // reset opacity
          modelsTempParams[idInstance].counter--;
          if (modelsTempParams[idInstance].counter === 0) {
            $("#drag-area-" + idWidget).css({ opacity: "" });
          }
        });

        $("#drag-area-" + idWidget).on("drop", function (event) {
          $("#drag-area-" + idWidget).css({ opacity: "" });
          if (
            event.originalEvent.dataTransfer &&
            event.originalEvent.dataTransfer.files.length
          ) {
            event.preventDefault();
            event.stopPropagation();
            self.readFile(event.originalEvent.dataTransfer.files[0]);
          }
        });

        $("#button_" + idWidget + "_select_file").on("change", function (
          event
        ) {
          const file = event.target.files[0];
          self.readFile(file);
        });
      };

      self.displayFile();
    };

    const _OUTPUT_DESCRIPTOR = new WidgetActuatorDescription(
      "outputFile",
      "File content",
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_FILE_LIKE,
    );
    this.getActuatorDescriptions = function () {
      return [_OUTPUT_DESCRIPTOR];
    };

    this.outputFile = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsTempParams[idInstance].outputFile = val;
        self.render();
      },
      getValue: function () {
        return modelsTempParams[idInstance].outputFile;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
      setCaption: function (caption, bCaptionManuallyChanged) {
        if (modelsParameters[idInstance].inheritLabelFromData) {
          self.captionHelper(
            caption,
            self.bIsInteractive,
            bCaptionManuallyChanged
          );
          self.render();
        }
      },
      clearCaption: function () {
        modelsParameters[idInstance].label = "";
        self.render();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.loadFileWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: "loadFile",
    widgetsDefinitionList: {
      loadFile: {
        factory: "loadFileWidget",
        title: "Load file",
        icn: "load-file",
        help: "wdg/wdg-basics/#load-file",
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
loadFileWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var loadFileWidgetsPlugin = new loadFileWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(loadFileWidgetsPlugin);
