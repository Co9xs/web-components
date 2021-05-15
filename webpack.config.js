const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    // add path to file you want bandle
    clipboardCopyElement: './src/clipboard-copy-element/main.ts',
    detailDialogElement: './src/detail-dialog-element/main.ts',
    typingEffectElement: './src/typing-effect-element/main.ts',
    filterInputElement: './src/filter-input-element/main.ts',
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist',
    publicPath: '/'
  },
  plugins: [
    // add set of chunks(js), template(html) and filename(routing) you want see on browser
    new HtmlWebpackPlugin({
      chunks:['clipboardCopyElement'],
      template: './src/clipboard-copy-element/index.html',
      filename: 'clipboard/index.html'
    }),
    new HtmlWebpackPlugin({
      chunks:['detailDialogElement'],
      template: './src/detail-dialog-element/index.html',
      filename: 'dialog/index.html'
    }),
    new HtmlWebpackPlugin({
      chunks:['typingEffectElement'],
      template: './src/typing-effect-element/index.html',
      filename: 'typing/index.html'
    }),
    new HtmlWebpackPlugin({
      chunks:['filterInputElement'],
      template: './src/filter-input-element/index.html',
      filename: 'filter-input/index.html'
    }),
 ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: [
      '.ts', '.js',
    ],
  },
};