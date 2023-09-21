﻿// ┌───────────────────────────────────────────────────────────────────────┐ \\
// │ widget-datanode-update                                                │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                           │ \\
// | Licensed under the Apache License, Version 2.0                        │ \\
// ├───────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Arsène RATSIMBAZAFY| \\
// |                      Ghiles HDIEUR                                    │ \\
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
  const sliders = widgetConnector.widgetsConnection[idInstance].sliders;
  const dnNames = [];
  if (!_.isUndefined(sliders)) {
    for (const trigger in sliders) {
      const dataNodeName = sliders[trigger].dataNode;
      if (dataNodeName !== 'None') {
        dnNames.push(datanodesManager.getDataNodeByName(dataNodeName).name());
      }
    }

    if (dnNames.length > 0) {
      datanodesManager.getDataNodeByName(dnNames[0]).schedulerStart(dnNames, dnNames[0], 'triggerButton');
    }
  }
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |               updateDataNodeFromWidgetwithspinButton               | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function updateDataNodeFromWidgetwithspinButton(idInstance, idWidget) {
  if (_.isUndefined(widgetConnector.widgetsConnection[idInstance])) return;
  const sliders = widgetConnector.widgetsConnection[idInstance].sliders;
  const dnNames = [];
  if (!_.isUndefined(sliders)) {
    for (let trigger in sliders) {
      const dataNodeName = sliders[trigger].dataNode;
      if (dataNodeName != 'None') {
        dnNames.push(datanodesManager.getDataNodeByName(dataNodeName).name());
      }
    }

    if (dnNames.length > 0) {
      const widgetElement = document.getElementById('button' + idWidget);
      const iElement = document.createElement('i');
      iElement.setAttribute('id', 'icon' + idWidget);
      datanodesManager.getDataNodeByName(dnNames[0]).schedulerStart(dnNames, dnNames[0], 'triggerButton');
      const intervalId = setInterval(function () {
        const pendings = [];
        dnNames.forEach((element) => {
          if (datanodesManager.getDataNodeByName(element).status() == 'Pending') {
            // check if datanode is in Pending state
            $('#button' + idWidget).attr('class', 'btn btn-table-cell btn-lg disabled'); // disable until request finished
            pendings.push(true);
            // Just do it if one datanode has "Pending" status. And do it only once
            if (!$(iElement).hasClass('fa fa-spinner fa-spin')) {
              iElement.setAttribute('class', 'fa fa-spinner fa-spin');
            }
            if (!widgetElement.contains(iElement)) {
              widgetElement.append(iElement);
            }
          }
        });
        if (pendings.length == 0) {
          $('#button' + idWidget).attr('class', 'btn btn-table-cell btn-lg ' + idInstance + 'widgetCustomColor ');
          document.getElementById('icon' + idWidget).remove();
          iElement.remove();
          clearInterval(intervalId);
        }
      }, 100);
    }
  }
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                   updateDataNodeFileFromWidget                     | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function updateDataNodeFileFromWidget(idInstance, fileContent) {
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
