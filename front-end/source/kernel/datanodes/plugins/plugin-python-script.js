// Best to encapsulate your plugin in a closure, although not required.
if (!_.isUndefined(urlPython)) {
  (function () {
    var error = false;

    function isEmbedded() {
      return angular
        .element(document.body)
        .injector()
        .invoke([
          '$rootScope',
          function ($rootScope) {
            return !$rootScope.UserProfile;
          },
        ]);
    }

    async function getImages() {
      const images = await angular
        .element(document.body)
        .injector()
        .invoke([
          'PythonImagesManager',
          '$rootScope',
          (PythonImagesManager, $rootScope) => {
            if (!$rootScope.UserProfile) {
              $rootScope.UserProfile = {};
            }
            if (!$rootScope.UserProfile.userId) {
              $rootScope.UserProfile.userId = prompt('Please fill your User ID');
            }
            return PythonImagesManager.getImages();
          },
        ]);
      //return images.map(i => ({ id: i.id, name: i.name, hash: i.hash })); // MBG 13/12/2021
      return images.map((i) => ({ id: i.Id, name: i.Name, hash: i.Hash }));
    }

    async function signCode(imageId, code) {
      return await angular
        .element(document.body)
        .injector()
        .invoke([
          '$http',
          '$rootScope',
          async ($http, $rootScope) => {
            const url = urlPython + 'images/sign';
            const result = await $http.post(url, JSON.stringify({ image: imageId, code }), {
              contentType: 'application/json; charset=utf-8',
              headers: {
                Authorization: LoginMngr.GetSavedJwt(),
                'X-Request-ID': createId(),
              },
            });
            return result.data;
          },
        ]);
    }

    async function dockerImageSelect(valueCell, settingDef, currentSettingsValues, newSettings) {
      const selectId = 'select-option' + settingDef.name;
      $('<select disabled="true" id="' + selectId + '"></select>').appendTo(
        $('<div class="styled-select"></div>').appendTo(valueCell)
      );

      // Set temporary options
      const def = { name: 'default', id: '' };
      const choicesTmp = [def];

      const input = $('#' + selectId);
      $('<option></option>').text(def.name).attr('value', def.id).appendTo(input);
      const current =
        settingDef.name in currentSettingsValues && currentSettingsValues[settingDef.name]
          ? currentSettingsValues[settingDef.name]
          : null;
      if (current && current.id !== '') {
        choicesTmp.push(current);
        $('<option></option>').text(current.name).attr('value', current.id).appendTo(input);
        input.val(current.id);
      }

      // Recover image list
      // "await" implies that at this point the user may interract with the UI
      const images = await getImages();

      // Set the actual options
      let unsortedChoices = [];
      _.each(images, function (image) {
        unsortedChoices.push({ name: image.name, id: image.id });
      });
      unsortedChoices.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });
      const choices = [def, ...unsortedChoices];

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
          replacement = def;
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

    function createId(useHex = true) {
      const array = new Uint32Array(8);
      window.crypto.getRandomValues(array);
      let str = '';
      for (let i = 0; i < array.length; i++) {
        str += (i < 2 || i > 5 ? '' : '-') + array[i].toString(useHex ? 16 : 36).slice(-4);
      }
      return str;
    }

    function displayPythonEditor(value, newSettings, settingDef, callback) {
      var dsName = newSettings.settings.name;
      var exampleText =
        '#example: create 2 datanodes py_a a,d py_b then use them as follow:\n' +
        '# Example: add the values of 2 datanodes.\n# return dataNodes["py_a"] + dataNodes["py_b"];\n';
      //  '# Munch would allow "return args.a + args.b"\n# Splating would allow "return a + b"\n' +
      //'# simple example:\nreturn args["key"]';

      // If value is empty, go ahead and suggest something
      if (!value) {
        value = exampleText;
      }

      var codeWindow = $('<div id="code-window-js" class="code-window cancel__box cancel__box--xl"></div>');
      var codeMirrorWrapper = $('<div class="code-mirror-wrapper" id="codeWrapper"></div>');
      var codeWindowFooter = $('<div class="cancel__box__bottom"></div>');
      var codeWindowBody = $('<div class="cancel__box__body"></div>');
      var codeWindowHeader = $(
        '<div class="cancel__box__top">' +
          '<div class="code-window-header cm-s-ambiance">' +
          '<span>This Python will be re-evaluated any time a dataNode referenced' +
          ' in the arguments is updated, and the value you <code><span class="cm-keyword">return</span></code> (which must be serializable to JSON)' +
          ' will be displayed in the widget. You can assume this script is wrapped in a function with an <code><span class="cm-def">dataNodes</span></code> parameter' +
          ' containing the defined JSON data as a Python dictionary. Alternatively, the script may define one or more functions and the one you designated will be called.' +
          // ' <br>If the dataNode is configured to "splat" the arguments, the function may have multiple arguments, either positional if the input is a JSON array, or named for a JSON object.' +
          ' <br>Press <code><span class="cm-keyword">ctrl-space</span></code> to activate autocompletion.' +
          '</div>'
      );

      var codeWindowContent = $('<div class="cancel__box__container"></div>');
      codeWindowBody.append([codeMirrorWrapper]);
      codeWindowContent.append([codeWindowHeader, codeWindowBody, codeWindowFooter]);
      codeWindow.append([codeWindowContent]);
      var wrapper = $('<div id="codeWindowContainer" class="cancel__container open"></div>');
      wrapper.append($('<div class="cancel__overlay"></div>'));
      wrapper.append(codeWindow);
      $('body').append(wrapper);

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

      var sortedDataNodes = datanodesManager.getAllDataNodes().sort((a, b) => a.name().localeCompare(b.name()));
      var codeMirrorEditor = CodeMirror(codeMirrorWrapper.get(0), {
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

      [bFoundConnection, prop] = datanodesManager.isConnectedWithWidgt(dsName);
      if (bFoundConnection) {
        var widgetSelect =
          '<div style="display: table-cell; padding: 10px">' + '<span>Connected widget(s): </span>' + '</div>';
        _.each(prop, (pr) => {
          widgetSelect =
            widgetSelect +
            '<div style="display: table-cell; padding: 10px">' +
            '<input type="radio" id="' +
            pr +
            '_radio" name="dataWidgetRadio" value="' +
            pr +
            '" onchange="datanodesManager.previewWidget(this.value)">' +
            '<label for="' +
            pr +
            '_radio">' +
            pr +
            '</label>' +
            '</div>';
        });

        var widgetButton = $(
          '<button id="dialog-widget" class="btn btn-rounded-fill primary" js-reset-toggle="">Show widget</button>'
        ).click(function () {
          if ($('#dialog-widget').text() == 'Show widget') {
            $('#code-window-js').width('80%');
            $('#dialog-widget').text('Hide widget');
            var widgetsPreviewDivs = '';
            _.each(prop, (instanceId) => {
              widgetsPreviewDivs = widgetsPreviewDivs + '<div id="widget-preview-zone-' + instanceId + '" ></div>';
            });
            var codeWidgetWindowHtml =
              '<div id="code-widget-window-js"  style="width: 49%;float: right;z-index:5000;overflow:auto;height:100%">' +
              '<div id="widgets-selection-header" class="code-window-header cm-s-ambiance" style="position:relative">' +
              '<div style="display: table-row">' +
              widgetSelect +
              '</div>' +
              '</div>' +
              '<div id="widgets-preview-top" class="code-widget-window-preview" style="display:flex; justify-content:center; background-color:white; border:1px dashed rgba(0, 0, 0, 0.5);"> ' +
              widgetsPreviewDivs +
              '</div>' +
              '</div>';
            var codeWidgetWindow = $(codeWidgetWindowHtml);
            codeMirrorWrapper.append(codeWidgetWindow);
            $('#' + prop[0] + '_radio').prop('checked', true);
            var buildPreviewZone = function (instanceId) {
              var childPrev = [];
              $('#widgets-preview-top > div').each((index, elem) => {
                childPrev.push(elem.id);
                $('#' + elem.id).hide();
              });
              $('#widget-preview-zone-' + instanceId).show();
              var height = Math.min(
                $('#' + instanceId).height(),
                $('#code-widget-window-js').height() - 40 - $('#widgets-selection-header').height()
              );
              var width = Math.min($('#' + instanceId).width(), $('#code-widget-window-js').width() - 100);
              $('#widget-preview-zone-' + instanceId).width(width);
              $('#widget-preview-zone-' + instanceId).height(height);
              var modelJsonIdStr = instanceId.substring(0, instanceId.length - 1);
              var wd = widgetsPluginsHandler.copyWidget(
                'widget-preview-zone-' + instanceId,
                modelJsonIdStr,
                null,
                instanceId,
                true
              );
              if (widgetConnector.widgetsConnection[instanceId] != null) {
                widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
                widgetConnector.widgetsConnection[instanceId].widgetObjConnect = wd;
              }
            };
            _.each(prop, (instanceId) => {
              buildPreviewZone(instanceId);
            });
            var instanceId = prop[0];
            datanodesManager.previewWidget(instanceId);
            $('.code-mirror-wrapper')[0].childNodes[0].style.float = 'left';
            $('.code-mirror-wrapper')[0].childNodes[0].style.width = '50%';
          } else {
            $('#dialog-widget').text('Show widget');
            _.each(prop, (instanceId) => {
              if (widgetConnector.widgetsConnection[instanceId] != null) {
                widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
                widgetConnector.widgetsConnection[instanceId].widgetObjConnect = null;
              }
            });
            $('#code-widget-window-js').remove();
            $('#code-window-js').width('80%');
            $('.code-mirror-wrapper')[0].childNodes[0].style.float = 'unset';
            $('.code-mirror-wrapper')[0].childNodes[0].style.width = 'unset';
          }
        });
        codeWindowFooter.append(widgetButton);

        var applyButton = $(
          '<button id="apply-widget" class="btn btn-rounded-fill primary" js-reset-toggle="">Apply</button>'
        ).click(function () {
          newSettings.settings[settingDef.name] = codeMirrorEditor.getValue();
          let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
          scopeDashDn.saveDataNodeSettings(true);
        });
        codeWindowFooter.append(applyButton);
      }

      var closeButton = $(
        '<button id="dialog-cancel" class="btn btn-rounded-fill primary" js-reset-toggle="">Close </button>'
      ).click(function () {
        if (callback) {
          var newValue = codeMirrorEditor.getValue();
          callback(newValue);
          codeWindow.remove();
        }
        $('#codeWindowContainer').remove();
      });

      codeWindowFooter.append(closeButton);
    }

    function displayMiniPythonEditor(input, value, callback) {
      var exampleText =
        '#example: create 2 datanodes py_a a,d py_b then use them as follow:\n' +
        '# Example: add the values of 2 datanodes.\n# return dataNodes["py_a"] + dataNodes["py_b"];\n';
      // '# Munch would allow "return args.a + args.b"\n# Splating would allow "return a + b"\n' +
      // '# simple example:\nreturn args["key"]';

      // If value is empty, go ahead and suggest something
      if (!value) {
        value = exampleText;
      }

      var codeMirrorWrapper = $('<div class="codemirror-wrapper__content"></div>');

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

      var sortedDataNodes = datanodesManager.getAllDataNodes().sort((a, b) => a.name().localeCompare(b.name()));
      var codeMirrorEditor = CodeMirror(codeMirrorWrapper.get(0), {
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

    if (urlPython) {
      datanodesManager.loadDatanodePlugin({
        // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
        type_name: 'Python_inline_plugin',
        // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
        display_name: 'Script (server-side)',
        // **icon_type** : icon of the datanode type displayed in data list
        icon_type: 'python.svg',
        // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
        description: 'Python script (in Docker server-side) plugin',
        // **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
        external_scripts: [],
        // **settings** : An array of settings that will be displayed for this plugin when the user adds it.
        settings: [
          {
            name: 'autoStart',
            display_name: 'AUTO START',
            description: 'DataNode is executed automatically at start (project load, its creation/modification).',
            type: 'boolean',
            default_value: true,
          },
          {
            name: 'explicitTrig',
            display_name: 'Explicit trigger',
            description:
              'DataNode is executed only if triggered explicitly (no execution when its predecessors are updated). It is executed automatically once when AutoStart is “YES”.',
            type: 'boolean',
            default_value: false,
          },
          {
            name: 'dockerImage',
            display_name: 'Docker Image',
            type: 'custom1',
            default_value: { name: 'default', id: '' },
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

              datanodeToolbox.append(jsEditorTool);
              $(valueCell).append(wrapperDiv);
            },
            description: 'Python script to evaluate.',
          },
          {
            name: 'function',
            display_name: 'Function name',
            type: 'text',
            description:
              'Optional function (from the script) to call.' +
              " Result must be serializable to JSON. If omitted, the script must contain a 'return' statement.",
          },
        ],
        // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
        // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
        // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
        // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
        newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
          if (
            !newInstanceCallback(
              new pythonFormulaPlugin(settings, updateCallback, statusCallback, notificationCallback)
            )
          )
            if (error) return false;
            else return true;
        },
      });
    }

    // ### datanode Implementation
    //
    // -------------------
    // Here we implement the actual datanode plugin. We pass in the settings and updateCallback.
    var pythonFormulaPlugin = function (settings, updateCallback, statusCallback, notificationCallback) {
      const clientId = createId(false);

      // Always a good idea...
      var self = this;
      var calculatedValue = {};

      // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
      var currentSettings = settings;

      // save past setting in case of cancelling modification in datanodes
      var pastSettings = settings;
      var pastStatus = 'None';
      var script;
      var image = undefined; // "error" when image was invalid
      var imagePromise = undefined;
      var jqXHR; //AEF

      // **onSettingsChanged(newSettings)** (required) : A public function we must implement that will be called when a user makes a change to the settings.
      self.onSettingsChanged = function (newSettings, status) {
        if (status === 'OK') {
          pastStatus = status;
          pastSettings = currentSettings;
        }
        // Here we update our current settings with the variable that is passed in.
        currentSettings = newSettings;
        self.runScriptSettings();
        if (!error) {
          pastSettings = currentSettings;
          return true;
        } else return false;
      };

      self.isSettingNameChanged = function (newName) {
        if (currentSettings.name != newName) return true;
        else return false;
      };

      // **updateNow()** (required) : A public function we must implement that will be called when the user wants to manually refresh the datanode
      self.updateNow = function (bCalledFromOrchestrator, bForceAutoStart, predsList) {
        // explicit trig!
        //if explicittrig is true, no execution when triggered by predecessor, except triggered by force
        if (currentSettings.explicitTrig && bCalledFromOrchestrator) {
          return { notTobeExecuted: true };
        }

        //Autostart
        //if autostart is false, no auto execution at creat/edit/load, except if triggered by predecessor or by force
        if (!currentSettings.autoStart && !(bForceAutoStart || bCalledFromOrchestrator)) {
          return { notTobeExecuted: true };
        }

        statusCallback('Pending');
        //const args = (_.isEmpty(currentSettings.args) && _.isUndefined(calculatedValue)) ? {} : calculatedValue;
        let args = {};

        for (let dsName of predsList) args[dsName] = datanodesManager.getDataNodeByName(dsName).latestData();

        if (_.isUndefined(args)) {
          var text = 'The value of arguments is undefined';
          notificationCallback('error', currentSettings.name, text);
          statusCallback('Error', 'Arguments error');
          updateCallback(undefined, 'Error');
          error = true;
          return false;
        }

        if (self.imagePromise) {
          // settings are being processed; wait for that to be over
          self.imagePromise.then(
            (im) => self.runScript(script, args, im),
            (err) => {
              console.log(err);
              self.errorAllTheThings('Error processing settings');
            }
          );
        } else if (self.image === 'error' || !currentSettings.signature) {
          // image was not ready, we need to check in case this has changed
          self.runScriptSettings().then(
            (im) => self.runScript(script, args, im),
            (err) => {
              console.log(err);
              self.errorAllTheThings('Error processing settings');
            }
          );
        } else {
          self.runScript(script, args, self.image);
        }

        return true;
      };

      self.runScriptSettings = function runScriptSettings() {
        self.imagePromise = self.doRunScriptSettings().then((i) => {
          self.image = i;
          self.imagePromise = null;
          return i;
        });
        return self.imagePromise;
      };

      self.doRunScriptSettings = async function doRunScriptSettings() {
        error = false;
        if (!_.isEmpty(currentSettings.args)) {
          //let firstLine = currentSettings.args.replaceAll("return", "args=");
          let firstLine = currentSettings.args; // MBG 25/10/2021
          firstLine = firstLine + '\n';
          script = firstLine + currentSettings.content;
          currentSettings.content = script;
          currentSettings.args = '';
        } else script = currentSettings.content;
        // if ((_.isEmpty(currentSettings.args))) {
        //     notificationCallback("warning", currentSettings.name, "Python arguments are empty. No args will be provided to the script");
        // }

        const imageId = currentSettings.dockerImage.id;
        if (imageId !== '' && !isEmbedded()) {
          const images = await getImages();
          const img = images.find(function (i) {
            return i.id === imageId;
          });
          if (!img) {
            error = true;
            swal('Docker error', 'The selected docker images does not exist anymore.', 'error');
            return 'error';
          }
          if (!img.hash) {
            error = true;
            swal('Docker error', 'The selected docker images has not been built.', 'error');
            return 'error';
          }
        }

        if (_.isNull(script) || _.isUndefined(script) || script == '') {
          error = true;
          swal('Script error', 'No python script was provided.', 'error');
        }

        if (isEmbedded()) {
          if (!currentSettings.signature) {
            error = true;
            swal('Script error', 'Script was not signed before exporting the dashboard.', 'error');
          }
        } else {
          script = script.replaceAll('datasources', 'dataNodes');
          script = script.replaceAll('headersFromDatasourceWS', 'headersFromDataNodeWS');
          //script = script.replaceAll("datasources", "args");
          //script = script.replaceAll("dataNodes", "args"); //AEF temp modif, need to change the ws python
          currentSettings.signature = await signCode(imageId, script);
        }

        return imageId;
      };

      self.errorAllTheThings = function (notifText, statusText = null, notifType = 'error', statusType = 'Error') {
        notificationCallback(notifType, currentSettings.name, notifText);
        statusCallback(statusType, statusText || notifText);
        updateCallback(undefined, statusType);
        self.error = true;
        self.pastStatus = 'Error';
      };

      self.runScript = function (script, args, image) {
        var interval = null; //AEF
        if (image === 'error') {
          self.errorAllTheThings('No docker image');
          return false;
        }
        if (!_.isEmpty(currentSettings.args)) {
          let firstLine = currentSettings.args.replaceAll('return', 'args=');
          firstLine = firstLine + '\n';
          script = firstLine + currentSettings.content;
        } else script = currentSettings.content;

        script = script.replaceAll('datasources', 'dataNodes');
        //script = script.replaceAll("datasources", "args");
        //script = script.replaceAll("dataNodes", "args"); //AEF temp modif, need to change the ws python
        const fct = currentSettings.function;
        const url = urlPython + 'eval';

        const body = {
          callerId: clientId,
          image,
          // splat: currentSettings.splat,
          splat: false,
          // munch: currentSettings.munch,
          munch: false,
          args: JSON.stringify(args),
          //dataNodes: JSON.stringify(args),//AEF replace temp modif, need to change the ws python
          function: fct,
          script: script,
          signature: currentSettings.signature,
        };

        //AEF
        if (jqXHR && jqXHR.readyState != 4) {
          jqXHR.abort();
        }

        jqXHR = $.ajax({
          url: url,
          dataType: 'json',
          type: 'POST',
          beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Request-ID', createId());
          },
          //headers: { "X-Request-ID": createId() }, // MBG 08/11/2021
          data: JSON.stringify(body),
          responseType: 'json',
          contentType: 'application/json',

          success: function (data, status, xhr) {
            //AEF: add security, sometimes after abort, response passes through success instead of error
            //AEF: test may be removed (abort fct is fixed)
            if (datanodesManager.getDataNodeByName(currentSettings.name).schedulerStatus() == 'Stop') {
              statusCallback('None', 'Request is aborted');
              updateCallback(undefined, 'None');
              notificationCallback('info', currentSettings.name, 'Response status 0 : abort');
              return false;
            }
            jqXHR = undefined; //AEF
            let text = 'Response status ' + xhr.status + ' : ' + xhr.statusText;
            let respType = xhr.getResponseHeader('Content-Type');
            if (respType.match('application/json')) {
              // TODO validate JS
              let result = undefined;
              try {
                // MBG 15/03/2022 for NaN
                result = JSON.parseMore(data.result);
              } catch (ex) {
                self.errorAllTheThings(text + '. Reponse type is not JSON. ' + ex.message);
                return false;
              }
              notificationCallback('success', currentSettings.name, text);
              statusCallback('OK');
              updateCallback(result);
              self.error = false;
              self.pastStatus = 'OK';
              self.pastSettings = currentSettings;
              return true;
            } else {
              self.errorAllTheThings(text + '. Reponse type is not JSON');
              return false;
            }
          },
          error: function (xhr, status, err) {
            jqXHR = undefined;

            if (xhr.status === 403) {
              // Will happen if the server's key changed.
              // Drop the signature if not recognized, clearing the way for requesting a new one.
              self.errorAllTheThings('Bad code signature');
              currentSettings.signature = undefined;
              return false;
            }

            //
            const statusText = 'Response status ' + xhr.status + ' :' + xhr.statusText;
            let notifText = statusText;
            const errorMsg = xhr.responseJSON;
            if (!_.isUndefined(errorMsg) && !_.isUndefined(errorMsg.errorMessage)) {
              notifText = notifText + '.  ' + errorMsg.errorMessage;
            }

            if (status === 'abort') {
              //it's an Abort request
              self.errorAllTheThings(notifText, statusText, 'info', 'None');
            } else {
              self.errorAllTheThings(notifText, statusText);
            }

            // TODO invalidate signature
            return false;
          },
          complete: function (xhr, status) {
            //AEF
            //To clear the interval on Complete
            clearInterval(interval);
          },
        });
        //AEF: network check for every 1 second
        interval = setInterval(function () {
          var isOnLine = navigator.onLine;
          if (isOnLine) {
            // online
          } else {
            if (!_.isUndefined(jqXHR)) {
              datanodesManager.getDataNodeByName(currentSettings.name).completeExecution('NOP');
              datanodesManager.getDataNodeByName(currentSettings.name).schedulerStatus('Stop');
              notificationCallback(
                'error',
                currentSettings.name,
                "Internet is disconnected. Request of '" + currentSettings.name + "' wil be aborted"
              );
              jqXHR.abort();
            }
          }
        }, 1000);
        return true;
      };

      // TODO kill interpreter

      // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
      self.onDispose = function () {
        const url = urlPython + 'end';
        jqXHR = $.ajax({
          url: url,
          type: 'POST',
          headers: { 'X-Request-ID': createId() },
          data: JSON.stringify({ callerId: clientId }),
          contentType: 'application/json',
          error: function (xhr, status, err) {
            //AEF
            var notifType = 'error';
            jqXHR = undefined;
            //
            //AEF
            text = 'Error stopping the interpreter. Status: ' + status + ', Error:' + err;
            notificationCallback(notifType, currentSettings.name, text);
            //
            return false;
          },
        });
      };

      //AEF
      this.getXHR = function () {
        return jqXHR;
      };

      this.isSetValueValid = function () {
        return false;
      };

      self.isSetFileValid = function () {
        return false;
      };

      self.onCalculatedValueChanged = function (propertyName, val) {
        calculatedValue = val;
      };

      self.runScriptSettings();
    };
  })();
}
