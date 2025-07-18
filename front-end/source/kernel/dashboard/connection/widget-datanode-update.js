// ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ widget-datanode-update                                                                                      │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                                                 │ \\
// | Licensed under the Apache License, Version 2.0                                                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Arsène RATSIMBAZAFY, Ghiles HDIEUR                       | \\
// └─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ \\
import { widgetConnector } from 'kernel/dashboard/connection/connect-widgets';
import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                         displayLoadSpinner                         | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
export function displayLoadSpinner(idWidget,idInstance) {
  const self = this;
  const aElement = document.getElementById('button' + idInstance + idWidget);
  const inputElement = document.getElementById('button' + idInstance + idWidget + '_select_file');
  const iElement = document.createElement('i');
  let timeoutId;

  this.disableButton = () => {
    // disable until request finished
    aElement.classList.add('disabled');
    iElement.setAttribute('id', 'icon' + idWidget);
    iElement.setAttribute('class', 'fa fa-spinner fa-spin');
    aElement.append(iElement);
  };
  this.enableButton = () => {
    aElement.classList.remove('disabled');
    if (iElement) {
      iElement.remove();
    }
  };

  this.disableButton();
  inputElement.onchange = () => {
    clearTimeout(timeoutId);
    document.body.focus();
    self.enableButton();
  };
  document.body.onfocus = () => {
    timeoutId = setTimeout(() => {
      self.enableButton();
      document.body.onfocus = null;
    }, 200);
  };
}

// ├────────────────────────────────────────────────────────────────────┤ \\
// |                             addSpinner                             | \\
// ├────────────────────────────────────────────────────────────────────┤ \\
function _addSpinner(idWidget, idInstance) {
  const widgetButton = document.getElementById('button' + idInstance + idWidget);
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
  const widgetButton = document.getElementById('button' + idInstance + idWidget);

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
          _addSpinner(idWidget, idInstance);
        } else {
          _removeSpinner(idInstance, idWidget);
          clearInterval(intervalId);
        }
      }, 100);
    }
  }
}


