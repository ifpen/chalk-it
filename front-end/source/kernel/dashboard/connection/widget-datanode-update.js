﻿// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ widget-datanode-update                                                │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Arsène RATSIMBAZAFY│ \\
// └───────────────────────────────────────────────────────────────────────┘ \\

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                     displaySpinnerOnInputFileButton                | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function displaySpinnerOnInputFileButton(idInstance, idWidget) {
  var widgetElement = document.getElementById('button' + idWidget);
  var inputElement = document.getElementById('button' + idWidget + '_select_file');
  var iElement = document.createElement('i');
  let timeoutId;

  var disableButton = function () {
    // disable until request finished
    widgetElement.setAttribute('class', 'btn btn-block btn-lg disabled');
    iElement.setAttribute('id', 'icon' + idWidget);
    iElement.setAttribute('class', 'fa fa-spinner fa-spin');
    widgetElement.append(iElement);
  };
  var enableButton = function () {
    widgetElement.setAttribute('class', 'btn btn-block btn-lg ' + idInstance + 'widgetCustomColor ');
    if (!!iElement) {
      iElement.remove();
    }
  };

  disableButton();
  inputElement.onchange = function () {
    clearTimeout(timeoutId);
    document.body.focus();
    enableButton();
  };
  document.body.onfocus = function () {
    timeoutId = setTimeout(() => {
      enableButton();
      document.body.onfocus = null;
    }, 200);
  };
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                     updateDataSourceFromWidget                     | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function updateDataSourceFromWidget(idInstance, e) {
  if (_.isUndefined(widgetConnector.widgetsConnection[idInstance])) return;
  var sliders = widgetConnector.widgetsConnection[idInstance].sliders;
  var dsNames = [];
  var dataNodeIndex;
  var validDsIndex;
  if (!_.isUndefined(sliders)) {
    for (var trigger in sliders) {
      dataNodeIndex = sliders[trigger].dataNodeIndex;
      if (dataNodeIndex != -1) {
        dataNodeIndex = validDsIndex;
        dsNames.push(datanodesManager.getAllDataNodes()[dataNodeIndex].name());
      }
    }

    if (dsNames.length > 0) {
      if (dataNodeIndex == -1) {
        dataNodeIndex = validDsIndex;
      }
      datanodesManager.getAllDataNodes()[dataNodeIndex].schedulerStart(dsNames, dsNames[0], 'triggerButton');
    }
  }
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                     updateDataSourceFromWidgetwithspinButton       | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function updateDataSourceFromWidgetwithspinButton(idInstance, idWidget) {
  var widgetElement = document.getElementById('button' + idWidget);
  var iElement = document.createElement('i');
  iElement.setAttribute('id', 'icon' + idWidget);
  widgetElement.append(iElement);
  if (_.isUndefined(widgetConnector.widgetsConnection[idInstance])) return;
  var sliders = widgetConnector.widgetsConnection[idInstance].sliders;
  var dsNames = [];
  var dataNodeIndex;
  var validDsIndex;
  if (!_.isUndefined(sliders)) {
    for (var trigger in sliders) {
      dataNodeIndex = sliders[trigger].dataNodeIndex;
      if (dataNodeIndex != -1) {
        validDsIndex = dataNodeIndex;
        dsNames.push(datanodesManager.getAllDataNodes()[dataNodeIndex].name());
      }
    }
    if (dsNames.length > 0) {
      if (dataNodeIndex == -1) {
        dataNodeIndex = validDsIndex;
      }
      datanodesManager.getAllDataNodes()[dataNodeIndex].schedulerStart(dsNames, dsNames[0], 'triggerButton');
      var intervalId = setInterval(function () {
        var pendings = [];
        dsNames.forEach((element) => {
          if (datanodesManager.getDataNodeByName(element).status() == 'Pending') {
            // check if datanode is in Pending state
            $('#button' + idWidget).attr('class', 'btn btn-block btn-lg disabled'); // disable until request finished
            pendings.push(true);
            // Just do it if one datanode has "Pending" status. And do it only once
            if (!$(iElement).hasClass('fa fa-spinner fa-spin')) iElement.setAttribute('class', 'fa fa-spinner fa-spin');
          }
        });
        if (pendings.length == 0) {
          $('#button' + idWidget).attr('class', 'btn btn-block btn-lg ' + idInstance + 'widgetCustomColor ');
          document.getElementById('icon' + idWidget).remove();
          iElement.remove();
          clearInterval(intervalId);
        }
      }, 100);
    }
  }
}
