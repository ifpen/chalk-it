﻿// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2024 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s):  Tristan BARTEMENT, Mongi BEN GAID, Abir EL FEKI,      │ \\
// │                       Guillaume CORBELIN                                    │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';
import { getRealMimeType, base64ArrayBuffer } from 'kernel/datanodes/plugins/thirdparty/utils';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.annotationIconInfo = {};
modelsHiddenParams.annotationLabel = {};
modelsHiddenParams.annotationRectangle = {};
modelsHiddenParams.annotationImage = {
  fileContentBase64: '',
  mimeType: '',
};
modelsHiddenParams.annotationImageConnected = {
  fileContentBase64: '',
  mimeType: '',
};
modelsHiddenParams.annotationVideo = {
  screenshotBase64: '',
  screenshotMimeType: '',
  screenshotData: '',
};

// Parameters
modelsParameters.annotationIconInfo = {
  text: 'Type texte',
  enableActuator: false,
  fontSize: 'medium', //small or medium or large,... or a number
  fontWeight: 'bold',
  fontFamily: 'var(--widget-font-family)',
  textColor: 'var(--widget-button-text)',
  textPadding: 0,
  tipBackgroundColor: 'var(--widget-button-color)',
  tipBorderColor: 'var(--widget-button-text)',
  tipWidth: 'auto',
  tipPositions: 'right', // Options: "top", "bottom", "left", "right", plus variations like "top-start" or "bottom-end"...
  tipEventTrigger: 'mouseenter', // "mouseenter", "mouseleave", "focus", "blur", "click", "manual", Combine events with spaces, e.g., "mouseenter focus"
  iconColor: 'var(--widget-label-color)',
  iconSize: 1,
  iconSign: 'info-circle', //info-circle or question-circle or exclamation-circle [FontAwesome]
  //iconSign: "info-sign", //info-sign or question-sign or exclamation-sign [glyphicon]
  //"iconSign": "info-circle" //question-circle; alert_circle [flatui]
  cornerRadius: 10,
};
modelsParameters.annotationLabel = {
  text: 'Type texte',
  enableActuator: false,
  fontsize: 0.5,
  backgroundColor: 'rgba(0, 0, 0, 0)',
  textColor: 'var(--widget-label-color)',
  valueFontFamily: 'var(--widget-font-family)',
  textAlign: 'left',
  textBold: false,
  textUnderline: false,
  textItalic: false,
  displayBorder: false,
  borderColor: 'var(--widget-border-color)',
  borderWidth: '2px',
  centerVertically: true,
};
modelsParameters.annotationRectangle = {
  text: '',
  enableActuator: false,
  fontsize: 0.5,
  backgroundColor: 'rgba(228, 228, 228, 1)',
  textColor: 'var(--widget-label-color)',
  valueFontFamily: 'var(--widget-font-family)',
  textAlign: 'left',
  displayBorder: false,
  borderColor: 'var(--widget-border-color)',
  centerVertically: true,
};
modelsParameters.annotationImage = {
  keepRatio: true,
  hideImageURL: false,
  enableActuator: false,
};
modelsParameters.annotationImageConnected = {
  keepRatio: true,
  hideImageURL: true,
  enableActuator: true,
};
modelsParameters.annotationVideo = {
  enforceCaptureRatio: false,
  captureRatio: 1.0,
  pauseOnCapture: false,
  buttonTextColor: 'var(--widget-button-text)',
  buttonDefaultColor: 'var(--widget-button-color)',
  buttonActiveColor: 'var(--widget-button-active-color)',
  buttonHoverColor: 'var(--widget-button-active-color)',
};

// Layout (default dimensions)
modelsLayout.annotationIconInfo = { height: '40px', width: '40px' };
modelsLayout.annotationLabel = { height: '40px', width: '200px', minWidth: '5px', minHeight: '5px' };
modelsLayout.annotationRectangle = { height: '40px', width: '200px', minWidth: '5px', minHeight: '5px' };
modelsLayout.annotationImage = { height: '200px', width: '260px' };
modelsLayout.annotationImageConnected = { height: '200px', width: '260px' };
modelsLayout.annotationVideo = { height: '260px', width: '260px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function annotationWidgetsPluginClass() {
  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                            Icon info                               | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.iconInfoAnnotationWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      let iconHeight = 20; // default value in class icons of flatui
      let iconWidth = 20; // default value in class icons of flatui

      // Update icon dimensions if elements are present
      const iconElement = $('.icons');
      iconHeight = iconElement.height() ?? iconHeight;
      iconWidth = iconElement.width() ?? iconWidth;

      const divContainer = $('#' + idDivContainer);
      const divContainerHeightPx = divContainer.height();
      const divContainerWidthPx = divContainer.width();

      const instanceParams = modelsParameters[idInstance];
      const lineHeight = instanceParams.iconSize * iconHeight;
      const labelHeight = iconHeight * instanceParams.iconSize;
      const divMarginTop = (divContainerHeightPx - labelHeight) / 2;

      // Create icon content based on FontAwesome, glyphicon, or flatui
      const iconClass = 'fa fa-' + instanceParams.iconSign; // [FontAwesome]
      // const iconClass = 'fui-' + modelsParameters[idInstance].iconSign; // [flatui]
      // const iconClass = 'glyphicon glyphicon-' + modelsParameters[idInstance].iconSign; // [glyphicon]
      const iconStyle = `line-height:normal; zoom:${instanceParams.iconSize};`;
      const divContent = `<i class="${iconClass}" style="${iconStyle}"></i>`;

      const widgetHtml = document.createElement('div');
      widgetHtml.className = 'btn';
      widgetHtml.id = 'annotationiconInfo' + idWidget;
      widgetHtml.innerHTML = divContent;
      // widgetHtml.title = modelsParameters[idInstance].text;

      // Configure display and enable styles
      const displayStyle = this.showWidget() ? 'display: inherit;' : 'display: none;';
      const enableStyle = this.enableWidget()
        ? 'pointer-events: initial; opacity: 1;'
        : 'pointer-events: none; opacity: 0.5;';

      widgetHtml.setAttribute(
        'style',
        `
          width: ${divContainerWidthPx}px;
          height: ${divContainerHeightPx}px;
          cursor: pointer;
          margin: auto;
          color: ${instanceParams.iconColor};
          line-height: ${lineHeight}px;
          padding-top: ${divMarginTop}px;
          ${displayStyle}
          ${enableStyle}
        `
      );

      divContainer.html(widgetHtml);

      this.applyDisplayOnWidget();

      // conversion to enable HTML tags
      const text = this.getTransformedText('text');

      const tooltipTarget = document.getElementById('annotationiconInfo' + idWidget);

      // Retrocompatibility
      if (Array.isArray(modelsParameters[idInstance].tipPositions)) {
        modelsParameters[idInstance].tipPositions = 'right';
        modelsParameters[idInstance].tipWidth = 'auto';
        modelsParameters[idInstance].tipEventTrigger = 'mouseenter';
      }

      if (modelsParameters[idInstance].spikeLength) {
        delete modelsParameters[idInstance].spikeLength;
      }

      if (modelsParameters[idInstance].spikeGirth) {
        delete modelsParameters[idInstance].spikeGirth;
      }

      // Configure and apply Tippy.js tooltip with dynamic styles and options
      tippy(tooltipTarget, {
        content: text,
        theme: 'custom',
        allowHTML: true,
        placement: modelsParameters[idInstance].tipPositions,
        arrow: true,
        animation: 'false',
        interactive: true,
        trigger: modelsParameters[idInstance].tipEventTrigger,

        // Define custom tooltip styles with the `onShow` lifecycle hook
        onShow(instance) {
          const styles = {
            color: modelsParameters[idInstance].textColor,
            fontWeight: modelsParameters[idInstance].fontWeight,
            fontSize: modelsParameters[idInstance].fontSize,
            fontFamily: modelsParameters[idInstance].fontFamily,
            padding: modelsParameters[idInstance].textPadding + 'px',
            width: modelsParameters[idInstance].tipWidth + 'px',
            borderRadius: modelsParameters[idInstance].cornerRadius + 'px',
            backgroundColor: self.tipBackgroundColor(),
          };

          // Apply styles to the tooltip content
          Object.assign(instance.popper.children[0].style, styles);

          // Style the arrow to match the tooltip background color
          const arrowElement = instance.popper.querySelector('.tippy-arrow');
          if (arrowElement) {
            arrowElement.style.color = self.tipBackgroundColor(); // Set arrow color
          }
        },
      });
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Hover text of the icon',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      return data && data.enableActuator ? [_VALUE_DESCRIPTOR] : [];
    };

    this.value = {
      setValue: function (val) {
        modelsParameters[idInstance].text = val;
        $('#annotationiconInfo' + idWidget)[0].value = val;
      },
      getValue: function () {
        return $('#annotationiconInfo' + idWidget)[0].value;
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
  this.iconInfoAnnotationWidget.prototype = baseWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                              Label                                 | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.labelAnnotationWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    if (_.isUndefined(modelsParameters[idInstance].textAlign)) modelsParameters[idInstance].textAlign = 'left'; // fix old projects

    this.enable = function () {};

    this.disable = function () {};

    this.rescale = function () {
      this.render();
    };

    if (_.isUndefined(modelsParameters[idInstance].centerVertically)) {
      modelsParameters[idInstance].centerVertically = true;
    }

    this.render = function () {
      var widgetHtml = document.createElement('div');

      let displayDiv1 = 'table';
      let displayDiv2 = 'table-cell';

      if (!modelsParameters[idInstance].centerVertically) {
        displayDiv1 = 'flex';
        displayDiv2 = 'table';
      }

      // conversion to enable HTML tags
      const text = this.getTransformedText('text');

      //AEF: modif to allow multilines
      //AEF: adapt height depending if text is in simple line or multilines
      //MBG : fix for Mozilla Firefox. No distinction between single line and multline. To check.
      let textBold = 'font-weight: normal;';
      let textUnderline = 'text-decoration: none;';
      let textItalic = 'font-style: normal;';
      if (modelsParameters[idInstance].textBold) textBold = 'font-weight: bold;';
      if (modelsParameters[idInstance].textUnderline) textUnderline = 'text-decoration: underline;';
      if (modelsParameters[idInstance].textItalic) textItalic = 'font-style: italic;';

      var divContent =
        '<div id="annotationLabelTextArea' +
        idWidget +
        '" style="max-width: 2000px; background-color: transparent; ' +
        ' box-shadow: none; width: inherit; ' +
        ' height: inherit; white-space: pre-wrap' +
        '; color:' +
        modelsParameters[idInstance].textColor +
        '; text-align: ' +
        modelsParameters[idInstance].textAlign +
        ';' +
        textBold +
        textUnderline +
        textItalic +
        '; background-color: ' +
        modelsParameters[idInstance].backgroundColor +
        '; padding: 4px; resize: inherit; margin: auto; vertical-align: middle ; border-radius: 6px; ' +
        this.fontSize() +
        this.valueFontFamily() +
        this.border() +
        'display: ' +
        displayDiv2 +
        '" readonly>' +
        text +
        '</textarea>';

      widgetHtml.innerHTML = divContent;
      //
      const showWidget = this.showWidget();
      let displayStyle = 'display: inherit;';
      if (!showWidget) {
        displayStyle = 'display: none;';
      }
      const enableWidget = this.enableWidget();
      let enableStyle = 'pointer-events: initial; opacity:initial;';
      if (!enableWidget) {
        enableStyle = 'pointer-events: none; opacity:0.5;';
      }
      //
      widgetHtml.setAttribute(
        'style',
        'width: inherit; height: inherit; display: ' +
          displayDiv1 +
          '; justify-content: center;' +
          displayStyle +
          enableStyle
      );
      $('#' + idDivContainer).html(widgetHtml);
      this.applyDisplayOnWidget();
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Label text',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_ANY_PRIMITIVE
    );
    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      return data && data.enableActuator ? [_VALUE_DESCRIPTOR] : [];
    };

    this.value = {
      setValue: function (val) {
        modelsParameters[idInstance].text = val;
        $('#annotationLabelTextArea' + idWidget)[0].value = val;
      },
      getValue: function () {
        return $('#annotationLabelTextArea' + idWidget)[0].value;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    }; // MBG : need to fix cohabitation with direct user input

    self.render();
  };

  // Inherit from baseWidget class
  this.labelAnnotationWidget.prototype = baseWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                              Image                                 | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.imageAnnotationWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');
      //
      const showWidget = this.showWidget();
      let displayStyle = 'display: inherit;';
      if (!showWidget) {
        displayStyle = 'display: none;';
      }
      const enableWidget = this.enableWidget();
      let enableStyle = 'pointer-events: initial; opacity:initial;';
      if (!enableWidget) {
        enableStyle = 'pointer-events: none; opacity:0.5;';
      }
      //

      widgetHtml.setAttribute(
        'style',
        'width: inherit; height: inherit; margin: auto; top: 0; left: 0;' + displayStyle + enableStyle
      ); // MBG 09/10/2019 : margin auto for centering
      widgetHtml.setAttribute('id', 'imgContainer' + idWidget);
      var divContent = '';
      if (modelsHiddenParams[idInstance].fileContentBase64 != '') {
        divContent = divContent + '<img id="img' + idWidget + '" style="position: relative;';
        divContent = divContent + 'width: inherit; height: inherit; ';

        if (modelsParameters[idInstance].keepRatio) {
          divContent = divContent + 'object-fit: contain; ';
        } else {
          divContent = divContent + 'object-fit: fill; ';
        }

        if (!self.bIsInteractive) {
          divContent = divContent + ' opacity: 0.75';
        }
        divContent =
          divContent +
          '" src="data:' +
          modelsHiddenParams[idInstance].mimeType +
          ';base64,' +
          modelsHiddenParams[idInstance].fileContentBase64 +
          '">';
        divContent = divContent + '</img>';
      }
      if (!self.bIsInteractive && !modelsParameters[idInstance].hideImageURL) {
        divContent =
          divContent +
          '<div id="image_drop_zone' +
          idWidget +
          '" style="z-index: 1000000; position: absolute; display: table; top: 20px; left:20px; height: calc(100%-40px); width: calc(100%-40px)">';
        divContent =
          divContent +
          '<div id="image_drop_zone_new' +
          idWidget +
          '" style="; cursor: pointer; display: table-cell; vertical-align: middle"><a style="color: var(--widget-label-color)"><center id="image_import_handle' +
          idWidget +
          '">Click here to import your image file</center></a></div>';

        divContent = divContent + '</div>';
        var parent = document.getElementById('_otherUse');
        var newChild =
          '<input type="file" id="image-file' +
          idWidget +
          '" name="files[]" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif" style="padding-bottom: 15px; display: none" required="">';
        parent.insertAdjacentHTML('beforeend', newChild);
      }

      widgetHtml.innerHTML = divContent;
      $('#' + idDivContainer).html(widgetHtml);
      this.applyDisplayOnWidget();
      if (!self.bIsInteractive && !modelsParameters[idInstance].hideImageURL) {
        var inputElt = document.getElementById('image_import_handle' + idWidget);

        inputElt.addEventListener(
          'click',
          function (e) {
            e.stopPropagation();
            const imageFileElt = document.getElementById('image-file' + idWidget);
            imageFileElt.addEventListener(
              'change',
              function (e) {
                e.stopPropagation();

                const file = e.target.files[0];
                const fileMimeType = file.type;
                const reader = new FileReader();

                reader.addEventListener(
                  'load',
                  function (event) {
                    event.stopPropagation();
                    const imageFile = event.target;
                    const realMimeType = getRealMimeType(imageFile.result);
                    modelsHiddenParams[idInstance].mimeType = realMimeType === 'unknown' ? fileMimeType : realMimeType;
                    modelsHiddenParams[idInstance].fileContentBase64 = encodeURIComponent(
                      base64ArrayBuffer(imageFile.result)
                    );
                    const i = new Image();
                    i.src =
                      'data:' +
                      modelsHiddenParams[idInstance].mimeType +
                      ';base64,' +
                      modelsHiddenParams[idInstance].fileContentBase64;
                    self.render();

                    return false;
                  },
                  false
                );

                reader.readAsArrayBuffer(file);

                modelsParameters[idInstance].hideImageURL = true; // MBG 04/06/2021

                return false;
              },
              false
            );

            $('#image-file' + idWidget).trigger('click');

            return false;
          },
          true
        );
      }
    };

    const _base64_regex = '^data:(image/[a-zA-Z\\+-]*);base64,([^"]*)$';
    const _IMAGE_DESCRIPTOR = new WidgetActuatorDescription(
      'base64Image',
      'Image file content or image encoded as a data URL',
      WidgetActuatorDescription.READ,
      {
        $schema: WidgetPrototypesManager.SCHEMA_VERSION,
        $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:imageAnnotationWidget',
        anyOf: [
          {
            type: 'string',
            pattern: _base64_regex,
          },
          {
            type: 'object',
            properties: {
              content: { type: 'string' }, // TODO regex ?
              isBinary: { const: true },
              type: {
                type: 'string',
                pattern: '^image/.*',
              },
            },
            required: ['content', 'isBinary', 'type'],
          },
        ],
      }
    );

    this.getActuatorDescriptions = function _getActuatorDescriptions(model = null) {
      const data = model || modelsParameters[idInstance];
      return data && data.enableActuator ? [_IMAGE_DESCRIPTOR] : [];
    };

    this.base64Image = {
      setValue: function (val) {
        if (val) {
          if (typeof val === 'string') {
            const reg = new RegExp(_base64_regex);
            const res = reg.exec(val);
            if (res == null) {
              modelsHiddenParams[idInstance].fileContentBase64 = val;
            } else {
              if (res.length != 3) {
                modelsHiddenParams[idInstance].fileContentBase64 = val;
              } else {
                modelsHiddenParams[idInstance].mimeType = res[1];
                modelsHiddenParams[idInstance].fileContentBase64 = res[2];
              }
            }
          } else if (typeof val === 'object' && val.isBinary) {
            modelsHiddenParams[idInstance].mimeType = val.type;
            modelsHiddenParams[idInstance].fileContentBase64 = val.content;
          }
          self.render();
        }
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].fileContentBase64;
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
  this.imageAnnotationWidget.prototype = baseWidget.prototype;

  // ├────────────────────────────────────────────────────────────────────┤ \\
  // |                              video                                 | \\
  // ├────────────────────────────────────────────────────────────────────┤ \\
  this.videoAnnotationWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    self.showCropBar = false;
    self.cropPercentage = 100;

    const enabledClass = 'btn btn-xs btn-block btn-primary ' + idInstance + 'widgetCustomColor';
    const disabledClass = 'btn btn-xs btn-block btn-primary disabled ' + idInstance + 'widgetCustomColor';
    const START = 'start';
    const STOP = 'stop';

    this.enable = function () {
      $('#video-capture-button-' + idWidget).attr('class', enabledClass);
      $('#video-crop-button-' + idWidget).attr('class', enabledClass);
      $('#video-screenshot-button-' + idWidget).attr('class', enabledClass);
    };

    this.disable = function () {
      $('#video-capture-button-' + idWidget).attr('class', disabledClass);
      $('#video-crop-button-' + idWidget).attr('class', disabledClass);
      $('#video-screenshot-button-' + idWidget).attr('class', disabledClass);
    };

    this.placeCanvas = function () {
      if (self.canvas && self.video) {
        const videoWidth = self.video.videoWidth;
        const videoHeight = self.video.videoHeight;

        const width = self.video.clientWidth;
        const height = self.video.clientHeight;

        if (videoWidth && videoHeight && width && height) {
          const ratio = videoWidth / videoHeight;

          let actualWidth = Math.round(ratio * height);
          let actualHeight = height;
          if (actualWidth > width) {
            actualWidth = width;
            actualHeight = Math.min(height, Math.round(width / ratio));
          }

          const x = Math.round((width - actualWidth) / 2);
          const y = Math.round((height - actualHeight) / 2);

          self.canvas.style.left = x.toString() + 'px';
          self.canvas.style.top = y.toString() + 'px';
        }
      }
    };

    this.handleSuccess = function (stream) {
      self.video.srcObject = stream;

      // Need to wait or video size is still 0
      self.video.addEventListener('loadeddata', function () {
        self.canvas.width = self.video.videoWidth;
        self.canvas.height = self.video.videoHeight;
        self.drawCanvas();
        self.placeCanvas();
      });
    };

    this.handleError = function (error) {
      swal('Annotation Video Widget', 'navigator.getUserMedia error: ' + error, 'error');
    };

    this.toggleCrop = function () {
      self.showCropBar = !self.showCropBar;
      $('#video-crop-button-' + idWidget).toggleClass(idInstance + 'widgetCustomColor');
      $('#video-crop-button-' + idWidget).toggleClass('btn-warning');
      if (self.showCropBar) {
        $('#cropbar' + idWidget).show();
      } else {
        $('#cropbar' + idWidget).hide();
      }
      self.drawCanvas();
      self.placeCanvas();
    };

    this.captureWindow = function () {
      const canvasWidth = self.canvas.width;
      const canvasHeight = self.canvas.height;

      let width = canvasWidth;
      let height = canvasHeight;

      let ratio = self.ratio;
      if (!ratio) {
        if (!self.showCropBar || self.cropPercentage === 100) {
          return { x: 0, y: 0, width, height };
        }
        ratio = canvasWidth / canvasHeight;
      }

      width = Math.round(ratio * height);
      if (width > canvasWidth) {
        width = canvasWidth;
        height = width / ratio;
      }

      if (self.showCropBar && self.cropPercentage !== 100) {
        width = (width * self.cropPercentage) / 100;
        height = (height * self.cropPercentage) / 100;
      }

      width = Math.min(Math.round(width), canvasWidth);
      height = Math.min(Math.round(height), canvasHeight);

      width = Math.max(1, width);
      height = Math.max(1, height);

      const x = Math.round((canvasWidth - width) / 2);
      const y = Math.round((canvasHeight - height) / 2);
      return { x, y, width, height };
    };

    this.drawCanvas = function () {
      const width = self.canvas.width;
      const height = self.canvas.height;

      const ctx = self.canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);

      if (!this.bIsInteractive || !self.video.srcObject) {
        return;
      }

      if (self.showCropBar || self.ratio) {
        const capture = self.captureWindow();

        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 3;
        ctx.strokeRect(capture.x, capture.y, capture.width, capture.height);
      }
    };

    this.screenshot = function () {
      const capture = self.captureWindow();

      const canvas = document.createElement('canvas');
      canvas.width = capture.width;
      canvas.height = capture.height;
      const ctx = canvas.getContext('2d');

      //draw image to canvas. scale to target dimensions
      ctx.drawImage(
        self.video,
        capture.x,
        capture.y,
        capture.width,
        capture.height,
        0,
        0,
        capture.width,
        capture.height
      );

      //convert to desired file format
      const dataURI = canvas.toDataURL('image/jpeg'); // can also use 'image/png'
      modelsHiddenParams[idInstance].screenshotBase64 = dataURI;
      modelsHiddenParams[idInstance].screenshotMimeType = 'image/jpeg';
      modelsHiddenParams[idInstance].screenshotData = dataURI.replace('data:image/jpeg;base64,', '');
    };

    this.handleSliderColors = function () {
      var sliderId = '#slider-crop' + idWidget;
      $(sliderId).find('div').css('background-color', modelsParameters[idInstance].buttonDefaultColor);
      $(sliderId).find('a').css('background-color', modelsParameters[idInstance].buttonActiveColor);
      $(sliderId)
        .find('a')
        .hover(
          function () {
            $(this).css('background-color', modelsParameters[idInstance].buttonHoverColor);
          },
          function () {
            $(this).css('background-color', modelsParameters[idInstance].buttonActiveColor);
          }
        );
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      const widgetHtml = document.createElement('div');
      let videoStyle = 'border: 1px solid black; ';
      if (!this.bIsInteractive) {
        videoStyle = videoStyle + 'background-color: lightgrey; opacity: 0.2 ';
      }

      const videoHeightPx = $('#' + idDivContainer).height() - 45;
      let divContent =
        '<div id="videoContainer' +
        idWidget +
        '" ' +
        'style="text-align: center; align: center; width: inherit; height: inherit;">';
      divContent = divContent + '<div style="display: flex;">';
      divContent =
        divContent +
        '<div style="margin: 0 auto; position: relative; ' +
        'height: ' +
        (videoHeightPx + 2) +
        'px; ' +
        videoStyle +
        '; flex: 100%;">';
      divContent =
        divContent +
        '<video id="video' +
        idWidget +
        '" ' +
        'class="videostream" ' +
        'style="position: absolute; top: 0; left: 0;" width="100%" ' +
        'height="' +
        videoHeightPx +
        'px" autoplay></video>';
      divContent =
        divContent +
        '<canvas id="canvas' +
        idWidget +
        '" ' +
        'style="max-width: 100%; max-height: 100%; position: absolute; ' +
        'top: 0; left: 0; z-index: 10;"></canvas>';
      divContent = divContent + '</div>';
      divContent =
        divContent +
        '<div id="cropbar' +
        idWidget +
        '" ' +
        'style="flex: 5px;" hidden>' +
        '<div class="v-slider-div-div" id="slider-crop' +
        idWidget +
        '" ' +
        'style="height: ' +
        (videoHeightPx + 2) +
        'px;"></div></div>';
      divContent = divContent + '</div>';

      divContent =
        divContent +
        '<div style="display:table; width:100%">' +
        '<div class="container"><div style="margin: 0px" class="row">';
      divContent =
        divContent +
        '<div class="col-3" style="padding: 1px">' +
        '<button id="video-capture-button-' +
        idWidget +
        '">' +
        START +
        '</button></div>';
      divContent =
        divContent +
        '<div class="col-6" style="padding: 1px">' +
        '<button id="video-screenshot-button-' +
        idWidget +
        '">screenshot</button></div>';
      divContent =
        divContent +
        '<div class="col-3" style="padding: 1px">' +
        '<button id="video-crop-button-' +
        idWidget +
        '">crop</button></div>';
      divContent = divContent + '</div></div></div></div>';

      widgetHtml.innerHTML = divContent;
      //
      const showWidget = this.showWidget();
      let displayStyle = 'display: inherit;';
      if (!showWidget) {
        displayStyle = 'display: none;';
      }
      const enableWidget = this.enableWidget();
      let enableStyle = 'pointer-events: initial; opacity:initial;';
      if (!enableWidget) {
        enableStyle = 'pointer-events: none; opacity:0.5;';
      }
      //
      widgetHtml.setAttribute(
        'style',
        'width: inherit; height: inherit; text-align:center; align: center;' + displayStyle + enableStyle
      );
      $('#' + idDivContainer).html(widgetHtml);
      this.applyDisplayOnWidget();
      this.setButtonColorStyle();

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }

      $('#slider-crop' + idWidget).slider({
        orientation: 'vertical',
        range: 'min',
        min: 0,
        max: 100,
        value: 100,
        slide: function (event, ui) {
          self.cropPercentage = ui.value;
          self.drawCanvas();
        },
      });
      $('#cropbar' + idWidget).hide();

      this.handleSliderColors();

      self.video = document.getElementById('video' + idWidget);
      self.canvas = document.getElementById('canvas' + idWidget);
      if (modelsParameters[idInstance].enforceCaptureRatio) {
        self.ratio = modelsParameters[idInstance].captureRatio;
      } else if (self.ratio) {
        delete self.ratio;
      }

      if (this.bIsInteractive) {
        const captureVideoButton = document.getElementById('video-capture-button-' + idWidget);
        captureVideoButton.onclick = function () {
          if (!self.video.srcObject) {
            // start
            navigator.mediaDevices
              .getUserMedia({
                video: {
                  facingMode: 'environment',
                },
                audio: false,
              })
              .then((stream) => {
                self.handleSuccess(stream);
                captureVideoButton.textContent = STOP;
              })
              .catch(self.handleError);
          } else if (self.video.paused) {
            // resume
            self.video.play();
            captureVideoButton.textContent = STOP;
          } else {
            // stop
            self.video.pause();
            captureVideoButton.textContent = START;
          }
        };

        const cropVideoButton = document.getElementById('video-crop-button-' + idWidget);
        cropVideoButton.onclick = function () {
          self.toggleCrop();
        };

        const screenshotVideoButton = document.getElementById('video-screenshot-button-' + idWidget);
        screenshotVideoButton.onclick = function () {
          if (!_.isUndefined(self.video)) {
            if (modelsParameters[idInstance].pauseOnCapture) {
              self.video.pause();
              captureVideoButton.textContent = START;
            }

            self.screenshot();
            self.base64Image.updateCallback(self.base64Image, self.base64Image.getValue());
            self.mimeType.updateCallback(self.mimeType, self.mimeType.getValue());
            self.imageData.updateCallback(self.imageData, self.imageData.getValue());
          }
        };
      }
    };

    const _BASE64_DESCRIPTOR = new WidgetActuatorDescription(
      'base64Image',
      'Sceenshot as a data URL',
      WidgetActuatorDescription.WRITE,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    const _MIME_DESCRIPTOR = new WidgetActuatorDescription(
      'mimeType',
      'MIME type of the screenshot',
      WidgetActuatorDescription.WRITE,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    const _IMAGE_DESCRIPTOR = new WidgetActuatorDescription(
      'imageData',
      'Sceenshot image raw data encoded as base 64',
      WidgetActuatorDescription.WRITE,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    this.getActuatorDescriptions = function () {
      return [_BASE64_DESCRIPTOR, _MIME_DESCRIPTOR, _IMAGE_DESCRIPTOR];
    };

    this.base64Image = {
      updateCallback: function () {},
      setValue: function (val) {},
      getValue: function () {
        return modelsHiddenParams[idInstance].screenshotBase64;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    this.mimeType = {
      updateCallback: function () {},
      setValue: function (val) {},
      getValue: function () {
        return modelsHiddenParams[idInstance].screenshotMimeType;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    this.imageData = {
      updateCallback: function () {},
      setValue: function (val) {},
      getValue: function () {
        return modelsHiddenParams[idInstance].screenshotData;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.videoAnnotationWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'annotation',
    widgetsDefinitionList: {
      annotationIconInfo: { factory: 'iconInfoAnnotationWidget', title: 'Info', icn: 'info' },
      annotationLabel: {
        factory: 'labelAnnotationWidget',
        title: 'Label',
        icn: 'label',
        help: 'wdg/wdg-annotation-video/#label',
      },
      annotationRectangle: {
        factory: 'labelAnnotationWidget',
        title: 'Form',
        icn: 'label',
        help: 'wdg/wdg-annotation-video/#label',
      },
      annotationImage: {
        factory: 'imageAnnotationWidget',
        title: 'Import Image',
        icn: 'image',
        help: 'wdg/wdg-annotation-video/#image',
      },
      annotationImageConnected: {
        factory: 'imageAnnotationWidget',
        title: 'Connect Image',
        icn: 'image',
        help: 'wdg/wdg-annotation-video/#image',
      },
      annotationVideo: {
        factory: 'videoAnnotationWidget',
        title: 'Camera',
        icn: 'camera',
        help: 'wdg/wdg-annotation-video/#camera',
      },
    },
    // MBG : need to fix cohabitation with direct user input
    // MBG 26/02/2019 : quick enable for airparif
  };

  this.constructor();
}

// Inherit from basePlugin class
annotationWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var annotationWidgetsPlugin = new annotationWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(annotationWidgetsPlugin);
