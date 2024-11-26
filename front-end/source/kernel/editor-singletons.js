import { initEditWidget } from 'kernel/dashboard/edition/edit-widgets';
import { widgetToolboxClass } from 'kernel/dashboard/toolbox-mgr';
import { LayoutMgrClass } from 'kernel/dashboard/scaling/layout-mgr';
import { initXdashRuntime } from 'kernel/runtime-singletons';

export const editorSingletons = {
  widgetEditor: null,
  WTBC: null,
  layoutMgr: null,
};

export function initXdashEditor() {
  editorSingletons.layoutMgr = new LayoutMgrClass();
  window.layoutMgr = editorSingletons.layoutMgr;

  initXdashRuntime();

  editorSingletons.widgetEditor = initEditWidget(); // edit
  window.widgetEditor = editorSingletons.widgetEditor;

  editorSingletons.WTBC = new widgetToolboxClass(); // edit ?
}
