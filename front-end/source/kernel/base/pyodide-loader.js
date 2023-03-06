// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ pyodideManager                                                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR, Mongi BEN GAID                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var pyodideManager = (function () {

    const self = this;
    self.pyodideLibs = {
        standardLibs: [],
        micropipLibs: []
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                          Load Pyodide                              | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    /*--------------_loadPyodide--------------*/
    async function _loadPyodide() {
        try {
            console.log("Loading Pyodide");
            const pyodide = await loadPyodide({
                indexURL: xDashConfig['pyodide'].pyodide_index
            });
            pyodide.runPython("globalScope = {}");
            console.log("End of loading Pyodide");
            return pyodide;
        } catch (error) {
            console.error("Error while loading Pyodide\n" + error);
        }
    }
    self.pyodideReadyPromise = _loadPyodide();

    /*--------------_getPyodide--------------*/
    function _getPyodide() {
        return self.pyodideReadyPromise;
    }

    /*--------------runPythonScript--------------*/
    async function runPythonScript(script) {
        try {
            const pyodide = await _getPyodide();
            const result = pyodide.runPython(script);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                      Load Pyodide Libraries                        | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    /*--------------loadPyodideLibs--------------*/
    async function loadPyodideLibs(pyodideLibs) {
        self.isLoading = false;
        const { standardLibs, micropipLibs } = await _getLibsToLoad(pyodideLibs);
        await _loadStandardLibs(standardLibs);
        await _loadMicropipLibs(micropipLibs);
        await _addProjectLoadedLibs(pyodideLibs);

        const $scopeLibs = angular.element(document.getElementById("library__wrap")).scope();
        $scopeLibs.updateLibsList();
        
        if (self.isLoading) {
             _endLoadingIndicator();
        }
    }

    /*--------------_loadStandardLibs--------------*/
    async function _loadStandardLibs(standardLibs) {
        if (!standardLibs.length)
            return;
        try {
            const notice = _notifyLoad("info", "Loading standard libraries");
            _startLoadingIndicator();
            const pyodide = await _getPyodide();
            await pyodide.loadPackage(standardLibs);
            self.isLoading = true;
            notice.remove();
        } catch (error) {
            _errorIndicator("standard", error);
        }
    }

    /*--------------_loadMicropipLibs--------------*/
    async function _loadMicropipLibs(micropipLibs) {
        if (!micropipLibs.length)
            return;
        try {
            const notice = _notifyLoad("info", "Loading micropip libraries");
            _startLoadingIndicator();
            const micropip = await _getMicropipLoader();
            await micropip.install(micropipLibs);
            self.isLoading = true;
            notice.remove();
        } catch (error) {
            _errorIndicator("micropip", error);
        }
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                          Pyodide Libraries                         | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    /*--------------getDefaultLibs--------------*/
    function getDefaultLibs() {
        const defaultLibs = {
            standardLibs: JSON.parse(xDashConfig['pyodide'].standard_pyodide_packages),
            micropipLibs: JSON.parse(xDashConfig['pyodide'].micropip_pyodide_packages)
        };
        return defaultLibs;
    }

    /*--------------getProjectLibs--------------*/
    function getProjectLibs() {
        return self.pyodideLibs;
    }

    /*--------------resetProjectLibs--------------*/
    function resetProjectLibs() {
        self.pyodideLibs = {
            standardLibs: [],
            micropipLibs: []
        }
    }

    /*--------------_addPyodideLibs--------------*/
    function _addPyodideLibs(libsObj) {
        for (const key in libsObj) {
            self.pyodideLibs[key] = _.union(self.pyodideLibs[key], libsObj[key])
        }
    }

    /*--------------_getPyodideLoadedLibs--------------*/
    async function _getPyodideLoadedLibs() {
        const pyodide = await _getPyodide();
        const pyodideLoadedLibs = pyodide.loadedPackages;
        const loadedLibs = {
            standardLibs: [],
            micropipLibs: []
        }
        for (let key in pyodideLoadedLibs) {
            if (pyodideLoadedLibs[key] === "default channel") {
                loadedLibs.standardLibs.push(key);
            } else if (pyodideLoadedLibs[key] === "pypi") {
                loadedLibs.micropipLibs.push(key);
            }
        }
        return loadedLibs;
    }

    /*--------------_getLibs--------------*/
    async function _getLibs(libsObj, compareFn) {
        const pyodideLoadedLibs = await _getPyodideLoadedLibs();
        const projectLibs = {
            standardLibs: [],
            micropipLibs: []
        }
        for (const key in libsObj) {
            libsObj[key].forEach(lib => {
                if (compareFn(pyodideLoadedLibs[key], lib))
                    projectLibs[key].push(lib);
            });
        }
        return projectLibs;
    }

    /*--------------_addProjectLoadedLibs--------------*/
    async function _addProjectLoadedLibs(libsObj) {
        const projectLoadeLibs = await _getLibs(libsObj, (pyodideLibs, lib) => pyodideLibs.includes(lib));
        _addPyodideLibs(projectLoadeLibs)
    }

    /*--------------_getLibsToLoad--------------*/
    async function _getLibsToLoad(libsObj) {
        const projectLibsToLoad = await _getLibs(libsObj, (pyodideLibs, lib) => !pyodideLibs.includes(lib));
        return projectLibsToLoad;
    }

    /*--------------_getMicropipLoader--------------*/
    async function _getMicropipLoader() {
        const pyodide = await _getPyodide();
        const micropipLib = pyodide.loadedPackages["micropip"];
        if (_.isUndefined(micropipLib)) {
            await pyodide.loadPackage("micropip");
        }
        const micropip = await pyodide.pyimport("micropip");
        return micropip;
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                   Notifications & Indicators                       | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    /*--------------_notifyLoad--------------*/
    function _notifyLoad(notifyType, notifyText) {
        const notice = new PNotify({
            title: "Loading Pyodide libraries",
            text: notifyText,
            type: notifyType,
            styling: "bootstrap3"
        });
        $('.ui-pnotify-container').on('click', function () {
            notice.remove();
        });
        (notifyType == "info") ? console.log(notifyText) : console.error(notifyText);
        return notice;
    }

    /*--------------_startLoadingIndicator--------------*/
    function _startLoadingIndicator() {
        datanodesManager.showLoadingIndicator(true);
    }

    /*--------------_endLoadingIndicator--------------*/
    function _endLoadingIndicator() {
        datanodesManager.showLoadingIndicator(false);
        _notifyLoad("info", "End of loading libraries");
    }

    /*--------------_errorIndicator--------------*/
    function _errorIndicator(libraryType, error) {
        datanodesManager.showLoadingIndicator(false);
        _notifyLoad("error", "Error of loading " + libraryType + " libraries\n" + error);
    }

    //----------------------------------------------------------------------

    // public functions
    return {
        getProjectLibs: getProjectLibs,
        resetProjectLibs: resetProjectLibs,
        getDefaultLibs: getDefaultLibs,
        loadPyodideLibs: loadPyodideLibs,
        runPythonScript: runPythonScript
    };

})();