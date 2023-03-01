// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ pyodideLib                                                         │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2022-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Ghiles HIDEUR                                 │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var pyodideLib = (function () {

    /*--------serialize--------*/
    function serialize() {
        const { standardLibs, micropipLibs } = pyodideManager.getProjectLibs();
        const libsObj = {
            'pyodideStandard': standardLibs,
            'pyodideMicropip': micropipLibs
        };

        return libsObj;
    }

    /*--------deserialize--------*/
    async function deserialize(jsonContent) {
        if (_.isUndefined(jsonContent.data.datanodes)) //compatibility
            jsonContent.data.datanodes = jsonContent.data.datasources;

        const datanodesList = jsonContent.data.datanodes;
        let isPythonDataNode = false;
        let libsToLoad = {
            standardLibs: [],
            micropipLibs: []
        };
        datanodesList.forEach(_ => {
            if (_.type === "Python_pyodide_plugin")
                isPythonDataNode = true;
        });
        if (isPythonDataNode) {
            const defaultLibs = pyodideManager.getDefaultLibs();
            for (const key in libsToLoad) {
                libsToLoad[key] = _.union(libsToLoad[key], defaultLibs[key]);
            }
        }
        if (!_.isUndefined(jsonContent.libraries)) {
            const { pyodideStandard, pyodideMicropip } = jsonContent.libraries;
            const libsObj = {
                standardLibs: pyodideStandard,
                micropipLibs: pyodideMicropip
            }
            for (const key in libsToLoad) {
                libsToLoad[key] = _.union(libsToLoad[key], libsObj[key]);
            }
        }
        await pyodideManager.loadPyodideLibs(libsToLoad);
    }

    //----------------------------------------------------------------------

    // public functions
    return {
        serialize: serialize,
        deserialize: deserialize
    };

})();