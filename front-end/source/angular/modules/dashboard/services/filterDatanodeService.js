import { datanodesManager } from 'kernel/datanodes/base/DatanodesManager';

angular.module('modules.dashboard').service('FilterDatanodeService', [
  '$rootScope',
  function ($rootScope) {
    const self = this;

    // Private helper function for filtering nodes
    function _filterNodes(node, action) {
      if (action === 'push') {
        if ($rootScope.filtredList.indexOf(node) === -1) {
          $rootScope.filtredList.push(node);
          node.hide = false;
        }
      }
      if (action === 'splice') {
        if ($rootScope.filtredList.indexOf(node) >= 0) {
          $rootScope.filtredList.splice($rootScope.filtredList.indexOf(node), 1);
          node.hide = true;
        }
      }
    }

    /*---------- filter By Connection btn----------------*/
    self.filterByConnection = function (singleton, element) {
      setTimeout(function () {
        for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
          $rootScope.alldatanodes[i]._serializedData = $rootScope.alldatanodes[i].serialize();

          if ($rootScope.filtredList.indexOf($rootScope.alldatanodes[i]) === -1) {
            $rootScope.alldatanodes[i].hide = true;
          }

          if (
            singleton &&
            datanodesManager.isSingletonNode($rootScope.alldatanodes[i]._serializedData.name)
          ) {
            if (element.className.includes('active')) {
              _filterNodes($rootScope.alldatanodes[i], 'push');
            } else {
              _filterNodes($rootScope.alldatanodes[i], 'splice');
            }
          } else if (
            !singleton &&
            !datanodesManager.isSingletonNode($rootScope.alldatanodes[i]._serializedData.name)
          ) {
            if (element.className.includes('active')) {
              _filterNodes($rootScope.alldatanodes[i], 'push');
            } else {
              _filterNodes($rootScope.alldatanodes[i], 'splice');
            }
          }
        }

        if ($rootScope.filtredList.length === 0) {
          self.resetNodesFilters();
        }
        self.updateNodesCountAndFontColor();
        $rootScope.$apply();
      }, 700);
    };

    /*---------- filter By Type button----------------*/
    self.filterByType = function (type, element) {
      setTimeout(function () {
        for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
          $rootScope.alldatanodes[i]._serializedData = $rootScope.alldatanodes[i].serialize();

          if ($rootScope.filtredList.indexOf($rootScope.alldatanodes[i]) === -1) {
            $rootScope.alldatanodes[i].hide = true;
          }

          if ($rootScope.alldatanodes[i]._serializedData.type === type) {
            if (element.className.includes('active')) {
              _filterNodes($rootScope.alldatanodes[i], 'push');
            } else {
              _filterNodes($rootScope.alldatanodes[i], 'splice');
            }
          }
        }
        if ($rootScope.filtredList.length === 0) {
          self.resetNodesFilters();
        }
        self.updateNodesCountAndFontColor();
        $rootScope.$apply();
      }, 700);
    };

    /*---------- filter By Type btn  --> cancel ----------------*/
    self.resetNodesFilters = function () {
      $rootScope.filtredList = [];
      $rootScope.filtredNodes = $rootScope.alldatanodes.length;
      $('.datanode__wrap--info p').removeAttr('style');
      for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
        $rootScope.alldatanodes[i].hide = false;
      }
      self.applyDatanodeFilter();
    };

    /*---------- updateNodesCountAndFontColor----------------*/
    self.updateNodesCountAndFontColor = function () {
      $rootScope.filtredNodes = $rootScope.alldatanodes.filter((el) => !el.hide).length;
      if ($rootScope.filtredNodes !== $rootScope.alldatanodes.length)
        $('.datanode__wrap--info p')[0].style.setProperty('color', 'var(--danger-color)');
      else $('.datanode__wrap--info p').removeAttr('style');
    };

    /*---------- applyDatanodeFilter----------------*/
    self.applyDatanodeFilter = function () {
      let scopeDashDn = angular.element(document.getElementById('dash-datanode-ctrl')).scope();
      let tmpStr = scopeDashDn.searchDatanodeByName;

      setTimeout(function () {
        for (let i = 0; i < $rootScope.alldatanodes.length; i++) {
          $rootScope.alldatanodes[i]._serializedData = $rootScope.alldatanodes[i].serialize();

          if (
            !($rootScope.alldatanodes[i]._serializedData.settings.name
              .toLowerCase()
              .indexOf(tmpStr.toLowerCase()) >= 0)
          ) {
            $rootScope.alldatanodes[i].hide = true;
          } else {
            if ($rootScope.filtredList.length === 0)
              $rootScope.alldatanodes[i].hide = false;
            if ($rootScope.filtredList.indexOf($rootScope.alldatanodes[i]) >= 0)
              $rootScope.alldatanodes[i].hide = false;
          }
        }

        self.updateNodesCountAndFontColor();
        $rootScope.$apply();
      }, 700);
    };
  },
]);
