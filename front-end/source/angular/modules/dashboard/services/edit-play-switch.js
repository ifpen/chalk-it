import { tabPlayLoadedEvt } from 'kernel/base/main-common';
import { widgetViewer } from 'kernel/dashboard/rendering/widget-viewer';
import { editorSingletons } from 'kernel/editor-singletons';

export function showEditMode() {
  const widgetEditor = editorSingletons.widgetEditor;
  widgetEditor.setAllowPageChangeFromScript(false);
}

export function showPlayMode() {
  const widgetEditor = editorSingletons.widgetEditor;
  widgetEditor.setAllowPageChangeFromScript(true);

  try {
    const { dashboard, display, pages } = editorSingletons.widgetEditor.serialize();
    widgetViewer.reset();
    widgetViewer.deserialize({ dashboard, display, pages, connections: {} });
  } catch (e) {
    console.error(e);
    // FIXME ?
  }

  // TODO coords check if we do need that
  document.dispatchEvent(tabPlayLoadedEvt); // for some widgets (like Leaflet)
}
