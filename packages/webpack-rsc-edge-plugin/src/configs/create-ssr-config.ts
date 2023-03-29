import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';
import type {Configuration} from 'webpack';
import type {ClientReferencesForSsrMap} from '../webpack-rsc-client-plugin.js';
import {WebpackRscSsrPlugin} from '../webpack-rsc-ssr-plugin.js';
import {createCssRule} from './create-css-rule.js';

export interface CreateSsrConfigOptions {
  readonly mode: Configuration['mode'];
  readonly clientReferencesForSsrMap: ClientReferencesForSsrMap;
}

export function createSsrConfig(
  options: CreateSsrConfigOptions,
): Configuration {
  const {mode, clientReferencesForSsrMap} = options;

  return {
    context: process.cwd(),
    entry: `./src/workers/main/index.ts`,
    output: {
      filename: `main-worker.js`,
      path: path.join(process.cwd(), `dist`),
      libraryTarget: `module`,
      chunkFormat: `module`,
    },
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
      conditionNames: [`workerd`, `node`, `import`, `require`],
    },
    module: {
      rules: [
        {test: /\.tsx?$/, loader: `swc-loader`, exclude: [/node_modules/]},
        {test: /\.md$/, type: `asset/source`},
        createCssRule({mode}),
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({filename: `ssr-main.css`, runtime: false}),
      new WebpackRscSsrPlugin({
        clientReferencesForSsrMap,
        ssrManifestFilename: `client/react-ssr-manifest.json`,
      }),
    ],
    devtool: `source-map`,
    mode,
    experiments: {outputModule: true},
    performance: {
      maxAssetSize: 1_000_000,
      maxEntrypointSize: 1_000_000,
    },
    externals: [`__STATIC_CONTENT_MANIFEST`],
  };
}
