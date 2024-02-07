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

  function displayPythonEditor(value, newSettings, settingDef, callback) {
    var dsName = newSettings.settings.name;
    var exampleText =
      '#example: create 2 datanodes py_a a,d py_b then use them as follow:\n' +
      '# Example: add the values of 2 datanodes.\n# return dataNodes["py_a"] + dataNodes["py_b"];\n';
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
        '<div class="code-window-header cm-s-ambiance">This Python script will be re-evaluated according to Chalk\'it execution engine rules,' +
        ' if one of the referenced input <code><span class="cm-def">dataNodes</span></code> is updated. The value you <code><span class="cm-keyword">return</span></code>' +
        ' will update the Chalk\'it workspace. You can assume this script is wrapped in a function with a <code><span class="cm-def">dataNodes</span></code> parameter' +
        ' containing the defined input dataNodes.' +
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

  // ## A Datanode Plugin
  //
  // -------------------
  // ### Datanode Definition
  //
  // -------------------
  datanodesManager.loadDatanodePlugin({
    // **type_name** (required) : A unique name for this plugin. This name should be as unique as possible to avoid collisions with other plugins, and should follow naming conventions for javascript variable and function declarations.
    type_name: 'Python_pyodide_plugin',
    // **display_name** : The pretty name that will be used for display purposes for this plugin. If the name is not defined, type_name will be used instead.
    display_name: 'Script (Pyodide)',
    // **icon_type** : icon of the datanode type displayed in data list
    icon_type: 'python.svg',
    // **description** : A description of the plugin. This description will be displayed when the plugin is selected or within search results (in the future). The description may contain HTML if needed.
    description: 'Python script (in client-side) plugin',
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

          var jsEditorTool = $('<a>Full Screen view<i class="basic icn-full-screen""></i></a>').mousedown(function (e) {
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
    // **newInstance(settings, newInstanceCallback, updateCallback)** (required) : A function that will be called when a new instance of this plugin is requested.
    // * **settings** : A javascript object with the initial settings set by the user. The names of the properties in the object will correspond to the setting names defined above.
    // * **newInstanceCallback** : A callback function that you'll call when the new instance of the plugin is ready. This function expects a single argument, which is the new instance of your plugin object.
    // * **updateCallback** : A callback function that you'll call if and when your datanode has an update for datanodesManager to recalculate. This function expects a single parameter which is a javascript object with the new, updated data. You should hold on to this reference and call it when needed.
    newInstance: function (settings, newInstanceCallback, updateCallback, statusCallback, notificationCallback) {
      if (
        !newInstanceCallback(new pyodideFormulaPlugin(settings, updateCallback, statusCallback, notificationCallback))
      )
        if (error) return false;
        else return true;
    },
  });

  // ### Datanode Implementation
  //
  // -------------------
  // Here we implement the actual datanode plugin. We pass in the settings and updateCallback.
  var pyodideFormulaPlugin = function (settings, updateCallback, statusCallback, notificationCallback) {
    // Always a good idea...
    var self = this;

    // Good idea to create a variable to hold on to our settings, because they might change in the future. See below.
    var currentSettings = settings;

    // save past setting in case of cancelling modification in datanodeS
    var pastSettings = settings;
    var pastStatus = 'None';
    var script;
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
    self.updateNow = function (bForceAutoStart, predsList) {
      statusCallback('Pending');
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

      // Run in Pyodide !!!
      self.runScript(script, args);

      return true;
    };

    self.runScriptSettings = function () {
      error = false;
      if (!_.isEmpty(currentSettings.args)) {
        let firstLine = currentSettings.args;
        firstLine = firstLine + '\n';
        script = firstLine + currentSettings.content;
        currentSettings.content = script;
        currentSettings.args = '';
      } else script = currentSettings.content;

      if (_.isNull(script) || _.isUndefined(script) || script == '') {
        error = true;
        swal('Script error', 'No python script was provided.', 'error');
      }

      if (isEmbedded()) {
      } else {
        script = script.replaceAll('datasources', 'dataNodes');
      }
      return true;
    };

    self.errorAllTheThings = function (notifText, statusText = null, notifType = 'error', statusType = 'Error') {
      notificationCallback(notifType, currentSettings.name, notifText);
      statusCallback(statusType, statusText || notifText);
      updateCallback(undefined, statusType);
      self.error = true;
      self.pastStatus = 'Error';
    };

    function shift(script) {
      return (
        script
          .split(/\r?\n/)
          .map((l) => '  ' + l)
          .join('\n') + '\n'
      );
    }

    // from Python runner backend
    function writePython(stdin, script, dataNodes, dataNodeName) {
      script = 'global globalScope' + '\n' + script + '\n';
      stdin = stdin + 'def runScript(dataNodes):\n';
      stdin = stdin + shift(script);
      stdin = stdin + 'import json\n';
      stdin = stdin + 'import js\n';
      if (!_.isEmpty(dataNodes)) {
        stdin = stdin + 'dataNodes = {}\n';
        _.each(_.keys(dataNodes), (dnName) => {
          if (datanodesManager.getDataNodeByName(dnName).type() == 'Python_pyodide_plugin') {
            if (dnName != dataNodeName) stdin = stdin + 'dataNodes["' + dnName + '"] = globalScope["' + dnName + '"]\n';
          } else {
            stdin =
              stdin +
              'dataNodes["' +
              dnName +
              '"] = json.loads(js.JSON.stringify(js.datanodesManager.getDataNodeByName("' +
              dnName +
              '").latestData()))\n';
          }
        });
      } else {
        stdin = stdin + `dataNodes = {};\n`;
      }
      // TODO create a lib ?
      stdin =
        stdin +
        `
import os
import sys
import json

def is_jsonable(x):
  try:
    json.dumps(x)
    return True
  except (TypeError, OverflowError):
    return False

sys.stdout = open(os.devnull,'w')
result = runScript(dataNodes);
sys.stdout = sys.__stdout__
globalScope['` +
        dataNodeName +
        `']=result
if is_jsonable(result):
  resRet = json.dumps(result)
else:
  if (str(type(result)) == "<class 'pandas.core.frame.DataFrame'>"):
    resRet =  json.dumps(result.to_html(notebook=True, max_rows=4))
  else :
    resRet = json.dumps(str(type(result)));

resRet
`;
      return stdin;
    }

    self.runScript = async function (script, args) {
      if (!_.isEmpty(currentSettings.args)) {
        let firstLine = currentSettings.args.replaceAll('return', 'args=');
        firstLine = firstLine + '\n';
        script = firstLine + currentSettings.content;
      } else script = currentSettings.content;

      script = script.replaceAll('datasources', 'dataNodes');

      var success = function (output) {
        //AEF: add security, sometimes after abort, response passes through success instead of error
        //AEF: test may be removed (abort fct is fixed)

        data = {};
        if (!_.isUndefined(output)) {
          if (output.constructor.name == 'PyProxyClass')
            // I think it's deadcode, but worth te be kept
            data = output.toJs();
          else data = JSON.parseMore(output);
        }
        if (datanodesManager.getDataNodeByName(currentSettings.name).schedulerStatus() == 'Stop') {
          statusCallback('None', 'Request is aborted');
          updateCallback(undefined, 'None');
          notificationCallback('info', currentSettings.name, 'Response status 0 : abort');
          return false;
        }
        notificationCallback('success', currentSettings.name, '');
        statusCallback('OK');
        updateCallback(data);
        self.error = false;
        self.pastStatus = 'OK';
        self.pastSettings = currentSettings;
        return true;
      };

      var error = function (status) {
        const statusText = status;
        let notifText = statusText;
        notifText = statusText;

        if (status === 'abort') {
          //it's an Abort request
          self.errorAllTheThings(notifText, statusText, 'info', 'None');
        } else {
          self.errorAllTheThings(notifText, statusText);
        }
        return false;
      };

      var wrappedScript = '';
      wrappedScript = writePython(wrappedScript, script, args, currentSettings.name);

      // when creating the first dataNode in the project
      const { standardLibs, micropipLibs } = pyodideManager.getProjectLibs();
      const isStandardLibs = _.isEqual(standardLibs, ['matplotlib']);
      const isMicropipLibs = _.isEqual(micropipLibs, ['plotly']);
      const isDefaultLibs =
        (isStandardLibs && isMicropipLibs) ||
        (isStandardLibs && !micropipLibs.length) ||
        (isMicropipLibs && !standardLibs.length) ||
        (!micropipLibs.length && !standardLibs.length);

      if (isDefaultLibs) {
        const defaultLibs = pyodideManager.getDefaultLibs();
        await pyodideManager.loadPyodideLibs(defaultLibs);
      }

      try {
        wrappedScript = wrappedScript.replace('xDashApi', 'js.xDashApi');
        const result = await pyodideManager.runPythonScript(wrappedScript);
        success(result);
      } catch (err) {
        error(err);
      }

      return true;
    };

    // **onDispose()** (required) : A public function we must implement that will be called when this instance of this plugin is no longer needed. Do anything you need to cleanup after yourself here.
    self.onDispose = function () {};

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
