import { xcloudModule as _xcloudModule } from 'kernel/base/xdash-load';

import './modules/components/authentication/userFactory';
import './modules/components/APIs';

import './modules/shared/services/managePrjService';

import './modules/modules.controller';
import './modules/dashboard/_partials/modals/exportDownloadModal.controller';

export const xcloudModule = _xcloudModule;
