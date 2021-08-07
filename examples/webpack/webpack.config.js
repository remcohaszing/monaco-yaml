const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  output: {
    filename: '[contenthash].js',
  },
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
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        // Monaco editor uses .ttf icons.
        test: /\.(svg|ttf)$/,
        type: 'asset',
      },
    ],
  },
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
  },
  plugins: [new HtmlWebPackPlugin(), new MiniCssExtractPlugin({ filename: '[contenthash].css' })],
};
