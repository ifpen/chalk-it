const path = require('path');
const webpack = require('webpack');

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  optimization: {
    splitChunks: {
      cacheGroups: {
        default: false,
      },
    },
  },
  devServer: {
    //port: 9001,
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: true,
      },
    },
    proxy: {
      // TODO extend
      '/FileSyncURI': {
        target: 'http://127.0.0.1:7854',
      },
      '/exec': {
        target: 'http://127.0.0.1:7854',
      },
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
  devtool: 'source-map',
  //devtool: 'cheap-module-eval-source-map',
  plugins: [new webpack.HotModuleReplacementPlugin()],
});
