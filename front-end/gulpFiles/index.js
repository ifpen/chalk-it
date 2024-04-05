let path = require('path');
let fs = require('fs');
let _ = require('lodash');
let jsJsonFileConfig;
let Env = 'dev';
let envFile = '.env.dev';

let initProject = function (env) {
  jsJsonFileConfig = JSON.parse(fs.readFileSync('./JsFiles.json'));
  Env = env;

  if (Env === 'prod') {
    envFile = '.env.prod';
  } else {
    envFile = '.env.dev';
  }
  try {
    let envPath = path.join(__dirname + '/../', envFile);
    fs.accessSync(envPath, fs.F_OK);
    var t = require('dotenv').config({ path: envPath });
  } catch (e) {
    console.log(e);
  }
  let ConfigEnv = {};
  let ConfigFile = require('../configs/config.js');

  let configGlobal = _.merge({}, ConfigFile.config, ConfigEnv.config);

  return {
    config: configGlobal,
    env: env,
    allFiles: jsJsonFileConfig,
  };
};

let Result = function (env) {
  return initProject(env);
};

module.exports.config = Result;
