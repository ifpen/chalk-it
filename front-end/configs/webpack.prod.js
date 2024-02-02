const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = {
  entry: {
    main: [
      './source/kernel/dashboard/plugins/plugins.js',
      './source/kernel/datanodes/plugins/plugins.js',
      './source/main-dashboard.js',
    ],
  },
  mode: 'production',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: {
            loader: 'css-loader',
            options: {
              minimize: true,
            },
          },
        }),
      },
      {
        test: /\.s[ac]ss$/i,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }],
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            //options: {
            //  minimize: true,
            //}
          },
        ],
      },

      {
        test: /\.svg$/,
        loader: 'svg-inline-loader',
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader?name=src/css/[name].[ext]',
      },

      {
        test: /\.(jepeg|jpg|gif|png)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new ExtractTextPlugin('[name].css'),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorOptions: { discardComments: { removeAll: true } },
      canPrint: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: 'production',
      },
    }),
    new HTMLWebpackPlugin({
      template: './index_tmp.html',
      inject: true,
      title: 'Webpack: AngularJS configuration',
    }),
  ],
};
