import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { checkES6, checkES7, checkES8, checkES9, checkES10 } from 'kernel/datanodes/plugins/thirdparty/utils';

// FIXME
// import { assertEditorOnly } from 'kernel/utils/asserts';
// assertEditorOnly();

// TODO
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/comment/continuecomment';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/mode/javascript/javascript';
import CodeMirror from 'codemirror';
import { JSHINT } from 'jshint';
import { JSEditorCompletion } from './JSEditorCompletion';
import './JSEditorFormatting';

export function JSEditor() {
  var assetRoot = '';

  function setAssetRoot(_assetRoot) {
    assetRoot = _assetRoot;
  }

  function displayJSEditor(value, newSettings, settingDef, settingsSavedCallback, callback) {
    var dsName = newSettings.settings.name;
    var exampleText = '';
    if (newSettings.type === 'JSON_formula_plugin')
      exampleText =
        '// Example: Convert temp from C to F and truncate to 2 decimal places.\n// return (dataNodes["MyDataNode"].sensor.tempInF * 1.8 + 32).toFixed(2);';
    else if (newSettings.type === 'Python_inline_plugin')
      exampleText =
        "//example: create 2 datanodes py_a a,d py_b then use them as follow:\n//return {'a':dataNodes[\"py_a\"],'b':dataNodes[\"py_b\"]}; \n//simple example:\nreturn {'key':'value'}; \n ";

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
        '<span>This javaScript code will be re-evaluated any time this dataNode is updated, ' +
        'and the value you <code><span class="cm-keyword">return</span></code> will update the workspace. ' +
        'You can assume this code is wrapped in a function of the form ' +
        '<code><span class="cm-keyword">function</span>(<span class="cm-def">dataNodes</span>)</code> ' +
        'where dataNodes is a collection of javaScript objects (keyed by their name) defining the workspace. ' +
        '<br>Press <code><span class="cm-keyword">ctrl-space</span></code> to activate dataNodes autocompletion, ' +
        '<code><span class="cm-keyword">Tab</span></code> to go deeper into JSON and ' +
        '<code><span class="cm-keyword">Escape</span></code> to leave it.' +
        '<br>Press <code><span class="cm-keyword">ctrl-K</span></code> to autoformat (beautify) selection. </span></div>' +
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

    //ABK: syntax highlighter
    var widgets = [];
    // check EMACS support of the browser
    var es6 = checkES6();
    var es7 = checkES7();
    var es8 = checkES8();
    var es9 = checkES9();
    var es10 = checkES10();
    var es = 5; // by default
    if (es6) es = 6;
    if (es7) es = 7;
    if (es8) es = 8;
    if (es9) es = 9;
    if (es10) es = 10;

    function updateHints() {
      editor.operation(function () {
        for (var i = 0; i < widgets.length; ++i) {
          editor.removeLineWidget(widgets[i]);
        }
        widgets.length = 0;
        // Avoid warnings during JSHint check
        // Just put => /*jshint esversion: 6 */ at the top of your js file
        // exp:true => if ExpressionStatement should be allowed as Programs
        // asi:true => don't complain about Missing semicolon warning
        //var value = "/*jshint expr:true, asi:true, esversion:" + es + "*/\n" + editor.getValue();
        var value = '/*jshint esversion:' + es + '*/\n' + editor.getValue(); // MBG 17/01/2020 restore old feeling
        JSHINT(value);

        for (var i = 0; i < JSHINT.errors.length; ++i) {
          var err = JSHINT.errors[i];
          if (!err) continue;
          var msg = document.createElement('div');
          var icon = msg.appendChild(document.createElement('span'));
          icon.innerHTML = '!!';
          icon.className = 'lint-error-icon';
          msg.appendChild(document.createTextNode(err.reason));
          msg.className = 'lint-error';
          widgets.push(editor.addLineWidget(err.line - 1, msg, { coverGutter: false, noHScroll: true }));
        }
        if (JSHINT.errors.length)
          // AR 11/06/2020 avoid loosing caret
          editor.focus();
      });
      var info = editor.getScrollInfo();
      var after = editor.charCoords({ line: editor.getCursor().line + 1, ch: 0 }, 'local').top;
      if (info.top + info.clientHeight < after) editor.scrollTo(null, after - info.clientHeight + 3);
    }
    //

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
      mode: { name: 'javascript', globalVars: true }, //ABK
      theme: 'eclipse',
      indentUnit: 4,
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      lineWrapping: true, //ABK
      showCursorWhenSelecting: true, //ABK
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Alt-C': (cm) => cm.toggleComment(),
        'Ctrl-K': (cm) => cm.autoFormatRange(cm.getCursor(true), cm.getCursor(false)), // MBG 20/10/2021
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

    //ABK: syntax highlighter
    var editor = codeMirrorEditor.doc.cm;
    var waiting;

    editor.on('change', function () {
      clearTimeout(waiting);
      waiting = setTimeout(updateHints, 500);
    });
    setTimeout(updateHints, 100);
    //
    // MBG 24/03/2021

    const [bFoundConnection, prop] = datanodesManager.isConnectedWithWidgt(dsName);
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
            widgetsPreviewDivs =
              widgetsPreviewDivs +
              '<div id="widget-preview-zone-' +
              instanceId +
              '" style="background-color:white; border:1px dashed rgba(0, 0, 0, 0.5)" ></div>';
          });
          var codeWidgetWindowHtml =
            '<div id="code-widget-window-js"  style="width: 49%;float: right;z-index:5000;overflow:auto;height:100%">' +
            '<div id="widgets-selection-header" class="code-window-header cm-s-ambiance" style="position:relative">' +
            '<div style="display: table-row">' +
            widgetSelect +
            '</div>' +
            '</div>' +
            '<div id="widgets-preview-top" class="code-widget-window-preview"> ' +
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
            var width = Math.min($('#' + instanceId).width(), $('#code-widget-window-js').width() - 40);
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
        // MBG 25/03/2021
        if ($('#dialog-widget').text() == 'Hide widget') {
          instanceId = prop[0];
          if (widgetConnector.widgetsConnection[instanceId] != null) {
            widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
            widgetConnector.widgetsConnection[instanceId].widgetObjConnect = null;
          }
        }
        //
      }
      $('#codeWindowContainer').remove();
    });

    codeWindowFooter.append(closeButton);
  }

  function displayMiniJSEditor(input, value, newSettings, callback) {
    var dsName = newSettings.settings.name;
    var exampleText = '';
    if (newSettings.type === 'JSON_formula_plugin')
      exampleText =
        '// Example: Convert temp from C to F and truncate to 2 decimal places.\n// return (dataNodes["MyDataNode"].sensor.tempInF * 1.8 + 32).toFixed(2);';
    else if (newSettings.type === 'Python_inline_plugin')
      // exampleText = "//example: create 2 datanodes py_a a,d py_b then use them as follow:\n//return {'a':dataNodes[\"py_a\"],'b':dataNodes[\"py_b\"]}; \n//simple example:\nreturn {'key':'value'}; \n ";
      exampleText = '';
    // If value is empty, go ahead and suggest something
    if (!value) {
      value = exampleText;
    }
    var codeMirrorWrapper = $('<div class="codemirror-wrapper__content"></div>');
    input.append(codeMirrorWrapper);

    //ABK: syntax highlighter
    var widgets = [];
    // check EMACS support of the browser
    var es6 = checkES6();
    var es7 = checkES7();
    var es8 = checkES8();
    var es9 = checkES9();
    var es10 = checkES10();
    var es = 5; // by default
    if (es6) es = 6;
    if (es7) es = 7;
    if (es8) es = 8;
    if (es9) es = 9;
    if (es10) es = 10;

    function updateHints() {
      editor.operation(function () {
        for (var i = 0; i < widgets.length; ++i) {
          editor.removeLineWidget(widgets[i]);
        }
        widgets.length = 0;
        // Avoid warnings during JSHint check
        // Just put => /*jshint esversion: 6 */ at the top of your js file
        // exp:true => if ExpressionStatement should be allowed as Programs
        // asi:true => don't complain about Missing semicolon warning
        //var value = "/*jshint expr:true, asi:true, esversion:" + es + "*/\n" + editor.getValue();
        var value = '/*jshint esversion:' + es + '*/\n' + editor.getValue(); // MBG 17/01/2020 restore old feeling
        JSHINT(value);

        for (var i = 0; i < JSHINT.errors.length; ++i) {
          var err = JSHINT.errors[i];
          if (!err) continue;
          var msg = document.createElement('div');
          var icon = msg.appendChild(document.createElement('span'));
          icon.innerHTML = '!!';
          icon.className = 'lint-error-icon';
          msg.appendChild(document.createTextNode(err.reason));
          msg.className = 'lint-error';
          widgets.push(editor.addLineWidget(err.line - 1, msg, { coverGutter: false, noHScroll: true }));
        }
        if (JSHINT.errors.length)
          // AR 11/06/2020 avoid loosing caret
          editor.focus();
      });
      var info = editor.getScrollInfo();
      var after = editor.charCoords({ line: editor.getCursor().line + 1, ch: 0 }, 'local').top;
      if (info.top + info.clientHeight < after) editor.scrollTo(null, after - info.clientHeight + 3);
    }
    //

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
      mode: { name: 'javascript', globalVars: true }, //ABK
      theme: 'eclipse',
      indentUnit: 4,
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      lineWrapping: true, //ABK
      showCursorWhenSelecting: true, //ABK
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Alt-C': (cm) => cm.toggleComment(),
        'Ctrl-K': (cm) => cm.autoFormatRange(cm.getCursor(true), cm.getCursor(false)), // MBG 20/10/2021
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

    //ABK: syntax highlighter
    var editor = codeMirrorEditor.doc.cm;
    var waiting;

    editor.on('change', function () {
      clearTimeout(waiting);
      waiting = setTimeout(updateHints, 500);
      var newValue = codeMirrorEditor.getValue();
      // if (newValue === exampleText) {
      //     newValue = "";
      // }
      callback(newValue);
    });
    waiting = setTimeout(updateHints, 500);
    var newValue = codeMirrorEditor.getValue();
    // if (newValue === exampleText) {
    //     newValue = "";
    // }
    setTimeout(function () {
      codeMirrorEditor.refresh();
    }, 1);
    callback(newValue);
    return codeMirrorEditor;
  }

  // Public API
  return {
    displayJSEditor: function (value, newSettings, settingDef, settingsSavedCallback, callback) {
      displayJSEditor(value, newSettings, settingDef, settingsSavedCallback, callback);
    },
    displayMiniJSEditor: function (input, value, newSettings, callback) {
      return displayMiniJSEditor(input, value, newSettings, callback);
    },
    setAssetRoot: function (assetRoot) {
      setAssetRoot(assetRoot);
    },
  };
}
