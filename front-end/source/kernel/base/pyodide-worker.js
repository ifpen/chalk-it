"use strict";

console.log("Pyodide worker started")

importScripts("/thirdparty/pyodide.js");


let pyodidePromise = null;

async function _loadPyodide(msg) {
    const pyodide = await loadPyodide({ indexURL: msg.indexURL });

    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    try {
        await micropip.install(msg.xdashLibUrl);
    } finally {
        micropip.destroy();
    }

    return pyodide;
}

async function _loadPackages(msg) {
    const missingStandardPackages = msg.standardPackages;
    const missingMicropipPackages = msg.micropipPackages;

    if (missingStandardPackages.length) {
        const pyodide = await pyodidePromise;
        await pyodide.loadPackage(missingStandardPackages);
    }
    if (missingMicropipPackages.length) {
        const pyodide = await pyodidePromise;
        const micropip = pyodide.pyimport("micropip");
        try {
            await micropip.install(missingMicropipPackages);
        } finally {
            micropip.destroy();
        }
    }
}

async function _runPythonAsync(msg) {
    const pyodide = await pyodidePromise;
    let globals = undefined;
    if (msg.globals) {
        // TODO check whether JSON <-> is faster
        globals = pyodide.toPy(msg.globals);
    }
    try {
        return await pyodide.runPythonAsync(msg.script, globals ? { globals } : undefined);
    } finally {
        if (globals) {
            globals.destroy();
        }
    }
}

async function _getPyodideLoadedLibs() {
    // TODO use
    const pyodide = await pyodidePromise;

    const standard = [];
    const micropip = [];
    Object.entries(pyodide.loadedPackages).forEach(([lib, type]) => {
        if (type === "default channel") {
            standard.push(lib);
        } else if (type === "pypi") {
            micropip.push(lib);
        }
    });

    return { standard, micropip };
}

function reply(id, msg) {
    self.postMessage({ ...msg, id });
}

self.onmessage = async (event) => {
    const { id, type, ...msg } = event.data;

    try {
        if (type === "start") {
            pyodidePromise = await _loadPyodide(msg);
            self.postMessage({ result: "ok", id });
        } else if (type === "loadPackages") {
            await _loadPackages(msg);
            self.postMessage({ result: "ok", id });
        } else if (type === "run") {
            const result = JSON.parse(await _runPythonAsync(msg));
            self.postMessage({ ...result, id });
        } else {
            const error = `Invalid message type: ${type}`;
            console.error(error);
            self.postMessage({ error, id });
        }
    } catch (error) {
        console.error(error);
        self.postMessage({ error: error.message, id });
    }
}