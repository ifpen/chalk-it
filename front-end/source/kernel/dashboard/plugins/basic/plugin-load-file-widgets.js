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

// Models
modelsHiddenParams.loadFile = { outputFile: '' };

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
     * Format file size in bytes to a readable string.
     *
     * @param {number} fileSize - The file size in bytes.
     * @returns {string} Formatted file size.
     */
    function _getFileSize(fileSize) {
      if (fileSize < 1024) {
        return `${fileSize} bytes`;
      } else if (fileSize < 1_048_576) {
        return `${(fileSize / 1024).toFixed(1)} KB`; // 1024 * 1024
      } else {
        return `${(fileSize / 1_048_576).toFixed(1)} MB`; // 1024 * 1024
      }
    }

    /**
     * Retrieves the file extension from a given file name.
     *
     * @function
     * @param {string} fileName - The file name to extract the extension from.
     * @returns {string} The file extension without the dot (e.g. "txt" for "example.txt").
     */
    function _getFileExtension(fileName) {
      const extension = fileName.split('.').pop();
      return extension;
    }

    /**
     * Processes text file data based on its extension.
     *
     * @param {string} fileExtension - The extension of the file.
     * @param {string} fileData - The data of the file.
     * @returns {string|object} - The processed data of the file.
     */
    function _processTextFile(fileExtension, fileData) {
      const extensions = ['json', 'xprjson'];
      return extensions.includes(fileExtension)
        ? JSON.parse(JSON.stringify(eval('(' + fileData + ')')), null, 2)
        : fileData;
    }

    /**
     * Processes binary file data and returns it as a base64 string.
     *
     * @param {Uint8Array} fileData - The data of the file.
     * @returns {string} - The base64 string of the file data.
     */
    function _processBinaryFile(fileData) {
      return btoa([].reduce.call(new Uint8Array(fileData), (p, c) => p + String.fromCharCode(c), ''));
    }

    /**
     * Checks the size of a file and returns -1 if it exceeds the maximum size.
     *
     * @param {number} size - The size of the file in bytes.
     * @returns {number} - Either the size of the file or -1 if the size exceeds the maximum size.
     */
    function _checkFileSize(size) {
      if (size > 104_857_600) {
        // 104_857_600 bytes = 100 MB
        throw new Error('Unable to load file due to large size over 100MB');
      }
    }

    /**
     * Handles errors when reading a zip file.
     *
     * @param {object} file - The file
     * @returns {function} - A function that handles the error when reading the zip file.
     */
    function _handleFileError(file, error) {
      const notice = new PNotify({
        title: 'Unzip file',
        text: 'Error reading ' + file.name + ': ' + error,
        type: 'error',
        styling: 'bootstrap3',
      });
      $('.ui-pnotify-container').on('click', () => notice.remove());
      console.error('Error reading ' + file.name + ': ' + error);
      return -1;
    }

    /**
     *
     * @param {*} file
     */
    this.readFile = async function (file) {
      try {
        _checkFileSize(file.size);
      } catch (error) {
        return _handleFileError(file, error.message);
      }

      const result = {
        type: file.type,
        size: _getFileSize(file.size),
        name: file.name,
        content: '',
      };
      const fileExtension = _getFileExtension(file.name);
      const extensionsText = ['txt', 'json', 'xprjson', 'xml', 'svg', 'html', 'css', 'js', 'ts', 'md', 'csv'];
      const extensionsBinary = ['xls', 'xlsx', 'jpg', 'jpeg', 'png', 'tiff', 'gif'];
      const fileTypes = ['', 'application/json'];
      const zipContent = [];

      if (fileExtension && fileTypes.includes(result.type)) {
        result.type = fileExtension;
      }

      if (fileExtension === 'zip') {
        try {
          const zip = await JSZip.loadAsync(file);
          for (const relativePath in zip.files) {
            const zipEntry = zip.files[relativePath];
            const isDir = zipEntry.dir;
            if (isDir) {
              continue;
            }
            const fileExtension = _getFileExtension(relativePath);
            const fileSize = zipEntry._data.uncompressedSize; // Get the compressed size of the zipEntry

            // do not increase this value otherwise the browser will crash
            // The crash is caused by the updateDataNodeFileFromWidget() function
            if (fileSize > 73_400_320) {
              // 73_400_320 bytes == 70 MB
              continue;
            }

            if (fileExtension && extensionsText.includes(fileExtension)) {
              const fileData = await zipEntry.async('string');
              zipContent.push({
                name: relativePath,
                content: _processTextFile(fileExtension, fileData),
              });
            } else {
              const fileData = await zipEntry.async('uint8array');
              zipContent.push({
                name: relativePath,
                content: _processBinaryFile(fileData),
              });
            }
          }
          result.content = zipContent;
          modelsHiddenParams[idInstance].outputFile = result;
          updateDataNodeFileFromWidget(idInstance, result);
        } catch (error) {
          return _handleFileError(file, error);
        }
      } else {
        const reader = new FileReader();
        reader.addEventListener('load', function (event) {
          const data = event.target.result;
          if (data instanceof ArrayBuffer) {
            result.content = _processBinaryFile(data);
            result.isBinary = true;
          } else {
            const content = _processTextFile(fileExtension, data);
            result.content = content;
            result.isBinary = false;
          }
          modelsHiddenParams[idInstance].outputFile = result;
          updateDataNodeFileFromWidget(idInstance, result);
        });

        if (modelsParameters[idInstance].binaryFileInput) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsText(file);
        }
      }
    };

    this.rescale = function () {
      this.render();
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

      this.addFileDiv = function (name, size) {
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
          $('#browse-btn-input' + idWidget + '_select_file').val('');
          $('#loaded-file' + idWidget).remove();
          delete modelsTempParams[idInstance].fileName;
          delete modelsTempParams[idInstance].fileSize;
          modelsHiddenParams[idInstance].outputFile = {};
          updateDataNodeFileFromWidget(idInstance, {});
          self.render();
        });
      };

      if (!_.isUndefined(modelsHiddenParams[idInstance].outputFile)) {
        if (_.isEmpty(modelsHiddenParams[idInstance].outputFile)) {
          updateDataNodeFileFromWidget(idInstance, {});
          delete modelsTempParams[idInstance].fileName;
          delete modelsTempParams[idInstance].fileSize;
        } else {
          updateDataNodeFileFromWidget(idInstance, modelsHiddenParams[idInstance].outputFile);
        }
      }

      if (
        !_.isUndefined(modelsTempParams[idInstance].fileName) &&
        !_.isUndefined(modelsTempParams[idInstance].fileSize)
      ) {
        const name = modelsTempParams[idInstance].fileName;
        const size = modelsTempParams[idInstance].fileSize;
        self.addFileDiv(name, size);
      }

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

      this.readFileEvent = async function (event) {
        this.addSpinner();
        let file = {};
        if (event.type == 'change') {
          file = event.target.files[0];
        } else if (event.type == 'drop') {
          file = event.originalEvent.dataTransfer.files[0];
        }
        const readFile = await self.readFile(file);
        if (readFile != -1) {
          const name = file.name;
          const size = _getFileSize(file.size);
          modelsTempParams[idInstance].fileName = name;
          modelsTempParams[idInstance].fileSize = size;

          if ($('#loaded-file' + idWidget).length) {
            $('#file-name-' + idWidget).text(name);
            $('#file-size-' + idWidget).text(size);
          } else {
            self.addFileDiv(name, size);
          }
        }
        this.removeSpinner();
      };

      this.displayFile = (function () {
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
            self.readFileEvent(event);
          }
        });

        $('#browse-btn-input' + idWidget + '_select_file').on('change', function (event) {
          self.readFileEvent(event);
        });
      })();

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
      WidgetActuatorDescription.FILE
    );
    this.getActuatorDescriptions = function () {
      return [_OUTPUT_DESCRIPTOR];
    };

    this.outputFile = {
      updateCallback: function () {},
      setValue: function (val) {},
      getValue: function () {
        return modelsHiddenParams[idInstance].outputFile;
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
        title: 'Load file',
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
