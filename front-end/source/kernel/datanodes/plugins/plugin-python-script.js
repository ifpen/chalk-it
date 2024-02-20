import _ from 'underscore';
import { urlPython } from 'config.js';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { jsonDataToBasicHtmlElement } from 'kernel/datanodes/plugins/thirdparty/utils';
import { PythonPluginRemoteExec, PythonPluginExecBase, PythonPluginLocalExec } from './plugin-python-support';

// TODO
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/comment/continuecomment';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/mode/python/python';
import CodeMirror from 'codemirror';
import { JSEditorCompletion } from 'kernel/datanodes/gui/JSEditorCompletion';

if (PythonPluginRemoteExec.isSupported() || PythonPluginLocalExec.isSupported()) {
  (function () {
    function createPythonExec(imageId, cliendId = undefined) {
      if (imageId === PythonPluginLocalExec.PSEUDO_IMAGE_ID) {
        return new PythonPluginLocalExec();
      } else {
        return new PythonPluginRemoteExec(imageId, cliendId);
      }
    }

    const DEFAULT_BACKEND = PythonPluginLocalExec.isSupported()
      ? { name: PythonPluginLocalExec.PSEUDO_IMAGE_NAME, id: PythonPluginLocalExec.PSEUDO_IMAGE_ID }
      : { name: PythonPluginRemoteExec.DEFAULT_IMAGE_NAME, id: PythonPluginRemoteExec.DEFAULT_IMAGE_ID };

    async function dockerImageSelect(valueCell, settingDef, currentSettingsValues, newSettings) {
      const selectId = 'select-option' + settingDef.name;
      $('<select disabled="true" id="' + selectId + '"></select>').appendTo(
        $('<div class="styled-select"></div>').appendTo(valueCell)
      );

      // Set temporary options
      const choicesDef = [];
      if (PythonPluginLocalExec.isSupported()) {
        choicesDef.push({ name: PythonPluginLocalExec.PSEUDO_IMAGE_NAME, id: PythonPluginLocalExec.PSEUDO_IMAGE_ID });
      }
      if (PythonPluginRemoteExec.isSupported()) {
        choicesDef.push({
          name: PythonPluginRemoteExec.DEFAULT_IMAGE_NAME,
          id: PythonPluginRemoteExec.DEFAULT_IMAGE_ID,
        });
      }

      const choicesTmp = [...choicesDef];
      const current =
        settingDef.name in currentSettingsValues && currentSettingsValues[settingDef.name]
          ? currentSettingsValues[settingDef.name]
          : null;
      if (
        current &&
        current.id !== PythonPluginLocalExec.PSEUDO_IMAGE_ID &&
        current.id !== PythonPluginRemoteExec.DEFAULT_IMAGE_ID
      ) {
        choicesTmp.push({ name: current.name, id: current.id });
      }

      const input = $('#' + selectId);
      choicesTmp.forEach((def) => $('<option></option>').text(def.name).attr('value', def.id).appendTo(input));

      input.val(current?.id ?? DEFAULT_BACKEND.id);

      // Disable Docker images in the open source version
      if (!urlPython) {
        return;
      }

      // Recover image list
      // "await" implies that at this point the user may interract with the UI
      const images = await PythonPluginRemoteExec.getImages();

      // Set the actual options
      let unsortedChoices = [];
      _.each(images, function (image) {
        unsortedChoices.push({ name: image.name, id: image.id });
      });
      unsortedChoices.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
      const choices = [...choicesDef, ...unsortedChoices];

      input.empty();
      _.each(choices, function (option) {
        $('<option></option>').text(option.name).attr('value', option.id).appendTo(input);
      });

      input.change(function () {
        const selectedId = $(this).val();
        const image = choices.find(function (i) {
          return i.id === selectedId;
        });
        newSettings.settings[settingDef.name] = image;
      });
      input.prop('disabled', false);

      // Update selection
      if (!choices.find((it) => it.id === current.id)) {
        let replacement = choices.find((it) => it.name === current.name);
        if (replacement) {
          swal(
            'Docker image',
            'The selected docker images does not exist anymore but one with the same name was found.',
            'warning'
          );
        } else {
          replacement = DEFAULT_BACKEND;
          swal(
            'Docker image',
            'The selected docker images does not exist anymore. It was replaced by the default one.',
            'warning'
          );
        }
        input.val(replacement.id);
        newSettings.settings[settingDef.name] = replacement;
      } else {
        input.val(current.id);
      }
    }

    function createTextSection(name, text, isError = false) {
      const div = document.createElement('div');
      div.style['margin-bottom'] = '1rem';
      if (isError) {
        div.style.color = 'red';
      }

      const title = document.createElement('h2');
      title.innerText = name;
      div.appendChild(title);

      const content = document.createElement('div');
      content.style['overflow-x'] = 'auto';

      const code = document.createElement('code');
      code.innerText = text;
      code.style['white-space'] = 'pre';

      content.appendChild(code);
      div.appendChild(content);

      return div;
    }

    function needUnroll(obj) {
      const isArray = Array.isArray(obj);
      if (isArray || typeof obj === 'object') {
        const content = isArray ? obj : Object.values(obj);
        for (const value of content) {
          if (
            value &&
            value.content &&
            value.type &&
            typeof value.content === 'string' &&
            typeof value.type === 'string'
          ) {
            return true;
          }
        }
      }

      return false;
    }

    function createOutputSection(name, data, isDebug = false) {
      const div = document.createElement('div');
      div.style['margin-bottom'] = '1rem';

      const title = document.createElement('h2');
      if (isDebug) {
        const em = document.createElement('em');
        em.innerText = name;
        title.appendChild(em);
      } else {
        title.innerText = name;
      }
      div.appendChild(title);

      const content = document.createElement('div');
      const dataElement = jsonDataToBasicHtmlElement(data);
      if (dataElement instanceof HTMLIFrameElement) {
        content.style.height = '30vh';
      }

      content.appendChild(dataElement);

      div.appendChild(content);

      return div;
    }

    function unrollOutput(data, isDebug = false) {
      const isArray = Array.isArray(data);
      if (isArray) {
        return data.map((v, i) => createOutputSection(`${isDebug ? 'Debug' : 'Output'} [${i}]`, v, isDebug));
      } else {
        return Object.entries(data).map(([k, v]) =>
          createOutputSection(`${isDebug ? 'Debug' : 'Output'} [${k}]`, v, isDebug)
        );
      }
    }

    const resultColId = 'python-in-editor-results';
    function fillResultColumn(colResult, result) {
      if (result instanceof Error) {
        colResult.appendChild(createTextSection('Error', result.stack ?? String(result), true));
      } else {
        if (result.error) {
          colResult.appendChild(createTextSection('Error', result.error, true));
        }
        if (result.stderr) {
          colResult.appendChild(createTextSection('Stderr', result.stderr, true));
        }
        if (result.stdout) {
          colResult.appendChild(createTextSection('Stdout', result.stdout));
        }
        if (result.debug && result.debug.length) {
          unrollOutput(result.debug, true).forEach((_) => colResult.appendChild(_));
        }
        if (result.result) {
          if (needUnroll(result.result)) {
            unrollOutput(result.result).forEach((_) => colResult.appendChild(_));
          } else {
            colResult.appendChild(createOutputSection('Output', result.result));
          }
        }
      }

      return colResult;
    }

    function displayPythonEditor(value, newSettings, settingDef, callback) {
      const dsName = newSettings.settings.name;
      const exampleText =
        '#example: create 2 datanodes py_a a,d py_b then use them as follow:\n' +
        '# Example: add the values of 2 datanodes.\n# return dataNodes["py_a"] + dataNodes["py_b"];\n';
      // If value is empty, go ahead and suggest something
      if (!value) {
        value = exampleText;
      }

      const $colContainer = $(
        '<div class="cancel__box__top cancel__box__body" style="display:flex; flex-direction:row;"></div>'
      );
      const $colEditor = $('<div style="display:flex; flex-direction:column; flex: 2; flex-shrink: 0;"></div>');
      $colContainer.append([$colEditor]);

      const codeWindow = document.createElement('div');
      codeWindow.classList.add('code-window', 'cancel__box', 'cancel__box--xl');
      codeWindow.appendChild($colContainer[0]);

      const codeMirrorWrapper = $('<div class="code-mirror-wrapper" id="codeWrapper"></div>').get(0);
      const $codeWindowFooter = $('<div class="cancel__box__bottom"></div>');
      const $codeWindowBody = $('<div class="cancel__box__body"></div>');
      const $codeWindowHeader = $(
        `<div class="code-window-header cm-s-ambiance">
            This Python will be re-evaluated any time a referenced dataNode is updated, and the value you <code><span class="cm-keyword">return</span></code>
            (which will be serialized to JSON) will be made available for widgets and other dataNodes. You can assume this script is wrapped in a function with 
            a dictionary-like <code><span class="cm-def">dataNodes</span></code> parameter.<br>
            Press <code><span class="cm-keyword">ctrl-space</span></code> to activate autocompletion; <code><span class="cm-keyword">ctrl-enter</span></code> to test the script.
        </div>`
      );

      $colEditor.append([$codeWindowHeader, $codeWindowBody, $codeWindowFooter]);
      $codeWindowBody.append(codeMirrorWrapper);

      const wrapper = $('<div id="codeWindowContainer" class="cancel__container open"></div>')[0];
      wrapper.appendChild($('<div class="cancel__overlay"></div>')[0]);
      wrapper.appendChild(codeWindow);
      document.body.appendChild(wrapper);

      let colResult = null;
      let resultHeader = null;

      let lastResult = null;
      let lastResultIsError = null;

      let selectedWidgetId = null;
      let selectedWidgetInstance = null;

      const executor = createPythonExec(newSettings.settings.dockerImage.id);

      function completeAndDrillDown(cm, callbacks) {
        // Select current suggestion and restart autocompleting from there
        callbacks.pick();
        cm.execCommand('autocomplete');
      }

      function rollbackDatasourcePath(cm, callbacks) {
        const cursor = cm.getCursor();
        const lineNb = cursor.line;
        const line = cm.getLine(lineNb);
        const pos = cursor.ch;
        const rmLength = JSEditorCompletion.getPrecedingPathLength(line, pos);
        if (rmLength) {
          cm.replaceRange('', CodeMirror.Pos(lineNb, pos - rmLength), CodeMirror.Pos(lineNb, pos));
          callbacks.close();
          cm.execCommand('autocomplete');
        }
      }

      function createResultCol() {
        colResult = document.createElement('div');
        colResult.id = resultColId;
        colResult.style.display = 'flex';
        colResult.style.flex = 1;
        colResult.style.width = 0;
        colResult.style['flex-direction'] = 'column';
        colResult.style['overflow-y'] = 'auto';
        colResult.style['margin-left'] = '1rem';

        const [, widgetIds] = datanodesManager.isConnectedWithWidgt(dsName);

        if (widgetIds?.length) {
          function createOutputRadio(widgetId) {
            const divRadio = document.createElement('div');
            divRadio.style.display = 'inline-block';
            divRadio.style.padding = '0rem 1rem 0rem 0rem';

            const input = document.createElement('input');
            input.type = 'radio';
            input.checked = widgetId === null;
            input.id = `result-radio-select-${widgetId ?? ''}`;
            input.name = `result-radio-select`;

            const label = document.createElement('label');
            label.for = input.id;
            label.innerText = ' ' + (widgetId ?? 'None');

            divRadio.appendChild(input);
            divRadio.appendChild(label);

            return divRadio;
          }

          const divOutputSel = document.createElement('div');
          divOutputSel.style['margin-bottom'] = '1rem';
          divOutputSel.classList.add('code-window-header', 'cm-s-ambiance');
          divOutputSel.appendChild(document.createTextNode('Connected widget(s) : '));
          const divOutput = createOutputRadio(null);
          divOutput.addEventListener('change', () => {
            selectedWidgetId = null;
            selectedWidgetInstance = null;
            updateOutputs();
          });
          divOutputSel.appendChild(divOutput);
          divOutputSel.appendChild(document.createElement('br'));

          widgetIds.forEach((widgetId) => {
            const divRadio = createOutputRadio(widgetId);
            divOutputSel.appendChild(divRadio);
            divRadio.addEventListener('change', () => {
              selectedWidgetId = widgetId;
              selectedWidgetInstance = null;
              updateOutputs();
            });
          });

          colResult.appendChild(divOutputSel);
          resultHeader = divOutputSel;
        }

        $colContainer.append(colResult);
      }

      function clearOutputs() {
        const nodes = [...colResult.childNodes];
        nodes.filter((_) => _ !== resultHeader).forEach((_) => _.remove());
        selectedWidgetInstance = null;
      }

      function updateOutputs() {
        // First evaluation not ready yet
        if (!lastResult) return;

        if (lastResultIsError || !selectedWidgetId) {
          clearOutputs();
          fillResultColumn(colResult, lastResult);
        } else {
          createOrUpdateWidget();
        }
      }

      function createOrUpdateWidget() {
        if (selectedWidgetInstance) {
          updateWidget(false);
        } else {
          clearOutputs();
          const widgetId = selectedWidgetId;
          const widgetContainer = document.createElement('div');
          widgetContainer.className = 'code-widget-window-preview';
          widgetContainer.style.display = 'flex';
          widgetContainer.style['background-color'] = 'white';
          widgetContainer.style['justify-content'] = 'center';
          widgetContainer.style.border = '1px dashed rgba(0, 0, 0, 0.5)';

          const divWidget = document.createElement('div');
          divWidget.id = 'widget-preview-zone-' + widgetId;

          widgetContainer.appendChild(divWidget);
          colResult.appendChild(widgetContainer);

          const height = Math.min($('#' + widgetId).height(), $(colResult).height() - 40 - $(resultHeader).height());
          const width = Math.min($('#' + widgetId).width(), $(colResult).width() - 100);
          $(divWidget).width(width);
          $(divWidget).height(height);

          // stinks
          const modelJsonIdStr = widgetId.substring(0, widgetId.length - 1);
          selectedWidgetInstance = widgetsPluginsHandler.copyWidget(divWidget.id, modelJsonIdStr, null, widgetId, true);

          updateWidget(true);
        }
      }

      function updateWidget(init) {
        const connections = widgetConnector.widgetsConnection[selectedWidgetId];
        for (const i in connections.sliders) {
          const slider = connections.sliders[i];
          if (slider.dataNode === 'None') continue;
          const actuator = selectedWidgetInstance.getByName(slider.name);
          const isSelf = slider.dataNode === dsName;
          if (actuator && actuator.setValue && (isSelf || init)) {
            const newData = isSelf
              ? lastResult.result
              : datanodesManager.getDataNodeByName(slider.dataNode).latestData();

            let value = newData;
            let varName = slider.dataNode;

            for (let depth = 0; depth < slider.dataFields.length; depth++) {
              const field = slider.dataFields[depth];
              varName = field;
              value = value[varName];
            }

            if (newData !== undefined) {
              actuator.setValue(value);
              if (actuator.setCaption) actuator.setCaption(varName, false);
            }
          }
        }
      }

      async function evaluate(script) {
        if (!colResult) createResultCol();
        if (!selectedWidgetId) clearOutputs();

        // TODO update
        let dataNodes = {};
        for (const ds of datanodesManager.getAllDataNodes()) {
          // TODO Warn if not available ? filter not needed ?
          dataNodes[ds.name()] = ds.latestData();
        }

        try {
          const resultObject = await executor.execute(script, dataNodes, true);

          lastResult = resultObject;
          lastResultIsError = false;
        } catch (err) {
          console.error(err);
          lastResult = err;
          lastResultIsError = true;
        }

        updateOutputs();
      }

      const sortedDataNodes = datanodesManager.getAllDataNodes().sort((a, b) => a.name().localeCompare(b.name()));
      const codeMirrorEditor = CodeMirror(codeMirrorWrapper, {
        value: value,
        mode: { name: 'python', globalVars: true },
        theme: 'eclipse',
        version: 3,
        indentUnit: 2,
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        lineWrapping: false,
        showCursorWhenSelecting: true,
        extraKeys: {
          'Ctrl-Space': 'autocomplete',
          'Ctrl-Enter': (cm) => evaluate(cm.getValue()),
          'Alt-C': (cm) => cm.toggleComment(),
        },
        hintOptions: {
          hint: JSEditorCompletion.createCompletionFct(sortedDataNodes),
          completeSingle: false,
          extraKeys: {
            Tab: completeAndDrillDown,
            Right: completeAndDrillDown,
            Left: rollbackDatasourcePath,
          },
        },
      });

      const evalButton = document.createElement('button');
      evalButton.innerText = 'Evaluate';
      evalButton.title = 'Test script (ctrl+enter)';
      evalButton.classList.add('btn', 'btn-rounded-fill', 'cancel');
      evalButton.addEventListener('click', () => {
        evaluate(codeMirrorEditor.getValue());
      });

      const closeButton = document.createElement('button');
      closeButton.innerText = 'Close';
      closeButton.title = 'Close the editor';
      closeButton.classList.add('btn', 'btn-rounded-fill', 'primary');
      closeButton.addEventListener('click', () => {
        wrapper.remove();
        executor.dispose();
        if (callback) {
          const newValue = codeMirrorEditor.getValue();
          callback(newValue);
        }
      });

      $codeWindowFooter.append(closeButton);
      $codeWindowFooter.append(evalButton);
    }

    function displayMiniPythonEditor(input, value, callback) {
      var exampleText =
        '#example: create 2 datanodes py_a a,d py_b then use them as follow:\n' +
        '# Example: add the values of 2 datanodes.\n# return dataNodes["py_a"] + dataNodes["py_b"];\n';

      // If value is empty, go ahead and suggest something
      if (!value) {
        value = exampleText;
      }

      const codeMirrorWrapper = $('<div class="codemirror-wrapper__content"></div>').get(0);

      input.append(codeMirrorWrapper);

      function completeAndDrillDown(cm, callbacks) {
        // Select current suggestion and restart autocompleting from there
        callbacks.pick();
        cm.execCommand('autocomplete');
      }

      function rollbackDatasourcePath(cm, callbacks) {
        const cursor = cm.getCursor();
        const lineNb = cursor.line;
        const line = cm.getLine(lineNb);
        const pos = cursor.ch;
        const rmLength = JSEditorCompletion.getPrecedingPathLength(line, pos);
        if (rmLength) {
          cm.replaceRange('', CodeMirror.Pos(lineNb, pos - rmLength), CodeMirror.Pos(lineNb, pos));
          callbacks.close();
          cm.execCommand('autocomplete');
        }
      }

      const sortedDataNodes = datanodesManager.getAllDataNodes().sort((a, b) => a.name().localeCompare(b.name()));
      const codeMirrorEditor = CodeMirror(codeMirrorWrapper, {
        value: value,
        mode: { name: 'python', globalVars: true },
        theme: 'eclipse',
        version: 3,
        indentUnit: 2,
        lineNumbers: true,
        matchBrackets: true,
        autoCloseBrackets: true,
        lineWrapping: false,
        showCursorWhenSelecting: true,
        extraKeys: {
          'Ctrl-Space': 'autocomplete',
          'Alt-C': (cm) => cm.toggleComment(),
        },
        hintOptions: {
          hint: JSEditorCompletion.createCompletionFct(sortedDataNodes),
          completeSingle: false,
          extraKeys: {
            Tab: completeAndDrillDown,
            Right: completeAndDrillDown,
            Left: rollbackDatasourcePath,
          },
        },
      });

      var editor = codeMirrorEditor.doc.cm;
      editor.on('change', function () {
        var newValue = codeMirrorEditor.getValue();
        callback(newValue);
      });
      var newValue = codeMirrorEditor.getValue();
      setTimeout(function () {
        codeMirrorEditor.refresh();
      }, 1);

      callback(newValue);

      return codeMirrorEditor;
    }

    // ## A Datanode Plugin
    //
    // -------------------
    // ### Datanode Definition
    //
    // -------------------
    datanodesManager.loadDatanodePlugin({
      // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
      type_name: 'Python_plugin',
      // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
      display_name: 'Python',
      // **icon_type** : icon of the datanode type displayed in data list
      icon_type: 'python.svg',
      // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
      description: 'Python script plugin',
      // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
      external_scripts: [],
      // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
      settings: [
        {
          name: 'autoStart',
          display_name: 'AUTO START',
          description: 'Start Python automatically after dashboard play begins or after creation or modification.',
          type: 'boolean',
          default_value: true,
        },
        {
          name: 'explicitTrig',
          display_name: 'Explicit trigger',
          description:
            'Execute Python only if triggered explicitly : no execution when predecessor dataNodes are modified.',
          type: 'boolean',
          default_value: false,
        },
        {
          name: 'dockerImage',
          display_name: 'Python backend / image',
          type: 'custom1',
          default_value: DEFAULT_BACKEND,
          implementation: dockerImageSelect,
        },
        {
          name: 'content',
          display_name: 'Python script',
          type: 'custom2',
          implementation: function (valueCell, settingDef, currentSettingsValues, newSettings) {
            var input = $(
              '<textarea autocorrect="off" autocomplete="off" spellcheck="false" class="calculated-value-input" style="display:none; width:78%"></textarea>'
            );
            input.change(function () {
              newSettings.settings[settingDef.name] = $(this).val();
            });

            input.val('');
            if (settingDef.name in currentSettingsValues) {
              input.val(currentSettingsValues[settingDef.name]);
            }
            var datanodeToolbox = $('<div class="codemirror-wrapper__top"></div>');
            var wrapperDiv = $('<div class="calculated-setting-row codemirror-wrapper"></div>'); /*ABK*/
            wrapperDiv.append(datanodeToolbox);
            var codeMirrorMiniEditor = displayMiniPythonEditor(wrapperDiv, input.val(), function (result) {
              input.val(result);
              input.change();
            });
            wrapperDiv.append(input);

            if (settingDef.name in currentSettingsValues) {
              input.val(currentSettingsValues[settingDef.name]);
            }

            var jsEditorTool = $('<a>Full Screen view<i class="basic icn-full-screen""></i></a>').mousedown(function (
              e
            ) {
              e.preventDefault();
              displayPythonEditor(input.val(), newSettings, settingDef, function (result) {
                codeMirrorMiniEditor.setValue(result);
                input.val(result);
                input.change();
              });
            });
            //
            datanodeToolbox.append(jsEditorTool);
            $(valueCell).append(wrapperDiv);
          },
          description: 'Python script to evaluate.',
        },
      ],
      expose_as_files: [
        {
          key: 'content',
          nameSuffix: 'script.py',
        },
      ],

      // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
      // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
      // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
      // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
      newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
        if (
          !newInstanceCallback(new pythonFormulaPlugin(settings, updateCallback, statusCallback, notificationCallback))
        )
          return true;
      },
    });

    // ### Datanode Implementation
    //
    // -------------------
    // Here we implement the actual datanode plugin. We pass in the settings and updateCallback.
    var pythonFormulaPlugin = function (settings, updateCallback, statusCallback, notificationCallback) {
      // Always a good idea...
      const self = this;

      const isEmbedded = PythonPluginExecBase.isEmbedded();

      // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
      let currentSettings = settings;

      const clientId = PythonPluginRemoteExec.createId();
      let executor = null;
      let setupPromise = undefined;
      let setupOk = false;
      let error = false;

      // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
      self.onSettingsChanged = function (newSettings, status) {
        const newImage = newSettings.dockerImage?.id !== currentSettings.dockerImage?.id;
        if (newImage && executor) {
          executor.dispose();
          executor = null;
        }

        if (
          newImage ||
          currentSettings.content !== newSettings.content ||
          (newSettings.dockerImage?.id !== PythonPluginLocalExec.PSEUDO_IMAGE_ID && !newSettings.signature) ||
          !setupPromise
        ) {
          newSettings.signature = undefined;
          setupPromise = undefined;
        }

        // Here we update our current settings with the variable that is passed in.
        currentSettings = newSettings;
        if (!setupOk) {
          setupPromise = self.runScriptSettings();
        }
        return !error;
      };

      self.isSettingNameChanged = function (newName) {
        return currentSettings.name != newName;
      };

      // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
      self.updateNow = function (bCalledFromOrchestrator, bForceAutoStart, predsList) {
        // explicit trig!
        if (!_.isUndefined(bCalledFromOrchestrator)) {
          if (!_.isUndefined(currentSettings.explicitTrig)) {
            if (currentSettings.explicitTrig) {
              if (bCalledFromOrchestrator == true) return { notTobeExecuted: true };
            }
          }
        }

        //Autostart
        if (!bForceAutoStart && currentSettings.autoStart === false) {
          return { notTobeExecuted: true };
        }

        statusCallback('Pending');
        let args = {};

        for (const dsName of predsList) {
          args[dsName] = datanodesManager.getDataNodeByName(dsName).latestData();
        }

        if (!setupPromise) {
          setupPromise = self.runScriptSettings();
        }
        self.runScript(args, setupPromise);

        return true;
      };

      self.runScriptSettings = async function () {
        error = false;

        const script = currentSettings.content;
        if (_.isNull(script) || _.isUndefined(script) || script == '') {
          error = true;
          const msg = 'No python script was provided.';
          swal('Script error', msg, 'error');
          throw new Error(msg);
        }

        const imageId = currentSettings.dockerImage.id;
        if (
          imageId !== PythonPluginLocalExec.PSEUDO_IMAGE_ID &&
          imageId !== PythonPluginRemoteExec.DEFAULT_IMAGE_ID &&
          !isEmbedded
        ) {
          const images = await PythonPluginRemoteExec.getImages();
          const img = images.find(function (i) {
            return i.id === imageId;
          });
          if (!img) {
            error = true;
            const msg = 'The selected docker images does not exist anymore.';
            swal('Docker error', msg, 'error');
            throw new Error(msg);
          }
          if (!img.hash) {
            error = true;
            const msg = 'The selected docker images has not been built.';
            swal('Docker error', msg, 'error');
            throw new Error(msg);
          }
        }

        executor ??= createPythonExec(imageId, clientId);

        let signature = currentSettings.signature;
        if (isEmbedded) {
          if (!currentSettings.signature) {
            error = true;
            const msg = 'Script was not signed before exporting the dashboard.';
            swal('Script error', msg, 'error');
            throw new Error(msg);
          }
        } else if (!signature) {
          try {
            currentSettings.signature = await executor.signCode(script);
          } catch (err) {
            if (err.status && err.statusText) {
              self.errorAllTheThings(`Response status ${err.status} : ${err.statusText}`);
            }
            if (err.message) {
              self.errorAllTheThings(err.message);
            } else {
              self.errorAllTheThings(String(err), 'Could not sign script');
            }
            throw err;
          }
          signature = currentSettings.signature;
        }

        return {
          script,
          signature,
          executor,
        };
      };

      self.errorAllTheThings = function (notifText, statusText = null, notifType = 'error', statusType = 'Error') {
        notificationCallback(notifType, currentSettings.name, notifText);
        statusCallback(statusType, statusText || notifText);
        updateCallback(undefined, statusType);
        error = true;
      };

      self.runScript = async function (args, setupPromise) {
        function success(data) {
          notificationCallback('success', currentSettings.name, '');
          statusCallback('OK');
          updateCallback(data);
        }

        function error(statusText, notifText = undefined) {
          notifText ??= statusText;
          self.errorAllTheThings(notifText, statusText);
        }

        try {
          const { executor, script, signature } = await setupPromise;

          const resultObject = await executor.execute(script, args, false, signature);
          if (resultObject.error && resultObject.error.length) {
            error(resultObject.error);
          } else {
            success(resultObject.result);
          }
        } catch (err) {
          if (err === PythonPluginExecBase.ABORT_ERROR) {
            const notifText = 'Response status : aborted';
            self.errorAllTheThings(notifText, notifText, 'info', 'None');
          } else if (err === PythonPluginExecBase.DISCONNECTED_ERROR) {
            datanodesManager.getDataNodeByName(currentSettings.name).completeExecution('NOP');
            datanodesManager.getDataNodeByName(currentSettings.name).schedulerStatus('Stop');
            notificationCallback(
              'error',
              currentSettings.name,
              "Internet is disconnected. Request of '" + currentSettings.name + "' wil be aborted"
            );
          } else if (err === PythonPluginExecBase.SIGNATURE_ERROR) {
            // Will happen if the server's key changed.
            // Drop the signature if not recognized, clearing the way for requesting a new one.
            self.errorAllTheThings('Bad code signature');
            currentSettings.signature = undefined;
          } else {
            console.error(err);
            if (err instanceof Error) {
              error(err.message, err.notifText);
            } else if (err.error) {
              error(err.error);
            } else if (err.status && err.statusText) {
              error(`Response status ${err.status} : ${err.statusText}`);
            } else {
              error(String(err));
            }
          }
        }
      };

      // TODO kill interpreter

      // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
      self.onDispose = function () {
        executor?.dispose();
      };

      this.getXHR = function () {
        return executor?.getXHR();
      };

      self.canSetValue = function () {
        return false;
      };

      setupPromise = self.runScriptSettings();
    };
  })();
}
