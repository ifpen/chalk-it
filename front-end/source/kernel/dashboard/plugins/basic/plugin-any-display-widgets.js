﻿// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2023 IFPEN                                             │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) :  Tristan BARTEMENT                                     │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
import { widgetsPluginsHandler } from 'kernel/dashboard/plugin-handler';
import { modelsHiddenParams, modelsParameters, modelsLayout } from 'kernel/base/widgets-states';
import { basePlugin } from '../plugin-base';
import { baseWidget, WidgetActuatorBase, WidgetActuatorDescription } from '../widget-base';
import { WidgetPrototypesManager } from 'kernel/dashboard/connection/widget-prototypes-manager';
import { jsonDataToBasicHtmlElement } from 'kernel/datanodes/plugins/thirdparty/utils';

/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/

// Models
modelsHiddenParams.anyDisplay = {
  content: '',
};

// Parameters
modelsParameters.anyDisplay = {
  fontsize: 0.3,
  backgroundColor: 'rgba(0, 0, 0, 0)',
  textColor: 'var(--widget-color)',
  valueFontFamily: 'Helvetica Neue',
  textAlign: 'left',
  displayBorder: false,
  centerVertically: true,
};

// Layout (default dimensions)
modelsLayout.anyDisplay = { height: '240px', width: '460px', minWidth: '50px', minHeight: '32px' };

/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/
(function () {
  class AnyContentActuator extends WidgetActuatorBase {
    setValue(value) {
      modelsHiddenParams[this.widget.idInstance].content = value;
      this.widget.render();
    }
  }

  class AnyDisplayWidget extends baseWidget {
    static _CONTENT_DESCRIPTOR = new WidgetActuatorDescription(
      'content',
      'Any content to display',
      WidgetActuatorDescription.READ,
      WidgetPrototypesManager.SCHEMA_ANYTHING
    );

    constructor(idDivContainer, idWidget, idInstance, bInteractive) {
      super(idDivContainer, idWidget, idInstance, bInteractive);

      this.content = new AnyContentActuator(this);

      this.render();
    }

    #hasScrollBar(element) {
      return element.scrollHeight > element.clientHeight;
    }

    #insertHtml(container, content) {
      const fitContent =
        content instanceof HTMLImageElement ||
        content instanceof HTMLIFrameElement ||
        content instanceof HTMLVideoElement ||
        content instanceof HTMLAudioElement;

      const divContent = document.createElement('div');
      divContent.id = `htmlDiv${this.idWidget}`;
      divContent.class = 'defaultCSS';
      divContent.style = `${this.fontSize()} ${this.valueFontFamily()} ${this.border()}`;
      divContent.style.overflow = fitContent ? 'none' : 'auto';
      divContent.style.width = 'inherit';
      divContent.style.height = 'inherit';
      divContent.style.padding = '4px';
      divContent.style.resize = 'inherit';
      divContent.style.color = this.plotTextColor();
      divContent.style['background-color'] = 'transparent';
      divContent.style['box-shadow'] = 'none';
      divContent.style['text-align'] = modelsParameters[this.idInstance].textAlign;
      divContent.style['border-radius'] = '6px';

      const divStyle = document.createElement('div');
      if (fitContent) {
        divStyle.style.width = '100%'; // TODO try to remove
        divStyle.style.height = '100%';
      }

      const widgetHtml = document.createElement('div');
      widgetHtml.style.width = 'inherit';
      widgetHtml.style.height = 'inherit';
      widgetHtml.style['background-color'] = modelsParameters[this.idInstance].backgroundColor;

      divContent.append(divStyle);
      divStyle.append(content);
      widgetHtml.append(divContent);

      container.replaceChildren(widgetHtml);

      if (modelsParameters[this.idInstance].centerVertically && !this.#hasScrollBar(divContent)) {
        const translate = 'translateY(-50%)';
        divStyle.style.position = 'relative';
        divStyle.style.top = '50%';
        divStyle.style.transform = translate;
        divStyle.style['-webkit-transform'] = translate;
        divStyle.style['-ms-transform'] = translate;
      }
    }

    rescale() {
      this.render();
    }

    render() {
      const content = modelsHiddenParams[this.idInstance].content;
      const container = document.getElementById(this.idDivContainer);
      const element = jsonDataToBasicHtmlElement(content);
      this.#insertHtml(container, element);
    }

    getActuatorDescriptions() {
      return [AnyDisplayWidget._CONTENT_DESCRIPTOR];
    }
  }

  /*******************************************************************/
  /************************ plugin declaration ***********************/
  /*******************************************************************/

  const PLUGIN_DEFINITION = {
    name: 'any widget',
    widgetsDefinitionList: {
      anyDisplay: {
        factory: AnyDisplayWidget,
        title: "'any' widget",
        icn: 'generic-html',
        help: 'wdg/wdg-basics/#any-widget',
      },
    },
  };
  widgetsPluginsHandler.loadWidgetPlugin(new basePlugin(PLUGIN_DEFINITION));
})();
