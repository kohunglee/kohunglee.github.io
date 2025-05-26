const path = require('path');
const webpack = require('webpack'); // 必须引入webpack

module.exports = {
  entry: './src/ccgxk.js', // 入口文件
  output: {
    filename: 'main.js', // 输出文件名
    path: path.resolve(__dirname, 'dist'), // 输出目录
  },
    mode: 'none',
  // mode: 'production',
  devtool: false,
  plugins: [
    new webpack.BannerPlugin({
      banner: '',
      raw: true,
      entryOnly: true,
    })
  ],
};