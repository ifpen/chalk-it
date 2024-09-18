import { editorModule as _editorModule } from './editor';
import './editor.actions';
import './editor.controller';
import './editor.file-sync-manager'; // TODO optional ?
import './editor.undo-manager';

import '../dashboard/_partials/panels/dashboard_rightSidePanel.controller';

export const editorModule = _editorModule;
