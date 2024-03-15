// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  │ \\
// │                      Tristan BARTEMENT, Guillaume CORBELIN         │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.flatUiHereAutocompleteValue = { value: '' };

// Parameters
modelsParameters.flatUiHereAutocompleteValue = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  valueWidthProportion: '70%',
  valueFontSize: 0.5,
  valueColor: 'var(--widget-color)',
  valueFontFamily: 'var(--widget-font-family)',
  displayBorder: true,
  borderColor: 'var(--widget-border-color)',
  backgroundColor: 'var(--widget-input-color)',
  countryIsoCodes: 'FRA',
};

// Layout (default dimensions)
modelsLayout.flatUiHereAutocompleteValue = { height: '5vh', width: '19vw', minWidth: '150px', minHeight: '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function flatUiAddressCompletionWidgetsPluginClass() {
  // +--------------------------------------------------------------------¦ \\
  // |                        Autocomplete Value                          | \\
  // +--------------------------------------------------------------------¦ \\
  this.hereAutocompleteValueFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    var self = this;

    this.updateValue = function (e) {
      var escapeKeys = [9, 16, 17, 18, 20, 33, 34, 35, 36, 37, 38, 39, 40];
      if (_.contains(escapeKeys, e.which)) return;

      if (e.which == 10 || e.which == 13 || e.which == 27) {
        var val = $('#ac-value' + idWidget)[0].value;
        modelsHiddenParams[idInstance].value = val;
        self.value.updateCallback(self.value, val);
        e.preventDefault();
      }
    };

    this.enable = function () {
      $('#ac-value' + idWidget).prop('disabled', false);
      $('#ac-value' + idWidget).bind('typeahead:selected', function (e, val, name) {
        modelsHiddenParams[idInstance].value = val.word;
        self.value.updateCallback(self.value, val.word);
      });
      $('#ac-value' + idWidget).on('keyup', function (e, ui) {
        self.updateValue(e);
      });

      //AEF:
      //TEMPORARY FIX: Put z-index of autocompletevalue widgets on top of all widgets
      // when click on one of autocompletevalue widgets, put its zIndex on top of the others
      //TO DO: correction and improvements have to be done on the well-use of the pluggin of flatui.js as it is done for select
      $('#ac-value' + idWidget).on('click', function (e, ui) {
        widgetPreview.elevateZIndex(idInstance, e);
      });

      self.initTypeahead();
    };

    this.disable = function () {
      $('#ac-value' + idWidget).prop('disabled', true);
    };

    this.formatHereSuggestTable = function (data) {
      var table = [];

      if (_.isUndefined(data)) return table;
      if (_.isEmpty(data)) return table;
      if (_.isUndefined(data.suggestions)) return table;
      if (_.isEmpty(data.suggestions)) return table;

      for (var i = 0; i < data.suggestions.length; i++) {
        table[i] = [];
        table[i][0] = data.suggestions[i].address.houseNumber;
        table[i][1] = data.suggestions[i].address.street;
        table[i][2] = data.suggestions[i].address.postalCode;
        table[i][3] = data.suggestions[i].address.city;
        table[i][4] = data.suggestions[i].address.county;
        table[i][5] = data.suggestions[i].address.state;
        table[i][6] = data.suggestions[i].address.country;
      }

      return table;
    };

    this.formatSuggestWords = function (table) {
      var suggestionStrings = [];
      var item;
      var sep;
      var first;
      if (table.length < 1) return ''; // AEF: return empty string instead of indefined to replace old suggested words
      for (var i = 0; i < table.length; i++) {
        suggestionStrings[i] = '';
        first = true;
        for (var j = 0; j <= 6; j++) {
          if (first) sep = '';
          else sep = ', ';
          item = table[i][j];
          if (!_.isNull(item) && !_.isUndefined(item)) {
            suggestionStrings[i] = suggestionStrings[i] + sep + item;
            first = false;
          }
        }
      }

      var words = [];
      if (_.isArray(suggestionStrings)) {
        for (var i = 0; i < suggestionStrings.length; i++) {
          words[i] = { word: suggestionStrings[i] };
        }
      }
      return words;
    };

    this.initTypeahead = function () {
      var country = '';
      if (!_.isUndefined(modelsParameters[idInstance].countryIsoCodes)) {
        country = '&country=' + modelsParameters[idInstance].countryIsoCodes;
      }

      // url: "https://autocomplete.geocoder.api.here.com/6.2/suggest.json" + "?app_id=" + here_app_id + "&app_code=" + here_app_code + "&query=" + query + "&language=fr" + country,
      $('#ac-value' + idWidget).typeahead('destroy');
      $('#ac-value' + idWidget).typeahead(null, {
        name: 'suggestions',
        displayKey: 'word',
        source: function (query, result) {
          $.ajax({
            url:
              'https://xdashgateway.azure-api.net/autocomplete/suggest.json' +
              '?query=' +
              query +
              '&language=fr' +
              country,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
              var tab = self.formatHereSuggestTable(data);
              var words = self.formatSuggestWords(tab);
              if (!_.isUndefined(words))
                //AEF: fix bug here because when length of tab==0 formatSuggestWords returned undefined
                result(
                  $.map(words, function (item) {
                    return item;
                  })
                );
            },
          });
        },
      });
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      let valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 2); // keepRatio
      const widgetHtml = document.createElement('div');
      widgetHtml.setAttribute('id', 'ac-value-widget-html' + idWidget);
      widgetHtml.setAttribute('class', 'ac-value-widget-html');
      let divContent = '';
      if (modelsParameters[idInstance].displayLabel) {
        let widthStyle = '';
        valueHeightPx = Math.min($('#' + idDivContainer).height(), $('#' + idDivContainer).width() / 4); // keepRatio
        if (!_.isUndefined(modelsParameters[idInstance].valueWidthProportion)) {
          const proportion = Math.max(0, 100 - parseFloat(modelsParameters[idInstance].valueWidthProportion)) + '%';
          widthStyle = 'width: ' + proportion + '; ';
        } else {
          widthStyle = 'max-width: 45%; ';
        }

        // conversion to enable HTML tags
        const label = this.getTransformedText('label');
        divContent +=
          '<span id ="ac-value-span' +
          idWidget +
          '" class="ac-value-span" style="' +
          this.labelFontSize() +
          this.labelColor() +
          this.labelFontFamily() +
          widthStyle +
          '">' +
          label +
          '</span>';
      }

      const border = this.border();

      divContent += '<div id="ac-value-no-input-group">';
      divContent +=
        '<input id="ac-value' +
        idWidget +
        '" type="text" placeholder="Type an address" autocomplete="off" spellcheck="false" class="value-input form-control" style="height: ' +
        valueHeightPx +
        'px; ' +
        border +
        '; float: right; ' +
        this.valueFontSize() +
        this.valueColor() +
        this.valueFontFamily() +
        this.backgroundColor() +
        'text-align: left;">';
      divContent += '</input>';
      divContent += '</div>';

      widgetHtml.innerHTML = divContent;

      if (this.bIsInteractive) {
        widgetHtml.setAttribute('style', 'height: ' + valueHeightPx + 'px; cursor: text;');
      } else {
        widgetHtml.setAttribute('style', 'height: ' + valueHeightPx + 'px;');
      }

      $('#' + idDivContainer).html(widgetHtml);
      $('#ac-value' + idWidget)[0].value = modelsHiddenParams[idInstance].value;

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Current value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        $('#ac-value' + idWidget)[0].value = modelsHiddenParams[idInstance].value;
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].value;
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
          $('#ac-value-span' + idWidget).text(modelsParameters[idInstance].label);
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
  this.hereAutocompleteValueFlatUiWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'flatUiAddressCompletion',
    widgetsDefinitionList: {
      flatUiHereAutocompleteValue: {
        factory: 'hereAutocompleteValueFlatUiWidget',
        title: 'Address auto-completion',
        iconWidth: 70,
        icn: 'address-autocompletion',
        help: 'wdg/wdg-geo-time/#address-autocompletion',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
flatUiAddressCompletionWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var flatUiAddressCompletionWidgetsPlugin = new flatUiAddressCompletionWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(flatUiAddressCompletionWidgetsPlugin);
