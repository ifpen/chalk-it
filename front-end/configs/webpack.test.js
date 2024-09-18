const nodeExternals = require('webpack-node-externals');

module.exports = (env) => ({
  target: 'node',
  externals: [nodeExternals()],
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
});
