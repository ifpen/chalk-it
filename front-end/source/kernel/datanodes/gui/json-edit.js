// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ JSONEdit                                                           │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Abir EL FEKI                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import JSONEditor from 'jsoneditor';
import { saveAs } from 'file-saver';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

export const JSONEdit = function () {
  let jsonEd;
  let currentMode = 'code';

  function setAssetRoot(_assetRoot) {
    assetRoot = _assetRoot;
  }

  function loadJSON() {
    jsonEd = datanodesManager.getJsonEditor();
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      const input = document.createElement('input');
      input.type = 'file';
      input.setAttribute('accept', '.json');

      $(input).on('change', function (event) {
        const files = event.target.files;
        if (files && files.length > 0) {
          const file = files[0];
          const reader = new FileReader();
          reader.addEventListener('load', function (fileReaderEvent) {
            try {
              jsonEd.setText(fileReaderEvent.target.result);
              const newValue = jsonEd.get();
              const strValue = JSON.stringify(newValue);
              $('#var-body').val(strValue);
              $('#var-body').change();
            } catch (exc) {
              swal('JSON Parse error', exc.message, 'error');
            }
          });
          reader.readAsText(file);
        }
      });
      $(input).trigger('click');
    } else {
      swal('Unable to load a file in this browser.', '', 'error');
    }
  }

  function saveJSON() {
    jsonEd = datanodesManager.getJsonEditor();
    // Save Dialog
    swal(
      {
        title: 'Export JSON',
        text: 'Save as ...',
        type: 'input',
        showConfirmButton: false,
        showConfirmButton1: true,
        showCancelButton: true,
        confirmButtonText: 'Save',
        closeOnConfirm: false,
        closeOnConfirm1: false,
        inputPlaceholder: 'please write JSON file name here ...',
      },
      function (inputValue) {
        if (inputValue === false) {
          return false; //cancel button
        }
        if (inputValue === '') {
          //empty input then ok button
          swal.showInputError('JSON file name is required!');
          return false;
        }
        //here when input is not empty then ok button
        if (inputValue != null) {
          let fname = inputValue;
          // Check json extension in file name
          if (fname.indexOf('.') == -1) {
            fname = fname + '.json';
          } else if (fname.split('.').pop().toLowerCase() == 'json') {
            // Nothing to do
          } else {
            fname = fname.split('.')[0] + '.json';
          }
          const blob = new Blob([jsonEd.getText()], { type: 'application/json;charset=utf-8' });
          saveAs(blob, fname);
          swal.close();
        }
      }
    );
  }

  function buildEditor(value, callback) {
    function updateEditor() {
      let newValue = {};
      try {
        newValue = jsonEd.get();
        const strValue = JSON.stringify(newValue);
        callback(strValue);
      } catch (exc) {
        swal('Error', exc.message, 'error');
        return;
      }
    }

    const container = $('#jsonedit');
    $('#jsonedit')[0].innerHTML = '';
    const options = {
      mode: 'code',
      modes: ['code', 'tree'], // allowed modes
      onError: function (err) {
        swal('Error', err.toString(), 'error');
      },
      onModeChange: function (newMode, oldMode) {
        if (newMode == 'tree') {
          $('#var-body').prop('disabled', true);
          $('#jsonedit').off('focusout');
          currentMode = 'tree';
        } else if (newMode == 'code') {
          $('#var-body').prop('disabled', false);
          $('#jsonedit').on('focusout', updateEditor);
          currentMode = 'code';
        }
      },
      language: 'en',
    };
    jsonEd = new JSONEditor(container[0], options);
    datanodesManager.setJsonEditor(jsonEd);
    try {
      if (value) {
        jsonEd.set(JSON.parse(value));
      }
    } catch (exc) {
      swal('JSON Parse error', exc.message, 'error');
    }
    $('#jsonedit').on('focusout', updateEditor);
  }

  function updateEditor(jsonEd, value) {
    datanodesManager.setJsonEditor(jsonEd);
    try {
      if (value) {
        jsonEd.set(JSON.parse(value));
      }
    } catch (exc) {
      swal('JSON Parse error', exc.message, 'error');
    }
  }

  function displayJSONEdit(value, callback) {
    $(
      '<button class = "btn btn-rounded" onclick="var json = datanodesManager.getJsonEd();json.loadJSON()"> <i class = "basic icn-upload"></i>Import Json</button>'
    ).appendTo($('#btn-json'));
    $(
      '<button class = "btn btn-rounded" onclick="var json = datanodesManager.getJsonEd();json.saveJSON()"> <i class = "basic icn-download"></i>Export Json</button>'
    ).appendTo($('#btn-json'));
    $('<div id="jsonedit"style="height:100%"></div>').appendTo($('#tree-preview'));
    buildEditor(value, callback);
  }

  function getJsonEd() {
    return jsonEd;
  }

  function updateVal() {
    if (currentMode == 'tree') {
      const newValue = jsonEd.get();
      const strValue = JSON.stringify(newValue);
      $('#var-body').val(strValue);
      $('#var-body').change();
    }
  }
  // Public API
  return {
    displayJSONEdit: displayJSONEdit,
    loadJSON: loadJSON,
    saveJSON: saveJSON,
    getJsonEd: getJsonEd,
    updateEditor: updateEditor,
    updateVal: updateVal,
  };
};
