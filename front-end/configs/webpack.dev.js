const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: [
      'babel-runtime/regenerator',
      'babel-register',
      './source/kernel/dashboard/plugins/plugins.js',
      './source/kernel/datanodes/plugins/plugins.js',
      './source/main-studio.js',
    ],
  },
  resolve: {
    modules: ['node_modules', 'thirdparty', 'source'],
    alias: {
      'config.js$': path.resolve(__dirname, '../configs/config.dev.js'),
    },
  },
  mode: 'development',
  output: {
    filename: '[name]-bundle.js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
  },
  devServer: {
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
    },
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader' }],
      },
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }],
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

      // {
      //   test: /\.svg$/,
      //   loader: 'svg-inline-loader'
      // },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        loader: 'file-loader?name=src/css/[name].[ext]',
      },

      {
        test: /\.html$/,
        use: [{ loader: 'html-loader' }],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      'window.$': 'jquery',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new HTMLWebpackPlugin({
      template: './index_tmp.html',
      title: 'Webpack: AngularJS configuration',
    }),
  ],
};
