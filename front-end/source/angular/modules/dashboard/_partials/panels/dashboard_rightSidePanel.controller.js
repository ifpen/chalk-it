// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_rightSidePanel.controller                                              │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Tristan BARTEMENT                             │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

angular
  .module('modules.editor')
  .component('xdashJsonEditor', {
    bindings: {
      json: '<',
      changes: '&',
    },
    controller: [
      '$element',
      '$scope',
      class GraphicalPropertiesEditor {
        constructor($element, $scope) {
          this.$element = angular.element($element[0].querySelectorAll('.graphicalPropertiesContent'))[0];
          this.$scope = $scope;
          this.json = {};
        }

        $onInit() {
          const self = this;
          this.editor = new JSONEditor(this.$element, {
            mode: 'form',
            modes: ['form'],
            onError: function (err) {
              swal('Error', err.toString(), 'error');
            },
            onChangeJSON: function (newValue) {
              self.changes({ newValue });
              self.$scope.$apply();
            },
          });

          //GHI display color picker #252
          $(this.$element).on('click', function () {
            const container = $('.popup');
            if (container.length) {
              container[0].scrollIntoView({
                behavior: 'auto', // or "smooth" or "instant"
                block: 'start', // or "end"
              });
            }
          });

          this.editor.set(this.json);
          this.editor.expandAll();
        }

        $onChanges(changes) {
          if (this.editor && changes.json && changes.json.currentValue !== changes.json.previousValue) {
            this.editor.set(changes.json.currentValue);
            this.editor.expandAll();
          }
        }
      },
    ],
    template: `<div class="graphicalPropertiesContent"></div>`,
  })
  .component('xdashWidgetConnectionsEditor', {
    bindings: {
      widgetParams: '<',
      widgetConnections: '<',
      changes: '&',
    },
    controller: [
      '$window',
      '$timeout',
      'UiNotifications',
      class WidgetConnectionsEditor {
        static MAX_VAL_PER_COMBO = 100; // Must be an integer above 2; would not try anything below a handful.
        static COMBO_SCALE_FACTOR = 10; // Integer > 1; Must be less than MAX_VAL_PER_COMBO

        title = '';
        validationInProgress = 0; // Number of validation in progess. Controls the spinner's display.
        /**
         * {
         *   name: string,
         *   index: number,
         *   latestData?: any,
         *   validated: {[sliderName: string]: boolean | undefined},
         *   supportsWrites: boolean,
         *   supportsPath: boolean,
         * }[] // Sorted by names.
         */
        dataNodes = [];
        sliderNames = [];

        /**
         * { [slider_name: string]: {
         *     validator?: (any)=>boolean,
         *     description?: WidgetActuatorDescription,
         *     read?: boolean,
         *     write?: boolean,
         *     trigger?: boolean,
         *     highlight?: string,
         *     dsFilter: (ds:dataNodes) => boolean,
         *     showFields: boolean,
         *   }
         * }
         */
        sliderDescriptions = {};

        /**
         * {
         *   [sliderName: string]: {
         *     fieldsCombos: {
         *       selectedOpt: {...}, // one of 'options'
         *       options: {
         *         label: string,
         *         key: string | number | undefined,
         *         keyRange?: [string, string] | [number, number]}, // Inclusive
         *         value: { value: any, range?: [number, number] } // Range end is exclusive
         *       }[],
         *       baseDataValue?: { value: any, range?: [number, number] },
         *     }[],
         *     validationErrors: string[] | undefined, // Result of the validation of the currently selected data. Undefined if validation is not possible (no data or no validation function). Otherwise array of errors (which is empty for valid selections).
         *   }
         * }
         */
        selectionCombos = {};

        currentConnections = {};

        constructor($window, $timeout, UiNotifications) {
          this.$window = $window;
          this.$timeout = $timeout;
          this.uiNotifications = UiNotifications;
        }

        $onChanges(changes) {
          const connectionChanged =
            changes.widgetConnections &&
            changes.widgetConnections.currentValue !== changes.widgetConnections.previousValue;
          const connections = connectionChanged ? this.widgetConnections : this.currentConnections;

          const newWidgetDescriptions = this._grabSliderDescriptions(connections, this.widgetParams);
          const newDescriptions = this._buildDescriptions(connections, newWidgetDescriptions);
          if (connectionChanged || this._descriptionsChanged(this.sliderDescriptions, newDescriptions)) {
            this.sliderNames = newWidgetDescriptions.map((_) => _.name);
            this.sliderDescriptions = newDescriptions;
            this._updateContent(connections);
          }
        }

        _notifyChanges() {
          this.changes({ newValue: this.currentConnections });
        }

        _grabSliderDescriptions(connections, params) {
          return connections && connections.widgetObjEdit
            ? [...connections.widgetObjEdit.getActuatorDescriptions(params)]
            : [];
        }

        _descriptionsChanged(oldDescriptions, newDescriptions) {
          const keysA = Object.keys(oldDescriptions);
          const keysB = Object.keys(newDescriptions);
          if (keysA.length !== keysB.length) {
            return true;
          }
          for (const actuatorName of keysA) {
            const older = oldDescriptions[actuatorName];
            const newer = newDescriptions[actuatorName];
            if (older !== newer) {
              if (older === undefined || newer === undefined) {
                return true;
              }
              const oldDef = older.description;
              const newDef = newer.description;
              if (oldDef !== newDef) {
                if (
                  oldDef == undefined ||
                  newDef == undefined ||
                  oldDef.summary !== newDef.summary ||
                  oldDef.direction !== newDef.direction ||
                  oldDef.jsonSchema !== newDef.jsonSchema ||
                  oldDef.validator !== newDef.validator
                ) {
                  return true;
                }
              }
            }
          }
          return false;
        }

        /**
         * In order of priority, adapts a widget's validation function ot create one from json schema if available.
         * The validation function always returns an array of errors. It is empty if data is valid.
         * @param {*} desc actuator descriptor object
         * @returns the validation function if available
         */
        _createValidationFct(desc) {
          if (!this.$window.widgetPrototypesManager) {
            return undefined;
          }

          if (desc.validator) {
            return (data) => desc.validator(data) || [];
          } else if (desc.jsonSchema) {
            const validator = this.$window.widgetPrototypesManager.getOrCompile(desc.jsonSchema);
            return (data) => {
              const isValid = validator(data);
              if (isValid) {
                return [];
              } else {
                const errors = validator.errors || [];
                return this.$window.widgetPrototypesManager.formatErrors(errors);
              }
            };
          } else {
            return undefined;
          }
        }

        printErrors(errors) {
          if (errors && errors.length) {
            return 'Selected data:\n' + errors.map((_) => _.toString()).join('\n');
          } else return undefined;
        }

        _buildDescriptions(connections, widgetActuatorDescriptions) {
          const result = {};
          if (connections && connections.widgetObjEdit) {
            for (const description of widgetActuatorDescriptions) {
              const actuatorName = description.name;
              result[actuatorName] = {
                dsFilter: () => true,
                showFields: true,
              };
              const validator = this._createValidationFct(description);
              const read =
                description.direction !== undefined && (description.direction & WidgetActuatorDescription.READ) !== 0;
              const write =
                description.direction !== undefined && (description.direction & WidgetActuatorDescription.WRITE) !== 0;
              const file = description.direction === WidgetActuatorDescription.FILE;
              result[actuatorName] = {
                description,
                validator,
                read,
                write,
                file,
                trigger: description.direction === WidgetActuatorDescription.TRIGGER,
                highlight: description.summary,
                dsFilter: write ? (ds) => ds.supportsWrites : () => true,
                showFields: description.direction !== WidgetActuatorDescription.TRIGGER,
              };
            }
          }
          return result;
        }

        /**
         * Starts validations tasks, ensuring the spinner is on.
         * @param {Array} tasks array of function
         */
        _startValidations(tasks) {
          if (tasks.length) {
            const self = this;
            self.validationInProgress++;
            this.$timeout(function () {
              try {
                tasks.forEach((_) => _());
              } finally {
                self.validationInProgress--;
              }
            }, 1); // Page is not updated if 0
          }
        }

        _updateContent(newConnections) {
          this.dataNodes = [];
          if (this.$window.datanodesManager) {
            // Check if there are any changes in dataTree
            const $rootScope = angular.element(document.body).scope().$root;
            if ($rootScope.xDashLiteVersion) taipyManager.processVariableData();
            // Probably not initialized before angular. TODO should be a service
            this.dataNodes = this.$window.datanodesManager.getAllDataNodes().map((ds, index) => ({
              name: ds.name(),
              index,
              latestData: ds.latestData(),
              validated: {},
              supportsWrites: !!ds.canSetValue(),
              supportsPath: !!ds.canSetValue() && ds.canSetValue().acceptPath,
              isFunction: ds.settings().isFunction ?? false,
            }));
            this.dataNodes = _.sortBy(this.dataNodes, (ds) => ds.name.toLowerCase());
          }

          this.currentConnections = jQuery.extend(true, {}, newConnections);
          this.selectionCombos = {};

          this.title = 'No selected ';
          if (this.currentConnections && this.currentConnections.modelJsonId !== undefined) {
            this.title = widgetsPluginsHandler.widgetToolbarDefinitions[this.currentConnections.modelJsonId].title;
          }

          const existingSliders = this.currentConnections.sliders;
          this.currentConnections.sliders = {};

          const validations = [];
          for (const actuatorName of this.sliderNames) {
            const desc = this.sliderDescriptions[actuatorName];
            if (desc && desc.validator) {
              for (const ds of this.dataNodes) {
                if (ds.latestData !== undefined) {
                  validations.push(() => {
                    const result = desc.validator(ds.latestData);
                    ds.validated[actuatorName] = !result.length;
                  });
                }
              }
            }

            let slider = existingSliders[actuatorName];

            // isFunction is used to test if the slider value is not a reserved name in javascript
            // For example : "keys", "values" are function names in javascript
            // slider value must be a string or undefined
            if (slider && !_.isFunction(slider)) {
              const ds = this.dataNodes.find((ds) => ds.name === slider.dataNode);

              // Should not be possible anymore; Warning for old dashboard with invalid connections.
              if (ds && !desc.dsFilter(ds)) {
                this.uiNotifications.notifyMessage(
                  'Invalid datasource',
                  `Datasource "${ds.name}" can not be bound to actuator "${actuatorName}".`,
                  UiNotifications.TYPE_ERROR
                );
              }

              if (ds && desc.dsFilter(ds)) {
                slider = { ...slider, name: actuatorName };

                this.selectionCombos[actuatorName] = this._createSelectionCombos(slider);
                slider.dataFields = this.selectionCombos[actuatorName].fieldsCombos
                  .map((_) => _.selectedOpt.key)
                  .filter((_) => _ !== undefined);
              } else {
                if (slider.dataNode !== 'None') {
                  console.log(
                    "DataNode connection is removed because '",
                    slider.dataNode,
                    "' dataNode does not exist!"
                  );
                  let vm = angular.element(document.getElementById('panel--right')).scope();
                  vm.$parent.vmd.resetPanel();
                  vm.$parent.vmd.savePanel();
                }
                slider = undefined;
              }
            }
            // isFunction is used to test if the slider value is a reserved name in javascript
            // For example : "keys", "values" are function names in javascript
            // slider value must be a string or undefined
            if (!slider || _.isFunction(slider)) {
              slider = {
                name: actuatorName,
                dataNode: 'None',
                dataFields: [],
              };
            }
            this.currentConnections.sliders[actuatorName] = slider;
          }

          this._startValidations(validations);
        }

        _buildOptions(valueDef) {
          const value = valueDef.value;

          if (value === null || typeof value !== 'object') {
            // 'object' does include arrays
            return null;
          }
          const sortedKeys = Array.isArray(value) ? value.map((_, i) => i) : Object.keys(value).sort();
          const [min, max] = valueDef.range || [0, sortedKeys.length];
          const size = max - min;

          if (size <= WidgetConnectionsEditor.MAX_VAL_PER_COMBO) {
            return sortedKeys.slice(min, max).map((key) => ({
              label: key.toString(),
              key,
              value: { value: value[key] },
            }));
          } else {
            let increment = WidgetConnectionsEditor.MAX_VAL_PER_COMBO;
            while (Math.ceil(size / increment) > WidgetConnectionsEditor.MAX_VAL_PER_COMBO) {
              increment *= WidgetConnectionsEditor.COMBO_SCALE_FACTOR;
            }

            if (increment > size) {
              // Make sure to always create more than one group
              console.warn(
                `COMBO_SCALE_FACTOR=${WidgetConnectionsEditor.COMBO_SCALE_FACTOR} too big relative to MAX_VAL_PER_COMBO=${WidgetConnectionsEditor.MAX_VAL_PER_COMBO}`
              );
              increment = Math.floor(size / 2);
            }

            const options = [];
            for (let i = min; i < max; i += increment) {
              const end = Math.min(i + increment, max);
              options.push({
                label: `${sortedKeys[i]} ... ${sortedKeys[end - 1]}`,
                key: undefined,
                keyRange: [sortedKeys[i], sortedKeys[end - 1]],
                value: { value: value, range: [i, end] },
              });
            }
            return options;
          }
        }

        _buildValidatedOptions(valueDef, sliderName) {
          const options = this._buildOptions(valueDef);
          const desc = this.sliderDescriptions[sliderName];

          const validations = [];
          if (options && desc && desc.validator) {
            for (const opt of options) {
              if (opt.value && !opt.value.range) {
                validations.push(() => {
                  const result = desc.validator(opt.value.value);
                  opt.validated = !result.length;
                });
              }
            }
          }

          this._startValidations(validations);
          return options;
        }

        _findOption(options, key, value) {
          if (Array.isArray(value) && typeof key === 'string') {
            key = parseInt(key, 10);
          }

          for (const opt of options) {
            if (opt.keyRange && key >= opt.keyRange[0] && key <= opt.keyRange[1]) {
              return opt;
            } else if (opt.key === key) {
              return opt;
            }
          }

          return null;
        }

        _createSelectionCombos(slider) {
          const dataFields = slider.dataFields;
          const ds = this.dataNodes.find((ds) => ds.name === slider.dataNode);
          const dsValue = ds ? ds.latestData : undefined;

          const desc = this.sliderDescriptions[slider.name];

          if (!desc.showFields || (desc.write && ds && !ds.supportsPath)) {
            const result = {
              fieldsCombos: [],
              validationErrors: undefined,
            };
            if (desc.validator && dsValue !== undefined) {
              this._startValidations([() => (result.validationErrors = desc.validator(dsValue))]);
            }
            return result;
          }

          const noneOpt = {
            label: 'None',
          };

          if (dsValue === undefined) {
            const fieldsCombos = dataFields.map((key) => {
              const opt = {
                label: key.toString(),
                key,
                value: { value: undefined },
              };
              return {
                selectedOpt: opt,
                options: [noneOpt, opt],
              };
            });
            return {
              fieldsCombos,
              validationErrors: undefined,
            };
          } else {
            const fieldsCombos = [];
            const result = {
              fieldsCombos,
              validationErrors: undefined,
            };

            let currentValue = { value: dsValue };
            for (const field of dataFields) {
              if (typeof field === 'string' && field.includes(' ... ')) {
                continue;
              }

              do {
                const options = this._buildValidatedOptions(currentValue, slider.name);
                if (options) {
                  const selectedOpt = this._findOption(options, field, currentValue.value) || noneOpt;
                  fieldsCombos.push({
                    selectedOpt,
                    options: [noneOpt, ...options],
                    baseDataValue: currentValue,
                  });
                  currentValue = selectedOpt.value;
                } else {
                  currentValue = undefined;
                }
              } while (currentValue && currentValue.range);

              if (!currentValue) {
                break;
              }
            }

            if (currentValue) {
              if (desc.validator) {
                this._startValidations([() => (result.validationErrors = desc.validator(currentValue.value))]);
              }

              const options = this._buildValidatedOptions(currentValue, slider.name);
              if (options) {
                fieldsCombos.push({
                  selectedOpt: noneOpt,
                  options: [noneOpt, ...options],
                  baseDataValue: currentValue,
                });
              }
            }

            return result;
          }
        }

        onDatasourceChange(sliderName) {
          const slider = this.currentConnections.sliders[sliderName];
          slider.dataFields = [];

          this.selectionCombos[sliderName] = this._createSelectionCombos(slider);

          this._notifyChanges();
        }

        onDatafieldChange(sliderName, index) {
          const slider = this.currentConnections.sliders[sliderName];
          const selectionData = this.selectionCombos[sliderName];
          let combos = selectionData.fieldsCombos;
          if (index < combos.length - 1) {
            combos = combos.slice(0, index + 1);
            selectionData.fieldsCombos = combos;
          }

          const combo = combos[index];
          const currentValue = combo.selectedOpt.value;
          selectionData.validationErrors = undefined;
          if (currentValue) {
            const desc = this.sliderDescriptions[sliderName];
            if (desc && desc.validator) {
              this._startValidations([() => (selectionData.validationErrors = desc.validator(currentValue.value))]);
            }

            const options = this._buildValidatedOptions(currentValue, sliderName);
            if (options) {
              const noneOpt = {
                label: 'None',
              };
              combos.push({
                selectedOpt: noneOpt,
                options: [noneOpt, ...options],
                baseDataValue: currentValue,
              });
            }
          }

          slider.dataFields = this.selectionCombos[sliderName].fieldsCombos
            .map((_) => _.selectedOpt.key)
            .filter((_) => _ !== undefined);
          this._notifyChanges();
        }
      },
    ],
    template: `
    <h2 style="margin-bottom:1.5em">
        {{$ctrl.title}} widget <i ng-if="$ctrl.validationInProgress > 0" class="fa fa-cog fa-spin fa-fw"></i>
    <h2>


    <h4 ng-repeat-start="sliderName in $ctrl.sliderNames" title="Actuator trigger of {{$ctrl.title}}{{$ctrl.sliderDescriptions[sliderName].highlight ? ' :\n' + $ctrl.sliderDescriptions[sliderName].highlight : ''}}">
        Actuator : {{sliderName}}

        <small ng-if="$ctrl.sliderDescriptions[sliderName].file" title="Sets a file's content into the bound data node">(<span style="color: var(--main-text-color)">F</span>)</small>
        <small ng-if="$ctrl.sliderDescriptions[sliderName].trigger" title="Triggers the execution/update of the bound data node">(<span style="color: var(--main-text-color)">X</span>)</small>
        <small ng-if="$ctrl.sliderDescriptions[sliderName].read || $ctrl.sliderDescriptions[sliderName].write">
            (<span ng-if="$ctrl.sliderDescriptions[sliderName].read" style="color: var(--success-color)" title="Reads data from the data node">R</span><span ng-if="$ctrl.sliderDescriptions[sliderName].write" style="color: var(--danger-color)" title="Writes data to the data node">W</span>)
        </small>

        <i ng-if="$ctrl.selectionCombos[sliderName].validationErrors && !$ctrl.selectionCombos[sliderName].validationErrors.length" class="fa fa-check" style="color: var(--primary-color)" aria-hidden="true"></i>
        <i ng-if="$ctrl.selectionCombos[sliderName].validationErrors && $ctrl.selectionCombos[sliderName].validationErrors.length" class="fa fa-times" style="color: var(--danger-color)" aria-hidden="true" title="{{$ctrl.printErrors($ctrl.selectionCombos[sliderName].validationErrors)}}"></i>
    </h4>
    <div class="dataconnection__row">
        <div class="dataconnection__col">
            <label for="DS{{sliderName}}_">DataNodes</label>
            <select id="DS{{sliderName}}" ng-model="$ctrl.currentConnections.sliders[sliderName].dataNode" ng-change="$ctrl.onDatasourceChange(sliderName)">
                <option>None</option>
                <option ng-repeat="ds in $ctrl.dataNodes | filter: $ctrl.sliderDescriptions[sliderName].dsFilter" ng-if="$ctrl.sliderDescriptions[sliderName].trigger === ds.isFunction" ng-class="{'validated' : ds.validated[sliderName]}">{{ds.name}}</option>
            </select>
        </div>
        <div class="dataconnection__col" ng-repeat="dataSelect in $ctrl.selectionCombos[sliderName].fieldsCombos">
            <label for="DS{{sliderName}}_">DataFields ({{$index}})</label>
            <select id="DF_{{$index}}_{{sliderName}}" ng-model="dataSelect.selectedOpt" ng-change="$ctrl.onDatafieldChange(sliderName, $index)">
                <option ng-repeat="opt in dataSelect.options" ng-value="opt" ng-class="{'validated' : opt.validated}">{{opt.label}}</option>
            </select>
        </div>
    </div>
    <span ng-repeat-end></span>
    `,
  })
  .controller('DashboardRightSidePanelController', [
    '$scope',
    '$rootScope',
    '$state',
    '$q',
    'UndoManagerService',
    'EditorActionFactory',
    'WidgetEditorGetter',
    function ($scope, $rootScope, $state, $q, undoManagerService, editorActionFactory, widgetEditorGetter) {
      const vm = this;

      vm.popup = null; // { title: string, textBtnYes: string, textBtnNo: string, resolve: (boolean) => void }
      vm.dirty = false;

      vm.widgetId = undefined;

      vm.widgetConnection = undefined; // Used as input for xdashWidgetConnectionsEditor as the reset changes the value
      vm.currentWidgetConnection = undefined;
      vm.originalWidgetConnection = undefined;

      vm.currentWidgetParams = undefined;
      vm.originalWidgetParams = undefined;

      vm.onWidgetConnectionsChange = function _onWidgetConnectionsChange(newValues) {
        vm.currentWidgetConnection = newValues;
        vm.dirty = true;
      };

      vm.onWidgetParamChange = function _onWidgetParamChange(newValues) {
        vm.currentWidgetParams = newValues;
        vm.dirty = true;
      };

      function _resetWidgetParamEditor() {
        vm.originalWidgetParams = jQuery.extend(true, {}, vm.originalWidgetParams);
        vm.currentWidgetParams = vm.originalWidgetParams;
      }

      function _resetEditorContent() {
        _resetWidgetParamEditor();
        vm.widgetConnection = jQuery.extend(true, {}, vm.originalWidgetConnection);
        vm.currentWidgetConnection = jQuery.extend(true, {}, vm.originalWidgetConnection);

        vm.dirty = false;
      }

      function _setEditedWidget(widgetId) {
        widgetConnector.updateWidgetsConnections();

        vm.widgetId = widgetId;
        vm.originalWidgetConnection = jQuery.extend(true, {}, widgetConnector.widgetsConnection[widgetId]);
        vm.originalWidgetParams = jQuery.extend(true, {}, modelsParameters[widgetId]);

        _resetEditorContent();
      }

      vm.editSelectedWidget = function _editSelectedWidget() {
        const widgetEditor = widgetEditorGetter();
        const widgetId = widgetEditor ? widgetEditor.getSelectedActive() : null;

        _setEditedWidget(widgetId);
      };

      /*--------save--------*/
      // Cannonical form for currentWidgetConnection to check if it actually changed in a meaningful way
      function _normalizeWidgetConnector(c) {
        const result = {};
        for (const key in c.sliders) {
          const slider = c.sliders[key];
          result[slider.name] = {
            dataNode: slider.dataNode,
            dataFields: slider.dataFields,
          };
        }
        return result;
      }

      vm.savePanel = function _savePanel() {
        // Only change if data was modified
        const newData = jQuery.extend(true, {}, vm.currentWidgetParams);
        const newConnections = jQuery.extend(true, {}, vm.currentWidgetConnection);
        if (
          !angular.equals(newData, vm.originalWidgetParams) ||
          !angular.equals(
            _normalizeWidgetConnector(newConnections),
            _normalizeWidgetConnector(vm.originalWidgetConnection)
          )
        ) {
          const action = editorActionFactory.createSetWidgetParametersAction(vm.widgetId, newData, newConnections);
          undoManagerService.execute(action);
        }

        vm.dirty = false;
      };

      /*--------popup--------*/

      // Opens a yes/no popup in the panel, asynchronously returns the users' choice.
      // There is no garantee the promise will ever resolve.
      vm.showPopup = function _showPopup(title, textBtnYes = 'Yes', textBtnNo = 'No') {
        // Promise<boolean>
        return new $q((resolve) => (vm.popup = { title, textBtnYes, textBtnNo, resolve })).finally(
          () => (vm.popup = null)
        );
      };

      vm.requestResetDataConnection = function _requestResetDataConnection() {
        return vm
          .showPopup('Are you sure you want to erase the DataNode Connections ?', 'Yes', 'Abandon')
          .then((ok) => {
            if (ok) {
              vm.resetPanel();
            }
            return ok;
          });
      };

      vm.requestResetGraphicalProperties = function _requestResetGraphicalProperties() {
        return vm
          .showPopup('Are you sure you want to reset the Graphical Properties ?', 'Yes', 'Abandon')
          .then((ok) => {
            if (ok) {
              vm.resetGraphicalProperties();
            }
            return ok;
          });
      };

      vm.requestSavePanel = function _requestSavePanel() {
        return vm.showPopup('Do you want to save your current changes ?').then((ok) => {
          if (ok) {
            vm.savePanel();
          }
          return ok;
        });
      };

      // Returns a promise that resolve to true if panel is saved or clean.
      vm.ensureSavedOrDiscarded = function _ensureSavedOrDiscarded() {
        return vm.dirty ? vm.requestSavePanel() : Promise.resolve(true);
      };

      /*-------- Break all connections --------*/
      vm.resetPanel = function _resetPanel() {
        _resetEditorContent();
        if (!_.isUndefined(vm.widgetConnection.sliders)) {
          for (const slider in vm.widgetConnection.sliders) {
            vm.widgetConnection.sliders[slider].dataNode = 'None';
            vm.widgetConnection.sliders[slider].dataFields = [];
          }
          vm.currentWidgetConnection = vm.widgetConnection;
          vm.dirty = true;
        }
      };

      /*-------- Reset all graphical settings --------*/
      vm.resetGraphicalProperties = function _resetGraphicalProperties() {
        _resetEditorContent();
        const widgetEditor = widgetEditorGetter();
        const widgetId = widgetEditor ? widgetEditor.getSelectedActive() : null;
        vm.currentWidgetParams = modelsParameters[widgetId.slice(0, -1)];
        // TODO: apply changes into JSONeditor, currently only works after save
        vm.dirty = true;
      };
    },
  ]);
