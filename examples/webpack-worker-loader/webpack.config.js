const { resolve } = require('path');

const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './index.js',
  },
  output: {
    globalObject: 'this',
    filename: '[name].bundle.js',
    path: resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$/,
        loader: 'file-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './index.html',
    }),
  ],
  node: {
    fs: 'empty',
    module: 'empty',
  },
};
