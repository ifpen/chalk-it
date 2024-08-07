const webpack = require('webpack');

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const proxyEntry = {};
if (process.env.PROXY_TO) {
  const proxyDict = {};

  // TODO extend as needed
  proxyDict['/FileSyncURI'] = { target: process.env.PROXY_TO };
  proxyDict['/ReadSettings'] = { target: process.env.PROXY_TO };
  proxyDict['/exec'] = { target: process.env.PROXY_TO };

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
      ...proxyEntry,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
    },
    devtool: 'source-map',
    // devtool: 'cheap-module-eval-source-map',
    plugins: [new webpack.HotModuleReplacementPlugin()],
  });
