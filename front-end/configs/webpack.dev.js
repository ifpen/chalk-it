const webpack = require('webpack');

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const proxyEntry = {};
if (process.env.PROXY_TO) {
  // TODO extend as needed
  const proxyDict = {
    '/FileSyncURI': { target: process.env.PROXY_TO },
    '/ReadSettings': { target: process.env.PROXY_TO },
    '/exec': { target: process.env.PROXY_TO },
  };

  proxyEntry['proxy'] = proxyDict;
}

module.exports = (env) =>
  merge(common(env), {
    mode: 'development',
    optimization: {
      splitChunks: {
        cacheGroups: {
          default: false,
        },
      },
    },
    devServer: {
      port: process.env.PORT || 7854,
      client: {
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: true,
        },
      },
      proxy: proxyEntry.proxy || {},
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
      open: true, // Automatically opens the browser when the server starts
    },
    devtool: 'source-map',
    // devtool: 'cheap-module-eval-source-map',
    plugins: [new webpack.HotModuleReplacementPlugin()],
  });
