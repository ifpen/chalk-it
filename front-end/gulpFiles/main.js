let { src, dest, watch, series, parallel, task } = require('gulp');

let browsersync = require('browser-sync').create(),
  gulp = require('gulp'),
  sass = require('gulp-dart-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  configuration = require('./config'),
  usemin = require('gulp-usemin'),
  pngquant = require('imagemin-pngquant'),
  htmlmin = require('gulp-htmlmin'),
  imagemin = require('gulp-imagemin'),
  debug = require('gulp-debug'),
  del = require('del'),
  rename = require('gulp-rename'),
  templateCache = require('gulp-angular-templatecache'),
  terser = require('gulp-terser'),
  concat = require('gulp-concat'),
  replace = require('gulp-replace'),
  argv = require('yargs').argv,
  cleanCSS = require('gulp-clean-css'),
  inject = require('gulp-inject'),
  newfile = require('gulp-file'),
  injectString = require('gulp-inject-string'),
  jshint = require('gulp-jshint'),
  pkg = require('../package.json'),
  semver = require('semver'),
  cors = require('cors'),
  connect = require('gulp-connect'),
  fs = require('fs'),
  exec = require('child_process').exec,
  Env = argv.env ?? 'dev',
  addVersion = true,
  GlobalConfig = [],
  filesName = configuration.filesName,
  generatedPageHeaderJsList = [],
  generatedPageBodyJsList = [],
  generatedPageCssList = [],
  xdashEditorBodyJsList = [],
  xdashEditorHeaderJsList,
  xdashEditorCssJsList,
  xdashRuntimeHeaderJsList,
  xdashRuntimeBodyJsList,
  xdashRuntimeCssJsList,
  xdashEditorCss = filesName.xdash_editor.css,
  xdashEditorHeader = filesName.xdash_editor.header,
  xdashEditorBody = filesName.xdash_editor.body,
  xdashRuntimeCss = filesName.xdash_runtime.css,
  xdashRuntimeHeader = filesName.xdash_runtime.header,
  xdashRuntimeBody = filesName.xdash_runtime.body,
  buildFilePath,
  buildDirPath,
  VERSION;
getXdashWorkerPyodideFile = () =>
  `${filesName.workers.pyodide}${
    addVersion && Env === 'prod' ? GlobalConfig.config.xDashConfig.version.fullVersion : Env
  }.js`;

ListTasksBeforeInject = 'createConfigurationFile';

const nodeVersion = pkg.engines.node;
// Compare installed NodeJs version with required NodeJs version.
if (!semver.satisfies(process.version, nodeVersion)) {
  console.log(`Required node version ${nodeVersion} not satisfied with current version ${process.version}.`);
  process.exit(1);
} else {
  console.log(
    `NodeJS Version Check: Required node version ${nodeVersion} SATISFIED with current version ${process.version}.`
  );
}

// Delete tmp and build directories
//We just do it at the beginning
var clear_cache = del(['../.tmp'], { force: true });
var clear_build = del(['../.build'], { force: true });

var dir = __dirname + '/../reports/jshint/html/';
if (!fs.existsSync(dir)) {
  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) throw err;
  });
}

task('clear:cache', () => {
  return del(['../.tmp'], { force: true });
});

task('clear:build', () => {
  return del(['../.build'], { force: true });
});

task('clear:config', () => {
  return del(['../configs/config.*.js'], { force: true });
});

task('clear:index', () => {
  return del(['../.index'], { force: true });
});

task('clear', series('clear:index', 'clear:config', 'clear:build'));

task('sass', () => {
  return src(['../source/assets/style/runtime.scss', '../source/assets/style/studio.scss'])
    .pipe(sourcemaps.init())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(sourcemaps.write('.', { includeContent: false, sourceRoot: '.' }))
    .pipe(dest('../source/assets/style/'));
});

task('init', (cb) => {
  if (Env === 'prod') {
    ListTasksBeforeInject =
      ('createConfigurationFile', 'usemin:xdash_editor:header', 'usemin:xdash_editor:body', 'usemin:xdash_editor:css');
  } else {
    ListTasksBeforeInject = 'createConfigurationFile';
  }
  GlobalConfig = require('./index').config(Env);

  VERSION = GlobalConfig.config.xDashConfig.version.fullVersion;
  prefixName = GlobalConfig.config.xDashConfig.xDashBasicVersion ? '/chalkit_' : '/xdash_';
  buildFilePath = prefixName + VERSION;
  buildDirPath = '../' + configuration.paths.buildDirectory + buildFilePath;
  mkDocsFileName = GlobalConfig.config.xDashConfig.xDashLiteVersion ? 'mkdocs.yml' : 'mkdocs_taipy.yml';

  if (addVersion) {
    filesName.xdash_editor.css = xdashEditorCss + VERSION;
    filesName.xdash_editor.header = xdashEditorHeader + VERSION;
    filesName.xdash_editor.body = xdashEditorBody + VERSION;
    filesName.xdash_runtime.css = xdashRuntimeCss + VERSION;
    filesName.xdash_runtime.header = xdashRuntimeHeader + VERSION;
    filesName.xdash_runtime.body = xdashRuntimeBody + VERSION;
  }

  // Insert the configuration at the top
  GlobalConfig.allFiles.xDashStudio.header.unshift('configs/config.' + Env + '.js');
  GlobalConfig.allFiles.xDashRuntime.header.unshift('configs/config.' + Env + '.js');

  // In production, html is inlined in templates.js
  // Not in development, otherwise reload problem after modification
  if (Env === 'prod') {
    GlobalConfig.allFiles.xDashStudio.header.push('.tmp/templates.js');
  }

  return cb();
});

task('template', () => {
  return src('../source/angular/**/*.html')
    .pipe(
      templateCache('templates.js', {
        module: 'xCLOUD',
        root: 'source/angular',
        standAlone: true,
      })
    )
    .pipe(dest('../' + configuration.paths.tmp));
});

task(
  'logs',
  series('clear:cache', 'init', (cb) => {
    console.log('\n                         -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*');
    console.log('                              xDash Vesion : ' + VERSION);
    console.log('                         -*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*');
    console.log('                                    EV ENV :', Env);
    console.log('                                       --------- \n');
    console.log('                                                 \n');
    console.log('                                                 \n');
    console.log('configuration :', configuration);
    return cb();
  })
);

task(
  'createConfigurationFile',
  series('init', 'template', (cb) => {
    Env = argv.env ? argv.env : 'dev';
    console.log('EV ENV :', Env);

    let jsFile =
      '/**\n' +
      ' * file autogenerated by gulp to declare all global var in the application defined in the config.js and the' +
      ' {{' +
      Env +
      '}}.config.js files \n' +
      ' */\n\n\n';

    const nameFile = 'config.' + Env + '.js';

    for (const prop in GlobalConfig.config) {
      if (GlobalConfig.config.hasOwnProperty(prop)) {
        if (prop == 'here_app_id' || prop == 'here_app_code') {
          jsFile += 'var ' + prop + ' = ' + JSON.stringify(GlobalConfig.config[prop]) + ' ;\n';
        } else {
          jsFile += 'var ' + prop + ' = ' + JSON.stringify(GlobalConfig.config[prop]) + ' ;\n'; // const here for security
        }
      }
    }
    const dirConfig = '../configs';
    const allFiles = GlobalConfig.allFiles;

    if (Env === 'prod') {
      generatedPageHeaderJsList = [xdashRuntimeHeader + '.min.js'];
      generatedPageBodyJsList = [xdashRuntimeBody + '.min.js'];
      generatedPageCssList = ['assets/' + xdashRuntimeCss + '.min.css'];

      xdashEditorBodyJsList = [xdashEditorBody + '.min.js'];
      xdashEditorHeaderJsList = [xdashEditorHeader + '.min.js'];
      xdashEditorCssJsList = [xdashEditorCss + '.min.css'];

      xdashRuntimeHeaderJsList = [xdashRuntimeHeader + '.min.js'];
      xdashRuntimeBodyJsList = [xdashRuntimeBody + '.min.js'];
      xdashRuntimeCssJsList = [xdashRuntimeCss + '.min.css'];
    } else {
      generatedPageHeaderJsList = allFiles.xDashRuntime.header;
      generatedPageBodyJsList = allFiles.xDashRuntime.body;
      generatedPageCssList = allFiles.xDashRuntime.css;

      xdashEditorBodyJsList = allFiles.xDashStudio.body;
      xdashEditorHeaderJsList = allFiles.xDashStudio.header;
      xdashEditorCssJsList = allFiles.xDashStudio.css;

      xdashRuntimeHeaderJsList = allFiles.xDashRuntime.header;
      xdashRuntimeBodyJsList = allFiles.xDashRuntime.body;
      xdashRuntimeCssJsList = allFiles.xDashRuntime.css;
    }

    jsFile +=
      '\n' +
      'var exportHeaderCss = ' +
      JSON.stringify(generatedPageCssList) +
      ';\n' +
      'var exportHeaderJs = ' +
      JSON.stringify(generatedPageHeaderJsList) +
      ';\n' +
      'var exportBodyJs = ' +
      JSON.stringify(generatedPageBodyJsList) +
      ';\n' +
      'var xdashEditorBodyJsList = ' +
      JSON.stringify(xdashEditorBodyJsList) +
      ';\n';

    newfile(nameFile, jsFile).pipe(dest(dirConfig));

    setTimeout(function () {
      return cb();
    }, 3000);
  })
);

let fixPath = function (List, basePath) {
  let path = basePath ? basePath : '../';
  for (let t = 0; t < List.length; t++) {
    List[t] = path + List[t];
  }
  return List;
};

task(
  'usemin:xdash_editor:body',
  series('createConfigurationFile', () => {
    return src(fixPath(GlobalConfig.allFiles.xDashStudio.body))
      .on('error', () => {
        /* Ignore compiler errors */
      })
      .pipe(
        terser().on('error', function (e) {
          console.log(e);
          return this.end();
        })
      )
      .pipe(concat(xdashEditorBody + '.min.js'))
      .pipe(replace('source/assets/', 'assets/'))
      .pipe(dest(buildDirPath));
  })
);

task(
  'usemin:xdash_runtime:body',
  series('createConfigurationFile', () => {
    return src(fixPath(GlobalConfig.allFiles.xDashRuntime.body))
      .on('error', () => {
        /* Ignore compiler errors */
      })
      .pipe(
        terser().on('error', function (e) {
          console.log(e);
          return this.end();
        })
      )
      .pipe(concat(xdashRuntimeBody + '.min.js'))
      .pipe(replace('source/assets/', 'assets/'))
      .pipe(dest(buildDirPath));
  })
);

task(
  'usemin:xdash_runtime:header',
  series('createConfigurationFile', () => {
    return src(fixPath(GlobalConfig.allFiles.xDashRuntime.header))
      .on('error', () => {
        /* Ignore compiler errors */
      })
      .pipe(
        terser().on('error', function (e) {
          console.log(e);
          return this.end();
        })
      )
      .pipe(concat(xdashRuntimeHeader + '.min.js'))
      .pipe(replace(`${filesName.workers.pyodide}dev.js`, getXdashWorkerPyodideFile()))
      .pipe(replace('source/assets/', 'assets/'))
      .pipe(dest(buildDirPath));
  })
);

task(
  'usemin:xdash_editor:header',
  series('createConfigurationFile', () => {
    return src(fixPath(GlobalConfig.allFiles.xDashStudio.header))
      .on('error', () => {
        /* Ignore compiler errors */
      })
      .pipe(
        terser().on('error', function (e) {
          console.log(e);
          return this.end();
        })
      )
      .pipe(concat(xdashEditorHeader + '.min.js'))
      .pipe(replace(`${filesName.workers.pyodide}dev.js`, getXdashWorkerPyodideFile()))
      .pipe(replace('source/assets/', 'assets/'))
      .pipe(dest(buildDirPath));
  })
);

task('usemin:xdash_editor', series('usemin:xdash_editor:header', 'usemin:xdash_editor:body'));

task(
  'usemin:xdash_editor:css',
  series('init', () => {
    return src(fixPath(GlobalConfig.allFiles.xDashStudio.css))
      .pipe(cleanCSS({ compatibility: 'ie8' }))
      .pipe(concat(xdashEditorCss + '.min.css'))
      .pipe(replace('../fonts/', './fonts/'))
      .pipe(replace('../img/', './img/'))
      .pipe(replace('../icon/', './icon/'))
      .pipe(dest(buildDirPath + '/assets'));
  })
);

task(
  'usemin:xdash_runtime:css',
  series('init', () => {
    return src(fixPath(GlobalConfig.allFiles.xDashRuntime.css))
      .pipe(cleanCSS({ compatibility: 'ie8' }))
      .pipe(concat(xdashRuntimeCss + '.min.css'))
      .pipe(replace('../fonts/', './fonts/'))
      .pipe(replace('../img/', './img/'))
      .pipe(replace('../icon/', './icon/'))
      .pipe(dest(buildDirPath + '/assets'));
  })
);

task(
  'inject:files:pyodide_worker',
  series('init', () => {
    Env = argv.env ?? 'dev';
    const isProd = Env === 'prod';

    let destination = '../';
    if (isProd) {
      destination = buildDirPath + '/';
    }

    const configFile = '../configs/config.' + Env + '.js';
    const dependenciesFiles = ['../thirdparty/pyodide.js', '../thirdparty/json_parseMore.js'];
    const workerFile = '../source/kernel/base/pyodide-worker.js';

    let pipe = src([configFile, ...dependenciesFiles, workerFile])
      .pipe(debug())
      .pipe(sourcemaps.init())
      .pipe(concat(getXdashWorkerPyodideFile()));

    if (isProd) {
      pipe = pipe.pipe(
        terser().on('error', function (e) {
          console.log(e);
          return this.end();
        })
      );
    }
    pipe = pipe.pipe(sourcemaps.write('.')).pipe(dest(destination));

    if (!isProd) {
      pipe = pipe.pipe(connect.reload());
    }

    return pipe;
  })
);

task(
  'inject:files:prod',
  series('usemin:xdash_editor:header', 'usemin:xdash_editor:body', 'usemin:xdash_editor:css', () => {
    console.log('EV ENV :', Env);

    const destination = `${buildDirPath}/`;
    const baseFileJs = destination;
    const baseFileCss = `${baseFileJs}assets/`;

    const header = src(fixPath(xdashEditorHeaderJsList, baseFileJs), { read: false });
    const css = src(fixPath(xdashEditorCssJsList, baseFileCss), { read: false, addRootSlash: true });

    const injectOptions = { ignorePath: destination, empty: true, addRootSlash: false };

    return src('../index_tmp.html')
      .pipe(inject(header, { ...injectOptions, name: 'third' }))
      .pipe(inject(css, { ...injectOptions }))
      .pipe(debug())
      .pipe(rename('index.html'))
      .pipe(replace('source/assets', 'assets'))
      .pipe(replace('source/starter-browser-compatibility.js', 'starter-browser-compatibility.js'))
      .pipe(
        usemin({
          html: [() => htmlmin({ collapseWhitespace: true })],
        })
      )
      .pipe(dest(destination));
  })
);

task(
  'inject:files',
  series(ListTasksBeforeInject, () => {
    console.log('EV ENV :', Env);

    const isProd = Env === 'prod';
    const destination = isProd ? `${buildDirPath}/` : '../';
    const baseFileJs = isProd ? destination : '';
    const baseFileCss = isProd ? `${baseFileJs}assets/` : '';

    const injectOptions = {
      ignorePath: destination,
      empty: true,
      addRootSlash: false,
    };

    const header = src(fixPath(xdashEditorHeaderJsList, baseFileJs), { read: false });
    const css = src(fixPath(xdashEditorCssJsList, baseFileCss), { read: false, addRootSlash: true });

    let stream = src('../index_tmp.html')
      .pipe(inject(header, { ...injectOptions, name: 'third' }))
      .pipe(inject(css, injectOptions))
      .pipe(debug())
      .pipe(rename('index.html'));

    if (isProd) {
      stream = stream
        .pipe(replace('source/assets', 'assets'))
        .pipe(replace('source/starter-browser-compatibility.js', 'starter-browser-compatibility.js'))
        .pipe(
          usemin({
            html: [() => htmlmin({ collapseWhitespace: true })],
          })
        )
        .pipe(dest(destination));
    } else {
      stream = stream.pipe(dest(destination)).pipe(connect.reload());
    }

    return stream;
  })
);

task(
  'inject:files:view:dev',
  series('createConfigurationFile', () => {
    console.log('EV ENV :', Env);

    const isProd = Env === 'prod';
    const destination = isProd ? `${buildDirPath}/` : '../';
    const baseFileJs = isProd ? destination : '';
    const baseFileCss = isProd ? `${baseFileJs}assets/` : '';

    const injectOptions = {
      ignorePath: destination,
      empty: true,
      addRootSlash: false,
      selfClosingTag: true,
    };

    const injectFiles = (fileList, basePath, options = {}) =>
      src(fixPath(fileList, basePath), {
        read: false,
        ...options,
      });

    const headerStream = injectFiles(xdashRuntimeHeaderJsList, baseFileJs);
    const bodyStream = injectFiles(xdashRuntimeBodyJsList, baseFileJs);
    const cssStream = injectFiles(xdashRuntimeCssJsList, baseFileCss, { addRootSlash: true });

    const fileName = isProd ? `index-view-${VERSION}.html` : 'index-view.html';

    let fileStream = src('../xprjson-view_tmp.html')
      .pipe(inject(headerStream, { ...injectOptions, name: 'header' }))
      .pipe(inject(bodyStream, { ...injectOptions, name: 'body' }))
      .pipe(inject(cssStream, injectOptions))
      .pipe(debug())
      .pipe(rename(fileName))
      .pipe(dest(destination));

    // Apply live reload for development environment
    if (!isProd) {
      fileStream = fileStream.pipe(connect.reload());
    }

    return fileStream;
  })
);

task(
  'inject:files:view',
  series('usemin:xdash_runtime:header', 'usemin:xdash_runtime:body', 'usemin:xdash_runtime:css', () => {
    console.log('EV ENV :', Env);

    const isProd = Env === 'prod';
    const destination = isProd ? `${buildDirPath}/` : '../';
    const baseFileJs = isProd ? destination : '';
    const baseFileCss = isProd ? `${baseFileJs}assets/` : '';

    const injectOptions = {
      ignorePath: destination,
      empty: true,
      addRootSlash: false,
      selfClosingTag: true,
    };

    const injectFiles = (fileList, basePath, options = {}) =>
      src(fixPath(fileList, basePath), {
        read: false,
        ...options,
      });

    const header = injectFiles(xdashRuntimeHeaderJsList, baseFileJs);
    const body = injectFiles(xdashRuntimeBodyJsList, baseFileJs);
    const css = injectFiles(xdashRuntimeCssJsList, baseFileCss, { addRootSlash: true });

    const fileName = isProd ? `index-view-${VERSION}.html` : 'index-view.html';

    return src('../xprjson-view_tmp.html')
      .pipe(inject(header, { ...injectOptions, name: 'header' }))
      .pipe(inject(body, { ...injectOptions, name: 'body' }))
      .pipe(inject(css, injectOptions))
      .pipe(replace('source/starter-browser-compatibility.js', 'starter-browser-compatibility.js'))
      .pipe(debug())
      .pipe(rename(fileName))
      .pipe(dest(destination));
  })
);

task(
  'images',
  series('clear:cache', 'clear:build', () => {
    return src([
      '../source/assets/**/*.png',
      '../source/assets/**/*.gif',
      '../source/assets/**/*.jpg',
      '../source/assets/**/*.svg',
      '../source/assets/**/*.woff2',
      '../source/assets/**/*.woff',
      '../source/assets/**/*.ttf',
      '../source/assets/**/*.ico',
      '../source/assets/**/*.eot',
    ])
      .pipe(
        imagemin({
          progressive: false,
          svgoPlugins: [{ removeViewBox: true }],
          use: [pngquant()],
        })
      )
      .pipe(dest(buildDirPath + '/assets'));
  })
);

task('copy', () => {
  Env = argv.env ? argv.env : 'dev';
  GlobalConfig = require('./index').config(Env);
  DocDirectory = '../doc';
  if (Env === 'prod') {
    DocDirectory = buildDirPath + '/' + configuration.paths.docName;
  }
  console.log('DocDirectory', DocDirectory);
  console.log('EV ENV :', Env);
  return src([
    '../../documentation/docs/**/*.*',
    '../../documentation/docs/node_modules/prismjs/components/**/*.*',
    '!../../documentation/docs/node_modules/**',
  ])
    .pipe(
      imagemin({
        progressive: false,
        svgoPlugins: [{ removeViewBox: true }],
        use: [pngquant()],
      })
    )
    .pipe(dest(DocDirectory));
});

task('buildmk', function (cb) {
  exec('mkdocs build -c -f "../../documentation/' + mkDocsFileName + '"', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

task('copymk', () => {
  Env = argv.env ? argv.env : 'dev';
  GlobalConfig = require('./index').config(Env);
  DocDirectory = '../doc';
  if (Env === 'prod') {
    DocDirectory = buildDirPath + '/' + configuration.paths.docName;
  }
  console.log('DocDirectory', DocDirectory);
  console.log('EV ENV :', Env);
  return src(['../../documentation/site/**/*.*'])
    .pipe(
      imagemin({
        progressive: false,
        svgoPlugins: [{ removeViewBox: true }],
        use: [pngquant()],
      })
    )
    .pipe(dest(DocDirectory));
});

task('inject:after', () => {
  return src(DocDirectory + '/index.html')
    .pipe(
      injectString.after(
        'above declarations **',
        '\n  xdashAddr ="' +
          (GlobalConfig.config.xDashConfig.urlBase
            ? GlobalConfig.config.xDashConfig.urlBase
            : GlobalConfig.config.xDashConfig.urlBaseForExport) +
          '";\n' +
          '  xdashDocAddr ="' +
          (GlobalConfig.config.xDashConfig.urlDoc ? GlobalConfig.config.xDashConfig.urlDoc : '/doc/') +
          '";\n' +
          '  connectString ="";\n' +
          '  bIsBasicVersion= ' +
          GlobalConfig.config.xDashConfig.xDashBasicVersion +
          ';\n'
      )
    )
    .pipe(rename('index.html'))
    .pipe(dest(DocDirectory + '/'))
    .pipe(connect.reload());
});

task('injectmk:after', () => {
  return src(DocDirectory + '/mkdocs-open-xprjson.js')
    .pipe(
      injectString.after(
        'above declarations **',
        '\n  xdashAddr ="' +
          (GlobalConfig.config.xDashConfig.urlBase
            ? GlobalConfig.config.xDashConfig.urlBase
            : GlobalConfig.config.xDashConfig.urlBaseForExport) +
          '";\n' +
          '  xdashDocAddr ="' +
          (GlobalConfig.config.xDashConfig.urlDoc ? GlobalConfig.config.xDashConfig.urlDoc : '/doc/') +
          '";\n' +
          '  connectString ="";\n' +
          '  bIsBasicVersion= ' +
          GlobalConfig.config.xDashConfig.xDashBasicVersion +
          ';\n'
      )
    )
    .pipe(rename('mkdocs-open-xprjson.js'))
    .pipe(dest(DocDirectory + '/'))
    .pipe(connect.reload());
});

task('test:lint', () => {
  return src(['../source/kernel/**/*.js', '../source/angular/**/*.js'])
    .pipe(jshint({ esversion: 9 }))
    .pipe(
      jshint.reporter('gulp-jshint-html-reporter', {
        filename: __dirname + '/../reports/jshint/html/jshint-output.html',
        createMissingFolders: false,
      })
    );
});

// define complex tasks

task('mkdocs', series('buildmk', 'copymk', 'injectmk:after'));

task('docsify', series('copy', 'inject:after'));

task('docs', series('init', 'docsify'));

task('copy-starter', function () {
  return src(['../source/starter-browser-compatibility.js']).pipe(dest(buildDirPath));
});

task('copy-taipy-worker', function () {
  return src(['../source/connectors/taipy/677.taipy-gui-base.js']).pipe(dest(buildDirPath));
});

task(
  'build',
  series(
    'clear:cache',
    'clear:build',
    'sass',
    'init',
    'mkdocs',
    'template',
    'copy-starter',
    'copy-taipy-worker',
    //'createConfigurationFile',
    //'usemin:xdash_editor:header',
    //'usemin:xdash_editor:body',
    //'usemin:xdash_editor:css',
    'inject:files:prod',
    'inject:files:pyodide_worker',
    //'usemin:_runtime:header',
    //'usemin:_runtime:body',
    //'usemin:_runtime:css',
    'inject:files:view',
    'images' //,
    //'test:lint'
  )
);

task(
  'build:runtime',
  series(
    'clear:cache',
    'clear:build',
    'sass',
    'init',
    'template',
    'copy-starter',
    'copy-taipy-worker',
    'inject:files:view',
    'images'
  )
);

task(
  'build:lite',
  series(
    'clear:cache',
    'clear:build',
    'sass',
    'init',
    'template',
    'copy-starter',
    'copy-taipy-worker',
    'inject:files:prod',
    'inject:files:pyodide_worker',
    'inject:files:view',
    'images'
  )
);

task(
  'start',
  series(
    'clear:cache',
    'sass',
    'init',
    'template',
    'inject:files',
    'inject:files:pyodide_worker',
    'inject:files:view:dev',
    'mkdocs'
  )
);

// Synchronization during development only
/*--------------------------------------------*/
// BrowserSync
function browserSync(done) {
  let dest = '../';
  if (Env === 'prod') {
    dest = '../build' + buildFilePath + '/';
  }
  browsersync.init({
    server: {
      baseDir: dest,
    },
    port: process.env.PORT ? process.env.PORT : 7854,
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Watch files
function watchFiles() {
  gulp.watch(
    // Array of files to watch
    ['../source/angular/**/*.html', '../source/**/*.js'],
    gulp.series('template', 'inject:files', browserSyncReload)
  ); // call tasks  if files in Array has changed
}

// Watch sass files
function watchSassFiles() {
  watch('../source/assets/style/**/*.scss', gulp.series('sass', browserSyncReload));
}

task('watch_', parallel(watchSassFiles, watchFiles, browserSync));

/*--------------------------------------------*/
task(
  'serve',
  series('clear:cache', 'sass', 'init', 'inject:files:pyodide_worker', 'inject:files', 'watch_', (cb) => {
    let src = '../';
    if (Env === 'prod') {
      src = '../build' + buildFilePath + '/';
    }
    connect.server({
      root: src,
      livereload: true,
      directoryListing: {
        enable: true,
        path: src,
      },
      fallback: 'index.html',
      port: GlobalConfig.config.port,
      middleware: function () {
        return [cors()];
      },
    });
    return cb();
  })
);
