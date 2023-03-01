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
    self._loadPyodide = async function () {
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
    self.pyodideReadyPromise = self._loadPyodide();

    /*--------------_getPyodide--------------*/
    self._getPyodide = function () {
        return self.pyodideReadyPromise;
    }

    /*--------------runPythonScript--------------*/
    self.runPythonScript = async function (script) {
        try {
            const pyodide = await self._getPyodide();
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
    self.loadPyodideLibs = async function (pyodideLibs) {
        self.isLoading = false;
        const { standardLibs, micropipLibs } = await self._getLibsToLoad(pyodideLibs);
        await self._loadStandardLibs(standardLibs);
        await self._loadMicropipLibs(micropipLibs);
        if (self.isLoading) {
            self._endLoadingIndicator();
        }
        await self._addProjectLoadedLibs(pyodideLibs);
    }

    /*--------------_loadStandardLibs--------------*/
    self._loadStandardLibs = async function (standardLibs) {
        if (!standardLibs.length)
            return;
        try {
            const notice = _notifyLoad("info", "Loading standard libraries");
            self._startLoadingIndicator();
            const pyodide = await self._getPyodide();
            await pyodide.loadPackage(standardLibs);
            self.isLoading = true;
            notice.remove();
        } catch (error) {
            self._errorIndicator("standard", error);
        }
    }

    /*--------------_loadMicropipLibs--------------*/
    self._loadMicropipLibs = async function (micropipLibs) {
        if (!micropipLibs.length)
            return;
        try {
            const notice = _notifyLoad("info", "Loading micropip libraries");
            self._startLoadingIndicator();
            const micropip = await self._getMicropipLoader();
            await micropip.install(micropipLibs);
            self.isLoading = true;
            notice.remove();
        } catch (error) {
            self._errorIndicator("micropip", error);
        }
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                          Pyodide Libraries                         | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    /*--------------getDefaultLibs--------------*/
    self.getDefaultLibs = function () {
        const defaultLibs = {
            standardLibs: JSON.parse(xDashConfig['pyodide'].standard_pyodide_packages),
            micropipLibs: JSON.parse(xDashConfig['pyodide'].micropip_pyodide_packages)
        };
        return defaultLibs;
    }

    /*--------------getProjectLibs--------------*/
    self.getProjectLibs = function () {
        return self.pyodideLibs;
    }

    /*--------------resetProjectLibs--------------*/
    self.resetProjectLibs = function () {
        self.pyodideLibs = {
            standardLibs: [],
            micropipLibs: []
        }
    }

    /*--------------_addPyodideLibs--------------*/
    self._addPyodideLibs = function (libsObj) {
        for (const key in libsObj) {
            self.pyodideLibs[key] = _.union(self.pyodideLibs[key], libsObj[key])
        }
    }

    /*--------------_getPyodideLoadedLibs--------------*/
    self._getPyodideLoadedLibs = async function () {
        const pyodide = await self._getPyodide();
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
    self._getLibs = async function (libsObj, compareFn) {
        const pyodideLoadedLibs = await self._getPyodideLoadedLibs();
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
    self._addProjectLoadedLibs = async function (libsObj) {
        const projectLoadeLibs = await self._getLibs(libsObj, (pyodideLibs, lib) => pyodideLibs.includes(lib));
        self._addPyodideLibs(projectLoadeLibs)
    }

    /*--------------_getLibsToLoad--------------*/
    self._getLibsToLoad = async function (libsObj) {
        const projectLibsToLoad = await self._getLibs(libsObj, (pyodideLibs, lib) => !pyodideLibs.includes(lib));
        return projectLibsToLoad;
    }

    /*--------------_getMicropipLoader--------------*/
    self._getMicropipLoader = async function () {
        const pyodide = await self._getPyodide();
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
    self._notifyLoad = function (notifyType, title, notifyText) {
        const notice = new PNotify({
            title: title,
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
    self._startLoadingIndicator = function () {
        datanodesManager.showLoadingIndicator(true);
    }

    /*--------------_endLoadingIndicator--------------*/
    self._endLoadingIndicator = function () {
        datanodesManager.showLoadingIndicator(false);
        _notifyLoad("info", "Loading Pyodide libraries", "End of loading libraries");
    }

    /*--------------_errorIndicator--------------*/
    self._errorIndicator = function (libraryType, error) {
        datanodesManager.showLoadingIndicator(false);
        _notifyLoad("error", "Loading Pyodide libraries","Error of loading " + libraryType + " libraries\n" + error);
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
