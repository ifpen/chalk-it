module.exports = {
  paths: {
    src: 'assets/css',
    dist: 'release',
    devDist: 'dev-release',
    tmp: '.tmp',
    e2e: 'e2e',
    docName: 'doc',
    buildDirectory: 'build',
  },
  filesName: {
    xdash_editor: {
      css: 'all-css-editor-',
      header: 'header-all-js-editor-',
      body: 'body-all-js-editor-',
      path: 'xdash_editor',
    },
    filesName: {
      xdash_editor: {
        css: 'all-css-editor-',
        js: 'all-js-editor-',
        path: 'xdash_editor',
      },
      xdash_runtime: {
        css: 'all-css-runtime-',
        js: 'all-js-runtime-',
        path: 'xdash_runtime:',
      },
      workers: {
        pyodide: 'pyodide-worker-',
      },
    },
  },
};
