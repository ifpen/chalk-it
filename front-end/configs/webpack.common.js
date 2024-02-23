const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const devMode = process.env.NODE_ENV !== 'production';

console.log(`production build: ${!devMode}`);

const PLUGINS = ['./source/kernel/dashboard/plugins/plugins.js', './source/kernel/datanodes/plugins/plugins.js'];

module.exports = {
  entry: {
    studio: [...PLUGINS, './source/main-studio.js'],
  },
  resolve: {
    modules: ['source', 'thirdparty', 'node_modules'],
  },
  mode: 'development',
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
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
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
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
        test: /\.(jpeg|jpg|gif|png|ico)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/[name].[ext]',
              emitFile: false,
            },
          },
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'assets/[name].[ext]',
              emitFile: false,
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
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
    }),
    new HTMLWebpackPlugin({
      template: './index_tmp.html',
      title: 'Webpack: AngularJS configuration',
    }),
    new CopyWebpackPlugin([
      {
        from: 'xdash_python_api-*.whl',
      },
      {
        context: 'source/assets/',
        from: '**/*.{jpeg,jpg,gif,png,ico,eot,svg,ttf,woff,woff2}',
        to: 'assets/',
        flatten: true,
      },
    ]),
  ],
};
