import fs from 'fs';
import { config as configEnv } from 'dotenv';

configEnv({ path: '.env.prod' });

const { config } = await import('./config.js');

const xDashConfig = config.xDashConfig;
const xdashAddr = xDashConfig.urlBase || xDashConfig.urlBaseForExport;

const insert_txt = `
xdashAddr = "${xdashAddr}";
bIsBasicVersion = "${xDashConfig.xDashBasicVersion}";
`;

const INSERTION_MARKER = '// ** Insert configuration here ** // Do not remove';
const CONF_FILE = '../documentation/site/mkdocs-open-xprjson.js';
fs.readFile(CONF_FILE, 'utf8', function (err, data) {
  if (err) throw err;

  if (!data.includes(INSERTION_MARKER)) {
    throw new Error(`no insertion marker "${INSERTION_MARKER}" in file ""${CONF_FILE}`);
  }
  const result = data.replace(INSERTION_MARKER, insert_txt);

  fs.writeFile(CONF_FILE, result, 'utf8', function (err) {
    if (err) throw err;
    console.log(`Configuration inserted into ${CONF_FILE}`);
  });
});
