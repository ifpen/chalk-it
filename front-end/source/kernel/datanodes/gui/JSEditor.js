import _ from 'lodash';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { checkES6, checkES7, checkES8, checkES9, checkES10 } from 'kernel/datanodes/plugins/thirdparty/utils';

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
  // Helper: Determine ECMAScript version based on available features.
  const getESVersion = () => {
    let es = 5;
    if (checkES6()) es = 6;
    if (checkES7()) es = 7;
    if (checkES8()) es = 8;
    if (checkES9()) es = 9;
    if (checkES10()) es = 10;
    return es;
  };

  // Helper: Create the function to update lint hints using JSHint.
  const createUpdateHints = (editor, widgets, es) => {
    return () => {
      editor.operation(() => {
        widgets.forEach((widget) => editor.removeLineWidget(widget));
        widgets.length = 0;
        const codeValue = `/*jshint expr:true, asi:true, sub:true, esversion:${es}*/\n${editor.getValue()}`;
        JSHINT(codeValue);
        JSHINT.errors.forEach((err) => {
          if (!err) return;
          const msg = document.createElement('div');
          const icon = document.createElement('span');
          icon.innerHTML = '!!';
          icon.className = 'lint-error-icon';
          msg.appendChild(icon);
          msg.appendChild(document.createTextNode(err.reason));
          msg.className = 'lint-error';
          widgets.push(editor.addLineWidget(err.line - 1, msg, { coverGutter: false, noHScroll: true }));
        });
        if (JSHINT.errors.length) {
          editor.focus();
        }
      });
      const info = editor.getScrollInfo();
      const after = editor.charCoords({ line: editor.getCursor().line + 1, ch: 0 }, 'local').top;
      if (info.top + info.clientHeight < after) {
        editor.scrollTo(null, after - info.clientHeight + 3);
      }
    };
  };

  // Helper: Autocompletion actions.
  const completeAndDrillDown = (cm, callbacks) => {
    callbacks.pick();
    cm.execCommand('autocomplete');
  };

  const rollbackDatasourcePath = (cm, callbacks) => {
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
  };

  // Helper: Set up a CodeMirror editor with shared configuration.
  const createCodeMirrorEditor = (container, initialValue, sortedDataNodes, extraChangeHandler) => {
    const es = getESVersion();
    const widgets = [];
    const editorInstance = CodeMirror(container, {
      value: initialValue,
      mode: { name: 'javascript', globalVars: true },
      theme: 'eclipse',
      indentUnit: 4,
      lineNumbers: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      lineWrapping: true,
      showCursorWhenSelecting: true,
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Alt-C': (cm) => cm.toggleComment(),
        'Ctrl-K': (cm) => cm.autoFormatRange(cm.getCursor(true), cm.getCursor(false)),
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
    const editor = editorInstance.doc.cm;
    const updateHints = createUpdateHints(editor, widgets, es);
    let waiting;
    editor.on('change', () => {
      clearTimeout(waiting);
      waiting = setTimeout(() => {
        updateHints();
        if (extraChangeHandler) {
          extraChangeHandler(editorInstance.getValue());
        }
      }, 500);
    });
    setTimeout(updateHints, 100);
    return editorInstance;
  };

  // Full JavaScript editor display.
  function displayJSEditor(value, newSettings, settingDef, settingsSavedCallback, callback) {
    const dsName = newSettings.settings.name;
    let exampleText = '';
    if (newSettings.type === 'JSON_formula_plugin') {
      exampleText = `// Example: Convert temp from C to F and truncate to 2 decimal places.
// return (dataNodes["MyDataNode"].sensor.tempInF * 1.8 + 32).toFixed(2);
`;
    } else if (newSettings.type === 'Python_inline_plugin') {
      exampleText = `#example: create 2 datanodes py_a a,d py_b then use them as follow:
#return {'a':dataNodes["py_a"],'b':dataNodes["py_b"]}; 
#simple example:
return {'key':'value'}; 
`;
    }
    if (!value) {
      value = exampleText;
    }

    // Build DOM elements using template literals.
    const codeWindow = $(`
      <div id="code-window-js" class="code-window cancel__box cancel__box--xl"></div>
    `);
    const codeMirrorWrapper = $(`
      <div class="code-mirror-wrapper" id="codeWrapper"></div>
    `);
    const codeWindowFooter = $('<div class="cancel__box__bottom"></div>');
    const codeWindowBody = $('<div class="cancel__box__body"></div>');
    const codeWindowHeader = $(`
      <div class="cancel__box__top">
        <div class="code-window-header cm-s-ambiance">
          <span>
            This javaScript code will be re-evaluated any time this dataNode is updated, and the value you 
            <code><span class="cm-keyword">return</span></code> will update the workspace. You can assume this code 
            is wrapped in a function of the form <code><span class="cm-keyword">function</span>(<span class="cm-def">dataNodes</span>)</code> 
            where dataNodes is a collection of javaScript objects (keyed by their name) defining the workspace.
            <br>
            Press <code><span class="cm-keyword">ctrl-space</span></code> to activate dataNodes autocompletion, 
            <code><span class="cm-keyword">Tab</span></code> to go deeper into JSON and 
            <code><span class="cm-keyword">Escape</span></code> to leave it.
            <br>
            Press <code><span class="cm-keyword">ctrl-K</span></code> to autoformat (beautify) selection.
          </span>
          <br>
          To debug this script effectively, insert the keyword <code><span class="cm-keyword">debugger</span></code> 
          at the points where you want to set breakpoints. Then, open the <code><span class="cm-def">DevTools</span></code> 
          during script execution to pause and inspect the code at those breakpoints.
        </div>
      </div>
    `);
    const codeWindowContent = $('<div class="cancel__box__container"></div>');
    codeWindowBody.append(codeMirrorWrapper);
    codeWindowContent.append([codeWindowHeader, codeWindowBody, codeWindowFooter]);
    codeWindow.append(codeWindowContent);
    const wrapper = $(`
      <div id="codeWindowContainer" class="cancel__container open">
        <div class="cancel__overlay"></div>
      </div>
    `);
    wrapper.append(codeWindow);
    $('body').append(wrapper);

    const sortedDataNodes = datanodesManager.getAllDataNodes().sort((a, b) => a.name().localeCompare(b.name()));
    const codeMirrorEditor = createCodeMirrorEditor(codeMirrorWrapper.get(0), value, sortedDataNodes);

    // Widget preview connection logic.
    const [widgetConnected, widgetProps] = datanodesManager.isConnectedWithWidgt(dsName);
    if (widgetConnected) {
      let widgetSelect = `
        <div style="display: table-cell; padding: 10px">
          <span>Connected widget(s): </span>
        </div>`;
      widgetProps.forEach((pr) => {
        widgetSelect += `
          <div style="display: table-cell; padding: 10px">
            <input type="radio" id="${pr}_radio" name="dataWidgetRadio" value="${pr}" onchange="datanodesManager.previewWidget(this.value)">
            <label for="${pr}_radio">${pr}</label>
          </div>`;
      });

      const widgetButton = $(`
        <button id="dialog-widget" class="btn btn-rounded-fill primary" js-reset-toggle="">Show widget</button>
      `).click(() => {
        const $dialogWidget = $('#dialog-widget');
        if ($dialogWidget.text() === 'Show widget') {
          $('#code-window-js').width('80%');
          $dialogWidget.text('Hide widget');
          let widgetsPreviewDivs = '';
          widgetProps.forEach((instanceId) => {
            widgetsPreviewDivs += `<div id="widget-preview-zone-${instanceId}" style="background-color:white; border:1px dashed rgba(0, 0, 0, 0.5)"></div>`;
          });
          const codeWidgetWindowHtml = `
            <div id="code-widget-window-js" style="width: 49%; float: right; z-index:5000; overflow:auto; height:100%">
              <div id="widgets-selection-header" class="code-window-header cm-s-ambiance" style="position:relative">
                <div style="display: table-row">${widgetSelect}</div>
              </div>
              <div id="widgets-preview-top" class="code-widget-window-preview">${widgetsPreviewDivs}</div>
            </div>`;
          const codeWidgetWindow = $(codeWidgetWindowHtml);
          codeMirrorWrapper.append(codeWidgetWindow);
          $(`#${widgetProps[0]}_radio`).prop('checked', true);
          const buildPreviewZone = (instanceId) => {
            $('#widgets-preview-top > div').hide();
            $(`#widget-preview-zone-${instanceId}`).show();
            const height = Math.min(
              $(`#${instanceId}`).height(),
              $('#code-widget-window-js').height() - 40 - $('#widgets-selection-header').height()
            );
            const width = Math.min($(`#${instanceId}`).width(), $('#code-widget-window-js').width() - 40);
            $(`#widget-preview-zone-${instanceId}`).width(width).height(height);
            const modelJsonIdStr = instanceId.slice(0, -1);
            const wd = widgetsPluginsHandler.copyWidget(
              `widget-preview-zone-${instanceId}`,
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
          widgetProps.forEach((instanceId) => buildPreviewZone(instanceId));
          datanodesManager.previewWidget(widgetProps[0]);
          const firstChild = $('.code-mirror-wrapper')[0].childNodes[0];
          firstChild.style.float = 'left';
          firstChild.style.width = '50%';
        } else {
          $dialogWidget.text('Show widget');
          widgetProps.forEach((instanceId) => {
            if (widgetConnector.widgetsConnection[instanceId] != null) {
              widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
              widgetConnector.widgetsConnection[instanceId].widgetObjConnect = null;
            }
          });
          $('#code-widget-window-js').remove();
          $('#code-window-js').width('80%');
          const firstChild = $('.code-mirror-wrapper')[0].childNodes[0];
          firstChild.style.float = 'unset';
          firstChild.style.width = 'unset';
        }
      });
      codeWindowFooter.append(widgetButton);

      const applyButton = $(`
        <button id="apply-widget" class="btn btn-rounded-fill primary" js-reset-toggle="">Apply</button>
      `).click(() => {
        newSettings.settings[settingDef.name] = codeMirrorEditor.getValue();
        const scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
        scopeDashDn.saveDataNodeSettings(true);
      });
      codeWindowFooter.append(applyButton);
    }

    const closeButton = $(`
      <button id="dialog-cancel" class="btn btn-rounded-fill primary" js-reset-toggle="">Close</button>
    `).click(() => {
      if (callback) {
        const newValue = codeMirrorEditor.getValue();
        callback(newValue);
        if ($('#dialog-widget').text() === 'Hide widget') {
          const instanceId = widgetProps[0];
          if (widgetConnector.widgetsConnection[instanceId] != null) {
            widgetConnector.widgetsConnection[instanceId].widgetObjEdit = null;
            widgetConnector.widgetsConnection[instanceId].widgetObjConnect = null;
          }
        }
      }
      $('#codeWindowContainer').remove();
    });
    codeWindowFooter.append(closeButton);
  }

  // Mini JavaScript editor display.
  function displayMiniJSEditor(input, value, newSettings, callback) {
    let exampleText = '';
    if (newSettings.type === 'JSON_formula_plugin') {
      exampleText = `// Example: Convert temp from C to F and truncate to 2 decimal places.
// return (dataNodes["MyDataNode"].sensor.tempInF * 1.8 + 32).toFixed(2);
`;
    } else if (newSettings.type === 'Python_inline_plugin') {
      exampleText = '';
    }
    if (!value) {
      value = exampleText;
    }
    const codeMirrorWrapper = $('<div class="codemirror-wrapper__content"></div>');
    input.append(codeMirrorWrapper);
    const sortedDataNodes = datanodesManager.getAllDataNodes().sort((a, b) => a.name().localeCompare(b.name()));
    const codeMirrorEditor = createCodeMirrorEditor(codeMirrorWrapper.get(0), value, sortedDataNodes, (newValue) =>
      callback(newValue)
    );
    setTimeout(() => {
      codeMirrorEditor.refresh();
    }, 1);
    callback(codeMirrorEditor.getValue());
    return codeMirrorEditor;
  }

  // Public API
  return {
    displayJSEditor: (value, newSettings, settingDef, settingsSavedCallback, callback) =>
      displayJSEditor(value, newSettings, settingDef, settingsSavedCallback, callback),
    displayMiniJSEditor: (input, value, newSettings, callback) =>
      displayMiniJSEditor(input, value, newSettings, callback),
  };
}
