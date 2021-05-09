const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    // add path to file you want bandle
    clipboardCopyElement: './src/clipboard-copy-element/main.ts',
    detailDialogElement: './src/detail-dialog-element/main.ts'
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
    })
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