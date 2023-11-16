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
        const packages = pyodideManager.packages;
        const libraries = {
            'pyodideStandard': [...packages.standard].sort(),
            'pyodideMicropip': [...packages.micropip].sort(),
        };

        return libraries;
    }

    /*--------deserialize--------*/
    function deserialize(jsonContent) {
        pyodideManager.reset();
        if (!_.isUndefined(jsonContent.libraries)) {
            const { pyodideStandard, pyodideMicropip } = jsonContent.libraries;
            pyodideManager.packages = {
                standard: pyodideStandard,
                micropip: pyodideMicropip,
            };
        }

        if (jsonContent.data.datanodes.find(_ => _.type === "Python_pyodide_plugin")) {
            // TODO let nodes handle this ? do wait ?
            pyodideManager.ensureStarted();
        }
    }

    //----------------------------------------------------------------------

    // public functions
    return {
        serialize: serialize,
        deserialize: deserialize
    };

})();