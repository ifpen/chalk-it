// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Tristan BARTEMENT, Guillaume CORBELIN  │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.ledStatus = { status: false };

// Parameters
modelsParameters.ledStatus = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  labelWidthProportion: '60%',
  onColor: '#00b700',
  offColor: '#004d00',
};

// Layout (default dimensions)
modelsLayout.ledStatus = { height: '10vh', width: '10vw', minWidth: '40px', minHeight: '40px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function getLedSvg(state, idWidget, idInstance) {
  var color1 = '#008400';
  var color2 = '#00b700';

  switch (state) {
    case 'off':
      color1 = modelsParameters[idInstance].offColor;
      var color1Obj = w3color(color1);
      color1Obj.darker(5);
      color2 = color1Obj.toHexString();
      break;
    case 'on':
      color2 = modelsParameters[idInstance].onColor;
      var color2Obj = w3color(color2);
      color2Obj.darker(10);
      color1 = color2Obj.toHexString();
      break;
    case 'inactive':
      color1 = '#e6e6e6';
      color2 = '#a6a6a6';
      break;
    default:
  }

  var ledSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns: xlink="http://www.w3.org/1999/xlink" viewBox="-1 -1 51 51"  preserveAspectRatio="xMinYMin meet" class="svg-content">' +
    '<title>LED ' +
    state +
    '</title>' +
    '<defs>' +
    '<linearGradient y2="0.154336" y1="1.1441" xlink: href="#linearGradient6506_' +
    idWidget +
    '" x2="0.566583" x1="0.577235" id="linearGradient6650_' +
    idWidget +
    '"/>' +
    '<linearGradient y2="0.846351" y1="0.057496" xlink: href="#linearGradient5756_' +
    idWidget +
    '" x2="0.609143" x1="0.532859" id="linearGradient6646_' +
    idWidget +
    '"/>' +
    '<linearGradient y2="1" y1="0.019227" xlink: href="#linearGradient5742_' +
    idWidget +
    '" x2="0.500488" x1="0.496181" id="linearGradient6644_' +
    idWidget +
    '"/>' +
    '<linearGradient id="linearGradient6506_' +
    idWidget +
    '">' +
    '<stop stop-color="#ffffff" stop-opacity="0" offset="0" id="stop6508_' +
    idWidget +
    '" />' +
    '<stop stop-color="#ffffff" stop-opacity="0.87451" offset="1" id="stop6510_' +
    idWidget +
    '" />' +
    '</linearGradient>' +
    '<linearGradient id="linearGradient5756_' +
    idWidget +
    '">' +
    '<stop stop-color="#828282" offset="0" id="stop5758_' +
    idWidget +
    '" />' +
    '<stop stop-color="#929292" stop-opacity="0.352941" offset="1" id="stop5760_' +
    idWidget +
    '" />' +
    '</linearGradient>' +
    '<linearGradient id="linearGradient5742_' +
    idWidget +
    '">' +
    '<stop stop-color="#adadad" offset="0" id="stop5744_' +
    idWidget +
    '" />' +
    '<stop stop-color="#f0f0f0" offset="1" id="stop5746_' +
    idWidget +
    '" />' +
    '</linearGradient>' +
    '<linearGradient y2="0.553776" x2="0.632943" y1="1" x1="1" id="svg_1_' +
    idWidget +
    '">' +
    '<stop offset="0" stop-opacity="0.984375" stop-color="' +
    color1 +
    '" />' +
    '<stop offset="0.984505" stop-opacity="0.980469" stop-color="' +
    color2 +
    '" />' +
    '</linearGradient>' +
    '</defs>' +
    '<g>' +
    '<title>Layer 1</title>' +
    '<g id="layer1_' +
    idWidget +
    '">' +
    '<g transform="matrix(31.25, 0, 0, 31.25, -625.023, -1325)" id="g9447_' +
    idWidget +
    '">' +
    '<path fill="url(#linearGradient6644_' +
    idWidget +
    ')" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="4" id="path6596_' +
    idWidget +
    '" d="m21.60074,43.19165c0,0.441601 -0.3584,0.799999 -0.800001,0.799999c-0.441599,0 -0.799999,-0.358398 -0.799999,-0.799999c0,-0.441601 0.3584,-0.799999 0.799999,-0.799999c0.441601,0 0.800001,0.358398 0.800001,0.799999z" />' +
    '<path fill="url(#linearGradient6646_' +
    idWidget +
    ')" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="4" id="path6598_' +
    idWidget +
    '" d="m21.44627,43.191471c0,0.35638 -0.28924,0.645618 -0.64562,0.645618c-0.35638,0 -0.64562,-0.289238 -0.64562,-0.645618c0,-0.35638 0.28924,-0.645611 0.64562,-0.645611c0.35638,0 0.64562,0.28923 0.64562,0.645611z" />' +
    '<path fill="url(#svg_1_' +
    idWidget +
    ')" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="4" id="path6600_' +
    idWidget +
    '" d="m21.378719,43.191639c0,0.31905 -0.25893,0.577991 -0.57798,0.577991c-0.31905,0 -0.57799,-0.258942 -0.57799,-0.577991c0,-0.319038 0.25894,-0.577969 0.57799,-0.577969c0.31905,0 0.57798,0.25893 0.57798,0.577969z" />' +
    '<path transform="rotate(-34.3336, 20.5508, 42.8652)" fill="url(#linearGradient6650_' +
    idWidget +
    ')" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="4" id="path6602_' +
    idWidget +
    '" d="m20.7453,42.86636c0,0.065899 -0.087271,0.11937 -0.194811,0.11937c-0.107529,0 -0.194809,-0.053471 -0.194809,-0.11937c0,-0.06588 0.08728,-0.119358 0.194809,-0.119358c0.10754,0 0.194811,0.053478 0.194811,0.119358z" />' +
    '</g>' +
    '</g>' +
    '</g>' +
    '</svg>';

  return ledSvg;
}

function ledWidgetsPluginClass() {
  // ├───────────────────────────────────────────────────────────────────────────────────────────┤ \\
  // |                                      Status Led Widget                                    | \\
  // | From : http://www.downloadclipart.net/download/43979/green-led-on-labview-style-svg       | \\
  // ├───────────────────────────────────────────────────────────────────────────────────────────┤ \\
  this.statusLedWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);

    var self = this;

    this.enable = function () {};

    this.disable = function () {};

    this.insertLabel = function (widgetHtml) {
      // conversion to enable HTML tags
      const labelText = this.getTransformedText('label');
      const widgetLabel = $('<span>', {
        class: 'led-span',
        id: 'led-span' + idWidget,
        html: labelText,
      });
      let labelStyle = 'height: inherit; ' + this.labelFontSize() + this.labelColor() + this.labelFontFamily();
      if (!_.isUndefined(modelsParameters[idInstance].labelWidthProportion)) {
        labelStyle += modelsParameters[idInstance].labelWidthProportion + '; ';
      } else {
        labelStyle += ' width: 20%; ';
      }
      widgetLabel.attr('style', labelStyle);
      widgetHtml.append(widgetLabel[0]);
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      var widgetHtml = document.createElement('div');

      var state;
      if (this.bIsInteractive) {
        if (modelsHiddenParams[idInstance].status) {
          state = 'on';
        } else {
          state = 'off';
        }
      } else {
        state = 'inactive';
      }

      var ledDivProportion = 1;

      if (modelsParameters[idInstance].displayLabel) {
        ledDivProportion = (100 - Number(modelsParameters[idInstance].labelWidthProportion.replace('%', ''))) / 100;
      }

      var svgDivContainerDims = 0;
      var vPadding = 0;
      if ($('#' + idDivContainer).width() * ledDivProportion > $('#' + idDivContainer).height()) {
        svgDivContainerDims = $('#' + idDivContainer).height() - 2;
      } else {
        svgDivContainerDims = $('#' + idDivContainer).width() * ledDivProportion - 2;
        vPadding = ($('#' + idDivContainer).height() - svgDivContainerDims - 2) / 2;
      }

      widgetHtml.setAttribute('class', 'led-widget-html');
      widgetHtml.setAttribute('style', 'height: inherit');

      var svgContainer = document.createElement('div');
      svgContainer.setAttribute('class', 'svg-container');
      svgContainer.setAttribute(
        'style',
        'display: inline-block; margin-top: ' +
          vPadding +
          'px; cursor: inherit; width:' +
          svgDivContainerDims +
          'px; height: ' +
          svgDivContainerDims +
          'px'
      );
      var divContent = getLedSvg(state, idWidget, idInstance);

      svgContainer.innerHTML = divContent;

      widgetHtml.appendChild(svgContainer);

      if (modelsParameters[idInstance].displayLabel) {
        this.insertLabel(widgetHtml);
      }

      $('#' + idDivContainer).html(widgetHtml);

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _STATUS_DESCRIPTOR = new WidgetActuatorDescription(
      'status',
      'Current status (boolean)',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_BOOLEAN
    );
    this.getActuatorDescriptions = function () {
      return [_STATUS_DESCRIPTOR];
    };

    this.status = {
      updateCallback: function () {},
      setValue: function (bStatus) {
        if (bStatus != modelsHiddenParams[idInstance].status) {
          modelsHiddenParams[idInstance].status = bStatus;
          self.render();
        }
      },
      getValue: function () {
        return modelsHiddenParams[idInstance];
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
          self.captionHelper(caption, self.bIsInteractive, bCaptionManuallyChanged);
        }
      },
      clearCaption: function () {
        if (modelsParameters[idInstance].inheritLabelFromData) {
          modelsParameters[idInstance].label = '';
        }
        self.render();
      },
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.statusLedWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'led',
    widgetsDefinitionList: {
      ledStatus: { factory: 'statusLedWidget', title: 'Status led', icn: 'status' },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
ledWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var ledWidgetsPlugin = new ledWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(ledWidgetsPlugin);
