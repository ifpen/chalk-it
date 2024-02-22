const env = process.env;
const VERSION_XDASH_A = env.VERSION_XDASH_A || '0';
const VERSION_XDASH_B = env.VERSION_XDASH_B || '000';

function getVersion() {
  if (env.VERSION_XDASH_C == 0) {
    const dateToday = new Date();
    const dateStart = new Date('01/01/2000');
    const result = Math.abs(dateStart.getTime() - dateToday.getTime());
    return Math.ceil(result / (3600000 * 24));
  }
  return env.VERSION_XDASH_C;
}

const VERSION_XDASH_C = getVersion();
const VERSION = VERSION_XDASH_A + '.' + VERSION_XDASH_B + '.' + VERSION_XDASH_C;
const VERSION_CHALK_IT = env.VERSION_CHALK_IT;

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
    disableRegistration: env.DISABLE_REGISTRATION || 'false',
    disableLocalServer: env.DISABLE_LOCAL_SERVER || 'false',
    urlDoc: urlDoc || '/doc/',
    urlBase: env.URL_BASE || '',
    urlBaseForExport: env.URL_BASE_FOR_EXPORT || '',
    urlWebSite: env.URL_WEBSITE || '',
    jsonEditorDatanodes: jsEditorDn,
    version: {
      major: VERSION_XDASH_A,
      minor: VERSION_XDASH_B,
      dateStamp: VERSION_XDASH_C,
      fullVersion: VERSION,
      chalkitVersion: VERSION_CHALK_IT,
    },
    disableSchedulerLog,
    disableSchedulerProfiling,
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
