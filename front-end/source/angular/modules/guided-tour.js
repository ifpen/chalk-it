// ┌──────────────────────────────────────────────────────────────────────────────────┐ \\
// │ startIntroGallery                                                                │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                                      │ \\
// | Licensed under the Apache License, Version 2.0                                   │ \\
// ├──────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Mondher AJIMI, Ghiles HIDEUR  │ \\
// └──────────────────────────────────────────────────────────────────────────────────┘ \\

import introJs from 'intro.js';

/*--------startIntro --------*/
export function startIntroProject() {
  const intro = introJs();
  const options = {
    exitOnOverlayClick: false,
    showBullets: false,
    showStepNumbers: true,
    tooltipPosition: 'right',
    steps: [
      {
        element: '#dashboard-editor',
        intro: 'This is dashboard edition area',
      },
      {
        element: '#editor-widget-toolbox',
        intro: 'This is the widgets toolbox',
      },
      {
        element: '#widget__groups--wrapper--icons',
        intro: 'Widgets are added to the dashboard edition area from the widgets toolbox',
      },
      {
        element: '#widgetGroups',
        intro: 'Available widgets are arranged according to 5 main groups',
      },
      {
        element: '#kpiCard',
        intro: 'Widgets are placed into the dashboard editor using click or drag and drop',
      },
      {
        element: '#editor-datanodes-list',
        intro: 'This is the dataNodes editor',
      },
      {
        element: '#editor-left-side-panel',
        intro: 'DataNodes are added, configured, listed and controlled here',
      },
      {
        element: '#annotationLabelT li:first-child',
        intro: 'This is widget connection and configuration menu',
      },
      {
        element: '#menuWidget',
        intro:
          'Widget connection to dataNodes, configuration, placement, z-order, etc. features are provided by this menu',
      },
      {
        element: '#panel--right',
        intro: 'Here, widget and dataNode connection is configured',
      },
    ],
  };

  intro.setOptions(options);

  intro.onbeforechange(async function (targetElement) {
    switch (targetElement.id) {
      case 'editor-widget-toolbox':
        if (this._direction == 'backward') document.getElementById('editor-widget-toolbox').click();
        break;
      case 'widget__groups--wrapper--icons':
        if (this._direction == 'forward') {
          document.getElementById('editor-widget-toolbox').click();

          let scopeWdgt = angular.element(document.getElementById('widget__wrap')).scope();
          if (scopeWdgt.displayedWdgtIndex !== 0) {
            document.getElementById('collapse-basic').click();
          }
        } else if (this._direction == 'backward') {
          document.getElementById('collapse-basic').click();
        }
        break;
      case 'widgetGroups':
        if (this._direction == 'forward') {
          document.getElementById('collapse-basic').click();
        } else if (this._direction == 'backward') {
          document.getElementById('collapse-gauges').click();
        }
        break;
      case 'kpiCard':
        if (this._direction == 'forward') {
          document.getElementById('collapse-gauges').click();
        } else if (this._direction == 'backward') {
          document.getElementById('editor-widget-toolbox').click();
        }
        break;
      case 'editor-datanodes-list':
        if (this._direction == 'forward') {
          document.getElementById('editor-datanodes-list').click();
        }
        break;
      case 'editor-left-side-panel':
        document.querySelector('#annotationLabelT li:first-child').click();
        break;
      case 'menuWidget':
        if (this._direction == 'forward') document.querySelector('#annotationLabelT li:first-child').click();
        break;
      case 'datanodes-widget-connect':
        if (this._direction == 'backward') {
          document.getElementById('editor-datanodes-list').click();
          document.getElementById('menuWidget').click();
        }
        break;
      case 'panel--right':
        if (this._direction == 'forward') {
          document.getElementById('open-datanodes-widget-connect').click();
          document.getElementById('menuWidget').click();
        }
        break;
    }
  });

  intro.onafterchange(function (targetElement) {
    const el0 = document.querySelectorAll('.introjs-helperLayer')[0];
    const el1 = document.querySelectorAll('.introjs-tooltipReferenceLayer')[0];
    setTimeout(() => {
      let clientRect = targetElement.getBoundingClientRect();
      el0.style.setProperty('left', parseInt(clientRect.left) - 5 + 'px');
      el1.style.setProperty('left', parseInt(clientRect.left) - 5 + 'px');

      el0.style.setProperty('top', parseInt(clientRect.top) - 5 + 'px');
      el1.style.setProperty('top', parseInt(clientRect.top) - 5 + 'px');

      el0.style.setProperty('width', parseInt(clientRect.width) + 10 + 'px');
      el1.style.setProperty('width', parseInt(clientRect.width) + 10 + 'px');

      el0.style.setProperty('height', parseInt(clientRect.height) + 10 + 'px');
      el1.style.setProperty('height', parseInt(clientRect.height) + 10 + 'px');
    }, 300);
  });

  intro.onchange(function (targetElement) {});

  intro.oncomplete(function () {
    document.getElementById('open-datanodes-widget-connect').click();
  });

  intro.start();
}
