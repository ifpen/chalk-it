// Monkey-patch to get around https://github.com/webpack/webpack/issues/13572
const crypto = require('crypto');
const crypto_orig_createHash = crypto.createHash;
crypto.createHash = (algorithm) => crypto_orig_createHash(algorithm == 'md4' ? 'sha256' : algorithm);

const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

console.log(`production build: ${!devMode}`);

require('dotenv').config({ path: devMode ? '.env.dev' : '.env.prod' });

const config = require('./config');
const confDic = Object.fromEntries(
  Object.entries(config.config).map(([k, v]) => [`__CONFIG_DIC__.${k}`, JSON.stringify(v)])
);

const PLUGINS = ['./source/kernel/dashboard/plugins/plugins.js', './source/kernel/datanodes/plugins/plugins.js'];

module.exports = (env) => ({
  entry: {
    editor: ['kernel/utils/editor-asserts.js', ...PLUGINS, './source/main-studio.js'],
    dashboard: ['kernel/utils/runtime-asserts.js', ...PLUGINS, './source/main-dashboard.js'],
  },
  resolve: {
    modules: ['source', 'thirdparty', 'node_modules'],
  },
  mode: 'development',
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, '../build'),
    publicPath: '',
    pathinfo: false,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader' }],
      },
      {
        // TODO change file names
        //test: /\.worker\.js$/,
        test: /-worker\.js$/i,
        use: [
          {
            loader: 'worker-loader',
            options: {
              filename: devMode ? '[name].js' : '[name].[contenthash].js',
            },
          },
          { loader: 'babel-loader' },
        ],
      },
      {
        test: /\.css$/,
        use: [devMode ? 'style-loader' : MiniCssExtractPlugin.loader, { loader: 'css-loader' }],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          { loader: 'css-loader' },
          { loader: 'sass-loader' },
        ],
      },
      {
        test: /\.(jpeg|jpg|svg|gif|png|ico)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/[path][name].[ext]',
              context: 'source/assets/',
              publicPath: '',
            },
          },
        ],
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/[path][name].[ext]',
              context: 'source/assets/',
              publicPath: '',
            },
          },
        ],
      },
      {
        test: /\.html$/,
        use: [{ loader: 'html-loader' }],
      },
    ],
  },
  plugins: [
    ...(devMode
      ? []
      : [
          new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
          }),
        ]),
    ...(env.enableEslintPlugin ? [new ESLintPlugin({})] : []),
    new webpack.DefinePlugin({
      ...confDic,
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
    }),
    new HTMLWebpackPlugin({
      template: './index_tmp.html',
      title: 'Webpack: AngularJS configuration',
      chunks: ['editor'],
    }),
    new HTMLWebpackPlugin({
      template: './index_view_tmp.html',
      title: 'Webpack: AngularJS configuration',
      filename: 'index-view.html',
      chunks: ['dashboard'],
    }),
    new MomentLocalesPlugin(),
    new CopyWebpackPlugin([
      {
        from: 'chalkit_python_api-*.whl',
      },
      {
        context: 'source/assets/',
        from: '**/*.{jpeg,jpg,gif,png,ico,eot,svg,ttf,woff,woff2}',
        to: 'assets/',
        flatten: false, // Ensure folder structure is preserved
      },
      ...(env.includeDocumentation
        ? [
            {
              context: '../documentation/site/',
              from: '**/*.*',
              to: 'doc/',
            },
          ]
        : []),
    ]),
  ],
});
