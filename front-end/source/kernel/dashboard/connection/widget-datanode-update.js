// ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ widget-datanode-update                                                                                      │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                                                 │ \\
// | Licensed under the Apache License, Version 2.0                                                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Arsène RATSIMBAZAFY, Ghiles HDIEUR                       | \\
// └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ \\

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                         displayLoadSpinner                         | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function displayLoadSpinner(idWidget) {
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
// |                        updateWidgetDataNode                        | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function updateWidgetDataNode(idInstance, idWidget) {
  if (_.isUndefined(widgetConnector.widgetsConnection[idInstance])) return;
  const sliders = widgetConnector.widgetsConnection[idInstance].sliders;
  const dnNames = [];
  if (!_.isUndefined(sliders)) {
    for (const trigger in sliders) {
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
            if (!widgetElement.contains(iElement)) {
              if (!iElement.classList.contains('fa', 'fa-spinner', 'fa-spin')) {
                iElement.classList.add('fa', 'fa-spinner', 'fa-spin');
              }
              widgetElement.append(iElement);
            }
          }
        });
        if (pendings.length == 0) {
          $(iElement).remove();
          $('#button' + idWidget).attr('class', 'btn btn-table-cell btn-lg ' + idInstance + 'widgetCustomColor ');
          clearInterval(intervalId);
        }
      }, 100);
    }
  }
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                          uploadFileToTaipy                         | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function uploadFileToTaipy(event, idInstance, idWidget) {
  const sliders = _.get(widgetConnector, `widgetsConnection[${idInstance}].sliders`);
  const varFilePath = sliders.file_path.dataNode;
  const endAction = () => triggerTaipyFunction(sliders);
  const displaySpinner = (status) => setFileUploadSpinner(idWidget, status);
  taipyManager.uploadFile(event, varFilePath, endAction, displaySpinner);
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                          triggerTaipyFunction                      | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function triggerTaipyFunction(sliders) {
  if (_.isEmpty(sliders)) return;
  const dnNames = Object.entries(sliders)
    .filter(([key, _]) => key !== 'file_path') // Ignore file_path, keep only triggers
    .map(([_, slider]) => slider.dataNode)
    .filter((dnName) => dnName !== 'None');
  if (_.isEmpty(dnNames)) return;
  dnNames.forEach((funName) => {
    taipyManager.functionTrigger(funName);
  });
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                         setFileUploadSpinner                       | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function setFileUploadSpinner(idWidget, status) {
  const buttonElement = document.getElementById('button' + idWidget);
  const existingSpinner = document.getElementById('icon' + idWidget);

  if (status == 'remove') {
    buttonElement.classList.remove('disabled');
    if (existingSpinner) existingSpinner.remove();
  } else if (status == 'add') {
    // disable until request finished
    buttonElement.classList.add('disabled');
    if (!existingSpinner) {
      const spinnerElement = document.createElement('i');
      spinnerElement.setAttribute('id', 'icon' + idWidget);
      spinnerElement.setAttribute('class', 'fa fa-spinner fa-spin');
      buttonElement.appendChild(spinnerElement);
    }
  }
}
