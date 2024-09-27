process.env.NODE_ENV = 'production';

const path = require('path');
const webpack = require('webpack');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = (env) =>
  merge(common(env), {
    mode: 'production',
    output: {
      filename: '[name].[contenthash].js',
      path: path.resolve(__dirname, '../build'),
      clean: true, // Clean the output directory before emit
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          default: false,
        },
      },
      minimize: true,
      minimizer: [
        // '...', // Extend existing minimizers (i.e. `terser-webpack-plugin`)
        new CssMinimizerPlugin({
          exclude: /\.min\.css$/i,
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
              },
            ],
          },
        }),
      ],
    },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
        },
      }),
    ],
  });
