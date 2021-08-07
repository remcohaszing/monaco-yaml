const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = {
  resolve: {
    fallback: {
      // Yaml-ast-parser-custom-tags imports buffer. This can be omitted safely.
      buffer: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        // Monaco editor uses .ttf icons.
        test: /\.(svg|ttf)$/,
        type: 'asset',
      },
    ],
  },
  plugins: [new HtmlWebPackPlugin()],
};
