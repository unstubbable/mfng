import path from 'path';
import url from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';
import {cssRule} from './webpack.config.js';

const dev = process.env.MODE === `development`;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * @type {Map<string, import('./lib/bundler/webpack-rsc-server-loader.cjs').ModuleExportsInfo>}
 */
const clientReferenceMap = new Map();

/**
 * @type {import('webpack').Configuration}
 */
export default {
  entry: `./src/workers/rsc/index.tsx`,
  output: {
    filename: `rsc-worker.js`,
    path: path.join(__dirname, `dist`),
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
            loader: path.resolve(
              __dirname,
              `lib/bundler/webpack-rsc-server-loader.cjs`,
            ),
            options: {clientReferenceMap},
          },
          `swc-loader`,
        ],
        exclude: [/node_modules/],
      },
      {test: /\.md$/, type: `asset/source`},
      cssRule,
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({filename: `rsc-main.css`, runtime: false}),
  ],
  devtool: `source-map`,
  mode: dev ? `development` : `production`,
  externals: [`__STATIC_CONTENT_MANIFEST`],
};
