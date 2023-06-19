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
function displaySpinnerOnInputFileButton(idWidget) {
  const self = this;
  const aElement = document.getElementById('button' + idWidget);
  const inputElement = document.getElementById('button' + idWidget + '_select_file');
  const iElement = document.createElement('i');
  let timeoutId;

  this.disableButton = function () {
    // disable until request finished
    aElement.classList.add('disabled');
    iElement.setAttribute('id', 'icon' + idWidget);
    iElement.setAttribute('class', 'fa fa-spinner fa-spin');
    aElement.append(iElement);
  };
  this.enableButton = function () {
    aElement.classList.remove('disabled');
    if (!!iElement) {
      iElement.remove();
    }
  };

  this.disableButton();
  inputElement.onchange = function () {
    clearTimeout(timeoutId);
    document.body.focus();
    self.enableButton();
  };
  document.body.onfocus = function () {
    timeoutId = setTimeout(() => {
      self.enableButton();
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
  if (!_.isUndefined(sliders)) {
    for (var trigger in sliders) {
      var dataNodeName = sliders[trigger].dataNode;
      if (dataNodeName != 'None') {
        dsNames.push(datanodesManager.getDataNodeByName(dataNodeName).name());
      }
    }

    if (dsNames.length > 0) {
      datanodesManager.getDataNodeByName(dsNames[0]).schedulerStart(dsNames, dsNames[0], 'triggerButton');
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
  if (!_.isUndefined(sliders)) {
    for (var trigger in sliders) {
      var dataNodeName = sliders[trigger].dataNode;
      if (dataNodeName != 'None') {
        dsNames.push(datanodesManager.getDataNodeByName(dataNodeName).name());
      }
    }

    if (dsNames.length > 0) {
      datanodesManager.getDataNodeByName(dsNames[0]).schedulerStart(dsNames, dsNames[0], 'triggerButton');

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

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                   updateDataSourceFileFromWidget                   | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function updateDataSourceFileFromWidget(idInstance, fileContent) {
  if (_.isUndefined(widgetConnector.widgetsConnection[idInstance])) return;
  var sliders = widgetConnector.widgetsConnection[idInstance].sliders;
  if (!_.isUndefined(sliders)) {
    for (var trigger in sliders) {
      let dataNodeName = sliders[trigger].dataNode;
      if (dataNodeName != 'None') {
        if (datanodesManager.getDataNodeByName(dataNodeName).isSetFileValid()) {
          datanodesManager.getDataNodeByName(dataNodeName).setFile(fileContent);
        }
      }
    }
  }
}
