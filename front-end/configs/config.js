function getVersion() {
    if (process.env.VERSION_XDASH_C == 0) {
        var dateToday = new Date();
        var dateStart = new Date("01/01/2000");
        var result = Math.abs(dateStart.getTime() - dateToday.getTime());
        return Math.ceil(result / (3600000 * 24));
    } else {
        return process.env.VERSION_XDASH_C;
    }
}

var VERSION_XDASH_A = process.env.VERSION_XDASH_A ? process.env.VERSION_XDASH_A : 0;
var VERSION_XDASH_B = process.env.VERSION_XDASH_B ? process.env.VERSION_XDASH_B : "000";
var VERSION_XDASH_C = getVersion();
var VERSION = VERSION_XDASH_A + "." + VERSION_XDASH_B + "." + VERSION_XDASH_C;
var VERSION_CHALK_IT = process.env.VERSION_CHALK_IT;

// datanodes with JSON Editor input
var jsEditorDn;

if (process.env.JSON_EDITOR_DATASOURCES != undefined) { //compatibility
    process.env.JSON_EDITOR_DATANODES = process.env.JSON_EDITOR_DATASOURCES;
}

if (process.env.JSON_EDITOR_DATANODES != undefined) {
    if (process.env.JSON_EDITOR_DATANODES == "true") {
        jsEditorDn = true;
    }
}

var disableAuth = true;
if (process.env.DISABLE_AUTH != undefined) {
    if (process.env.DISABLE_AUTH == "false") {
        disableAuth = false;
    }
} else {
	process.env.DISABLE_AUTH = "true"
}

var disableSchedulerLog = true;
if (process.env.DISABLE_SCHEDULER_LOG != undefined) {
    if (process.env.DISABLE_SCHEDULER_LOG == "false") {
        disableSchedulerLog = false;
    }
}

var disableSchedulerProfiling = false;
if (process.env.DISABLE_SCHEDULER_PROFILING != undefined) {
    if (process.env.DISABLE_SCHEDULER_PROFILING == "true") {
        disableSchedulerProfiling = true;
    }
}

var standard_pyodide_packages = "";
if (process.env.STANDARD_PYODIDE_PACKAGES != undefined) {
    standard_pyodide_packages = process.env.STANDARD_PYODIDE_PACKAGES;
}

var micropip_pyodide_packages = "";
if (process.env.MICROPIP_PYODIDE_PACKAGES != undefined) {
    micropip_pyodide_packages = process.env.MICROPIP_PYODIDE_PACKAGES;
}

var pyodide_index = "";
if (process.env.PYODIDE_INDEX != undefined) {
    pyodide_index = process.env.PYODIDE_INDEX;
}

var xdash_lib_url = "";
if (process.env.XDASH_LIB_URL != undefined) {
    xdash_lib_url = process.env.XDASH_LIB_URL;
}

module.exports.config = {
    port: process.env.PORT ? process.env.PORT : 7854,
    xDashConfig: {
        'xDashBasicVersion': process.env.DISABLE_AUTH,
        'xDashLiteVersion': process.env.LITE_BUILD,
        'disableRegistration': process.env.DISABLE_REGISTRATION,
        'disableLocalServer': process.env.DISABLE_LOCAL_SERVER,
        'urlDoc': process.env.URL_DOC ? process.env.URL_DOC : "/doc/",
        'urlBase': process.env.URL_BASE ? process.env.URL_BASE : "",
        'urlBaseForExport': process.env.URL_BASE_FOR_EXPORT,
        'urlWebSite': process.env.URL_WEBSITE,
        'jsonEditorDatanodes': jsEditorDn,
        'version': {
            major: VERSION_XDASH_A,
            minor: VERSION_XDASH_B,
            dateStamp: VERSION_XDASH_C,
            fullVersion: VERSION,
			chalkitVersion: VERSION_CHALK_IT
        },
        'disableSchedulerLog': disableSchedulerLog,
        'disableSchedulerProfiling': disableSchedulerProfiling,
        'pyodide': {
            'standard_pyodide_packages': standard_pyodide_packages,
            'micropip_pyodide_packages': micropip_pyodide_packages,
            'pyodide_index': pyodide_index,
            'xdash_lib_url': xdash_lib_url
        },
        'disablePythonSlim': process.env.DISABLE_PYTHON_SLIM,
        'copyright': '\u00A9 2016-' + new Date().getFullYear() + ' IFP Energies nouvelles',
    },
    xServConfig: {
        'url': disableAuth ? process.env.URL_LOCAL_SERVER : process.env.URL_SERVER,
        'urlApi': disableAuth ? null : process.env.URL_API,
        'urlApiFMI': disableAuth ? null : process.env.URL_FMI_API,
        'urlxProxy': process.env.URL_XPROXY
    },
    urlPython: process.env.URL_PYTHON,
    urlxDashNodeServer: process.env.URL_XDASH_NODE_SERVER,
    urlAdminApp: process.env.URL_XDASH_ADMIN,
    dateLastBuild: new Date(),
    urlBase: process.env.URL_BASE ? process.env.URL_BASE : "" //backward compatibility
};