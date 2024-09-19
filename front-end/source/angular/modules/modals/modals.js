import datanodeInfoTemplate from './datanode_info.html';
import infoProjectTemplate from './info_project.html';
import managePageShareTemplate from './manage_page_share.html';
import shareProjectTemplate from './share_project.html';
import shareTemplate from './share.html';
import userAvatarTemplate from './userAvatar.html';

export const modalsModule = angular
  .module('modules.modals', [])
  .directive('datanodeInfoTemplate', function () {
    return {
      template: datanodeInfoTemplate,
    };
  })
  .directive('infoProjectTemplate', function () {
    return {
      template: infoProjectTemplate,
    };
  })
  .directive('managePageShareTemplate', function () {
    return {
      template: managePageShareTemplate,
    };
  })
  .directive('shareProjectTemplate', function () {
    return {
      template: shareProjectTemplate,
    };
  })
  .directive('shareTemplate', function () {
    return {
      template: shareTemplate,
    };
  })
  .run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put('angular/modules/modals/userAvatar.html', userAvatarTemplate);
    },
  ]);
