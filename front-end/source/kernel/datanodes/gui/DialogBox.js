// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DatanodeModel : fork from freeboard                                │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
import _ from 'lodash';

import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { htmlExport } from 'kernel/general/export/html-export';

export function DialogBox(contentElement, title, okTitle, cancelTitle, okCallback, cancelCallback) {
  var param;
  var OkClbkParam;
  // Initialize our modal overlay
  var overlay = $('<div class="modalDialog modalDialogOpen" style="z-index:1000"></div>');
  var _codeMirror = false;
  if (!_.isUndefined($('.code-mirror-wrapper')[0])) {
    $(overlay)[0].style.zIndex = 6000;
    _codeMirror = true;
  }
  if (!_.isUndefined($('.showSweetAlert')[0])) {
    $(overlay)[0].style.zIndex = 99999;
  }
  var modalDialog = $('<div class="modalDialog__wrapper"></div>');

  function closeModal() {
    $(document).unbind('keydown', onKeydown);
    overlay.fadeOut(200, function () {
      $(this).remove();
    });
  }

  function onKeydown(e) {
    if (e.keyCode === 27) {
      // ESC

      if (!cancelTitle) {
        okFunction();
      }
    }
  }

  $(document).on('keydown', onKeydown);

  // Create our header
  modalDialog.append('<div class="modalDialog__header"><h2>' + title + '</h2></div>');
  var content = $('<div class="modalDialog__content"></div>').appendTo(modalDialog);
  content.append(contentElement);

  // Create our footer
  var footer = $('<div class="modalDialog__footer"></div>').appendTo(modalDialog);

  function cancelFunction() {
    if (_.isFunction(cancelCallback)) {
      cancelCallback();
    } else if (!_.isUndefined(cancelCallback)) {
      // this case is not a cancelCallback but a parameter needed for okCallback
      param = cancelCallback;
    }
    closeModal();
  }

  if (cancelTitle) {
    $(
      '<input id="dialog-cancel" type="button" class="btn btn-rounded-fill cancel"  value="' +
        cancelTitle +
        '"></input>'
    )
      .appendTo(footer)
      .click(cancelFunction);

    //AEF used by DialogBoxForHtmlExport
    if (!_.isUndefined(cancelCallback) && !_.isFunction(cancelCallback)) {
      OkClbkParam = cancelCallback;
    }
  }

  function okFunction() {
    var hold = false;

    if (_.isFunction(okCallback)) {
      if (param) hold = okCallback(param);
      else if (OkClbkParam)
        //AEF used by DialogBoxForHtmlExport
        hold = okCallback(OkClbkParam);
      else hold = okCallback();
    }

    if (!hold) {
      closeModal();
    }
  }

  if (okTitle) {
    $('<input id="dialog-ok" type="button" class="btn btn-rounded-fill primary" value="' + okTitle + '"></input>')
      .appendTo(footer)
      .click(okFunction);
  }

  overlay.append(modalDialog);
  $('body').append(overlay);
  overlay.fadeIn(200);
}

export function DialogBoxForToolboxEdit(contentElement, title, okTitle, cancelTitle, okCallback) {
  DialogBox(contentElement, title, okTitle, cancelTitle, okCallback);
}

export function DialogBoxForData(contentElement, title, okTitle, cancelTitle, okCallback) {
  DialogBox(contentElement, title, okTitle, cancelTitle, okCallback);

  if (!_.isUndefined($('#check-all'))) {
    $('#check-all').click(function (event) {
      if (this.checked) {
        // Iterate each checkbox
        $('.check-option1').each(function () {
          this.checked = true;
        });
        $('#uncheck-all')[0].checked = false;
      }
    });

    $('#uncheck-all').click(function (event) {
      if (this.checked) {
        // Iterate each checkbox
        $('.check-option1').each(function () {
          this.checked = false;
        });
        $('#check-all')[0].checked = false;
      }
    });

    $('.check-option1').click(function () {
      $('#check-all')[0].checked = false;
      $('#uncheck-all')[0].checked = false;
    });
  }
}

export function DialogBoxForDuplicateData(contentElement, title, okTitle, cancelTitle, okCallback) {
  DialogBoxForData(contentElement, title, okTitle, cancelTitle, okCallback);

  if (!_.isUndefined($('.data-check-input')[0])) {
    var i = 0;
    $('.data-check-input').each(function () {
      i++;
      $('.data-check-input').on('change paste input', function (event) {
        var id = this.id.substring(this.id.length - 1, this.id.length);
        var bFound = false;
        for (var j = 0; j < datanodesManager.getAllDataNodes().length; j++) {
          if (datanodesManager.getAllDataNodes()[j].name() == this.value) {
            bFound = true;
            break;
          }
        }
        if (bFound) {
          $('#data-overwrite-' + id)[0].checked = true; //overwrite radio button active
          $('#data-checkbox-' + id)[0].checked = false; //uncheck load checkbox if overwrite
        } else {
          $('#data-rename-' + id)[0].checked = true; //rename radio button active
          $('#data-checkbox-' + id)[0].checked = true; //check load checkbox if rename
        }
      });
    });
  }
}

function copyURLtoClipboard() {
  var copyText = document.getElementById('swal-input');
  copyText.select();
  document.execCommand('copy');

  $('#swal-p')[0].style.visibility = 'visible';
  setTimeout(function () {
    $('#swal-p')[0].style.visibility = 'hidden';
  }, 1500);
}

function DialogBoxForHtmlExport(contentElement, title, okTitle, cancelTitle, okCallback, param) {
  DialogBox(contentElement, title, okTitle, cancelTitle, okCallback, param);
  if (_.isUndefined(param)) {
    $('#select-export-settings')[0].value = htmlExport.exportOptions;
    $('#check-scale-export')[0].checked = htmlExport.checkExportOptions;
  } else {
    // filled from .xprjson
    $('#select-export-settings')[0].value = param[0].exportOptions;
    $('#check-scale-export')[0].checked = param[0].checkExportOptions;
    $('#check-scale-export').attr('disabled', true); // disable because even if it is changed, user has to save this infi in xprjson
  }
}
