const { merge } = require('webpack-merge');
const common = require('./webpack.prod.js');

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env) =>
  merge(common(env), {
    plugins: [new BundleAnalyzerPlugin()],
  });
