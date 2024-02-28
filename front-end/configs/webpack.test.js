const path = require('path');
const nodeExternals = require('webpack-node-externals');
const common = require('./webpack.common.js');

module.exports = {
  target: 'node',
  externals: [nodeExternals()],
  resolve: {
    modules: common.resolve.modules,
    alias: {
      'config.js$': path.resolve(__dirname, '../configs/config.dev.js'),
    },
  },
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
};
