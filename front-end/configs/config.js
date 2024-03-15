const fs = require('fs');
const env = process.env;

// Utility function to read and parse JSON from a file
function readJsonVersion(filePath, formatVersion) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    if (formatVersion && typeof formatVersion === 'function') return formatVersion(jsonData);
    return jsonData;
  } catch (err) {
    console.error(`Error reading the version.json file from ${filePath}:`, err);
  }
}

const xDashJsonVersion = readJsonVersion('../version.json');
const chalkitVersion = readJsonVersion('../../version.json', (data) => `${data.major}.${data.minor}.${data.patch}`);

console.log(xDashJsonVersion); // Output the xDash version
console.log(chalkitVersion); // Output the Chalkit version

function getVersion() {
  if (xDashJsonVersion.C == 0) {
    const dateToday = new Date();
    const dateStart = new Date('01/01/2000');
    const result = Math.abs(dateStart.getTime() - dateToday.getTime());
    return Math.ceil(result / (3600000 * 24));
  }
  return xDashJsonVersion.C;
}

const VERSION_XDASH_A = xDashJsonVersion.A || '0';
const VERSION_XDASH_B = xDashJsonVersion.B || '000';
const VERSION_XDASH_C = getVersion();
const VERSION = VERSION_XDASH_A + '.' + VERSION_XDASH_B + '.' + VERSION_XDASH_C;
const VERSION_CHALK_IT = chalkitVersion;

if (env.JSON_EDITOR_DATASOURCES != undefined) {
  //compatibility
  env.JSON_EDITOR_DATANODES = env.JSON_EDITOR_DATASOURCES;
}
// datanodes with JSON Editor input
const jsEditorDn = env.JSON_EDITOR_DATANODES === 'true';
const disableAuth = env.DISABLE_AUTH !== 'false';
const disableSchedulerLog = env.DISABLE_SCHEDULER_LOG !== 'false';
const disableSchedulerProfiling = env.DISABLE_SCHEDULER_PROFILING === 'true';
const urlDoc = env.LITE_BUILD === 'true' ? 'https://ifpen.github.io/chalk-it/hosted/doc/' : env.URL_DOC;

module.exports.config = {
  port: env.PORT || 7854,
  xDashConfig: {
    xDashBasicVersion: disableAuth.toString(),
    xDashLiteVersion: env.LITE_BUILD || 'false',
    taipyLink: env.TAIPY_LINK || 'false',
    disableRegistration: env.DISABLE_REGISTRATION || 'false',
    disableLocalServer: env.DISABLE_LOCAL_SERVER || 'false',
    urlDoc: urlDoc || '/doc/',
    urlBase: env.URL_BASE || '',
    urlBaseForExport: env.URL_BASE_FOR_EXPORT || '',
    urlWebSite: env.URL_WEBSITE || '',
    jsonEditorDatanodes: jsEditorDn.toString(),
    version: {
      major: VERSION_XDASH_A,
      minor: VERSION_XDASH_B,
      dateStamp: VERSION_XDASH_C,
      fullVersion: VERSION,
      chalkitVersion: VERSION_CHALK_IT,
    },
    disableSchedulerLog: disableSchedulerLog.toString(),
    disableSchedulerProfiling: disableSchedulerProfiling.toString(),
    pyodide: {
      standard_pyodide_packages: env.STANDARD_PYODIDE_PACKAGES || '',
      micropip_pyodide_packages: env.MICROPIP_PYODIDE_PACKAGES || '',
      pyodide_index: env.PYODIDE_INDEX || '',
      xdash_lib_url: env.XDASH_LIB_URL || '',
    },
    disablePythonSlim: env.DISABLE_PYTHON_SLIM,
    copyright: '\u00A9 2016-' + new Date().getFullYear() + ' IFP Energies nouvelles',
  },
  xServConfig: {
    url: disableAuth ? env.URL_LOCAL_SERVER : env.URL_SERVER,
    urlApi: disableAuth ? null : env.URL_API,
    urlApiFMI: disableAuth ? null : env.URL_FMI_API,
    urlxProxy: env.URL_XPROXY,
  },
  urlPython: env.URL_PYTHON,
  urlxDashNodeServer: env.URL_XDASH_NODE_SERVER,
  urlAdminApp: env.URL_XDASH_ADMIN,
  dateLastBuild: new Date(),
  urlBase: env.URL_BASE || '', //backward compatibility
};
