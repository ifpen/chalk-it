import { tabPlayLoadedEvt } from 'kernel/base/main-common';
import { widgetPreview } from 'kernel/dashboard/rendering/preview-widgets';
import { editorSingletons } from 'kernel/editor-singletons';

export function showEditMode() {
  // TODO coords check if we do need that
  // document.dispatchEvent(tabWidgetsLoadedEvt);

  const widgetEditor = editorSingletons.widgetEditor;
  widgetEditor.setAllowPageChangeFromScript(false);
}

export function showPlayMode() {
  const widgetEditor = editorSingletons.widgetEditor;
  widgetEditor.setAllowPageChangeFromScript(true);

  try {
    const { dashboard } = editorSingletons.widgetEditor.serialize();

    widgetPreview.reset();
    widgetPreview.renderDashboardWidgets(dashboard);
  } catch (e) {
    console.error(e);
    // FIXME ?
  }

  // TODO coords check if we do need that
  document.dispatchEvent(tabPlayLoadedEvt); // for some widgets (like Leaflet)
}
