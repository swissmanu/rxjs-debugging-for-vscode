import HtmlWebpackPlugin from 'html-webpack-plugin';
import * as path from 'path';
import * as url from 'url';
import RxJSDebuggingPlugin from './plugin/RxJSDebuggingPlugin.js';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

/** @type { import('webpack').Configuration } */
const config = {
  mode: 'development',
  entry: './src/browser.ts',
  output: {
    path: path.resolve(dirname, 'dist'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  devtool: 'source-map',
  module: {
    rules: [{ test: /.ts$/, loader: 'ts-loader' }],
  },
  plugins: [
    new RxJSDebuggingPlugin(),
    new HtmlWebpackPlugin({
      title: 'RxJS Debugger for vscode | Example Workspace',
    }),
  ],
};

export default config;
