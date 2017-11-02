import path from 'path';
import UglifyJSPlugin from 'uglifyjs-webpack-plugin';

module.exports = {
  entry: './src/client/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node-modules/,
        loader: ['babel-loader'],
      },
    ],
  },
  plugins: [
    new UglifyJSPlugin(),
  ],
};
