// ┌───────────────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard_libraries.controller                                                │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2024 IFPEN                                                   │ \\
// | Licensed under the Apache License, Version 2.0                                │ \\
// ├───────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR, Abir EL FEKI                              │ \\
// └───────────────────────────────────────────────────────────────────────────────┘ \\

import _ from 'lodash';
import { pyodideManager, PyodideManager } from 'kernel/base/pyodide-loader';
import { standardAvailablePyodideLibs, microPipAvailablePyodideLibs } from 'kernel/base/pyodide-def';

angular.module('modules.dashboard').controller('DashboardLibrariesController', [
  '$scope',
  '$rootScope',
  '$element',
  class DashboardLibrariesController {
    constructor($scope, $rootScope, $element) {
      this.LIBS_NONE = 0;
      this.LIBS_MICROPIP = 1;
      this.LIBS_STANDARD = 2;
      this.LIBS_ALL = this.LIBS_MICROPIP | this.LIBS_STANDARD;

      this.$rootScope = $rootScope;
      this.$element = $element;

      //toggles which python lib panel is displayed
      this.displayedLibs = this.LIBS_NONE;

      this.search = '';

      this.standardPyodideLibrariesStates = standardAvailablePyodideLibs.map((name) => ({
        name,
        loaded: false,
        selected: false,
      }));
      this.micropipPyodideLibrariesStates = microPipAvailablePyodideLibs.map((name) => ({
        name,
        loaded: false,
        selected: false,
      }));

      this._updateLibStates();

      this._pyodideManagerListener = () => {
        this._updateLibStates();
        $scope.$applyAsync();
      };
      pyodideManager.addListener(this._pyodideManagerListener);
    }

    async loadPyodideLibraries() {
      // TODO feedback
      await pyodideManager.loadPackages();
      for (let iElement = 0; iElement < this.$element.length; iElement++) {
        const element = this.$element[iElement];
        const lists = element.getElementsByClassName('toggle_wrapper');
        for (let iList = 0; iList < lists.length; iList++) {
          lists[iList].scrollTop = 0;
        }
      }
    }

    isLoading() {
      return pyodideManager.pyodideState === PyodideManager.PYODIDE_STATE_LOADING;
    }

    canLoad() {
      if (
        pyodideManager.pyodideState === PyodideManager.PYODIDE_STATE_LOADING ||
        pyodideManager.pyodideState === PyodideManager.PYODIDE_STATE_ERROR
      ) {
        return false;
      } else {
        return (
          pyodideManager.pyodideState === PyodideManager.PYODIDE_STATE_NONE ||
          this.standardPyodideLibrariesStates.find((_) => _.selected && !_.loaded) ||
          this.micropipPyodideLibrariesStates.find((_) => _.selected && !_.loaded)
        );
      }
    }

    canReset() {
      return pyodideManager.pyodideState !== PyodideManager.PYODIDE_STATE_NONE;
    }

    resetPyodide() {
      pyodideManager.reset(false);
    }

    toggleStandardLib(name) {
      const packages = pyodideManager.packages;
      if (packages.standard.has(name)) {
        packages.standard.delete(name);
      } else {
        packages.standard.add(name);
      }
      pyodideManager.packages = packages;

      this.$rootScope.updateFlagDirty(true);
    }

    toggleMicropipLib(name) {
      const packages = pyodideManager.packages;
      if (packages.micropip.has(name)) {
        packages.micropip.delete(name);
      } else {
        packages.micropip.add(name);
      }
      pyodideManager.packages = packages;

      this.$rootScope.updateFlagDirty(true);
    }

    _updateLibStates() {
      const packages = pyodideManager.packages;
      const loadedPackages = pyodideManager.loadedPackages;

      this.standardPyodideLibrariesStates.forEach((state) => {
        state.selected = packages.standard.has(state.name);
        state.loaded = loadedPackages.standard.has(state.name);
      });
      this.micropipPyodideLibrariesStates.forEach((state) => {
        state.selected = packages.micropip.has(state.name);
        state.loaded = loadedPackages.micropip.has(state.name);
      });
    }

    togglePythonLibDisplay(panel) {
      if (panel === this.displayedLibs) {
        this.displayedLibs = this.LIBS_NONE;
      } else {
        this.displayedLibs = panel;
      }
    }

    isPythonLibDisplayOpen(panel) {
      return !!this.search || (this.displayedLibs & panel) !== 0;
    }

    itemSortValue(item) {
      return `${item.loaded ? '0' : '1'}/${item.name}`;
    }

    $onDestroy() {
      pyodideManager.removeListener(this._pyodideManagerListener);
    }
  },
]);
