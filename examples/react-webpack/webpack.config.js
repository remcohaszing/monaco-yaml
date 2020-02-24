const HtmlWebPackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    main: './index.jsx',
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
    'yaml.worker': 'monaco-yaml/esm/yaml.worker.js',
  },
  output: {
    globalObject: 'this',
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
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
};
