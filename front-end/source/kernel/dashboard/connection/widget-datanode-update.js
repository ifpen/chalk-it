// ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ widget-datanode-update                                                                                      │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                                                 │ \\
// | Licensed under the Apache License, Version 2.0                                                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Arsène RATSIMBAZAFY, Ghiles HDIEUR                       | \\
// └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ \\
import _ from 'lodash';
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';
import { taipyManager } from 'connectors/taipy/taipy-manager';

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                         displayLoadSpinner                         | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
export function displayLoadSpinner(idWidget) {
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
    if (iElement) {
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
// |                             addSpinner                             | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function _addSpinner(idWidget) {
  const widgetButton = document.getElementById('button' + idWidget);
  const iElement = document.getElementById('icon' + idWidget) || document.createElement('i');
  iElement.setAttribute('id', 'icon' + idWidget);

  widgetButton.classList.add('btn', 'btn-table-cell', 'btn-lg', 'disabled'); // disable until request finished
  if (!iElement.classList.contains('fa', 'fa-spinner', 'fa-spin')) {
    iElement.classList.add('fa', 'fa-spinner', 'fa-spin');
  }
  if (!widgetButton.contains(iElement)) {
    widgetButton.append(iElement);
  }
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                            removeSpinner                           | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function _removeSpinner(idInstance, idWidget) {
  const iElement = document.getElementById('icon' + idWidget);
  const widgetButton = document.getElementById('button' + idWidget);

  if (iElement) {
    iElement.remove();
  }
  widgetButton.className = `btn btn-table-cell btn-lg ${idInstance}widgetCustomColor`;
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                        updateWidgetDataNode                        | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
export function updateWidgetDataNode(idInstance, idWidget) {
  const widgetConnection = widgetConnector.widgetsConnection[idInstance];
  if (!widgetConnection) return;

  const sliders = widgetConnection.sliders;
  const dnNames = [];

  if (sliders) {
    for (const trigger in sliders) {
      const dataNodeName = sliders[trigger].dataNode;
      if (dataNodeName != 'None') {
        const dataNode = datanodesManager.getDataNodeByName(dataNodeName);
        dnNames.push(dataNode.name());
      }
    }

    if (dnNames.length) {
      datanodesManager.getDataNodeByName(dnNames[0]).schedulerStart(dnNames, dnNames[0], 'triggerButton');

      const intervalId = setInterval(function () {
        const pendings = dnNames.some((name) => datanodesManager.getDataNodeByName(name).status() === 'Pending');

        if (pendings) {
          _addSpinner(idWidget);
        } else {
          _removeSpinner(idInstance, idWidget);
          clearInterval(intervalId);
        }
      }, 100);
    }
  }
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                          uploadFileToTaipy                         | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
export function uploadFileToTaipy(event, idInstance, idWidget) {
  const sliders = _.get(widgetConnector, `widgetsConnection[${idInstance}].sliders`);
  const varFilePath = sliders.file_path.dataNode;
  const endAction = () => triggerTaipyFunction(idInstance);
  const displaySpinner = (status) => setFileUploadSpinner(idWidget, status);
  taipyManager.uploadFile(event, varFilePath, endAction, displaySpinner);
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                          triggerTaipyFunction                      | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
export function triggerTaipyFunction(idInstance, idWidget) {
  const sliders = _.get(widgetConnector, `widgetsConnection[${idInstance}].sliders`);
  const dnNames = Object.entries(sliders)
    .filter(([key, _]) => key !== 'file_path') // Ignore file_path, keep only triggers
    .map(([_, slider]) => slider.dataNode)
    .filter((dnName) => dnName !== 'None');
  if (_.isEmpty(dnNames)) return;

  taipyManager.widgetSpinner = {
    display: true,
    add: () => {
      _addSpinner(idWidget);
    },
    remove: () => {
      _removeSpinner(idInstance, idWidget);
    },
  };
  dnNames.forEach((funName) => {
    taipyManager.functionTrigger(funName);
  });
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                         setFileUploadSpinner                       | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
export function setFileUploadSpinner(idWidget, status) {
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
