const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const devMode = process.env.NODE_ENV !== 'production';

console.log(`Production build: ${!devMode}`);

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
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, '../build'),
    publicPath: '',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(js|mjs|ts)$/,
        resolve: {
          fullySpecified: false,
        },
      },
      {
        // TODO change file names
        //test: /\.worker\.js$/,
        test: /-worker\.js$/i,
        exclude: /node_modules/,
        use: [
          {
            loader: 'worker-loader',
            options: {
              filename: devMode ? '[name].js' : '[name].[contenthash].js',
            },
          },
          'babel-loader',
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [devMode ? 'style-loader' : MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.(jpeg|jpg|svg|gif|png|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[path][name][ext]',
        },
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[path][name][ext]',
        },
      },
      {
        test: /\.html$/,
        use: 'html-loader',
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
    ...(env.enableEslintPlugin ? [new ESLintPlugin()] : []),
    new webpack.DefinePlugin({
      ...confDic,
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
      process: 'process/browser',
    }),
    new HTMLWebpackPlugin({
      template: './index_tmp.html',
      title: 'Webpack: AngularJS Configuration',
      chunks: ['editor'],
      favicon: devMode ? 'source/assets/img/chalk-it-icon.ico' : 'assets/img/chalk-it-icon.ico',
    }),
    new HTMLWebpackPlugin({
      template: './index_view_tmp.html',
      title: 'Webpack: AngularJS Configuration',
      filename: 'index-view.html',
      chunks: ['dashboard'],
      favicon: devMode ? 'source/assets/img/chalk-it-icon.ico' : 'assets/img/chalk-it-icon.ico',
    }),
    new MomentLocalesPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'chalkit_python_api-*.whl' },
        {
          context: 'source/assets/',
          from: '**/*.{jpeg,jpg,gif,png,ico,eot,svg,ttf,woff,woff2}',
          to: 'assets/',
        },
        {
          context: path.resolve(__dirname, '../../documentation/site/'),
          from: '**/*.*',
          to: 'doc/',
        },
      ],
    }),
  ],
});
