const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  output: {
    filename: '[contenthash].js',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.mjs', '.js', '.ts'],
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
        type: 'asset/resource',
      },
      {
        test: /schema\.json$/,
        type: 'asset/resource',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: { transpileOnly: true },
      },
    ],
  },
  optimization: {
    minimizer: ['...', new CssMinimizerPlugin()],
  },
  plugins: [new HtmlWebPackPlugin(), new MiniCssExtractPlugin({ filename: '[contenthash].css' })],
};
