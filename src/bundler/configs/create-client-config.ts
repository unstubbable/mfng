import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';
import type {Configuration} from 'webpack';
import {WebpackManifestPlugin} from 'webpack-manifest-plugin';
import type {ClientReferencesForSsrMap} from '../webpack-rsc-client-plugin.js';
import {WebpackRscClientPlugin} from '../webpack-rsc-client-plugin.js';
import type {ClientReferencesForClientMap} from '../webpack-rsc-server-loader.cjs';
import {createCssRule} from './create-css-rule.js';

export interface CreateClientConfigOptions {
  readonly mode: Configuration['mode'];
  readonly clientReferencesForClientMap: ClientReferencesForClientMap;
  readonly clientReferencesForSsrMap: ClientReferencesForSsrMap;
}

export function createClientConfig(
  options: CreateClientConfigOptions,
): Configuration {
  const {mode, clientReferencesForClientMap, clientReferencesForSsrMap} =
    options;
  const dev = mode === `development`;

  return {
    context: process.cwd(),
    entry: `./src/client.tsx`,
    output: {
      filename: dev ? `main.js` : `main.[contenthash:8].js`,
      path: path.join(process.cwd(), `dist/client`),
      clean: !dev,
    },
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
    },
    module: {
      rules: [
        {test: /\.tsx?$/, loader: `swc-loader`, exclude: [/node_modules/]},
        createCssRule({mode}),
      ],
    },
    plugins: [
      new CopyPlugin({patterns: [{from: `static`}]}),
      new MiniCssExtractPlugin({
        filename: dev ? `main.css` : `main.[contenthash:8].css`,
        runtime: false,
      }),
      new WebpackManifestPlugin({
        fileName: `css-manifest.json`,
        publicPath: `/`,
        filter: (file) => file.path.endsWith(`.css`),
      }),
      new WebpackManifestPlugin({
        fileName: `js-manifest.json`,
        publicPath: `/`,
        filter: (file) => file.path.endsWith(`.js`),
      }),
      new WebpackRscClientPlugin({
        clientReferencesForClientMap,
        clientReferencesForSsrMap,
      }),
    ],
    devtool: `source-map`,
    mode,
  };
}
