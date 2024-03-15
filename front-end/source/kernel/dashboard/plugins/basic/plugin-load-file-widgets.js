// ┌──────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                              │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                                  │ \\
// | Licensed under the Apache License, Version 2.0                               │ \\
// ├──────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Ghiles HIDEUR, Tristan BARTEMENT, Guillaume CORBELIN   │ \\
// └──────────────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Parameters
modelsParameters.loadFile = {
  label: 'Choose a file',
  displayLabel: true,
  labelFontSize: 0.1,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  labelAlign: 'left',
  textColor: 'var(--widget-color)',
  subTextColor: 'var(--widget-color)',
  textSize: 0.1,
  binaryFileInput: false,
  displayBorder: true,
  borderColor: 'var(--widget-border-color)',
  backgroundColor: 'var(--widget-dropzone-background-color)',
  displayBrowseButton: true,
  labelBackgroundColor: 'var(--widget-dropzone-label-background-color)',
  browseButtonTextColor: 'var(--widget-button-text)',
  browseButtonDefaultColor: 'var(--widget-button-color)',
  browseButtonActiveColor: 'var(--widget-button-active-color)',
  browseButtonHoverColor: 'var(--widget-button-hover-color)',
  deleteButtonDefaultColor: 'var(--widget-delete-button-default-color)',
  deleteButtonActiveColor: 'var(--widget-delete-button-active-color)',
  deleteButtonHoverColor: 'var(--widget-delete-button-hover-color)',
  deleteButtonIconColor: 'var(--widget-delete-button-icon-color)',
  deleteButtonIconHoverColor: 'var(--widget-delete-button-icon-hover-color)',
};

// Layout (default dimensions)
modelsLayout.loadFile = {
  height: '15vh',
  width: '20vw',
  minWidth: '95px',
  minHeight: '70px',
};

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function loadFileWidgetsPluginClass() {
  this.loadFileWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    const self = this;

    this.enable = function () {};
    this.disable = function () {};
    this.updateValue = function (e) {};

    /**
     * Handles errors when reading a file.
     *
     * @param {File} file - The file
     * @param {string} error - Error message
     */
    function _handleFileError(file, error) {
      const text = 'Error reading ' + file.name + ': ' + error;
      const notice = new PNotify({
        title: 'Loading file',
        text,
        type: 'error',
        styling: 'bootstrap3',
      });
      $('.ui-pnotify-container').on('click', () => notice.remove());
      console.error(text);
    }

    this.readFile = function (file) {
      if (file.size > 104_857_600) {
        // 104_857_600 bytes = 100 MB
        _handleFileError(file, 'Unable to load file due to large size over 100MB');
        return;
      }

      const result = {
        type: file.type,
        size: file.size,
        name: file.name,
        content: '',
      };

      const reader = new FileReader();
      reader.addEventListener('error', function (event) {
        self.removeSpinner();
        reader.abort();
        _handleFileError(file, event.error);
      });
      reader.addEventListener('load', function (event) {
        self.removeSpinner();
        const data = event.target.result;
        if (data instanceof ArrayBuffer) {
          result.content = base64ArrayBuffer(data);
          result.isBinary = true;
        } else {
          result.content = data;
          result.isBinary = false;
        }
        self.notifyNewValue(result);
      });

      this.addSpinner();
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
    };

    this.rescale = function () {
      this.render();
    };

    this.updateFileDisplay = function () {
      const file = modelsTempParams[idInstance].outputFile;
      if (file && file.content && typeof file.content === 'string') {
        const name = file.name ?? '';
        const sizeBytes = file.isBinary ? b64StrSize(file.content) : file.content.length;
        const sizeTxt = formatFileSize(sizeBytes);

        if ($('#file-content' + idWidget).length) {
          $('#file-name-' + idWidget).text(name);
          $('#file-size-' + idWidget).text(sizeTxt);
        } else {
          self.addFileDiv(name, sizeTxt);
        }
      }
    };

    this.addFileDiv = function (name, size) {
      // Check if the div file already exists
      if ($('#loaded-file' + idWidget).length) return;

      let divFile = '<div id="loaded-file' + idWidget + '" class="loaded-file">';

      divFile += '<div class="loaded-file__icon-wrapper">';
      divFile += '<i class="fa fa-file" aria-hidden="true"></i>';
      divFile += '</div>';

      divFile += '<div class="loaded-file__info-file-wrapper">';
      divFile +=
        '<span id="file-name-' +
        idWidget +
        '" title="' +
        name +
        '" class="loaded-file__info-file-wrapper__name" style="' +
        this.labelFontFamily() +
        this.textSize() +
        this.textColor() +
        '">' +
        name +
        '</span>';
      divFile +=
        '<span id="file-size-' +
        idWidget +
        '" title="' +
        size +
        '" class="loaded-file__info-file-wrapper__size" style="' +
        this.labelFontFamily() +
        this.textSize() +
        this.subTextColor() +
        '">' +
        size +
        '</span>';
      divFile += '</div>';

      divFile += '<div id="close-file-btn' + idWidget + '" class="loaded-file__close-btn-wrapper">';
      divFile += '<i class="fa fa-times" aria-hidden="true"></i>';
      divFile += '</div>';

      divFile += '</div>';

      $('#load-file-widget-html' + idWidget).append(divFile);

      document.styleSheets[0].addRule('#close-file-btn' + idWidget + ' > i', this.deleteButtonDefaultColor());
      document.styleSheets[0].addRule('#close-file-btn' + idWidget + ' > i:hover', this.deleteButtonHoverColor());
      document.styleSheets[0].addRule('#close-file-btn' + idWidget + ' > i:active', this.deleteButtonActiveColor());

      document.styleSheets[0].addRule(
        '#close-file-btn' + idWidget + ' > i',
        'color: ' + modelsParameters[idInstance].deleteButtonIconColor
      );
      document.styleSheets[0].addRule(
        '#close-file-btn' + idWidget + ' > i:hover',
        'color: ' + modelsParameters[idInstance].deleteButtonIconHoverColor
      );

      $('#close-file-btn' + idWidget).on('click', function () {
        self.outputFile.setValue({});
        self.outputFile.updateCallback(self.outputFile);
      });
    };

    this.addSpinner = function () {
      const widgetContainer = document.getElementById('load-file-widget-html' + idWidget);
      const divElement = document.createElement('div');
      const iElement = document.createElement('i');

      divElement.setAttribute('id', 'icon-wrapper' + idWidget);
      divElement.setAttribute('class', 'load-spinner-wrapper');
      iElement.setAttribute('class', 'fa fa-spinner fa-spin load-spinner-wrapper__icon');

      divElement.append(iElement);
      widgetContainer.append(divElement);
    };

    this.removeSpinner = function () {
      const divElement = document.getElementById('icon-wrapper' + idWidget);
      divElement.remove();
    };

    this.render = function () {
      const widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'load-file-widget-html' + idWidget);

      // Backward compatibility
      if (_.isUndefined(modelsParameters[idInstance].displayBrowseButton)) {
        modelsParameters[idInstance].displayBrowseButton = true;
      }

      if (modelsParameters[idInstance].displayBorder) {
        widgetHtml.setAttribute('class', 'load-file-widget-html load-file-widget-html--border');
      } else {
        widgetHtml.setAttribute('class', 'load-file-widget-html');
      }

      let divContent = '';

      if (modelsParameters[idInstance].displayLabel) {
        // conversion to enable HTML tags
        const labelText = this.getTransformedText('label');
        divContent +=
          '<div id="load-file-label' +
          idWidget +
          '" class="label-wrapper" style="' +
          this.labelFontSize() +
          this.labelColor() +
          this.labelFontFamily() +
          ' text-align: ' +
          modelsParameters[idInstance].labelAlign +
          '">';
        divContent += '<p>' + labelText + '</p>';
        divContent += '</div>';
      }

      divContent += '<div id="drag-area' + idWidget + '" class="drag-area">';

      divContent += '<div id="drag-area-icon' + idWidget + '" class="drag-area__icon-wrapper">';
      divContent += `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor">
          <path d="M28.992 21.44c-0.704-0.512-1.536-0.768-2.176-0.896v-10.752c0-0.192-0.064-0.32-0.192-0.448l-8.512-8.448c-0.128-0.128-0.256-0.192-0.448-0.192h-11.84c-0.32 0-0.64 0.256-0.64 0.64v29.312c0 0.32 0.256 0.576 0.64 0.576h20.352c0.32 0 0.64-0.256 0.64-0.576v-2.624h0.704c0.512 0 1.344-0.192 1.984-0.768 0.704-0.576 1.152-1.472 1.152-2.88-0.064-1.344-0.768-2.368-1.664-2.944zM24.704 9.088h-6.912v-6.912l6.912 6.912zM25.664 30.208h-19.392v-28.352h10.432v7.68c0 0.32 0.256 0.576 0.64 0.576h8.32v7.872c-0.064-0.064-0.064-0.128-0.128-0.192-0.896-1.28-2.432-2.368-4.992-2.368-3.712 0-5.44 2.048-6.016 3.456-2.624 0.192-4.864 1.92-4.864 4.352s1.792 4.736 4.8 4.736h11.2v2.24zM28.736 26.496c-0.448 0.384-0.96 0.512-1.28 0.512h-12.928c-2.368 0-3.712-1.792-3.712-3.712 0-1.728 1.792-3.264 4.16-3.264 0.256 0 0.512-0.192 0.576-0.448 0.256-0.96 1.6-3.008 5.056-3.008 2.112 0 3.392 0.896 4.096 1.92 0.768 1.024 0.96 2.176 0.96 2.496 0 0.064 0 0.128 0.064 0.192 0.064 0.192 0.256 0.384 0.512 0.384 0.192 0 0.384 0.064 0.576 0.128 0.512 0.128 1.088 0.32 1.6 0.64 0.704 0.448 1.152 1.152 1.152 2.112-0.064 1.088-0.384 1.728-0.832 2.048z"></path>
          <path d="M20.992 19.712c-0.192-0.192-0.576-0.192-0.768 0l-2.048 2.048c-0.192 0.192-0.192 0.576 0 0.768s0.576 0.192 0.768 0l1.088-1.088v3.648c0 0.32 0.256 0.576 0.576 0.576s0.512-0.256 0.512-0.576v-3.648l1.088 1.088c0.192 0.192 0.576 0.192 0.768 0s0.192-0.576 0-0.768l-1.984-2.048z"></path>
        </svg>`;
      divContent += '</div>';

      divContent += '<div id="drag-area-text' + idWidget + '" class="drag-area__text-wrapper">';
      divContent +=
        '<span style="' +
        this.labelFontFamily() +
        this.textSize() +
        this.textColor() +
        '">Drag & drop file here</span>';
      divContent +=
        '<span style="' +
        this.labelFontFamily() +
        this.textSize() +
        this.subTextColor() +
        '">Limit 100MB per file</span>';
      divContent += '</div>';

      if (modelsParameters[idInstance].displayBrowseButton) {
        divContent += '<div id="browse-btn' + idWidget + '" class="drag-area__browse-btn-wrapper">';
        divContent += '<input type="file" name="file" id="browse-btn-input' + idWidget + '_select_file" />';
        divContent +=
          '<label id="browse-btn-label' +
          idWidget +
          '" style="' +
          this.labelFontFamily() +
          this.textSize() +
          this.browseButtonTextColor() +
          '" for="browse-btn-input' +
          idWidget +
          '_select_file">Browse files</label>';
        divContent += '</div>';
        divContent += '</div>';
      }

      widgetHtml.innerHTML = divContent;
      $('#' + idDivContainer).html(widgetHtml);

      document.styleSheets[0].addRule(
        '#drag-area' + idWidget,
        ' background-color: ' + modelsParameters[idInstance].backgroundColor
      );
      document.styleSheets[0].addRule(
        '#load-file-widget-html' + idWidget,
        ' border-color: ' + modelsParameters[idInstance].borderColor
      );
      document.styleSheets[0].addRule(
        '#load-file-widget-html' + idWidget,
        ' background-color: ' + modelsParameters[idInstance].labelBackgroundColor
      );
      document.styleSheets[0].addRule('#browse-btn-label' + idWidget, this.browseButtonDefaultColor());
      document.styleSheets[0].addRule('#browse-btn-label' + idWidget + ':hover', this.browseButtonHoverColor());
      document.styleSheets[0].addRule('#browse-btn-label' + idWidget + ':active', this.browseButtonActiveColor());

      modelsTempParams[idInstance].counter = 0;

      $('#drag-area' + idWidget).on('dragenter', function (event) {
        event.preventDefault();
        event.stopPropagation();
        modelsTempParams[idInstance].counter++;
        // set opacity to 50%
        $('#drag-area' + idWidget).css({ opacity: '.5' });
      });

      $('#drag-area' + idWidget).on('dragover', function (event) {
        event.preventDefault();
        event.stopPropagation();
      });

      $('#drag-area' + idWidget).on('dragleave', function (event) {
        event.preventDefault();
        event.stopPropagation();
        // reset opacity
        modelsTempParams[idInstance].counter--;
        if (modelsTempParams[idInstance].counter === 0) {
          $('#drag-area' + idWidget).css({ opacity: '' });
        }
      });

      $('#drag-area' + idWidget).on('drop', function (event) {
        $('#drag-area' + idWidget).css({ opacity: '' });
        if (event.originalEvent.dataTransfer && event.originalEvent.dataTransfer.files.length) {
          event.preventDefault();
          event.stopPropagation();
          self.readFile(event.originalEvent.dataTransfer.files[0]);
        }
      });

      $('#browse-btn-input' + idWidget + '_select_file').on('change', function (event) {
        self.readFile(event.target.files[0]);
      });

      if (!_.isUndefined(modelsTempParams[idInstance].outputFile)) {
        this.updateFileDisplay();
      }

      /**
       * Updates the content and layout of the widget based on the current widget width.
       *
       * @returns {void}
       */
      const widgetDiv = document.getElementById(idDivContainer);
      const widgetWidth = widgetDiv.clientWidth;
      const isWidgetWidthLessThan290 = widgetWidth < 290;
      const isWidgetWidthLessThan240 = widgetWidth < 240;

      const dragArea = document.getElementById('drag-area' + idWidget);
      const dragAreaText = document.getElementById('drag-area-text' + idWidget);
      const dragAreaIcon = document.getElementById('drag-area-icon' + idWidget);

      this.updateWidgetContent = function () {
        if (isWidgetWidthLessThan290) {
          document.styleSheets[0].addRule(`#loaded-file${idWidget} .loaded-file__icon-wrapper`, 'display: none');
        } else {
          document.styleSheets[0].addRule(`#loaded-file${idWidget} .loaded-file__icon-wrapper`, 'display: block');
        }
        dragAreaIcon.classList.toggle('drag-area__icon-wrapper--hidden', isWidgetWidthLessThan290);

        dragArea.classList.toggle('drag-area--column', isWidgetWidthLessThan240);
        dragAreaText.children[0].textContent = isWidgetWidthLessThan240 ? 'Drag & Drop' : 'Drag & drop file here';
        dragAreaText.children[1].classList.toggle('drag-area__text-wrapper__span--hidden', isWidgetWidthLessThan240);
      };

      if (bInteractive) {
        // Call the function once to ensure the content is hidden initially
        this.updateWidgetContent();
      } else {
        const observer = new ResizeObserver(() => {
          this.updateWidgetContent();
        });
        observer.observe(widgetDiv);
      }
    };

    const _OUTPUT_DESCRIPTOR = new WidgetActuatorDescription(
      'outputFile',
      'File content',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_FILE_LIKE
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
      setCaption: function (caption, bCaptionManuallyChanged) {},
      clearCaption: function () {},
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.loadFileWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'loadFile',
    widgetsDefinitionList: {
      loadFile: {
        factory: 'loadFileWidget',
        title: 'Load file control',
        icn: 'load-file',
        help: 'wdg/wdg-basics/#load-file',
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
