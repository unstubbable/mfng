import {createRequire} from 'module';
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';
import type {Configuration} from 'webpack';
import type {ClientReferencesForClientMap} from '../webpack-rsc-server-loader.cjs';
import {WebpackRscServerPlugin} from '../webpack-rsc-server-plugin.js';
import {createCssRule} from './create-css-rule.js';

export interface CreateServerConfigOptions {
  readonly mode: Configuration['mode'];
  readonly entry: string;
  readonly clientReferencesForClientMap: ClientReferencesForClientMap;
}

const require = createRequire(import.meta.url);

export function createServerConfig(
  options: CreateServerConfigOptions,
): Configuration {
  const {mode, entry, clientReferencesForClientMap} = options;

  return {
    context: process.cwd(),
    entry,
    output: {
      filename: `rsc-worker.js`,
      path: path.join(process.cwd(), `dist`),
      libraryTarget: `module`,
      chunkFormat: `module`,
    },
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
      conditionNames: [`react-server`, `workerd`, `import`, `require`],
    },
    experiments: {outputModule: true},
    performance: {
      maxAssetSize: 1_000_000,
      maxEntrypointSize: 1_000_000,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: require.resolve(`../webpack-rsc-server-loader.cjs`),
              options: {clientReferencesForClientMap},
            },
            `swc-loader`,
          ],
          exclude: [/node_modules/],
        },
        {test: /\.md$/, type: `asset/source`},
        createCssRule({mode}),
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({filename: `rsc-main.css`, runtime: false}),
      new WebpackRscServerPlugin(),
    ],
    devtool: `source-map`,
    mode,
    externals: [`__STATIC_CONTENT_MANIFEST`],
  };
}
