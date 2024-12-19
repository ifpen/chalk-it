// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir El FEKI, Ghiles HIDEUR   │ \\
// │ Tristan BARTEMENT, Guillaume CORBELIN                              │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import 'flat-ui.alt';
import 'mindmup-editabletable';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';
import { getFontFactor } from 'kernel/dashboard/scaling/scaling-utils';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.flatUiSelect = { keys: [], values: [], selectedValue: '' };
modelsHiddenParams.flatUiMultiSelect = { value: [], selectedValue: '' };
modelsHiddenParams.flatUiList = { value: [], selectedValue: '' };
modelsHiddenParams.flatUiEditableTable = { value: null };
modelsHiddenParams.flatUiTable = { value: null };

// Parameters
modelsParameters.flatUiSelect = {
  label: 'labelText',
  inheritLabelFromData: true,
  displayLabel: true,
  labelFontSize: 0.5,
  labelColor: 'var(--widget-label-color)',
  labelFontFamily: 'var(--widget-font-family)',
  selectWidthProportion: '70%',
  isNumber: false,
  isBoolean: false,
  selectValueFontFamily: 'var(--widget-font-family)',
  selectValueFontSize: 0.5,
  selectedValueColor: 'var(--widget-select-option-highlighted-text)',
  selectedItemDefaultColor: 'var(--widget-select-option-highlighted-color)',
  selectedItemHoverColor: 'var(--widget-select-option-highlighted-color)',
  isKeyValuePairs: false,
};
modelsParameters.flatUiMultiSelect = {
  addControls: false,
  resetPastSelection: false,
  valueFontSize: 0.4,
  valueFontFamily: 'var(--widget-font-family)',
  checkboxWidth: 7,
  checkboxHeight: 1.5,
  valueDefaultColor: 'var(--widget-label-color)',
  checkboxDefaultColor: 'var(--widget-multiselect-color)',
  checkboxBorderColor: 'var(--widget-multiselect-border-color)',
  valueHoverColor: 'var(--widget-multiselect-hover-text)',
  checkboxHoverColor: 'var(--widget-multiselect-hover-color)',
  checkboxHoverBorderColor: 'var(--widget-multiselect-hover-border-color)',
  valueFocusColor: 'var(--widget-multiselect-checked-text)',
  checkboxFocusColor: 'var(--widget-multiselect-checked-color)',
  checkboxFocusBorderColor: 'var(--widget-multiselect-checked-border-color)',
  displayBorder: true,
  borderColor: 'var(--widget-border-color)',
  isNumber: false,
  isBoolean: false,
  maxSelected: '*',
};
modelsParameters.flatUiList = {
  addControls: false,
  listValueFontSize: 0.5,
  listValueColor: 'var(--widget-select-drop-text)',
  listBackgroundColor: 'var(--widget-select-drop-color)',
  selectValueColor: 'var(--widget-select-option-highlighted-text)',
  selectValueBackgroundColor: 'var(--widget-select-option-highlighted-color)',
  valueFontFamily: 'var(--widget-font-family)',
  borderColor: 'var(--widget-border-color)',
  displayBorder: true,
  maxSelected: '*',
};
modelsParameters.flatUiTable = {
  headerLine: false,
  indexColumn: false,
  tableValueFontSize: 0.5,
  striped: true,
  valueColor: 'var(--widget-table-value-color)',
  valueFontFamily: 'var(--widget-font-family)',
  valueAlign: 'left',
  bordered: true,
  noBorder: false,
  editableCols: '[]',
  backgroundColor: {
    primary: 'var(--widget-color-0)',
    secondary: 'var(--widget-table-striped-odd)',
  },
  paginationMinNbr: 10,
  paginationOptions: '[10, 50, 100, 500]',
  paginationDefaultValue: 10,
};
modelsParameters.flatUiEditableTable = {
  headerLine: false,
  indexColumn: false,
  tableValueFontSize: 0.5,
  striped: true,
  valueColor: 'var(--widget-table-value-color)',
  valueFontFamily: 'var(--widget-font-family)',
  valueAlign: 'left',
  bordered: true,
  noBorder: false,
  editableCols: '*',
  backgroundColor: {
    primary: 'var(--widget-color-0)',
    secondary: 'var(--widget-table-striped-odd)',
  },
  paginationMinNbr: 10,
  paginationOptions: '[10, 50, 100, 500]',
  paginationDefaultValue: 10,
};

// Layout (default dimensions)
modelsLayout.flatUiSelect = { height: '40px', width: '300px', minWidth: '40px', minHeight: '27px' };
modelsLayout.flatUiMultiSelect = { height: '140px', width: '180px', minWidth: '80px', minHeight: '75px' };
modelsLayout.flatUiList = { height: '140px', width: '180px', minWidth: '80px', minHeight: '75px' };
modelsLayout.flatUiEditableTable = { height: '100px', width: '180px', minWidth: '88px', minHeight: '79px' };
modelsLayout.flatUiTable = { height: '100px', width: '180px', minWidth: '88px', minHeight: '79px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function flatUiComplexWidgetsPluginClass() {
  // +--------------------------------------------------------------------¦ \\
  // |                              Select                                | \\
  // +--------------------------------------------------------------------¦ \\
  this.selectFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;

    this.enable = function () {
      const selectElement = $(`#select${idWidget}`);

      // Remove existing click handler and add new one
      selectElement.off('click').on('click', (e, ui) => {
        const val = self.selectedValue.getValue();
        modelsHiddenParams[idInstance].selectedValue = val;
        self.selectedValue.updateCallback(self.selectedValue, val);
      });

      // Enable the select element
      selectElement.prop('disabled', false);

      // Add custom styles to the select2 elements
      const stylesheet = document.styleSheets[0];
      const baseSelector = `#s2id_select${idWidget} > .select2-choice`;

      stylesheet.addRule(`${baseSelector} > .select2-chosen`, this.selectedValueColor());
      stylesheet.addRule(baseSelector, this.selectedItemDefaultColor());
      stylesheet.addRule(`${baseSelector}:hover`, this.selectedItemHoverColor());
    };

    this.disable = function () {
      $('#select' + idWidget).prop('disabled', true);
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      const widgetHtml = document.createElement('div');
      widgetHtml.id = `select-widget-html${idWidget}`;
      widgetHtml.className = 'select-widget-html';

      const container = $(`#${idDivContainer}`);
      const containerHeight = container.height();
      const containerWidth = container.width();
      let valueHeightPx = Math.min(containerHeight, containerWidth / 2);

      let divContent = '';

      // Handle label display
      if (modelsParameters[idInstance].displayLabel) {
        // conversion to enable HTML tags
        const labelText = this.getTransformedText('label');

        valueHeightPx = Math.min(containerHeight, containerWidth / 4);

        const widthProportion = modelsParameters[idInstance].selectWidthProportion;
        const widthStyle = widthProportion
          ? `width: ${Math.max(0, 100 - parseFloat(widthProportion))}%;`
          : 'max-width: 45%;';

        divContent += `
          <span id="select-span${idWidget}" 
                class="select-span" 
                style="${widthStyle} ${this.labelFontSize()} ${this.labelColor()} ${this.labelFontFamily()}">
              ${labelText}
          </span>`;
      }

      // Handle select options
      let { keys, values, selectedValue } = modelsHiddenParams[idInstance];

      if (values?.length === 0 && keys?.length > 0 && !modelsParameters[idInstance]?.isKeyValuePairs) {
        values = [...keys];
      }

      const nbOptions = Math.min(values.length, keys.length);
      const selectStyle = `style="display: table; height: ${valueHeightPx}px;"`;

      divContent += `
          <select data-toggle="select" 
                  id="select${idWidget}" 
                  class="select-div form-control select select-primary select-block mbl" 
                  ${selectStyle}>
      `;

      for (let i = 0; i < nbOptions; i++) {
        divContent += `<option value="${values[i]}">${keys[i]}</option>`;
      }

      divContent += '</select>';

      // Apply styles and attributes to the widget container
      widgetHtml.innerHTML = divContent;
      widgetHtml.id = `select-div-container${idWidget}`;

      const showWidget = this.showWidget();
      const enableWidget = this.enableWidget();
      const displayStyle = showWidget ? 'display: table;' : 'display: none;';
      const enableStyle = enableWidget
        ? 'pointer-events: initial; opacity: initial;'
        : 'pointer-events: none; opacity: 0.5;';

      widgetHtml.style = `
        height: ${valueHeightPx}px; 
        ${this.selectFontSize()} 
        ${this.selectValueFontFamily()}
        ${displayStyle} 
        ${enableStyle}`;

      container.html(widgetHtml);
      this.applyDisplayOnWidget();

      // Enable or disable widget interactivity
      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }

      // Apply CSS to dynamically created select2 elements
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && mutation.addedNodes.length) {
            const element = document.querySelector(`#s2id_select${idWidget} > a > span:first-child`);
            if (element) {
              const idNumber = element.getAttribute('id').split('-').pop();
              document.styleSheets[0].addRule(`#select2-results-${idNumber}`, self.selectValueFontFamily());
              observer.disconnect();
            }
          }
        }
      });

      // Start observing changes in the DOM
      observer.observe(document.body, { childList: true, subtree: true });

      // Initialize select2 with the correct value
      const $select = $(`#select${idWidget}`);
      if ($select?.length) {
        $select.val(String(selectedValue));
        $select.select2();
      }
    };

    const _VALUE_NUMBER_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedValue',
      'Selected value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_NUMBER
    );
    const _VALUE_STRING_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedValue',
      'Selected value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_STRING
    );
    const _VALUE_BOOLEAN_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedValue',
      'Selected value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_BOOLEAN
    );
    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedValue',
      'Selected value',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_NUMBER_OR_STRING
    );

    // !isKeyValuePairs
    const _KEYS_DESCRIPTOR = new WidgetActuatorDescription(
      'keys',
      'Labels of the selectable options',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_STRING_ARRAY
    );
    const _VALUES_STRING_DESCRIPTOR = new WidgetActuatorDescription(
      'values',
      "Selectable values. Must match 'keys'.",
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_STRING_ARRAY
    );
    const _VALUES_NUMBER_DESCRIPTOR = new WidgetActuatorDescription(
      'values',
      "Selectable values. Must match 'keys'.",
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_NUMBER_ARRAY
    );
    const _VALUES_BOOLEAN_DESCRIPTOR = new WidgetActuatorDescription(
      'values',
      "Selectable values. Must match 'keys'.",
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_BOOLEAN_ARRAY
    );

    // isKeyValuePairs
    const _KEYVALUE_NUMBER_DESCRIPTOR = new WidgetActuatorDescription(
      'keyValuePairs',
      'Array of selectable key-value objects; Key being the displayed label',
      WidgetActuatorDescription.READ,
      {
        $schema: WidgetPrototypesManager.SCHEMA_VERSION,
        $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:selectFlatUiWidget_keyValuePairs_isNumber',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: ['string', 'number', 'boolean'] },
            value: { type: 'number' },
          },
          required: ['key'], // TODO value missing => key is number ?
        },
      }
    );
    const _KEYVALUE_STRING_DESCRIPTOR = new WidgetActuatorDescription(
      'keyValuePairs',
      'Array of selectable key-value objects; Key being the displayed label',
      WidgetActuatorDescription.READ,
      {
        $schema: WidgetPrototypesManager.SCHEMA_VERSION,
        $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:selectFlatUiWidget_keyValuePairs',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: ['string', 'number', 'boolean'] },
            value: { type: 'string' },
          },
          required: ['key'],
        },
      }
    );
    const _KEYVALUE_BOOLEAN_DESCRIPTOR = new WidgetActuatorDescription(
      'keyValuePairs',
      'Array of selectable key-value objects; Key being the displayed label',
      WidgetActuatorDescription.READ,
      {
        $schema: WidgetPrototypesManager.SCHEMA_VERSION,
        $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:selectFlatUiWidget_keyValuePairs',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: ['string', 'number', 'boolean'] },
            value: { type: 'boolean' },
          },
          required: ['key'],
        },
      }
    );
    this.getActuatorDescriptions = function (model = null) {
      const data = model || modelsParameters[idInstance];
      const result = [];

      if (data && data.isKeyValuePairs) {
        result.push(
          data.isNumber
            ? _KEYVALUE_NUMBER_DESCRIPTOR
            : data.isBoolean
            ? _KEYVALUE_BOOLEAN_DESCRIPTOR
            : _KEYVALUE_STRING_DESCRIPTOR
        );
      } else {
        result.push(_KEYS_DESCRIPTOR);
        result.push(
          data && data.isNumber
            ? _VALUES_NUMBER_DESCRIPTOR
            : data.isBoolean
            ? _VALUES_BOOLEAN_DESCRIPTOR
            : _VALUES_STRING_DESCRIPTOR
        );
      }

      let selectedValue = _VALUE_DESCRIPTOR;
      if (data) {
        selectedValue = data.isNumber
          ? _VALUE_NUMBER_DESCRIPTOR
          : data.isBoolean
          ? _VALUE_BOOLEAN_DESCRIPTOR
          : _VALUE_STRING_DESCRIPTOR;
      }
      result.push(selectedValue);

      return result;
    };

    this.selectedValue = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].selectedValue = val;
        self.render();
      },
      getValue: function () {
        const val = $(`#select${idWidget}`).val();

        if (modelsParameters[idInstance].isNumber) {
          return Number(val);
        }

        if (modelsParameters[idInstance].isBoolean) {
          return val !== 'false' && Boolean(val);
        }

        return val;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;

        const value = $(`#select${idWidget}`).val();
        if (value != '') {
          updateDataFromWidget(this, value);
        }

        self.enable();
      },
      removeValueChangedHandler: function (updateDataFromWidget) {
        self.disable();
      },
      setCaption: function (caption, bCaptionManuallyChanged) {
        if (modelsParameters[idInstance].inheritLabelFromData) {
          self.captionHelper(caption, self.bIsInteractive, bCaptionManuallyChanged);
          $(`#select-span${idWidget}`).text(modelsParameters[idInstance].label);
        }
      },
      clearCaption: function () {
        if (modelsParameters[idInstance].inheritLabelFromData) {
          modelsParameters[idInstance].label = '';
        }
        self.render();
      },
    };

    if (!modelsParameters[idInstance].isKeyValuePairs) {
      //AEF: new created widget and newer loaded project
      this.keys = {
        //AEF: in this slider put array of keys (madatory)
        setValue: function (val) {
          const msg1 = '"keys" must be an array (in widget' + idInstance + ')';
          const msg2 = 'Example: ["choice1","choice2"]';

          if (!Array.isArray(val)) {
            console.log(`${msg1}. ${msg2}`);
            return;
          }

          if (val.length && typeof val[0] === 'object') {
            // Prevent old format like [{}, {}]
            console.log(`${msg1}. ${msg2}`);
            return;
          }

          modelsHiddenParams[idInstance].keys = val;
          self.render();
        },
        getValue: function () {},
        addValueChangedHandler: function (updateDataFromWidget) {
          self.enable();
        },
        removeValueChangedHandler: function (updateDataFromWidget) {
          self.disable();
        },
      };

      this.values = {
        //AEF: in this slider put array of values (optional)
        setValue: function (val) {
          const msg1 = '"value" must be an array (in widget' + idInstance + ')';
          const msg2 = 'Example: [1, 2]';

          if (val == null) {
            // Initialize as an empty array if null or undefined
            modelsHiddenParams[idInstance].values = [];
          } else if (!Array.isArray(val) || (val.length && typeof val[0] === 'object')) {
            // Prevent old format like [{}, {}]
            console.log(`${msg1}. ${msg2}`);
            return;
          } else {
            modelsHiddenParams[idInstance].values = val;
          }

          self.render();
        },
        getValue: function () {},
        addValueChangedHandler: function (updateDataFromWidget) {
          self.enable();
        },
        removeValueChangedHandler: function (updateDataFromWidget) {
          self.disable();
        },
      };
    } else {
      //AEF: older project (before issue#61)
      this.keyValuePairs = {
        //AEF: in this slider put array of key or array of key/value pairs
        setValue: function (val) {
          modelsHiddenParams[idInstance].keys = [];
          modelsHiddenParams[idInstance].values = [];
          const msg1 =
            '"keyValuePairs" must be an array of key or an array of key/value pairs (in widget' + idInstance + ')';
          const msg2 =
            'Example1: [{"key":"choice1"}, {"key":"choice2"}] \n or Example2: [{"key":"choice1", "value":"1"}, {"key":"choice2", "value":"2"}]';
          if (!Array.isArray(val)) {
            console.log(msg1 + '. ' + msg2);
            return;
          }
          for (const item of val) {
            if (_.isUndefined(item.key)) {
              //AEF: key is mandatory
              console.log(msg1 + '. ' + msg2);
              return;
            }

            modelsHiddenParams[idInstance].keys.push(item.key);
            modelsHiddenParams[idInstance].values.push(item.value ?? item.key); //AEF: value is optional
          }
          self.render();
        },
        getValue: function () {},
        addValueChangedHandler: function (updateDataFromWidget) {
          self.enable();
        },
        removeValueChangedHandler: function (updateDataFromWidget) {
          self.disable();
        },
      };
    }

    self.render();
  };

  // Inherit from baseWidget class
  this.selectFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                          Multi-select                              | \\
  // +--------------------------------------------------------------------¦ \\
  this.multiSelectFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;

    this.enable = function () {
      $('#multi-select' + idWidget)[0].style.opacity = '1';
    };

    this.disable = function () {
      $('#multi-select' + idWidget)[0].style.opacity = '0.7';
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      const container = document.getElementById(idDivContainer);
      const valueHeightPx = $('#' + idDivContainer).height();

      // Create the main widget container
      const widgetHtml = document.createElement('div');
      widgetHtml.className = 'multi-select-widget';
      widgetHtml.style.width = 'inherit';
      widgetHtml.style.height = `${valueHeightPx}px`;
      widgetHtml.style.cursor = this.bIsInteractive ? 'pointer' : 'inherit';

      // Generate multi-select content
      const val = modelsHiddenParams[idInstance]?.value || [];
      const widgetId = `multi-select${idWidget}`;
      const cursorStyle = this.bIsInteractive ? 'cursor: pointer;' : 'cursor: inherit;';
      const fontFamily = this.valueFontFamily();
      const fontSize = this.valueFontSize();
      const checkboxWidth = this.checkboxWidth();
      const checkboxHeight = this.checkboxHeight();

      let divContent = `
        <div 
          class="multi-select-div" 
          id="${widgetId}"
          style="height: ${valueHeightPx}px; ${this.valueDefaultColor()} ${this.border()}">
      `;

      if (Array.isArray(val)) {
        divContent += val
          .map(
            (value) => `
          <label>
            <input type="checkbox" value="${value}" />
            <span 
              id="multi-select-label${idWidget}" 
              style="${cursorStyle} ${fontFamily} ${fontSize} ${checkboxWidth} ${checkboxHeight}" 
              tabindex="-1">
              ${value}
            </span>
          </label>
        `
          )
          .join('');
      }

      divContent += '</div>';
      widgetHtml.innerHTML = divContent;

      // Set display and enable styles
      widgetHtml.style.display = this.showWidget() ? 'initial' : 'none';
      widgetHtml.style.pointerEvents = this.enableWidget() ? 'initial' : 'none';
      widgetHtml.style.opacity = this.enableWidget() ? '1' : '0.5';

      // Append widget to the container
      container.innerHTML = '';
      container.appendChild(widgetHtml);

      this.applyDisplayOnWidget();

      // Check for scrollbars and adjust alignment
      const targetElement = document.getElementById('dashboard-preview-div');
      if (targetElement) {
        const observer = new MutationObserver((mutationsList) => {
          mutationsList.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const $multiSelectElement = $('#multi-select' + idWidget);

              if ($multiSelectElement.length) {
                const hasScrollBar = $multiSelectElement[0].scrollHeight > $multiSelectElement[0].clientHeight;

                if (!hasScrollBar) {
                  $multiSelectElement.filter('.multi-select-div').css('align-content', 'center');
                }
              }
            }
          });
        });

        // Observe changes to the class attribute
        observer.observe(targetElement, { attributes: true });
        window.addEventListener('unload', () => observer.disconnect());
      }

      const multiSelectElement = document.getElementById(widgetId);

      // Apply additional styles for mobile or tablet
      const isMobileOrTablet = window.mobileAndTabletCheck();
      const touchDevice = 'ontouchstart' in document.documentElement; // Only mobiles
      if ((isMobileOrTablet || touchDevice) && multiSelectElement) {
        multiSelectElement.style.height = 'auto';
      }

      // Restore previous selections if needed
      if (!modelsParameters[idInstance]?.resetPastSelection) {
        const selectedValues = modelsHiddenParams[idInstance]?.selectedValue || [];
        const checkboxes = multiSelectElement.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
          if (selectedValues.includes(checkbox.value)) {
            checkbox.checked = true;
          }
        });
      }

      // Handle selection logic
      const maxSelected = modelsParameters[idInstance]?.maxSelected ?? '*';
      const checkboxes = multiSelectElement.querySelectorAll('input[type="checkbox"]');
      let selectedOptions = [];

      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            selectedOptions.push(checkbox);

            if (maxSelected !== '*' && selectedOptions.length > maxSelected) {
              const firstSelectedCheckbox = selectedOptions.shift(); // Remove the oldest selected
              firstSelectedCheckbox.checked = false; // Deselect it in the DOM
            }
          } else {
            // Remove the deselected option
            selectedOptions = selectedOptions.filter((selected) => selected !== checkbox);
          }
          self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
        });
      });

      // Apply dynamic styles
      const styleSheet = document.styleSheets[0];
      const idSelector = `#multi-select-label${idWidget}`;
      const checkedSelector = `input[type="checkbox"]:checked + ${idSelector}`;
      const hoverSelector = `${idSelector}:hover`;

      // Default styles
      styleSheet.addRule(idSelector, this.valueDefaultColor());
      styleSheet.addRule(idSelector, this.checkboxDefaultColor());
      styleSheet.addRule(idSelector, this.checkboxBorder());

      // Hover styles
      styleSheet.addRule(hoverSelector, this.valueHoverColor());
      styleSheet.addRule(hoverSelector, this.checkboxHoverColor());
      styleSheet.addRule(hoverSelector, this.checkboxHoverBorderColor());

      // Checked styles
      styleSheet.addRule(checkedSelector, this.valueFocusColor());
      styleSheet.addRule(checkedSelector, this.checkboxFocusColor());
      styleSheet.addRule(checkedSelector, this.checkboxFocusBorderColor());

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Available choices',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_PRIMITIVE_ARRAY
    );
    const _SELECTED_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedValue',
      'Currently selected choices',
      WidgetActuatorDescription.READ_WRITE,
      WidgetPrototypesManager.SCHEMA_STRING_ARRAY
    );
    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR, _SELECTED_DESCRIPTOR];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        self.render();
        self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
      },
      getValue: function () {
        const value = modelsHiddenParams[idInstance]?.value;

        if (modelsParameters[idInstance]?.isNumber) {
          return Number(value);
        }

        if (modelsParameters[idInstance]?.isBoolean) {
          return value !== 'false' && Boolean(value);
        }

        return value;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
      setCaption: function (caption, bCaptionManuallyChanged) {},
      clearCaption: function () {},
    };

    this.selectedValue = {
      updateCallback: function () {},
      setValue: function (val) {
        if (!Array.isArray(val)) return;

        const checkboxes = document.querySelectorAll(`#multi-select${idWidget} > label > input[type='checkbox']`);

        checkboxes.forEach((checkbox) => {
          if (val.includes(checkbox.value)) {
            checkbox.checked = true;
          }
        });

        // Update the selected values
        modelsHiddenParams[idInstance].selectedValue = val;
      },
      getValue: function () {
        const selectedVal = [];
        const checkboxes = document.querySelectorAll(
          `#multi-select${idWidget} > label > input[type='checkbox']:checked`
        );

        checkboxes.forEach((checkbox) => {
          const value = checkbox.value;
          if (modelsParameters[idInstance]?.isNumber) {
            selectedVal.push(Number(value));
          } else if (modelsParameters[idInstance]?.isBoolean) {
            selectedVal.push(value !== 'false' && Boolean(value));
          } else {
            selectedVal.push(value);
          }
        });

        return selectedVal;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
      setCaption: function (caption, bCaptionManuallyChanged) {},
      clearCaption: function () {},
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.multiSelectFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                              List                                  | \\
  // +--------------------------------------------------------------------¦ \\
  this.listFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;

    this.enable = function () {
      const maxSelected = modelsParameters[idInstance]?.maxSelected ?? '*';
      const listElement = $('#list' + idWidget);
      let selectedOptions = [];

      const updateSelection = () => {
        const allSelectedOptions = Array.from(listElement.find(':selected'));

        // Add newly selected options to the array in order
        allSelectedOptions.forEach((option) => {
          if (!selectedOptions.includes(option)) {
            selectedOptions.push(option);
          }
        });

        // Remove deselected options from the array
        selectedOptions = selectedOptions.filter((option) => allSelectedOptions.includes(option));

        if (maxSelected !== '*' && selectedOptions.length > maxSelected) {
          // Remove the first (oldest) option to maintain the limit
          const removedOption = selectedOptions.shift();
          $(removedOption).prop('selected', false);
        }

        // Update callback with the current selected values
        const selectedValues = selectedOptions.map((option) => $(option).val());
        self.selectedValue.updateCallback(self.selectedValue, selectedValues);
      };

      listElement.on('keydown change', function (e) {
        // Handle Ctrl + A (Select All) only if maxSelected is "*"
        if (e.ctrlKey && (e.key === 'a' || e.key === 'A' || e.keyCode === 65)) {
          e.preventDefault();

          if (maxSelected === '*') {
            // Select all options if no limit
            listElement.find('option').prop('selected', true);
            return;
          }
        }

        updateSelection();
      });

      // Enable the list visually
      listElement[0].style.opacity = '1';
    };

    this.disable = function () {
      $('#list' + idWidget)[0].style.opacity = '0.7'; // Semi-transparent to indicate disabled state
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      const widgetHtml = document.createElement('div');
      const valueHeightPx = $('#' + idDivContainer).height();

      // Configure widget container styles
      Object.assign(widgetHtml.style, {
        width: 'inherit',
        height: `${valueHeightPx}px`,
        cursor: 'inherit',
        display: this.showWidget() ? 'initial' : 'none',
        pointerEvents: 'none',
        opacity: this.enableWidget() ? '1' : '0.5',
      });

      const borderStyle = this.border();
      const fontFactor = getFontFactor();
      const fontSize = modelsParameters[idInstance].listValueFontSize * fontFactor;

      // Build <select> content
      const val = modelsHiddenParams[idInstance].value || [];
      let options = '';

      if (Array.isArray(val)) {
        const pointerEvents = this.enableWidget() ? 'initial' : 'none';
        const cursorStyle = this.bIsInteractive ? 'pointer' : 'inherit';

        for (const option of val) {
          options += `<option style="cursor: ${cursorStyle}; pointer-events: ${pointerEvents};">${option}</option>`;
        }
      }

      const selectHtml = `
        <select 
          class="form-control" 
          id="list${idWidget}" 
          multiple 
          size="10" 
          style="
            width: 100%; 
            height: ${valueHeightPx}px; 
            border-radius: 6px; 
            color: ${modelsParameters[idInstance].listValueColor}; 
            ${borderStyle}; 
            ${this.valueFontFamily()}
            box-sizing: border-box; 
            font-size: calc(7px + ${fontSize}vw + 0.4vh); 
            cursor: inherit; 
            max-width: 2000px;"
        >
          ${options}
        </select>`;

      widgetHtml.innerHTML = selectHtml;

      // Insert widget into the container
      $('#' + idDivContainer).html(widgetHtml);
      this.applyDisplayOnWidget();

      // Adjust height for mobile/tablet devices
      const touchDevice = 'ontouchstart' in document.documentElement;
      const isMobileOrTablet = window.mobileAndTabletCheck();
      // const touchDevice = (navigator.maxTouchPoints || 'ontouchstart' in document.documentElement); // desktops with a touch screen and mobiles

      if (touchDevice || isMobileOrTablet) {
        document.getElementById(`list${idWidget}`).style.height = 'auto';
      }

      // Set selected value if any
      const selectedValue = modelsHiddenParams[idInstance]?.selectedValue || null;
      if (selectedValue) {
        $(`#list${idWidget}`).val(selectedValue);
      }

      // Add custom stylesheet rules
      const stylesheet = document.styleSheets[0];
      const listId = `#list${idWidget}`;

      const colors = modelsHiddenParams[idInstance]?.valueColor;
      if (Array.isArray(colors) && colors.length > 0) {
        const numColors = colors.length;
        document.querySelectorAll(`${listId} option`).forEach((_, index) => {
          const color = colors[index % numColors]; // Loop through colors
          const rule = `${listId} option:nth-child(${index + 1}) { color: ${color}; }`;
          stylesheet.insertRule(rule, stylesheet.cssRules.length);
        });
      } else {
        stylesheet.addRule(`${listId} option`, modelsParameters[idInstance].listValueColor);
      }

      stylesheet.addRule(`${listId} option`, this.listBackgroundColor());
      stylesheet.addRule(`${listId} option:checked`, this.selectValueColor());
      stylesheet.addRule(`${listId} option:checked`, this.selectValueBackgroundColor());

      if (this.bIsInteractive) {
        self.enable();
      } else {
        self.disable();
      }
    };

    const _VALUE_DESCRIPTOR = new WidgetActuatorDescription(
      'value',
      'Available choices',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_PRIMITIVE_ARRAY
    );
    const _VALUE_COLOR_DESCRIPTOR = new WidgetActuatorDescription(
      'valueColor',
      'Colors of selected choices',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_PRIMITIVE_ARRAY
    );
    const _SELECTED_DESCRIPTOR = new WidgetActuatorDescription(
      'selectedValue',
      'Currently selected choices',
      WidgetActuatorDescription.READ_WRITE,
      {
        $schema: WidgetPrototypesManager.SCHEMA_VERSION,
        $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:listFlatUiWidget_selectedValue',
        anyOf: [
          { type: 'string' },
          {
            type: 'array',
            items: { type: 'string' },
          },
        ],
      }
    );

    this.getActuatorDescriptions = function () {
      return [_VALUE_DESCRIPTOR, _VALUE_COLOR_DESCRIPTOR, _SELECTED_DESCRIPTOR];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        const pastSelect = JSON.stringify(modelsHiddenParams[idInstance].selectedValue);

        modelsHiddenParams[idInstance].value = val;
        self.render();

        const selected = JSON.stringify(self.selectedValue.getValue());
        if (selected !== pastSelect) {
          //add a test to avoid loop
          self.selectedValue.updateCallback(self.selectedValue, self.selectedValue.getValue());
        }
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].value;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
      setCaption: function (caption, bCaptionManuallyChanged) {},
      clearCaption: function () {},
    };

    this.valueColor = {
      updateCallback: function () {},
      setValue: function (valColor) {
        modelsHiddenParams[idInstance].valueColor = valColor;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].valueColor;
      },
      addValueChangedHandler: function (updateDataFromWidget) {},
      removeValueChangedHandler: function (updateDataFromWidget) {},
      setCaption: function (caption, bCaptionManuallyChanged) {},
      clearCaption: function () {},
    };

    this.selectedValue = {
      updateCallback: function () {},
      setValue: function (val) {
        $('#list' + idWidget).val(val);
        modelsHiddenParams[idInstance].selectedValue = val;
      },
      getValue: function () {
        const listElement = document.getElementById('list' + idWidget);
        const selectedVal = $('#list' + idWidget).val();
        // const selectedIndex = x.selectedIndex;
        const selectedOptions = listElement?.selectedOptions || [];
        const valuesArray = modelsHiddenParams[idInstance]?.value || [];
        const listLength = Array.isArray(valuesArray) ? valuesArray.length : 0;

        // Return empty string if no options are selected
        if (selectedOptions.length === 0) return '';

        // Validate the indices of the selected options
        for (const option of selectedOptions) {
          if (option.index < 0 || option.index >= listLength) {
            return '';
          }
        }

        return selectedVal || '';
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
      setCaption: function (caption, bCaptionManuallyChanged) {},
      clearCaption: function () {},
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.listFlatUiWidget.prototype = baseWidget.prototype;

  // +--------------------------------------------------------------------¦ \\
  // |                              Table                                 | \\
  // +--------------------------------------------------------------------¦ \\
  this.tableFlatUiWidget = function (idDivContainer, idWidget, idInstance, bInteractive) {
    this.constructor(idDivContainer, idWidget, idInstance, bInteractive);
    const self = this;
    const nbminPerPagination = modelsParameters[idInstance]?.paginationMinNbr ?? 10;
    const options = JSON.parse(modelsParameters[idInstance]?.paginationOptions ?? '[10, 50, 100, 500]');

    let currentPage = 1;
    let totalRows = 0;
    let defaultValue = modelsParameters[idInstance]?.paginationDefaultValue ?? 10;

    if (!options.includes(defaultValue)) {
      defaultValue = options[0];
    }

    function sortTable(cell, columnIndex, isAscending) {
      const tbody = cell.parent().parent().parents()[0].tBodies[0];
      const [headerRow, ...dataRows] = modelsHiddenParams[idInstance].value;

      // Helper function to remove HTML tags (like <b>)
      const cleanHTML = (value) => {
        if (typeof value === 'string') {
          return value.replace(/<\/?[^>]+(>|$)/g, '');
        }
        return value;
      };

      // Sort the dataRows based on the columnIndex
      const sortedData = dataRows.sort((a, b) => {
        let valueA = cleanHTML(a[columnIndex]);
        let valueB = cleanHTML(b[columnIndex]);

        // Handle numeric and string comparison
        const compareA = isNaN(valueA) ? valueA.toLowerCase() : parseFloat(valueA);
        const compareB = isNaN(valueB) ? valueB.toLowerCase() : parseFloat(valueB);

        if (compareA < compareB) return isAscending ? -1 : 1;
        if (compareA > compareB) return isAscending ? 1 : -1;
        return 0;
      });

      // Update modelsHiddenParams with sorted data
      modelsHiddenParams[idInstance].value = [headerRow, ...sortedData];

      // Clear the tbody efficiently
      tbody.innerHTML = '';

      // Append the sorted rows back to the table
      const bodyContent = self.buildTableBody(sortedData);
      tbody.insertAdjacentHTML('beforeend', bodyContent);
    }

    function updateSortArrows(cell, activeHeader, isAscending) {
      const headers = $('#table' + idWidget)[0].querySelectorAll("th[data-sortable='true']");
      headers.forEach((header) => {
        //header.removeAttribute('data-sort');
        header.setAttribute('data-sort', '');
      });
      cell[0].setAttribute('data-sort', isAscending ? 'asc' : 'desc');
    }

    function updateTable() {
      const adjustedTotalRows = modelsParameters[idInstance].headerLine && totalRows > 0 ? totalRows - 1 : totalRows;

      // Get rows per page and calculate total pages
      const rowsPerPage = Number($(`#rows-per-page${idWidget}`).val()) || 1;
      const totalPages = Math.ceil(adjustedTotalRows / rowsPerPage);

      // Cache table body for better performance
      const $tableBody = $(`#table${idWidget} tbody`);
      const $rows = $tableBody.find('tr');

      // Hide all rows, then show the relevant rows for the current page
      $rows
        .hide()
        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
        .show();

      // Update page info
      $(`#page-info${idWidget}`).text(`Page ${currentPage} of ${totalPages}`);

      // Enable/disable pagination buttons
      const isFirstPage = currentPage === 1;
      const isLastPage = currentPage === totalPages;

      $(`#first-page${idWidget}`).prop('disabled', isFirstPage);
      $(`#prev-page${idWidget}`).prop('disabled', isFirstPage);
      $(`#next-page${idWidget}`).prop('disabled', isLastPage);
      $(`#last-page${idWidget}`).prop('disabled', isLastPage);
    }

    this.enable = function () {
      const tableSelector = `#table${idWidget}`;
      const rowsPerPageSelector = `#rows-per-page${idWidget}`;
      const tableElement = $(tableSelector);

      // Initialize editable table widget
      tableElement.editableTableWidget();

      // Handle cell change event
      tableElement.find('td').on('change', function (evt, newValue) {
        const cell = $(this);
        const parent = cell.parent();
        let row = parent.index();
        const column = cell.index();
        const fontSize = modelsParameters[idInstance]?.tableValueFontSize ?? 0.5;

        if (modelsParameters[idInstance].headerLine) {
          row += 1;
        }

        // Basic type handling, convert to number if applicable
        newValue = !isNaN(Number(newValue)) ? Number(newValue) : newValue;

        // Update the hidden model data
        modelsHiddenParams[idInstance].value[row][column] = newValue;

        // Update cell content with styled value
        cell.html(
          `<span style="${self.valueColor()} ${self.valueFontFamily()} font-size: calc(7px + ${
            fontSize * getFontFactor()
          }vw);">${newValue}</span>`
        );

        // Trigger the update callback
        self.value.updateCallback(self.value, self.value.getValue());
      });

      // Handle header sorting click event
      tableElement.find('th').on('click', function (evt) {
        // evt.preventDefault(); // Prevent default behavior
        const cell = $(this);
        const columnIndex = cell.index();
        const isAscending = cell.attr('data-sort') !== 'asc';

        sortTable(cell, columnIndex, isAscending);
        updateSortArrows(cell, columnIndex, isAscending);
        self.value.updateCallback(self.value, self.value.getValue());
        if (totalRows >= nbminPerPagination) {
          updateTable();
        }
      });

      // Handle pagination events
      $(rowsPerPageSelector).on('change', () => {
        currentPage = 1;
        updateTable();
      });

      $('#first-page' + idWidget).on('click', () => {
        currentPage = 1;
        updateTable();
      });

      $('#prev-page' + idWidget).on('click', () => {
        if (currentPage > 1) {
          currentPage--;
          updateTable();
        }
      });

      $('#next-page' + idWidget).on('click', () => {
        const rowsPerPage = $(rowsPerPageSelector).val();
        const totalPages = Math.ceil(totalRows / rowsPerPage);

        if (currentPage < totalPages) {
          currentPage++;
          updateTable();
        }
      });

      $('#last-page' + idWidget).on('click', () => {
        const rowsPerPage = $(rowsPerPageSelector).val();
        const adjustedTotalRows = modelsParameters[idInstance].headerLine && totalRows > 0 ? totalRows - 1 : totalRows;
        currentPage = Math.ceil(adjustedTotalRows / rowsPerPage);
        updateTable();
      });
    };

    this.disable = function () {
      $('#table' + idWidget + ' td').on('change', function (evt, newValue) {});
    };

    // Helper: Get the calculated font size
    this.getCalculatedFontSize = () => {
      const fontSize = modelsParameters[idInstance]?.tableValueFontSize ?? 0.5;
      return `font-size: calc(7px + ${fontSize * getFontFactor()}vw);`;
    };

    // Helper: build table header
    this.buildTableHeader = (headers) => {
      const thElements = $('#table' + idWidget + ' th');
      let tableHeader = '<thead><tr>';

      headers.forEach((header, i) => {
        const dSort = thElements.length ? thElements[i]?.getAttribute('data-sort') : '';
        tableHeader += `<th data-sortable="true" data-sort="${dSort}" style="${this.valueAlign()}">`;
        tableHeader += `<span style="${this.getValueColor()} ${this.valueFontFamily()} ${self.getCalculatedFontSize()} padding-right:15px">`;
        tableHeader += '<b>' + header + '</b>';
        tableHeader += `</span><span class="sort-arrow"></span></th>`;
      });

      tableHeader += '</tr></thead>';
      return tableHeader;
    };

    // Helper: build table body
    this.buildTableBody = (dataRows) => {
      // Helper: determine if a cell is editable
      const isCellEditable = (colIndex) => {
        const val = modelsHiddenParams[idInstance]?.value;
        const editableCols =
          modelsParameters[idInstance].editableCols === '*'
            ? Array.from({ length: val[0].length }, (_, i) => i)
            : (() => {
                try {
                  return JSON.parse(modelsParameters[idInstance].editableCols);
                } catch (e) {
                  console.error('Invalid editableCols format:', e);
                  return [];
                }
              })();

        return editableCols.includes(colIndex) ? 'true' : 'false';
      };

      const sortAsc = $('#table' + idWidget)[0]?.getAttribute('data-sort-asc') || 'true';
      const sortCol = $('#table' + idWidget)[0]?.getAttribute('data-sort-column') || '0';
      let bodyContent = `<tbody data-sort-asc="${sortAsc}" data-sort-column="${sortCol}">`;

      dataRows.forEach((row, i) => {
        if (typeof row === 'string') {
          row = [row];
        }

        const rowStyle =
          modelsParameters[idInstance].striped && i % 2 !== 0
            ? `style="${this.tableBackgroundColor('secondary')}"`
            : '';

        bodyContent += `<tr ${rowStyle}>`;
        row.forEach((cellValue, j) => {
          const isEditable = isCellEditable(j);
          const cursorEditable = isEditable && this.bIsInteractive ? 'cursor: cell;' : '';

          bodyContent += `<td style="${cursorEditable} ${this.valueAlign()}" data-editable="${isEditable}" tabindex="0">`;
          bodyContent += `<span style="${this.getValueColor()} ${this.valueFontFamily()} ${self.getCalculatedFontSize()}">${cellValue}</span>`;
          bodyContent += `</td>`;
        });
        bodyContent += '</tr>';
      });

      bodyContent += '</tbody>';
      return bodyContent;
    };

    this.buildTable = function (val) {
      let tableContent = '';
      let startIndex = 0;

      // Handle array or DataFrame-like content
      if (Array.isArray(val) || modelsHiddenParams[idInstance].isDataFrame) {
        if (modelsParameters[idInstance].headerLine) {
          startIndex = 1;
          tableContent += self.buildTableHeader(val[0]);
        }

        tableContent += self.buildTableBody(val.slice(startIndex));
      } else if (val && val.length > 0) {
        /* 1D table*/
        /*if (modelsParameters[idInstance].headerLine) {
                        startIndex = 1;
                        tableContent += '<thead><tr>';
                        tableContent += '<th><span style="color: #2154ab; font-size: calc(7px + .5vw)"><b>' + val[0] + '</b></span></th>';
                        tableContent += '</tr></thead>';
                    }*/ // MBG : does-it make sense to have header in 1D ?
        tableContent += '<tbody><tr>';
        val.slice(startIndex).forEach((token) => {
          tableContent += `<td style="${this.valueAlign()}">`;
          tableContent += `<span style="${this.getValueColor()} ${this.valueFontFamily()} ${self.getCalculatedFontSize()}">${token}</span>`;
          tableContent += `</td>`;
        });
        tableContent += '</tr></tbody>';
      }

      return tableContent;
    };

    this.buildPagination = function () {
      const fontSize = modelsParameters[idInstance].tableValueFontSize ?? 0.5;
      const strFontSize = `font-size: calc(7px + ${fontSize * getFontFactor()}vw);`;
      const styleAttributes = `${this.getValueColor()} ${this.valueFontFamily()} ${strFontSize}`;

      // Get or default rows per page
      const _defaultValue = $('#rows-per-page' + idWidget)?.val() ?? defaultValue;

      // Build options for rows per page dropdown
      const optionsHTML = options
        .map(
          (value) => `<option value="${value}"${value === parseInt(_defaultValue) ? ' selected' : ''}>${value}</option>`
        )
        .join('');

      // Construct the pagination controls
      return `
        <div id="pagination-controls">
          <label for="rows-per-page" style="${styleAttributes}">
            Rows per page:
          </label>
          <div class="custom-select-wrapper">
            <select name="rows-per-page" id="rows-per-page${idWidget}" style="${strFontSize}">
              ${optionsHTML}
            </select>
          </div>
          <button id="first-page${idWidget}" disabled>|&lt;</button>
          <button id="prev-page${idWidget}" disabled>&lt;</button>
          <span id="page-info${idWidget}" style="${styleAttributes}">
            Page 1 of 1
          </span>
          <button id="next-page${idWidget}">&gt;</button>
          <button id="last-page${idWidget}">&gt;|</button>
        </div>
      `;
    };

    this.rescale = function () {
      this.render();
    };

    this.render = function () {
      const val = modelsHiddenParams[idInstance]?.value;
      totalRows = val?.length ?? 0;
      let insideTable = self.buildTable(val);
      const isTableEmpty = insideTable === '';
      const tableWidth = isTableEmpty || totalRows < nbminPerPagination ? '100%' : '75%';

      if (isTableEmpty) {
        insideTable = '<tbody><tr><td/><td/><td/></tr><tr><td/><td/><td/></tr></tbody>'; // empty table
      }

      const widgetHtml = document.createElement('div');
      const displayStyle =
        'cursor: ' + (this.bIsInteractive ? 'auto' : 'inherit') + '; width: inherit; height: inherit; overflow: auto;';

      let tableClass = 'table';
      if (modelsParameters[idInstance].bordered) tableClass += ' table-bordered';
      if (modelsParameters[idInstance].noBorder) tableClass += ' no-border';
      tableClass += ' table-responsive';

      let divContent = `<table style="margin: 0; height: ${tableWidth}; ${this.tableBackgroundColor(
        'primary'
      )}" class="${tableClass}" id="table${idWidget}">
        ${insideTable}
      </table>`;

      // Append pagination if applicable
      if (!isTableEmpty && totalRows >= nbminPerPagination) {
        divContent += self.buildPagination();
      }

      widgetHtml.innerHTML = divContent;

      const showWidget = this.showWidget();
      const enableWidget = this.enableWidget();

      const displayStyle2 = showWidget ? 'display: block;' : 'display: none;';
      const enableStyle = enableWidget
        ? 'pointer-events: initial; opacity:initial;'
        : 'pointer-events: none; opacity:0.5;';

      widgetHtml.setAttribute('style', `${displayStyle}${displayStyle2}${enableStyle}`);

      $('#' + idDivContainer).html(widgetHtml);
      this.applyDisplayOnWidget();

      if (this.bIsInteractive) {
        self.enable();
        if (totalRows >= nbminPerPagination) {
          currentPage = 1;
          updateTable();
        }
      } else {
        self.disable();
      }
    };

    const _SCHEMA = {
      $schema: WidgetPrototypesManager.SCHEMA_VERSION,
      $id: WidgetPrototypesManager.ID_URI_SCHEME + 'xdash:tableFlatUiWidget',
      anyOf: [
        {
          type: 'array',
          items: {
            anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
          },
        },
        {
          type: 'array',
          items: {
            type: 'array',
            items: {
              anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
            },
          },
        },
      ],
    };
    const _VALUE_DESCRIPTOR_R = new WidgetActuatorDescription(
      'value',
      'Table content as an array or array of arrays',
      WidgetActuatorDescription.READ,
      _SCHEMA
    );
    const _VALUE_DESCRIPTOR_RW = new WidgetActuatorDescription(
      'value',
      'Table content as an array or array of arrays',
      WidgetActuatorDescription.READ_WRITE,
      _SCHEMA
    );
    this.getActuatorDescriptions = function (model = null) {
      const params = model || modelsParameters[idInstance];
      let parsedEditableCols = [];
      try {
        parsedEditableCols = JSON.parse(params.editableCols);
      } catch (e) {}
      return Array.isArray(parsedEditableCols) && parsedEditableCols.length
        ? [_VALUE_DESCRIPTOR_RW]
        : [_VALUE_DESCRIPTOR_R];
    };

    this.value = {
      updateCallback: function () {},
      setValue: function (val) {
        modelsHiddenParams[idInstance].value = val;
        self.render();
      },
      getValue: function () {
        return modelsHiddenParams[idInstance].value;
      },
      addValueChangedHandler: function (updateDataFromWidget) {
        this.updateCallback = updateDataFromWidget;
      },
      removeValueChangedHandler: function (updateDataFromWidget) {},
      setCaption: function (caption, bCaptionManuallyChanged) {},
      clearCaption: function () {},
    };

    self.render();
  };

  // Inherit from baseWidget class
  this.tableFlatUiWidget.prototype = baseWidget.prototype;

  // Plugin definition
  this.pluginDefinition = {
    name: 'flatUi',
    widgetsDefinitionList: {
      flatUiSelect: { factory: 'selectFlatUiWidget', title: 'Select', icn: 'select', help: 'wdg/wdg-basics/#select' },
      flatUiMultiSelect: {
        factory: 'multiSelectFlatUiWidget',
        title: 'Multi-select',
        icn: 'multi-select',
        help: 'wdg/wdg-basics/#multi-select',
      },
      flatUiList: { factory: 'listFlatUiWidget', title: 'List', icn: 'list', help: 'wdg/wdg-basics/#list' },
      flatUiTable: {
        factory: 'tableFlatUiWidget',
        title: 'Table',
        icn: 'board',
        help: 'wdg/wdg-basics/#editable-table',
      },
      flatUiEditableTable: {
        factory: 'tableFlatUiWidget',
        title: 'Editable table',
        icn: 'board',
        help: 'wdg/wdg-basics/#table',
      },
    },
  };

  this.constructor();
}

// Inherit from basePlugin class
flatUiComplexWidgetsPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
const flatUiComplexWidgetsPlugin = new flatUiComplexWidgetsPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(flatUiComplexWidgetsPlugin);
